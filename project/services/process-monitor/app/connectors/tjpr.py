"""Conector TJPR (ProJUDI) — piloto seguro e desabilitado por padrão.

NÃO implementa:
- bypass de captcha
- solver de captcha
- login automático
- scraping agressivo
- download de documentos sigilosos

Modos suportados:
- fixtures: usa HTML local para testes
- public_http: tenta caminho público configurado por env
- disabled: não faz nada, retorna NOT_CONFIGURED

Playwright NÃO é usado nesta fase.
"""

import pathlib
from typing import Any

import httpx

from app.config import settings
from app.connectors.base import TribunalConnector
from app.connectors.parsers.tjpr import (
    detect_tjpr_captcha_or_block,
    detect_tjpr_error_page,
    parse_tjpr_movements,
    parse_tjpr_process_page,
)
from app.core.errors import (
    CaptchaOrBlockError,
    ConnectorNotImplementedError,
    ParseError,
    ProcessMonitorError,
    RateLimitError,
)
from app.core.rate_limit import RateLimiter
from app.core.session_manager import SessionManager
from app.logging_config import get_logger, log_operation
from app.models.schemas import ConnectorHealth, ConnectorResult, TribunalDocument, TribunalMovement, TribunalProcess

logger = get_logger("connectors.tjpr")

rate_limiter = RateLimiter()


