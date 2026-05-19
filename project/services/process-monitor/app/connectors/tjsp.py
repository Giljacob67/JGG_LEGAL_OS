"""Conector TJSP (e-SAJ) — piloto seguro e desabilitado por padrão."""

import json
import pathlib
from typing import Any

import httpx

from app.config import settings
from app.connectors.base import TribunalConnector
from app.connectors.parsers.esaj import (
    detect_esaj_captcha_or_block,
    detect_esaj_error_page,
    parse_esaj_movements,
    parse_esaj_process_page,
)
from app.core.errors import CaptchaOrBlockError, ConnectorNotImplementedError, ParseError, ProcessMonitorError, RateLimitError
from app.core.rate_limit import RateLimiter
from app.core.session_manager import SessionManager
from app.logging_config import get_logger, log_operation
from app.models.schemas import ConnectorHealth, ConnectorResult

logger = get_logger("connectors.tjsp")
rate_limiter = RateLimiter()


class TJSPConnector(TribunalConnector):
    @property
    def tribunal(self) -> str:
        return "tjsp"

    @property
    def nome(self) -> str:
        return "TJSP (e-SAJ) — piloto"

    def _is_enabled(self) -> bool:
        return getattr(settings, "TJSP_CONNECTOR_ENABLED", False) is True

    def _mode(self) -> str:
        return getattr(settings, "TJSP_CONNECTOR_MODE", "fixtures")

    def _fixtures_dir(self) -> pathlib.Path:
        return pathlib.Path(getattr(settings, "TJSP_FIXTURES_DIR", "tests/fixtures/tjsp"))

    def _public_url(self) -> str | None:
        return getattr(settings, "TJSP_PUBLIC_SEARCH_URL", None) or None

    def _public_search_method(self) -> str:
        return getattr(settings, "TJSP_PUBLIC_SEARCH_METHOD", "GET").upper()

    def _public_search_headers(self) -> dict[str, str]:
        raw = getattr(settings, "TJSP_PUBLIC_SEARCH_HEADERS", None)
        if raw:
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                logger.warning("invalid_tjsp_headers_json", extra={"raw": raw})
        return {"User-Agent": "JGG-Legal-OS/1.0 (process-monitor)"}

    def _timeout(self) -> float:
        return getattr(settings, "TJSP_TIMEOUT_SECONDS", 20.0)

    def _rate_limit_seconds(self) -> float:
        return getattr(settings, "TJSP_RATE_LIMIT_SECONDS", 10.0)

    async def login(self, credentials: dict[str, Any]) -> bool:
        if credentials:
            raise ConnectorNotImplementedError("Login TJSP não implementado nesta fase", details={"error_code": "AUTH_NOT_IMPLEMENTED"})
        return True

    async def buscar_processo_por_numero(self, numero_cnj: str) -> ConnectorResult:
        if not self._is_enabled():
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp_disabled", process=None, movements=[], documents=[], error_code="NOT_CONFIGURED", error_message="TJSP connector está desabilitado")
        with log_operation(logger, operation="buscar_processo_por_numero", tribunal=self.tribunal, connector="tjsp", numero_cnj=numero_cnj):
            mode = self._mode()
            if mode == "fixtures":
                return await self._buscar_fixtures(numero_cnj)
            if mode == "public_http":
                return await self._buscar_public_http(numero_cnj)
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=None, movements=[], documents=[], error_code="NOT_CONFIGURED", error_message=f"Modo TJSP não suportado: {mode}")

    async def _buscar_fixtures(self, numero_cnj: str) -> ConnectorResult:
        fixtures_dir = self._fixtures_dir()
        fixture_path = fixtures_dir / "processo_publico_basico.html"
        if not fixture_path.exists():
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp_fixture", process=None, movements=[], documents=[], error_code="NOT_CONFIGURED", error_message="Fixture não encontrada")
        html = fixture_path.read_text(encoding="utf-8")
        if numero_cnj.replace("-", "").replace(".", "") not in html.replace("-", "").replace(".", ""):
            not_found_path = fixtures_dir / "processo_nao_encontrado.html"
            if not_found_path.exists() and detect_esaj_error_page(not_found_path.read_text(encoding="utf-8")) == "not_found":
                return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp_fixture", process=None, movements=[], documents=[], error_code="NOT_FOUND", error_message="Processo não encontrado (fixture)")
        try:
            process = parse_esaj_process_page(html, tribunal="tjsp")
            movements = parse_esaj_movements(html)
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp_fixture", process=process, movements=movements, documents=[])
        except ParseError as exc:
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp_fixture", process=None, movements=[], documents=[], error_code=exc.error_code, error_message=exc.message)

    async def _buscar_public_http(self, numero_cnj: str) -> ConnectorResult:
        url = self._public_url()
        if not url:
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=None, movements=[], documents=[], error_code="NOT_CONFIGURED", error_message="TJSP_PUBLIC_SEARCH_URL não configurada")
        try:
            rate_limiter.wait_if_needed(self.tribunal)
        except ProcessMonitorError as exc:
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=None, movements=[], documents=[], error_code=exc.error_code, error_message=exc.message)
        try:
            session = SessionManager(self.tribunal)
            self._apply_credentials(session)
            method = self._public_search_method()
            headers = self._public_search_headers()
            payload = {"numero": numero_cnj, "numeroProcesso": numero_cnj}
            if method == "POST":
                resp = await session.request("POST", url, data=payload, headers=headers)
            else:
                resp = await session.request("GET", url, params=payload, headers=headers)
            await session.close()
        except RateLimitError as exc:
            rate_limiter.record_failure(self.tribunal, error_code="RATE_LIMIT")
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=None, movements=[], documents=[], error_code="RATE_LIMITED", error_message=exc.message)
        except CaptchaOrBlockError as exc:
            rate_limiter.record_failure(self.tribunal, error_code="CAPTCHA_OR_BLOCK")
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=None, movements=[], documents=[], error_code="CAPTCHA_OR_BLOCK", error_message=exc.message)
        except Exception as exc:
            rate_limiter.record_failure(self.tribunal, error_code=type(exc).__name__)
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=None, movements=[], documents=[], error_code="NETWORK_ERROR", error_message=str(exc))
        html = resp.text
        if detect_esaj_captcha_or_block(html):
            rate_limiter.record_failure(self.tribunal, error_code="CAPTCHA_OR_BLOCK")
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=None, movements=[], documents=[], error_code="CAPTCHA_OR_BLOCK", error_message="Captcha ou bloqueio detectado no TJSP")
        error = detect_esaj_error_page(html)
        if error == "not_found":
            rate_limiter.record_success(self.tribunal)
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=None, movements=[], documents=[], error_code="NOT_FOUND", error_message="Processo não encontrado no TJSP")
        if error == "system_error":
            rate_limiter.record_failure(self.tribunal, error_code="TRIBUNAL_ERROR")
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=None, movements=[], documents=[], error_code="TRIBUNAL_ERROR", error_message="Erro no sistema do TJSP")
        try:
            process = parse_esaj_process_page(html, tribunal="tjsp")
            movements = parse_esaj_movements(html)
            rate_limiter.record_success(self.tribunal)
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=process, movements=movements, documents=[])
        except ParseError as exc:
            rate_limiter.record_failure(self.tribunal, error_code="PARSER_ERROR")
            return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=None, movements=[], documents=[], error_code=exc.error_code, error_message=exc.message)

    async def listar_andamentos(self, processo_id_tribunal: str) -> ConnectorResult:
        return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=None, movements=[], documents=[], error_code="NOT_IMPLEMENTED_SEPARATE", error_message="Andamentos são retornados na busca principal do TJSP")

    async def listar_documentos(self, processo_id_tribunal: str) -> ConnectorResult:
        return ConnectorResult(ok=True, tribunal=self.tribunal, source="tjsp", process=None, movements=[], documents=[], error_code="DOCUMENTS_NOT_IMPLEMENTED", error_message="Documentos não implementados no TJSP piloto")

    async def baixar_documento(self, documento_id_tribunal: str) -> bytes:
        raise ConnectorNotImplementedError("Download de documentos TJSP não implementado", details={"error_code": "DOCUMENT_DOWNLOAD_NOT_IMPLEMENTED"})

    async def healthcheck(self, live: bool = False) -> ConnectorHealth:
        if not self._is_enabled():
            return ConnectorHealth(tribunal=self.tribunal, connector="tjsp_pilot", status="disabled", details={"reason": "TJSP_CONNECTOR_ENABLED=false"})
        mode = self._mode()
        if mode == "fixtures":
            has_fixtures = (self._fixtures_dir() / "processo_publico_basico.html").exists()
            return ConnectorHealth(tribunal=self.tribunal, connector="tjsp_pilot", status="ok" if has_fixtures else "not_configured", details={"mode": "fixtures", "has_fixtures": has_fixtures})
        if mode == "public_http":
            url = self._public_url()
            if not url:
                return ConnectorHealth(tribunal=self.tribunal, connector="tjsp_pilot", status="not_configured", details={"mode": "public_http", "reason": "TJSP_PUBLIC_SEARCH_URL não configurada"})
            if not live:
                return ConnectorHealth(tribunal=self.tribunal, connector="tjsp_pilot", status="configured", details={"mode": "public_http", "url": url, "live_check": False})
            try:
                async with httpx.AsyncClient(timeout=self._timeout()) as client:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    return ConnectorHealth(tribunal=self.tribunal, connector="tjsp_pilot", status="ok", details={"mode": "public_http", "url": url, "live_check": True})
            except Exception as exc:
                return ConnectorHealth(tribunal=self.tribunal, connector="tjsp_pilot", status="degraded", last_error_code=type(exc).__name__, last_error_message=str(exc), details={"mode": "public_http", "url": url, "live_check": True})
        return ConnectorHealth(tribunal=self.tribunal, connector="tjsp_pilot", status="not_configured", details={"mode": mode, "reason": "Modo não suportado"})
