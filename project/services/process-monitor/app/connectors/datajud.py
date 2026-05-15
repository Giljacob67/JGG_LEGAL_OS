"""Conector DataJud — fonte auxiliar pública de metadados processuais.

DataJud fornece apenas metadados públicos (capa, movimentações).
NÃO baixa documentos nem autos.
NÃO substitui conectores oficiais dos tribunais.
"""

import hashlib
import json
from typing import Any

import httpx

from app.config import settings
from app.core.cnj import normalizar
from app.core.errors import CaptchaOrBlockError, NotFoundError, ParseError
from app.logging_config import get_logger, log_operation
from app.models.schemas import (
    ConnectorHealth,
    ConnectorResult,
    TribunalDocument,
    TribunalMovement,
    TribunalProcess,
)
from app.connectors.base import TribunalConnector

logger = get_logger("connectors.datajud")


class DataJudConnector(TribunalConnector):
    """Conector para API pública DataJud (CNJ)."""

    @property
    def tribunal(self) -> str:
        return "datajud"

    @property
    def nome(self) -> str:
        return "DataJud (API Pública CNJ)"

    def _headers(self) -> dict[str, str]:
        h: dict[str, str] = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if settings.DATAJUD_API_KEY:
            h["Authorization"] = f"APIKey {settings.DATAJUD_API_KEY}"
        return h

    def _url(self, tribunal_alias: str) -> str:
        return f"{settings.DATAJUD_BASE_URL}/{tribunal_alias}/_search"

    def _alias(self, tribunal: str) -> str:
        """Mapeia tribunal para alias oficial DataJud."""
        mapping = {
            "tjpr": "api_publica_tjpr",
            "tjmt": "api_publica_tjmt",
            "trf4": "api_publica_trf4",
            "trf1": "api_publica_trf1",
            "tjrs": "api_publica_tjrs",
            "tjsp": "api_publica_tjsp",
            "trf3": "api_publica_trf3",
        }
        return mapping.get(tribunal, f"api_publica_{tribunal}")

    async def login(self, credentials: dict[str, Any]) -> bool:
        """DataJud não requer login por sessão."""
        return True

    async def buscar_processo_por_numero(self, numero_cnj: str) -> ConnectorResult:
        cnj_digits = normalizar(numero_cnj)
        tribunal_code = cnj_digits[14:16]
        tribunal = self._tribunal_por_codigo(tribunal_code)
        alias = self._alias(tribunal)

        with log_operation(
            logger,
            operation="buscar_processo_por_numero",
            tribunal=tribunal,
            connector=self.tribunal,
            numero_cnj=numero_cnj,
        ):
            payload = {
                "query": {
                    "match": {"numeroProcesso": cnj_digits}
                }
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    self._url(alias),
                    headers=self._headers(),
                    json=payload,
                )
                self._check_blocked(resp)

                if resp.status_code == 404:
                    raise NotFoundError(f"Processo não encontrado no DataJud: {numero_cnj}")

                resp.raise_for_status()
                data = resp.json()

                hits = data.get("hits", {}).get("hits", [])
                if not hits:
                    return ConnectorResult(
                        ok=True,
                        tribunal=tribunal,
                        source=self.tribunal,
                        process=None,
                        movements=[],
                        documents=[],
                    )

                source = hits[0].get("_source", {})
                process = self._parse_processo(source, tribunal)
                movements = self._parse_movimentacoes(source)

                return ConnectorResult(
                    ok=True,
                    tribunal=tribunal,
                    source=self.tribunal,
                    process=process,
                    movements=movements,
                    documents=[],
                )

    async def listar_andamentos(self, processo_id_tribunal: str) -> ConnectorResult:
        """DataJud já retorna movimentações na busca; stub aqui."""
        return ConnectorResult(
            ok=True,
            tribunal="unknown",
            source=self.tribunal,
            process=None,
            movements=[],
            documents=[],
            error_code="NOT_IMPLEMENTED_SEPARATE",
            error_message="DataJud retorna movimentações na busca principal",
        )

    async def listar_documentos(self, processo_id_tribunal: str) -> ConnectorResult:
        """DataJud NÃO fornece documentos."""
        return ConnectorResult(
            ok=True,
            tribunal="unknown",
            source=self.tribunal,
            process=None,
            movements=[],
            documents=[],
            error_code="NO_DOCUMENTS",
            error_message="DataJud não fornece acesso a documentos/autos",
        )

    async def baixar_documento(self, documento_id_tribunal: str) -> bytes:
        """DataJud NÃO permite download de documentos."""
        raise NotImplementedError("DataJud não fornece download de documentos")

    async def healthcheck(self) -> ConnectorHealth:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{settings.DATAJUD_BASE_URL}/api_publica_tjpr/_search?size=0",
                    headers=self._headers(),
                )
                resp.raise_for_status()
                return ConnectorHealth(
                    tribunal="datajud",
                    connector=self.tribunal,
                    status="healthy",
                    details={"base_url": settings.DATAJUD_BASE_URL},
                )
        except Exception as exc:
            return ConnectorHealth(
                tribunal="datajud",
                connector=self.tribunal,
                status="down",
                last_error_code=type(exc).__name__,
                last_error_message=str(exc),
                details={"base_url": settings.DATAJUD_BASE_URL},
            )

    def _check_blocked(self, resp: httpx.Response) -> None:
        text = resp.text.lower()
        block_signals = [
            "captcha",
            "recaptcha",
            "bloqueio",
            "acesso negado",
            "muitas requisições",
            "too many requests",
        ]
        if resp.status_code == 403 or resp.status_code == 429:
            raise CaptchaOrBlockError(
                f"Bloqueio detectado (HTTP {resp.status_code})",
                details={"url": str(resp.url), "snippet": resp.text[:500]},
            )
        if any(sig in text for sig in block_signals):
            raise CaptchaOrBlockError(
                "Possível captcha/bloqueio detectado no corpo da resposta",
                details={"url": str(resp.url), "snippet": resp.text[:500]},
            )

    def _tribunal_por_codigo(self, code: str) -> str:
        mapping = {
            "41": "tjpr",
            "51": "tjmt",
            "04": "trf4",
            "01": "trf1",
            "21": "tjrs",
            "26": "tjsp",
            "03": "trf3",
        }
        return mapping.get(code, f"tribunal_{code}")

    def _parse_processo(self, source: dict[str, Any], tribunal: str) -> TribunalProcess:
        return TribunalProcess(
            numero_cnj=source.get("numeroProcesso", ""),
            tribunal=tribunal,
            sistema="datajud",
            classe=source.get("classe", {}).get("nome"),
            assunto=source.get("assunto", [{}])[0].get("nome") if source.get("assunto") else None,
            orgao_julgador=source.get("orgaoJulgador", {}).get("nome"),
            comarca=source.get("orgaoJulgador", {}).get("codigoMunicipioIBGE"),
            data_distribuicao=source.get("dataAjuizamento"),
            valor_causa=source.get("valorCausa"),
            status_raw=source.get("situacao", {}).get("nome"),
            raw=source,
        )

    def _parse_movimentacoes(self, source: dict[str, Any]) -> list[TribunalMovement]:
        movs = source.get("movimentos", [])
        result: list[TribunalMovement] = []
        for m in movs:
            desc = m.get("nome") or m.get("descricao") or ""
            if not desc:
                continue
            payload = json.dumps(m, sort_keys=True, ensure_ascii=False)
            result.append(
                TribunalMovement(
                    external_id=m.get("codigo"),
                    data=m.get("dataHora"),
                    descricao_original=desc,
                    tipo_evento=m.get("tipo"),
                    orgao_julgador=m.get("orgaoJulgador", {}).get("nome"),
                    raw=m,
                    hash=hashlib.sha256(payload.encode("utf-8")).hexdigest(),
                )
            )
        return result
