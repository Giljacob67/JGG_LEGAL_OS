"""Testes do TJRSConnector piloto (e-SAJ)."""

import pytest
import respx
from httpx import Response

from app.connectors.registry import ConnectorRegistry
from app.connectors.tjrs import TJRSConnector
from app.core.errors import ConnectorNotImplementedError


class TestTJRSConnectorFixturesMode:
    @pytest.fixture(autouse=True)
    def fixture_mode(self, monkeypatch):
        monkeypatch.setattr("app.connectors.tjrs.settings.TJRS_CONNECTOR_ENABLED", True)
        monkeypatch.setattr("app.connectors.tjrs.settings.TJRS_CONNECTOR_MODE", "fixtures")
        monkeypatch.setattr(
            "app.connectors.tjrs.settings.TJRS_FIXTURES_DIR",
            "tests/fixtures/tjrs",
        )

    @pytest.mark.asyncio
    async def test_fixtures_sucesso(self):
        conn = TJRSConnector()
        result = await conn.buscar_processo_por_numero("0004444-55.2026.8.21.0000")
        assert result.ok is True
        assert result.process is not None
        assert result.process.numero_cnj == "0004444-55.2026.8.21.0000"
        assert len(result.movements) == 2
        assert result.source == "tjrs_fixture"

    @pytest.mark.asyncio
    async def test_fixtures_not_found(self):
        conn = TJRSConnector()
        result = await conn.buscar_processo_por_numero("0000000-00.0000.0.00.0000")
        assert result.ok is True
        assert result.process is None
        assert result.error_code == "NOT_FOUND"

    @pytest.mark.asyncio
    async def test_listar_documentos(self):
        conn = TJRSConnector()
        result = await conn.listar_documentos("123")
        assert result.ok is True
        assert result.error_code == "DOCUMENTS_NOT_IMPLEMENTED"

    @pytest.mark.asyncio
    async def test_baixar_documento(self):
        conn = TJRSConnector()
        with pytest.raises(ConnectorNotImplementedError) as exc_info:
            await conn.baixar_documento("123")
        assert exc_info.value.details.get("error_code") == "DOCUMENT_DOWNLOAD_NOT_IMPLEMENTED"

    @pytest.mark.asyncio
    async def test_login_not_implemented(self):
        conn = TJRSConnector()
        with pytest.raises(ConnectorNotImplementedError) as exc_info:
            await conn.login({"user": "x"})
        assert exc_info.value.details.get("error_code") == "AUTH_NOT_IMPLEMENTED"

    @pytest.mark.asyncio
    async def test_healthcheck_fixtures(self):
        conn = TJRSConnector()
        health = await conn.healthcheck()
        assert health.status == "ok"
        assert health.details["mode"] == "fixtures"


