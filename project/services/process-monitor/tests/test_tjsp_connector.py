"""Testes do TJSPConnector piloto (e-SAJ)."""

import pytest
import respx
from httpx import Response

from app.connectors.registry import ConnectorRegistry
from app.connectors.tjsp import TJSPConnector
from app.core.errors import ConnectorNotImplementedError


class TestTJSPConnectorFixturesMode:
    @pytest.fixture(autouse=True)
    def fixture_mode(self, monkeypatch):
        monkeypatch.setattr("app.connectors.tjsp.settings.TJSP_CONNECTOR_ENABLED", True)
        monkeypatch.setattr("app.connectors.tjsp.settings.TJSP_CONNECTOR_MODE", "fixtures")
        monkeypatch.setattr(
            "app.connectors.tjsp.settings.TJSP_FIXTURES_DIR",
            "tests/fixtures/tjsp",
        )

    @pytest.mark.asyncio
    async def test_fixtures_sucesso(self):
        conn = TJSPConnector()
        result = await conn.buscar_processo_por_numero("0003333-44.2026.8.26.0000")
        assert result.ok is True
        assert result.process is not None
        assert result.process.numero_cnj == "0003333-44.2026.8.26.0000"
        assert len(result.movements) == 2
        assert result.source == "tjsp_fixture"

    @pytest.mark.asyncio
    async def test_fixtures_not_found(self):
        conn = TJSPConnector()
        result = await conn.buscar_processo_por_numero("0000000-00.0000.0.00.0000")
        assert result.ok is True
        assert result.process is None
        assert result.error_code == "NOT_FOUND"

    @pytest.mark.asyncio
    async def test_listar_documentos(self):
        conn = TJSPConnector()
        result = await conn.listar_documentos("123")
        assert result.ok is True
        assert result.error_code == "DOCUMENTS_NOT_IMPLEMENTED"

    @pytest.mark.asyncio
    async def test_baixar_documento(self):
        conn = TJSPConnector()
        with pytest.raises(ConnectorNotImplementedError) as exc_info:
            await conn.baixar_documento("123")
        assert exc_info.value.details.get("error_code") == "DOCUMENT_DOWNLOAD_NOT_IMPLEMENTED"

    @pytest.mark.asyncio
    async def test_login_not_implemented(self):
        conn = TJSPConnector()
        with pytest.raises(ConnectorNotImplementedError) as exc_info:
            await conn.login({"user": "x"})
        assert exc_info.value.details.get("error_code") == "AUTH_NOT_IMPLEMENTED"

    @pytest.mark.asyncio
    async def test_healthcheck_fixtures(self):
        conn = TJSPConnector()
        health = await conn.healthcheck()
        assert health.status == "ok"
        assert health.details["mode"] == "fixtures"