class TJPRConnector(TribunalConnector):
    """Conector piloto para TJPR (ProJUDI)."""

    @property
    def tribunal(self) -> str:
        return "tjpr"

    @property
    def nome(self) -> str:
        return "TJPR (ProJUDI) — piloto"

    def _is_enabled(self) -> bool:
        return getattr(settings, "TJPR_CONNECTOR_ENABLED", False) is True

    def _mode(self) -> str:
        return getattr(settings, "TJPR_CONNECTOR_MODE", "fixtures")

    def _fixtures_dir(self) -> pathlib.Path:
        raw = getattr(settings, "TJPR_FIXTURES_DIR", "tests/fixtures/tjpr")
        return pathlib.Path(raw)

    def _public_url(self) -> str | None:
        url = getattr(settings, "TJPR_PUBLIC_SEARCH_URL", None)
        return url if url else None

    def _timeout(self) -> float:
        return getattr(settings, "TJPR_TIMEOUT_SECONDS", 20.0)

    def _rate_limit_seconds(self) -> float:
        return getattr(settings, "TJPR_RATE_LIMIT_SECONDS", 10.0)

    async def login(self, credentials: dict[str, Any]) -> bool:
        """Login não implementado nesta fase."""
        if credentials:
            raise ConnectorNotImplementedError(
                "Login TJPR não implementado nesta fase",
                details={"error_code": "AUTH_NOT_IMPLEMENTED"},
            )
        return True

    async def buscar_processo_por_numero(self, numero_cnj: str) -> ConnectorResult:
        if not self._is_enabled():
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr_disabled",
                process=None,
                movements=[],
                documents=[],
                error_code="NOT_CONFIGURED",
                error_message="TJPR connector está desabilitado (TJPR_CONNECTOR_ENABLED=false)",
            )

        with log_operation(
            logger,
            operation="buscar_processo_por_numero",
            tribunal=self.tribunal,
            connector="tjpr",
            numero_cnj=numero_cnj,
        ):
            mode = self._mode()

            if mode == "fixtures":
                return await self._buscar_fixtures(numero_cnj)

            if mode == "public_http":
                return await self._buscar_public_http(numero_cnj)

            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr",
                process=None,
                movements=[],
                documents=[],
                error_code="NOT_CONFIGURED",
                error_message=f"Modo TJPR não suportado: {mode}",
            )

    async def _buscar_fixtures(self, numero_cnj: str) -> ConnectorResult:
        """Busca processo em fixtures HTML locais."""
        fixtures_dir = self._fixtures_dir()
        fixture_path = fixtures_dir / "processo_publico_basico.html"

        if not fixture_path.exists():
            logger.warning("fixture_not_found", extra={"path": str(fixture_path)})
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr_fixture",
                process=None,
                movements=[],
                documents=[],
                error_code="NOT_CONFIGURED",
                error_message="Fixture não encontrada",
            )

        html = fixture_path.read_text(encoding="utf-8")

        # Verificar se CNJ da fixture corresponde (simulação)
        if numero_cnj.replace("-", "").replace(".", "") not in html.replace("-", "").replace(".", ""):
            # Tentar fixture de não encontrado
            not_found_path = fixtures_dir / "processo_nao_encontrado.html"
            if not_found_path.exists():
                not_found_html = not_found_path.read_text(encoding="utf-8")
                error = detect_tjpr_error_page(not_found_html)
                if error == "not_found":
                    return ConnectorResult(
                        ok=True,
                        tribunal=self.tribunal,
                        source="tjpr_fixture",
                        process=None,
                        movements=[],
                        documents=[],
                        error_code="NOT_FOUND",
                        error_message="Processo não encontrado (fixture)",
                    )

        try:
            process = parse_tjpr_process_page(html)
            movements = parse_tjpr_movements(html)
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr_fixture",
                process=process,
                movements=movements,
                documents=[],
            )
        except ParseError as exc:
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr_fixture",
                process=None,
                movements=[],
                documents=[],
                error_code=exc.error_code,
                error_message=exc.message,
            )

    async def _buscar_public_http(self, numero_cnj: str) -> ConnectorResult:
        """Busca processo via HTTP público configurado."""
        url = self._public_url()
        if not url:
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr",
                process=None,
                movements=[],
                documents=[],
                error_code="NOT_CONFIGURED",
                error_message="TJPR_PUBLIC_SEARCH_URL não configurada",
            )

        try:
            rate_limiter.wait_if_needed(self.tribunal)
        except ProcessMonitorError as exc:
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr",
                process=None,
                movements=[],
                documents=[],
                error_code=exc.error_code,
                error_message=exc.message,
            )

        try:
            session = SessionManager(self.tribunal)
            resp = await session.request(
                "GET",
                url,
                params={"numero": numero_cnj},
            )
            await session.close()
        except RateLimitError as exc:
            rate_limiter.record_failure(self.tribunal, error_code="RATE_LIMIT")
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr",
                process=None,
                movements=[],
                documents=[],
                error_code="RATE_LIMITED",
                error_message=exc.message,
            )
        except CaptchaOrBlockError as exc:
            rate_limiter.record_failure(self.tribunal, error_code="CAPTCHA_OR_BLOCK")
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr",
                process=None,
                movements=[],
                documents=[],
                error_code="CAPTCHA_OR_BLOCK",
                error_message=exc.message,
            )
        except Exception as exc:
            rate_limiter.record_failure(self.tribunal, error_code=type(exc).__name__)
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr",
                process=None,
                movements=[],
                documents=[],
                error_code="NETWORK_ERROR",
                error_message=str(exc),
            )

        html = resp.text
        error = detect_tjpr_error_page(html)
        if error == "captcha_or_block":
            rate_limiter.record_failure(self.tribunal, error_code="CAPTCHA_OR_BLOCK")
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr",
                process=None,
                movements=[],
                documents=[],
                error_code="CAPTCHA_OR_BLOCK",
                error_message="Captcha ou bloqueio detectado no TJPR",
            )
        if error == "not_found":
            rate_limiter.record_success(self.tribunal)
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr",
                process=None,
                movements=[],
                documents=[],
                error_code="NOT_FOUND",
                error_message="Processo não encontrado no TJPR",
            )
        if error == "system_error":
            rate_limiter.record_failure(self.tribunal, error_code="TRIBUNAL_ERROR")
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr",
                process=None,
                movements=[],
                documents=[],
                error_code="TRIBUNAL_ERROR",
                error_message="Erro no sistema do TJPR",
            )

        try:
            process = parse_tjpr_process_page(html)
            movements = parse_tjpr_movements(html)
            rate_limiter.record_success(self.tribunal)
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr",
                process=process,
                movements=movements,
                documents=[],
            )
        except ParseError as exc:
            rate_limiter.record_failure(self.tribunal, error_code="PARSER_ERROR")
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr",
                process=None,
                movements=[],
                documents=[],
                error_code=exc.error_code,
                error_message=exc.message,
            )

    async def listar_andamentos(self, processo_id_tribunal: str) -> ConnectorResult:
        """Andamentos já são retornados na busca principal."""
        return ConnectorResult(
            ok=True,
            tribunal=self.tribunal,
            source="tjpr",
            process=None,
            movements=[],
            documents=[],
            error_code="NOT_IMPLEMENTED_SEPARATE",
            error_message="Andamentos são retornados na busca principal do TJPR",
        )

    async def listar_documentos(self, processo_id_tribunal: str) -> ConnectorResult:
        return ConnectorResult(
            ok=True,
            tribunal=self.tribunal,
            source="tjpr",
            process=None,
            movements=[],
            documents=[],
            error_code="DOCUMENTS_NOT_IMPLEMENTED",
            error_message="Documentos não implementados no TJPR piloto",
        )

    async def baixar_documento(self, documento_id_tribunal: str) -> bytes:
        raise ConnectorNotImplementedError(
            "Download de documentos TJPR não implementado",
            details={"error_code": "DOCUMENT_DOWNLOAD_NOT_IMPLEMENTED"},
        )

    async def healthcheck(self, live: bool = False) -> ConnectorHealth:
        if not self._is_enabled():
            return ConnectorHealth(
                tribunal=self.tribunal,
                connector="tjpr_pilot",
                status="disabled",
                details={"reason": "TJPR_CONNECTOR_ENABLED=false"},
            )

        mode = self._mode()
        if mode == "fixtures":
            fixtures_dir = self._fixtures_dir()
            has_fixtures = (fixtures_dir / "processo_publico_basico.html").exists()
            return ConnectorHealth(
                tribunal=self.tribunal,
                connector="tjpr_pilot",
                status="ok" if has_fixtures else "not_configured",
                details={"mode": "fixtures", "fixtures_dir": str(fixtures_dir), "has_fixtures": has_fixtures},
            )

        if mode == "public_http":
            url = self._public_url()
            if not url:
                return ConnectorHealth(
                    tribunal=self.tribunal,
                    connector="tjpr_pilot",
                    status="not_configured",
                    details={"mode": "public_http", "reason": "TJPR_PUBLIC_SEARCH_URL não configurada"},
                )
            if not live:
                return ConnectorHealth(
                    tribunal=self.tribunal,
                    connector="tjpr_pilot",
                    status="configured",
                    details={"mode": "public_http", "url": url, "live_check": False},
                )
            # Live check
            try:
                async with httpx.AsyncClient(timeout=self._timeout()) as client:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    return ConnectorHealth(
                        tribunal=self.tribunal,
                        connector="tjpr_pilot",
                        status="ok",
                        details={"mode": "public_http", "url": url, "live_check": True},
                    )
            except Exception as exc:
                return ConnectorHealth(
                    tribunal=self.tribunal,
                    connector="tjpr_pilot",
                    status="degraded",
                    last_error_code=type(exc).__name__,
                    last_error_message=str(exc),
                    details={"mode": "public_http", "url": url, "live_check": True},
                )

        return ConnectorHealth(
            tribunal=self.tribunal,
            connector="tjpr_pilot",
            status="not_configured",
            details={"mode": mode, "reason": "Modo não suportado"},
        )
