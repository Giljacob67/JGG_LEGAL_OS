"""
TRF4 usa eproc (sistema próprio do TRF4/RS/SC/PR federal).
Consulta pública disponível em:
  https://eproc.trf4.jus.br/eproc/externo_controlador.php?acao=processo_seleciona_publica
"""
from __future__ import annotations

import logging
from datetime import date
from typing import Optional
from urllib.parse import urlencode

import httpx
from bs4 import BeautifulSoup

from connectors.base import (
    AndamentoCapturado,
    ResultadoCaptura,
    TribunalConnector,
)
from connectors.pje_base import CAPTCHA_PATTERNS

logger = logging.getLogger(__name__)


class TRF4Connector(TribunalConnector):
    tribunal_id = "trf4"
    nome = "Tribunal Regional Federal da 4ª Região"
    sistema = "eproc"
    base_url = "https://eproc.trf4.jus.br/eproc"
    consulta_url = (
        "https://eproc.trf4.jus.br/eproc/"
        "externo_controlador.php?acao=processo_seleciona_publica"
    )

    async def buscar_processo(self, cnj: str) -> ResultadoCaptura:
        try:
            client = await self._session.get_client()

            # eproc aceita número do processo sem formatação
            cnj_limpo = cnj.replace(".", "").replace("-", "")
            params = urlencode({"acao": "processo_seleciona_publica", "num_processo": cnj_limpo})
            url = f"{self.base_url}/externo_controlador.php?{params}"

            r = await client.get(url, timeout=30)

            if any(p in r.text.lower() for p in CAPTCHA_PATTERNS):
                return ResultadoCaptura(
                    cnj=cnj, tribunal_id=self.tribunal_id,
                    sucesso=False, captcha_detectado=True, erro="captcha_detectado",
                )

            andamentos = self._parse_andamentos(r.text)
            return ResultadoCaptura(
                cnj=cnj,
                tribunal_id=self.tribunal_id,
                sucesso=True,
                andamentos=andamentos,
            )

        except httpx.TimeoutException as e:
            return ResultadoCaptura(cnj=cnj, tribunal_id=self.tribunal_id,
                                    sucesso=False, erro=f"timeout: {e}")
        except Exception as e:
            logger.exception("erro trf4 cnj=%s", cnj)
            return ResultadoCaptura(cnj=cnj, tribunal_id=self.tribunal_id,
                                    sucesso=False, erro=str(e))

    async def buscar_andamentos(
        self, cnj: str, desde: Optional[date] = None
    ) -> list[AndamentoCapturado]:
        result = await self.buscar_processo(cnj)
        if not desde:
            return result.andamentos
        return [a for a in result.andamentos if a.data >= desde]

    def _parse_andamentos(self, html: str) -> list[AndamentoCapturado]:
        soup = BeautifulSoup(html, "lxml")
        andamentos: list[AndamentoCapturado] = []

        # eproc: tabela de eventos tem class "infraTable" ou id contendo "tableEventos"
        selectors = [
            "table#tableEventos tbody tr",
            "table.infraTable tbody tr",
            "table[id*='Evento'] tbody tr",
        ]

        rows: list = []
        for sel in selectors:
            rows = soup.select(sel)
            if rows:
                break

        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 3:
                continue
            data_str = cells[0].get_text(strip=True)
            evento = cells[2].get_text(strip=True)  # eproc: col 0=data, 1=usuário, 2=evento
            descricao = cells[3].get_text(strip=True) if len(cells) > 3 else evento

            if not data_str or not evento:
                continue

            parsed = self._parse_date(data_str)
            if parsed:
                andamentos.append(
                    AndamentoCapturado(
                        data=parsed,
                        evento=evento,
                        descricao_bruta=descricao,
                    )
                )

        return andamentos

    @staticmethod
    def _parse_date(s: str) -> Optional[date]:
        from datetime import datetime
        for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
            try:
                return datetime.strptime(s.strip(), fmt).date()
            except ValueError:
                continue
        return None
