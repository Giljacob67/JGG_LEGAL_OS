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
from app.core.errors import (
    CaptchaOrBlockError,
    NotFoundError,
    ParseError,
    ProcessMonitorError,
    RateLimitError,
)
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


class DataJudConfigMissingError(ProcessMonitorError):
    error_code = "CONFIG_MISSING"


class DataJudAuthError(ProcessMonitorError):
    error_code = "DATAJUD_AUTH_ERROR"


class DataJudTimeoutError(ProcessMonitorError):
    error_code = "TIMEOUT"


class DataJudNotFoundError(ProcessMonitorError):
    error_code = "NOT_FOUND"


class DataJudParserError(ProcessMonitorError):
    error_code = "PARSER_ERROR"


class DataJudConnector(TribunalConnector):
    """Conector para API pública DataJud (CNJ)."""

    DEFAULT_ALIASES = [
        "api_publica_tjpr",
        "api_publica_tjmt",
        "api_publica_trf4",
        "api_publica_trf1",
    ]

    @property
    def tribunal(self) -> str:
        return "datajud"

    @property
    def nome(self) -> str:
        return "DataJud (API Pública CNJ)"

    def _ensure_configured(self) -> None:
        if not settings.DATAJUD_API_KEY:
            raise DataJudConfigMissingError("DATAJUD_API_KEY não configurada")

    def _headers(self) -> dict[str, str]:
        self._ensure_configured()
        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"ApiKey {settings.DATAJUD_API_KEY}",
        }

    def _url(self, tribunal_alias: str) -> str:
        return f"{settings.DATAJUD_BASE_URL}/{tribunal_alias}/_search"

    def _aliases(self, tribunal: str | None = None) -> list[str]:
        """Retorna lista de aliases para consulta."""
        if tribunal:
            alias = self._alias(tribunal)
            return [alias]
        env_aliases = settings.DATAJUD_DEFAULT_ALIASES
        if env_aliases:
            return [a.strip() for a in env_aliases.split(",") if a.strip()]
        return self.DEFAULT_ALIASES

    def _alias(self, tribunal: str) -> str:
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
        return True

    async def buscar_processo_por_numero(
        self, numero_cnj: str, tribunal: str | None = None
    ) -> ConnectorResult:
        cnj_digits = normalizar(numero_cnj)
        aliases = self._aliases(tribunal)

        with log_operation(
            logger,
            operation="buscar_processo_por_numero",
            tribunal=tribunal or "auto",
            connector=self.tribunal,
            numero_cnj=numero_cnj,
        ):
            last_error: Exception | None = None
            for alias in aliases:
                try:
                    result = await self._search_alias(cnj_digits, alias)
                    if result.process:
                        return result
                except Exception as exc:
                    last_error = exc
                    logger.warning(
                        "datajud_alias_failed",
                        extra={"alias": alias, "error": str(exc)},
                    )
                    continue

            if last_error:
                raise last_error
            return ConnectorResult(
                ok=True,
                tribunal=tribunal or "unknown",
                source=self.tribunal,
                process=None,
                movements=[],
                documents=[],
            )

    async def _search_alias(self, cnj_digits: str, alias: str) -> ConnectorResult:
        try:
            payload = {
                "query": {
                    "match": {"numeroProcesso": cnj_digits}
                },
                "size": 1,
            }
            timeout = getattr(settings, "DATAJUD_TIMEOUT_SECONDS", 20)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    self._url(alias),
                    headers=self._headers(),
                    json=payload,
                )
        except httpx.TimeoutException as exc:
            raise DataJudTimeoutError(f"Timeout ao consultar DataJud ({alias})") from exc
        except httpx.NetworkError as exc:
            raise ProcessMonitorError(
                f"Erro de rede ao consultar DataJud ({alias})",
                error_code="NETWORK_ERROR",
            ) from exc

        if resp.status_code == 429:
            raise RateLimitError(f"Rate limit no DataJud ({alias})")

        self._check_blocked(resp)

        if resp.status_code == 401 or resp.status_code == 403:
            raise DataJudAuthError(
                f"Autenticação rejeitada pelo DataJud ({alias})",
                details={"status": resp.status_code},
            )

        if resp.status_code == 404:
            raise DataJudNotFoundError(f"Alias não encontrado: {alias}")

        try:
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as exc:
            raise ProcessMonitorError(
                f"HTTP {exc.response.status_code} do DataJud",
                error_code="HTTP_ERROR",
                details={"status": exc.response.status_code, "body": exc.response.text[:500]},
            ) from exc
        except json.JSONDecodeError as exc:
            raise DataJudParserError(
                "Resposta do DataJud não é JSON válido",
                details={"body": resp.text[:500]},
            ) from exc

        hits = data.get("hits", {}).get("hits", [])
        if not hits:
            return ConnectorResult(
                ok=True,
                tribunal=alias,
                source=self.tribunal,
                process=None,
                movements=[],
                documents=[],
            )

        try:
            source = hits[0].get("_source", {})
            process = self._parse_processo(source, alias)
            movements = self._parse_movimentacoes(source)
        except Exception as exc:
            raise DataJudParserError(
                f"Erro ao parsear resposta do DataJud: {exc}",
                details={"body": json.dumps(data)[:500]},
            ) from exc

        return ConnectorResult(
            ok=True,
            tribunal=alias,
            source=self.tribunal,
            process=process,
            movements=movements,
            documents=[],
        )

    async def listar_andamentos(self, processo_id_tribunal: str) -> ConnectorResult:
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
        raise NotImplementedError("DataJud não fornece download de documentos")

    async def healthcheck(self, live: bool = False) -> ConnectorHealth:
        if not settings.DATAJUD_API_KEY:
            return ConnectorHealth(
                tribunal="datajud",
                connector=self.tribunal,
                status="not_configured",
                details={"reason": "DATAJUD_API_KEY não configurada"},
            )

        if not live:
            return ConnectorHealth(
                tribunal="datajud",
                connector=self.tribunal,
                status="configured",
                details={"base_url": settings.DATAJUD_BASE_URL, "live_check": False},
            )

        try:
            timeout = getattr(settings, "DATAJUD_TIMEOUT_SECONDS", 20)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(
                    f"{settings.DATAJUD_BASE_URL}/api_publica_tjpr/_search?size=0",
                    headers=self._headers(),
                )
                resp.raise_for_status()
                return ConnectorHealth(
                    tribunal="datajud",
                    connector=self.tribunal,
                    status="healthy",
                    details={"base_url": settings.DATAJUD_BASE_URL, "live_check": True},
                )
        except Exception as exc:
            return ConnectorHealth(
                tribunal="datajud",
                connector=self.tribunal,
                status="unavailable",
                last_error_code=type(exc).__name__,
                last_error_message=str(exc),
                details={"base_url": settings.DATAJUD_BASE_URL, "live_check": True},
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

    def _parse_processo(self, source: dict[str, Any], alias: str) -> TribunalProcess:
        return TribunalProcess(
            numero_cnj=source.get("numeroProcesso", ""),
            tribunal=alias,
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
