"""
ProJUDI (Projudi) connector — consulta pública sem autenticação.
TJPR usa este sistema. HTML estrutura real validada em 2026-05-14.

Tabela de movimentações: #idTableMovimentacoesmov1Grau1
Linhas: tr[id^="mov1Grau"] (excluir tr[id^="rowmovimentacoes"])
Colunas: 0=icon, 1=seq, 2=data DD/MM/YYYY HH:MM:SS, 3=<b>evento</b><br>desc, 4=ator
"""
from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from connectors.base import AndamentoCapturado, ResultadoCaptura, TribunalConnector

logger = logging.getLogger(__name__)

_CAPTCHA = ["recaptcha", "captcha", "bloqueado", "too many requests", "muitas requisi"]

_CRITICOS = {
    "SENTENÇA", "ACÓRDÃO", "DECISÃO", "DESPACHO", "JULGADO",
    "INDEFERIDO", "DEFERIDO", "INTIMAÇÃO", "EMBARGO",
}


class ProJUDIBaseConnector(TribunalConnector):
    """Consulta pública ProJUDI — POST com numeroProcesso, parse HTML estático."""

    base_url: str    # https://consulta.tjpr.jus.br/projudi_consulta
    search_url: str  # …/consultaPublica.do?actionType=iniciar

    def _detectar_captcha(self, html: str) -> bool:
        low = html.lower()
        return any(p in low for p in _CAPTCHA)

    async def _buscar_html(self, cnj: str) -> str:
        client = await self._session.get_client()
        # Cookie de sessão
        await client.get(self.base_url, timeout=15)
        r = await client.post(
            self.search_url,
            data={"numeroProcesso": cnj},
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": self.base_url,
            },
            timeout=30,
        )
        r.raise_for_status()
        return r.content.decode("windows-1252", errors="replace")

    def _parse_andamentos(self, html: str, cnj: str) -> list[AndamentoCapturado]:
        soup = BeautifulSoup(html, "lxml")

        tabela = soup.find("table", id="idTableMovimentacoesmov1Grau1")
        if not tabela:
            logger.warning("projudi_tabela_nao_encontrada cnj=%s", cnj)
            return []

        resultado: list[AndamentoCapturado] = []

        for tr in tabela.find_all("tr"):
            tr_id = tr.get("id", "")
            if not tr_id.startswith("mov1Grau"):
                continue

            tds = tr.find_all("td")
            if len(tds) < 4:
                continue

            # Col 2: data "DD/MM/YYYY HH:MM:SS"
            data_raw = tds[2].get_text(strip=True)
            try:
                data_val = datetime.strptime(data_raw, "%d/%m/%Y %H:%M:%S").date()
            except ValueError:
                try:
                    data_val = datetime.strptime(data_raw[:10], "%d/%m/%Y").date()
                except ValueError:
                    logger.debug("projudi_data_invalida raw=%r cnj=%s", data_raw, cnj)
                    continue

            # Col 3: evento (<b>NOME</b>) + descrição (resto do td)
            td_ev = tds[3]
            b = td_ev.find("b")
            evento = re.sub(r"\s+", " ", b.get_text(strip=True)).strip() if b else ""
            if not evento:
                evento = re.sub(r"\s+", " ", td_ev.get_text(separator=" ", strip=True)).strip()

            descricao_partes: list[str] = []
            for node in td_ev.children:
                if getattr(node, "name", None) == "b":
                    continue
                txt = (node.get_text(separator=" ", strip=True)
                       if hasattr(node, "get_text") else str(node).strip())
                if txt:
                    descricao_partes.append(txt)
            descricao = " ".join(descricao_partes).strip()

            critico = any(p in evento.upper() for p in _CRITICOS)

            resultado.append(AndamentoCapturado(
                data=data_val,
                evento=evento,
                descricao_bruta=descricao or evento,
                critico=critico,
            ))

        logger.info("projudi_parse cnj=%s andamentos=%d", cnj, len(resultado))
        return resultado

    async def buscar_andamentos(
        self, cnj: str, desde: Optional[datetime] = None
    ) -> list[AndamentoCapturado]:
        html = await self._buscar_html(cnj)
        andamentos = self._parse_andamentos(html, cnj)
        if desde:
            andamentos = [a for a in andamentos if a.data >= desde.date()]
        return andamentos

    async def buscar_processo(self, cnj: str) -> ResultadoCaptura:
        try:
            html = await self._buscar_html(cnj)

            if self._detectar_captcha(html):
                logger.warning("captcha_detectado tribunal=%s cnj=%s", self.tribunal_id, cnj)
                return ResultadoCaptura(cnj=cnj, tribunal_id=self.tribunal_id, sucesso=False, captcha_detectado=True)

            andamentos = self._parse_andamentos(html, cnj)
            return ResultadoCaptura(
                cnj=cnj,
                tribunal_id=self.tribunal_id,
                sucesso=True,
                andamentos=andamentos,
            )

        except httpx.TimeoutException:
            return ResultadoCaptura(cnj=cnj, tribunal_id=self.tribunal_id, sucesso=False, erro="timeout")
        except httpx.HTTPStatusError as e:
            return ResultadoCaptura(cnj=cnj, tribunal_id=self.tribunal_id, sucesso=False, erro=f"HTTP {e.response.status_code}")
        except Exception as e:
            logger.exception("erro_captura tribunal=%s cnj=%s", self.tribunal_id, cnj)
            return ResultadoCaptura(cnj=cnj, tribunal_id=self.tribunal_id, sucesso=False, erro=str(e))

    async def health_check(self) -> bool:
        try:
            client = await self._session.get_client()
            r = await client.get(self.base_url, timeout=10)
            return r.status_code == 200
        except Exception:
            return False
