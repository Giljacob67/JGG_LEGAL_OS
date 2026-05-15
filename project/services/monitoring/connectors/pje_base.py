"""
Lógica comum para tribunais que rodam PJe (JavaServer Faces / Seam).
TJPR, TJMT e TRF1 herdam desta classe.
"""
from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Optional

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

CAPTCHA_PATTERNS = [
    "recaptcha",
    "captcha",
    "sou humano",
    "not a robot",
    "muitas requisi",
    "too many requests",
    "acesso bloqueado",
    "securimage",
]


class PJeBaseConnector(TribunalConnector):
    """Consulta pública PJe via HTTP direto (sem JS headless)."""

    consulta_url: str  # definida por cada tribunal

    async def _get_viewstate(self) -> tuple[str, str]:
        """Carrega página de consulta e extrai javax.faces.ViewState + id do form."""
        client = await self._session.get_client()
        r = await client.get(self.consulta_url, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        vs_input = soup.find("input", {"name": "javax.faces.ViewState"})
        form = soup.find("form")
        form_id = form.get("id", "fPP") if form else "fPP"
        vs = vs_input["value"] if vs_input else ""
        return vs, form_id

    async def buscar_processo(self, cnj: str) -> ResultadoCaptura:
        try:
            viewstate, form_id = await self._get_viewstate()
            client = await self._session.get_client()

            payload = {
                f"{form_id}:Nprocesso:nProcesso": cnj,
                "javax.faces.ViewState": viewstate,
                f"{form_id}:btnPesquisar": "Pesquisar",
                "AJAXREQUEST": "_viewRoot",
                "javax.faces.partial.ajax": "true",
                "javax.faces.partial.execute": f"{form_id}:Nprocesso",
                "javax.faces.partial.render": f"{form_id}",
            }

            r = await client.post(
                self.consulta_url,
                data=payload,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Faces-Request": "partial/ajax",
                },
                timeout=30,
            )

            if self._detectar_captcha(r.text):
                logger.warning(
                    "captcha_detectado tribunal=%s cnj=%s",
                    self.tribunal_id, cnj,
                )
                return ResultadoCaptura(
                    cnj=cnj,
                    tribunal_id=self.tribunal_id,
                    sucesso=False,
                    captcha_detectado=True,
                    erro="captcha_detectado",
                )

            andamentos = self._parse_andamentos(r.text)

            if not andamentos and self._detectar_layout_quebrado(r.text):
                logger.error(
                    "layout_quebrado tribunal=%s cnj=%s html_len=%d",
                    self.tribunal_id, cnj, len(r.text),
                )
                return ResultadoCaptura(
                    cnj=cnj,
                    tribunal_id=self.tribunal_id,
                    sucesso=False,
                    erro="layout_quebrado: tabela de andamentos não encontrada",
                )

            documentos = extrair_documentos_do_html(r.text, self.consulta_url, self.tribunal_id, cnj)
            return ResultadoCaptura(
                cnj=cnj,
                tribunal_id=self.tribunal_id,
                sucesso=True,
                andamentos=andamentos,
                documentos=documentos,
                payload_bruto={"html_len": len(r.text)},
            )

        except httpx.TimeoutException as e:
            return ResultadoCaptura(
                cnj=cnj, tribunal_id=self.tribunal_id,
                sucesso=False, erro=f"timeout: {e}",
            )
        except httpx.HTTPStatusError as e:
            return ResultadoCaptura(
                cnj=cnj, tribunal_id=self.tribunal_id,
                sucesso=False, erro=f"http_{e.response.status_code}",
            )
        except Exception as e:
            logger.exception("erro_inesperado tribunal=%s cnj=%s", self.tribunal_id, cnj)
            return ResultadoCaptura(
                cnj=cnj, tribunal_id=self.tribunal_id,
                sucesso=False, erro=str(e),
            )

    async def buscar_documentos(self, cnj: str) -> list[DocumentoCapturado]:
        result = await self.buscar_processo(cnj)
        return result.documentos

    async def buscar_andamentos(
        self, cnj: str, desde: Optional[date] = None
    ) -> list[AndamentoCapturado]:
        result = await self.buscar_processo(cnj)
        if not desde:
            return result.andamentos
        return [a for a in result.andamentos if a.data >= desde]

    # ------------------------------------------------------------------ #
    # Parsing HTML                                                         #
    # ------------------------------------------------------------------ #

    def _parse_andamentos(self, html: str) -> list[AndamentoCapturado]:
        soup = BeautifulSoup(html, "lxml")
        andamentos: list[AndamentoCapturado] = []

        # Tenta múltiplos seletores — PJe muda entre versões
        selectors = [
            "table.rich-table tbody tr",
            "#tableMovimentos tbody tr",
            "table[id*='movimento'] tbody tr",
            "table[id*='Movimento'] tbody tr",
            ".procedimento tbody tr",
        ]

        rows = []
        for sel in selectors:
            rows = soup.select(sel)
            if rows:
                break

        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 2:
                continue
            data_str = cells[0].get_text(strip=True)
            evento = cells[1].get_text(strip=True)
            descricao = cells[2].get_text(strip=True) if len(cells) > 2 else evento
            orgao = cells[3].get_text(strip=True) if len(cells) > 3 else None

            if not data_str or not evento:
                continue

            parsed_date = self._parse_date(data_str)
            if parsed_date:
                andamentos.append(
                    AndamentoCapturado(
                        data=parsed_date,
                        evento=evento,
                        descricao_bruta=descricao,
                        orgao=orgao,
                    )
                )

        return andamentos

    def _detectar_captcha(self, html: str) -> bool:
        lower = html.lower()
        return any(p in lower for p in CAPTCHA_PATTERNS)

    def _detectar_layout_quebrado(self, html: str) -> bool:
        """Detecta se a página chegou mas sem a estrutura esperada."""
        soup = BeautifulSoup(html, "lxml")
        # Verifica se tem ao menos alguma estrutura de tabela de processos
        has_table = bool(soup.find("table"))
        has_processo_form = bool(soup.find(attrs={"id": lambda x: x and "nProcesso" in x}))
        return not has_table and not has_processo_form

    @staticmethod
    def _parse_date(s: str) -> Optional[date]:
        for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d/%m/%y"):
            try:
                return datetime.strptime(s.strip(), fmt).date()
            except ValueError:
                continue
        return None
