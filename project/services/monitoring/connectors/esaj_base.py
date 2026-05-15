"""
Base para tribunais que usam e-SAJ (Softplan).
TJRS, TJSP e outros tribunais que rodam este sistema.

Estrutura típica:
- Consulta pública por número CNJ
- Tabela de movimentações com classe "secaoFormBody" ou " fundoClaro"
- Documentos em links com "download" no href
"""
from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Optional
from urllib.parse import urlencode, urljoin

import httpx
from bs4 import BeautifulSoup

from .base import (
    AndamentoCapturado,
    DocumentoCapturado,
    ResultadoCaptura,
    TribunalConnector,
)
from .document_parser import extrair_documentos_do_html

logger = logging.getLogger(__name__)

_CAPTCHA = [
    "recaptcha", "captcha", "bloqueado", "too many requests",
    "muitas requisi", "acesso negado", "session expired",
]


class ESAJBaseConnector(TribunalConnector):
    """Consulta pública e-SAJ via HTTP direto."""

    consulta_url: str  # definida por cada tribunal
    search_param: str = "pbEncaminhar=pesquisar"

    async def buscar_processo(self, cnj: str) -> ResultadoCaptura:
        try:
            html = await self._buscar_html(cnj)

            if self._detectar_captcha(html):
                logger.warning("captcha_detectado tribunal=%s cnj=%s", self.tribunal_id, cnj)
                return ResultadoCaptura(
                    cnj=cnj, tribunal_id=self.tribunal_id,
                    sucesso=False, captcha_detectado=True,
                    erro="captcha_detectado",
                )

            andamentos = self._parse_andamentos(html, cnj)
            documentos = extrair_documentos_do_html(html, self.base_url, self.tribunal_id, cnj)

            if not andamentos and not documentos:
                logger.warning("esaj_sem_dados tribunal=%s cnj=%s", self.tribunal_id, cnj)
                return ResultadoCaptura(
                    cnj=cnj, tribunal_id=self.tribunal_id,
                    sucesso=False, erro="processo_nao_encontrado_ou_sem_dados",
                )

            return ResultadoCaptura(
                cnj=cnj,
                tribunal_id=self.tribunal_id,
                sucesso=True,
                andamentos=andamentos,
                documentos=documentos,
                payload_bruto={"html_len": len(html)},
            )

        except httpx.TimeoutException:
            return ResultadoCaptura(cnj=cnj, tribunal_id=self.tribunal_id, sucesso=False, erro="timeout")
        except httpx.HTTPStatusError as e:
            return ResultadoCaptura(cnj=cnj, tribunal_id=self.tribunal_id, sucesso=False, erro=f"HTTP {e.response.status_code}")
        except Exception as e:
            logger.exception("erro_esaj tribunal=%s cnj=%s", self.tribunal_id, cnj)
            return ResultadoCaptura(cnj=cnj, tribunal_id=self.tribunal_id, sucesso=False, erro=str(e))

    async def _buscar_html(self, cnj: str) -> str:
        client = await self._session.get_client()
        # e-SAJ geralmente aceita CNJ limpo ou formatado
        cnj_limpo = cnj.replace(".", "").replace("-", "").replace(" ", "")

        # Alguns e-SAJ usam POST, outros GET com query string
        payload = {
            "conversationId": "",
            "paginaConsulta": "1",
            "cbPesquisa": "NUMPROC",
            "numeroDigitoAnoUnificado": cnj,
            "dePesquisaNuUnificado": cnj,
            "dePesquisa": cnj_limpo,
        }

        r = await client.post(
            self.consulta_url,
            data=payload,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": self.consulta_url,
            },
            timeout=30,
            follow_redirects=True,
        )
        r.raise_for_status()
        return r.text

    def _parse_andamentos(self, html: str, cnj: str) -> list[AndamentoCapturado]:
        soup = BeautifulSoup(html, "lxml")
        andamentos: list[AndamentoCapturado] = []

        # e-SAJ: tabela de movimentações tem vários possíveis seletores
        selectors = [
            "table.secaoFormBody tbody tr",
            "table.fundoClaro tbody tr",
            "table.movimentacao tbody tr",
            "table[class*='moviment'] tbody tr",
            ".movimentacao tbody tr",
        ]

        rows: list = []
        for sel in selectors:
            rows = soup.select(sel)
            if rows:
                break

        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 2:
                continue

            # e-SAJ: geralmente col 0=data, 1=descricao completa
            data_str = cells[0].get_text(strip=True)
            descricao = cells[1].get_text(strip=True) if len(cells) > 1 else ""

            if not data_str or not descricao:
                continue

            parsed_date = self._parse_date(data_str)
            if not parsed_date:
                continue

            # Tenta separar evento da descrição
            evento = descricao
            if " - " in descricao:
                partes = descricao.split(" - ", 1)
                evento = partes[0].strip()
                descricao = partes[1].strip()

            andamentos.append(AndamentoCapturado(
                data=parsed_date,
                evento=evento,
                descricao_bruta=descricao or evento,
            ))

        logger.info("esaj_parse tribunal=%s cnj=%s andamentos=%d", self.tribunal_id, cnj, len(andamentos))
        return andamentos

    async def buscar_andamentos(self, cnj: str, desde: Optional[date] = None) -> list[AndamentoCapturado]:
        result = await self.buscar_processo(cnj)
        if not desde:
            return result.andamentos
        return [a for a in result.andamentos if a.data >= desde]

    async def buscar_documentos(self, cnj: str) -> list[DocumentoCapturado]:
        result = await self.buscar_processo(cnj)
        return result.documentos

    def _detectar_captcha(self, html: str) -> bool:
        low = html.lower()
        return any(p in low for p in _CAPTCHA)

    @staticmethod
    def _parse_date(s: str) -> Optional[date]:
        for fmt in ("%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d"):
            try:
                return datetime.strptime(s.strip(), fmt).date()
            except ValueError:
                continue
        return None
