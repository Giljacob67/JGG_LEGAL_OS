"""Testes do TRF4Connector piloto."""

import pytest
import respx
from httpx import Response

from app.connectors.registry import ConnectorRegistry
from app.connectors.trf4 import TRF4Connector
from app.core.errors import ConnectorNotImplementedError


class TestTRF4ConnectorFixturesMode:
    @pytest.fixture(autouse=True)
    def fixture_mode(self, monkeypatch):
        monkeypatch.setattr("app.connectors.trf4.settings.TRF4_CONNECTOR_ENABLED", True)
        monkeypatch.setattr("app.connectors.trf4.settings.TRF4_CONNECTOR_MODE", "fixtures")
        monkeypatch.setattr(
            "app.connectors.trf4.settings.TRF4_FIXTURES_DIR",
            "tests/fixtures/trf4",
        )

    @pytest.mark.asyncio
    async def test_fixtures_sucesso(self):
        conn = TRF4Connector()
        result = await conn.buscar_processo_por_numero("0001234-56.2026.4.04.0000")
        assert result.ok is True
        assert result.process is not None
        assert result.process.numero_cnj == "0001234-56.2026.4.04.0000"
        assert len(result.movements) == 5
        assert result.source == "trf4_fixture"

    @pytest.mark.asyncio
    async def test_fixtures_not_found(self):
        conn = TRF4Connector()
        result = await conn.buscar_processo_por_numero("0000000-00.0000.0.00.0000")
        assert result.ok is True
        assert result.process is None
        assert result.error_code == "NOT_FOUND"

    @pytest.mark.asyncio
    async def test_listar_documentos(self):
        conn = TRF4Connector()
        result = await conn.listar_documentos("123")
        assert result.ok is True
        assert result.error_code == "DOCUMENTS_NOT_IMPLEMENTED"

    @pytest.mark.asyncio
    async def test_baixar_documento(self):
        conn = TRF4Connector()
        with pytest.raises(ConnectorNotImplementedError) as exc_info:
            await conn.baixar_documento("123")
        assert exc_info.value.details.get("error_code") == "DOCUMENT_DOWNLOAD_NOT_IMPLEMENTED"

    @pytest.mark.asyncio
    async def test_login_not_implemented(self):
        conn = TRF4Connector()
        with pytest.raises(ConnectorNotImplementedError) as exc_info:
            await conn.login({"user": "x"})
        assert exc_info.value.details.get("error_code") == "AUTH_NOT_IMPLEMENTED"

    @pytest.mark.asyncio
    async def test_healthcheck_fixtures(self):
        conn = TRF4Connector()
        health = await conn.healthcheck()
        assert health.status == "ok"
        assert health.details["mode"] == "fixtures"