class TestTJRSConnectorPublicHttpMode:
    @pytest.fixture(autouse=True)
    def public_mode(self, monkeypatch):
        monkeypatch.setattr("app.connectors.tjrs.settings.TJRS_CONNECTOR_ENABLED", True)
        monkeypatch.setattr("app.connectors.tjrs.settings.TJRS_CONNECTOR_MODE", "public_http")
        monkeypatch.setattr("app.connectors.tjrs.settings.TJRS_PUBLIC_SEARCH_URL", None)
        monkeypatch.setattr("app.connectors.tjrs.settings.TJRS_PUBLIC_SEARCH_METHOD", "GET")

    @pytest.mark.asyncio
    async def test_public_http_not_configured(self):
        conn = TJRSConnector()
        result = await conn.buscar_processo_por_numero("0004444-55.2026.8.21.0000")
        assert result.ok is True
        assert result.error_code == "NOT_CONFIGURED"
        assert "TJRS_PUBLIC_SEARCH_URL" in result.error_message

    @pytest.mark.asyncio
    async def test_healthcheck_public_not_configured(self):
        conn = TJRSConnector()
        health = await conn.healthcheck()
        assert health.status == "not_configured"
        assert health.details["mode"] == "public_http"

    @pytest.mark.asyncio
    async def test_public_http_get_sucesso(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.tjrs.settings.TJRS_PUBLIC_SEARCH_URL",
            "https://www.tjrs.jus.br/site/processos/consulta",
        )
        fixture_html = (
            "<table>"
            "<tr><th>Número do Processo:</th><td>0004444-55.2026.8.21.0000</td></tr>"
            "<tr><th>Classe:</th><td>Ação Civil Pública</td></tr>"
            "<tr><th>Assunto:</th><td>Dano Ambiental</td></tr>"
            "<tr><th>Situação:</th><td>Em andamento</td></tr>"
            "<tr><th>Comarca:</th><td>Porto Alegre</td></tr>"
            "</table>"
            "<table><tr><td>01/05/2026</td><td>Distribuição</td></tr></table>"
        )
        with respx.mock:
            route = respx.get("https://www.tjrs.jus.br/site/processos/consulta").mock(
                return_value=Response(200, text=fixture_html)
            )
            conn = TJRSConnector()
            result = await conn.buscar_processo_por_numero("0004444-55.2026.8.21.0000")
            assert result.ok is True
            assert result.process is not None
            assert result.process.numero_cnj == "0004444-55.2026.8.21.0000"
            assert result.source == "tjrs"
            assert route.called
            assert "numero" in str(route.calls[0].request.url)

    @pytest.mark.asyncio
    async def test_public_http_not_found(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.tjrs.settings.TJRS_PUBLIC_SEARCH_URL",
            "https://www.tjrs.jus.br/site/processos/consulta",
        )
        with respx.mock:
            route = respx.get("https://www.tjrs.jus.br/site/processos/consulta").mock(
                return_value=Response(200, text="O processo informado não foi localizado.")
            )
            conn = TJRSConnector()
            result = await conn.buscar_processo_por_numero("0000000-00.0000.0.00.0000")
            assert result.ok is True
            assert result.error_code == "NOT_FOUND"
            assert route.called

    @pytest.mark.asyncio
    async def test_public_http_captcha(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.tjrs.settings.TJRS_PUBLIC_SEARCH_URL",
            "https://www.tjrs.jus.br/site/processos/consulta",
        )
        with respx.mock:
            route = respx.get("https://www.tjrs.jus.br/site/processos/consulta").mock(
                return_value=Response(200, text="<html><body>recaptcha v2</body></html>")
            )
            conn = TJRSConnector()
            result = await conn.buscar_processo_por_numero("0004444-55.2026.8.21.0000")
            assert result.ok is True
            assert result.error_code == "CAPTCHA_OR_BLOCK"
            assert route.called

    @pytest.mark.asyncio
    async def test_public_http_custom_headers(self, monkeypatch):
        monkeypatch.setattr(
            "app.connectors.tjrs.settings.TJRS_PUBLIC_SEARCH_URL",
            "https://www.tjrs.jus.br/site/processos/consulta",
        )
        monkeypatch.setattr(
            "app.connectors.tjrs.settings.TJRS_PUBLIC_SEARCH_HEADERS",
            '{"X-Custom-Token": "abc123", "User-Agent": "CustomBot/1.0"}',
        )
        fixture_html = (
            "<table>"
            "<tr><th>Número do Processo:</th><td>0004444-55.2026.8.21.0000</td></tr>"
            "<tr><th>Classe:</th><td>Ação Civil Pública</td></tr>"
            "</table>"
            "<table><tr><td>01/05/2026</td><td>Distribuição</td></tr></table>"
        )
        with respx.mock:
            route = respx.get("https://www.tjrs.jus.br/site/processos/consulta").mock(
                return_value=Response(200, text=fixture_html)
            )
            conn = TJRSConnector()
            result = await conn.buscar_processo_por_numero("0004444-55.2026.8.21.0000")
            assert result.ok is True
            assert route.called
            req = route.calls[0].request
            assert req.headers["X-Custom-Token"] == "abc123"
            assert req.headers["User-Agent"] == "CustomBot/1.0"


class TestTJRSConnectorDisabled:
    @pytest.fixture(autouse=True)
    def disabled(self, monkeypatch):
        monkeypatch.setattr("app.connectors.tjrs.settings.TJRS_CONNECTOR_ENABLED", False)

    @pytest.mark.asyncio
    async def test_disabled(self):
        conn = TJRSConnector()
        result = await conn.buscar_processo_por_numero("0004444-55.2026.8.21.0000")
        assert result.ok is True
        assert result.error_code == "NOT_CONFIGURED"
        assert "desabilitado" in result.error_message

    @pytest.mark.asyncio
    async def test_healthcheck_disabled(self):
        conn = TJRSConnector()
        health = await conn.healthcheck()
        assert health.status == "disabled"


class TestRegistry:
    def test_registry_with_tjrs_enabled(self, monkeypatch):
        monkeypatch.setattr("app.connectors.registry.settings.TJRS_CONNECTOR_ENABLED", True)
        reg = ConnectorRegistry()
        reg._connectors = {}
        reg._register_defaults()
        tjrs = reg.get("tjrs")
        assert tjrs is not None
        assert isinstance(tjrs, TJRSConnector)

    def test_registry_with_tjrs_disabled(self, monkeypatch):
        monkeypatch.setattr("app.connectors.registry.settings.TJRS_CONNECTOR_ENABLED", False)
        from app.connectors.tjrs_stub import TJRSConnectorStub
        reg = ConnectorRegistry()
        reg._connectors = {}
        reg._register_defaults()
        tjrs = reg.get("tjrs")
        assert tjrs is not None
        assert isinstance(tjrs, TJRSConnectorStub)