class TestTJSPConnectorPublicHttpMode:
    @pytest.fixture(autouse=True)
    def public_mode(self, monkeypatch):
        monkeypatch.setattr("app.connectors.tjsp.settings.TJSP_CONNECTOR_ENABLED", True)
        monkeypatch.setattr("app.connectors.tjsp.settings.TJSP_CONNECTOR_MODE", "public_http")
        monkeypatch.setattr("app.connectors.tjsp.settings.TJSP_PUBLIC_SEARCH_URL", None)
        monkeypatch.setattr("app.connectors.tjsp.settings.TJSP_PUBLIC_SEARCH_METHOD", "GET")

    @pytest.mark.asyncio
    async def test_public_http_not_configured(self):
        conn = TJSPConnector()
        result = await conn.buscar_processo_por_numero("0003333-44.2026.8.26.0000")
        assert result.ok is True
        assert result.error_code == "NOT_CONFIGURED"
        assert "TJSP_PUBLIC_SEARCH_URL" in result.error_message

    @pytest.mark.asyncio
    async def test_healthcheck_public_not_configured(self):
        conn = TJSPConnector()
        health = await conn.healthcheck()
        assert health.status == "not_configured"
        assert health.details["mode"] == "public_http"

    @pytest.mark.asyncio
    async def test_public_http_get_sucesso(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.tjsp.settings.TJSP_PUBLIC_SEARCH_URL",
            "https://esaj.tjsp.jus.br/cpo/pg/search.do",
        )
        fixture_html = (
            "<table>"
            "<tr><th>Número do Processo:</th><td>0003333-44.2026.8.26.0000</td></tr>"
            "<tr><th>Classe:</th><td>Ação Civil Pública</td></tr>"
            "<tr><th>Assunto:</th><td>Dano Moral</td></tr>"
            "<tr><th>Situação:</th><td>Em andamento</td></tr>"
            "<tr><th>Comarca:</th><td>São Paulo</td></tr>"
            "</table>"
            "<table><tr><td>20/04/2026</td><td>Distribuição</td></tr></table>"
        )
        with respx.mock:
            route = respx.get("https://esaj.tjsp.jus.br/cpo/pg/search.do").mock(
                return_value=Response(200, text=fixture_html)
            )
            conn = TJSPConnector()
            result = await conn.buscar_processo_por_numero("0003333-44.2026.8.26.0000")
            assert result.ok is True
            assert result.process is not None
            assert result.process.numero_cnj == "0003333-44.2026.8.26.0000"
            assert result.source == "tjsp"
            assert route.called
            assert "numero" in str(route.calls[0].request.url)

    @pytest.mark.asyncio
    async def test_public_http_not_found(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.tjsp.settings.TJSP_PUBLIC_SEARCH_URL",
            "https://esaj.tjsp.jus.br/cpo/pg/search.do",
        )
        with respx.mock:
            route = respx.get("https://esaj.tjsp.jus.br/cpo/pg/search.do").mock(
                return_value=Response(200, text="O processo informado não foi localizado.")
            )
            conn = TJSPConnector()
            result = await conn.buscar_processo_por_numero("0000000-00.0000.0.00.0000")
            assert result.ok is True
            assert result.error_code == "NOT_FOUND"
            assert route.called

    @pytest.mark.asyncio
    async def test_public_http_captcha(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.tjsp.settings.TJSP_PUBLIC_SEARCH_URL",
            "https://esaj.tjsp.jus.br/cpo/pg/search.do",
        )
        with respx.mock:
            route = respx.get("https://esaj.tjsp.jus.br/cpo/pg/search.do").mock(
                return_value=Response(200, text="<html><body>recaptcha v2</body></html>")
            )
            conn = TJSPConnector()
            result = await conn.buscar_processo_por_numero("0003333-44.2026.8.26.0000")
            assert result.ok is True
            assert result.error_code == "CAPTCHA_OR_BLOCK"
            assert route.called

    @pytest.mark.asyncio
    async def test_public_http_custom_headers(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.tjsp.settings.TJSP_PUBLIC_SEARCH_URL",
            "https://esaj.tjsp.jus.br/cpo/pg/search.do",
        )
        monkeypatch.setattr(
            "app.connectors.tjsp.settings.TJSP_PUBLIC_SEARCH_HEADERS",
            '{"X-Custom-Token": "abc123", "User-Agent": "CustomBot/1.0"}',
        )
        fixture_html = (
            "<table>"
            "<tr><th>Número do Processo:</th><td>0003333-44.2026.8.26.0000</td></tr>"
            "<tr><th>Classe:</th><td>Ação Civil Pública</td></tr>"
            "</table>"
            "<table><tr><td>20/04/2026</td><td>Distribuição</td></tr></table>"
        )
        with respx.mock:
            route = respx.get("https://esaj.tjsp.jus.br/cpo/pg/search.do").mock(
                return_value=Response(200, text=fixture_html)
            )
            conn = TJSPConnector()
            result = await conn.buscar_processo_por_numero("0003333-44.2026.8.26.0000")
            assert result.ok is True
            assert route.called
            req = route.calls[0].request
            assert req.headers["X-Custom-Token"] == "abc123"
            assert req.headers["User-Agent"] == "CustomBot/1.0"


class TestTJSPConnectorDisabled:
    @pytest.fixture(autouse=True)
    def disabled(self, monkeypatch):
        monkeypatch.setattr("app.connectors.tjsp.settings.TJSP_CONNECTOR_ENABLED", False)

    @pytest.mark.asyncio
    async def test_disabled(self):
        conn = TJSPConnector()
        result = await conn.buscar_processo_por_numero("0003333-44.2026.8.26.0000")
        assert result.ok is True
        assert result.error_code == "NOT_CONFIGURED"
        assert "desabilitado" in result.error_message

    @pytest.mark.asyncio
    async def test_healthcheck_disabled(self):
        conn = TJSPConnector()
        health = await conn.healthcheck()
        assert health.status == "disabled"


class TestRegistry:
    def test_registry_with_tjsp_enabled(self, monkeypatch):
        monkeypatch.setattr("app.connectors.registry.settings.TJSP_CONNECTOR_ENABLED", True)
        reg = ConnectorRegistry()
        reg._connectors = {}
        reg._register_defaults()
        tjsp = reg.get("tjsp")
        assert tjsp is not None
        assert isinstance(tjsp, TJSPConnector)

    def test_registry_with_tjsp_disabled(self, monkeypatch):
        monkeypatch.setattr("app.connectors.registry.settings.TJSP_CONNECTOR_ENABLED", False)
        from app.connectors.tjsp_stub import TJSPConnectorStub
        reg = ConnectorRegistry()
        reg._connectors = {}
        reg._register_defaults()
        tjsp = reg.get("tjsp")
        assert tjsp is not None
        assert isinstance(tjsp, TJSPConnectorStub)