class TestTRF4ConnectorPublicHttpMode:
    @pytest.fixture(autouse=True)
    def public_mode(self, monkeypatch):
        monkeypatch.setattr("app.connectors.trf4.settings.TRF4_CONNECTOR_ENABLED", True)
        monkeypatch.setattr("app.connectors.trf4.settings.TRF4_CONNECTOR_MODE", "public_http")
        monkeypatch.setattr("app.connectors.trf4.settings.TRF4_PUBLIC_SEARCH_URL", None)
        monkeypatch.setattr("app.connectors.trf4.settings.TRF4_PUBLIC_SEARCH_METHOD", "GET")

    @pytest.mark.asyncio
    async def test_public_http_not_configured(self):
        conn = TRF4Connector()
        result = await conn.buscar_processo_por_numero("0001234-56.2026.4.04.0000")
        assert result.ok is True
        assert result.error_code == "NOT_CONFIGURED"
        assert "TRF4_PUBLIC_SEARCH_URL" in result.error_message

    @pytest.mark.asyncio
    async def test_healthcheck_public_not_configured(self):
        conn = TRF4Connector()
        health = await conn.healthcheck()
        assert health.status == "not_configured"
        assert health.details["mode"] == "public_http"

    @pytest.mark.asyncio
    async def test_public_http_get_sucesso(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.trf4.settings.TRF4_PUBLIC_SEARCH_URL",
            "https://eproc.trf4.jus.br/api/processo",
        )
        fixture_html = (
            "Número do Processo: 0001234-56.2026.4.04.0000\n"
            "Classe: Ação Civil Pública\n"
            "Assunto: Dano Ambiental\n"
            "Situação: Em andamento\n"
            "Órgão Julgador: 1ª Turma\n"
            "Seção Judiciária: Paraná\n"
            "Data de Autuação: 10/01/2026\n"
            "<table><tr><td>10/01/2026</td><td>Autuação</td></tr></table>"
        )
        with respx.mock:
            route = respx.get("https://eproc.trf4.jus.br/api/processo").mock(
                return_value=Response(200, text=fixture_html)
            )
            conn = TRF4Connector()
            result = await conn.buscar_processo_por_numero("0001234-56.2026.4.04.0000")
            assert result.ok is True
            assert result.process is not None
            assert result.process.numero_cnj == "0001234-56.2026.4.04.0000"
            assert result.source == "trf4"
            assert route.called
            assert "numero" in str(route.calls[0].request.url)

    @pytest.mark.asyncio
    async def test_public_http_post_sucesso(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.trf4.settings.TRF4_PUBLIC_SEARCH_URL",
            "https://eproc.trf4.jus.br/api/processo",
        )
        monkeypatch.setattr(
            "app.connectors.trf4.settings.TRF4_PUBLIC_SEARCH_METHOD",
            "POST",
        )
        fixture_html = (
            "Número do Processo: 0001234-56.2026.4.04.0000\n"
            "Classe: Ação Civil Pública\n"
            "Assunto: Dano Ambiental\n"
            "Situação: Em andamento\n"
            "Órgão Julgador: 1ª Turma\n"
            "Data de Autuação: 10/01/2026\n"
            "<table><tr><td>10/01/2026</td><td>Autuação</td></tr></table>"
        )
        with respx.mock:
            route = respx.post("https://eproc.trf4.jus.br/api/processo").mock(
                return_value=Response(200, text=fixture_html)
            )
            conn = TRF4Connector()
            result = await conn.buscar_processo_por_numero("0001234-56.2026.4.04.0000")
            assert result.ok is True
            assert result.process is not None
            assert result.source == "trf4"
            assert route.called

    @pytest.mark.asyncio
    async def test_public_http_not_found(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.trf4.settings.TRF4_PUBLIC_SEARCH_URL",
            "https://eproc.trf4.jus.br/api/processo",
        )
        with respx.mock:
            route = respx.get("https://eproc.trf4.jus.br/api/processo").mock(
                return_value=Response(200, text="Processo não localizado. Não existe processo com esse número.")
            )
            conn = TRF4Connector()
            result = await conn.buscar_processo_por_numero("0000000-00.0000.0.00.0000")
            assert result.ok is True
            assert result.error_code == "NOT_FOUND"
            assert route.called

    @pytest.mark.asyncio
    async def test_public_http_captcha(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.trf4.settings.TRF4_PUBLIC_SEARCH_URL",
            "https://eproc.trf4.jus.br/api/processo",
        )
        with respx.mock:
            route = respx.get("https://eproc.trf4.jus.br/api/processo").mock(
                return_value=Response(200, text="<html><body>recaptcha v2</body></html>")
            )
            conn = TRF4Connector()
            result = await conn.buscar_processo_por_numero("0001234-56.2026.4.04.0000")
            assert result.ok is True
            assert result.error_code == "CAPTCHA_OR_BLOCK"
            assert route.called

    @pytest.mark.asyncio
    async def test_public_http_custom_headers(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.trf4.settings.TRF4_PUBLIC_SEARCH_URL",
            "https://eproc.trf4.jus.br/api/processo",
        )
        monkeypatch.setattr(
            "app.connectors.trf4.settings.TRF4_PUBLIC_SEARCH_HEADERS",
            '{"X-Custom-Token": "abc123", "User-Agent": "CustomBot/1.0"}',
        )
        fixture_html = (
            "Número do Processo: 0001234-56.2026.4.04.0000\n"
            "Classe: Ação Civil Pública\n"
            "Assunto: Dano Ambiental\n"
            "Situação: Em andamento\n"
            "<table><tr><td>10/01/2026</td><td>Autuação</td></tr></table>"
        )
        with respx.mock:
            route = respx.get("https://eproc.trf4.jus.br/api/processo").mock(
                return_value=Response(200, text=fixture_html)
            )
            conn = TRF4Connector()
            result = await conn.buscar_processo_por_numero("0001234-56.2026.4.04.0000")
            assert result.ok is True
            assert route.called
            req = route.calls[0].request
            assert req.headers["X-Custom-Token"] == "abc123"
            assert req.headers["User-Agent"] == "CustomBot/1.0"


class TestTRF4ConnectorDisabled:
    @pytest.fixture(autouse=True)
    def disabled(self, monkeypatch):
        monkeypatch.setattr("app.connectors.trf4.settings.TRF4_CONNECTOR_ENABLED", False)

    @pytest.mark.asyncio
    async def test_disabled(self):
        conn = TRF4Connector()
        result = await conn.buscar_processo_por_numero("0001234-56.2026.4.04.0000")
        assert result.ok is True
        assert result.error_code == "NOT_CONFIGURED"
        assert "desabilitado" in result.error_message

    @pytest.mark.asyncio
    async def test_healthcheck_disabled(self):
        conn = TRF4Connector()
        health = await conn.healthcheck()
        assert health.status == "disabled"


class TestRegistry:
    def test_registry_with_trf4_enabled(self, monkeypatch):
        monkeypatch.setattr("app.connectors.registry.settings.TRF4_CONNECTOR_ENABLED", True)
        from app.connectors.trf4 import TRF4Connector
        reg = ConnectorRegistry()
        reg._connectors = {}
        reg._register_defaults()
        trf4 = reg.get("trf4")
        assert trf4 is not None
        assert isinstance(trf4, TRF4Connector)

    def test_registry_with_trf4_disabled(self, monkeypatch):
        monkeypatch.setattr("app.connectors.registry.settings.TRF4_CONNECTOR_ENABLED", False)
        from app.connectors.trf4_stub import TRF4ConnectorStub
        reg = ConnectorRegistry()
        reg._connectors = {}
        reg._register_defaults()
        trf4 = reg.get("trf4")
        assert trf4 is not None
        assert isinstance(trf4, TRF4ConnectorStub)
