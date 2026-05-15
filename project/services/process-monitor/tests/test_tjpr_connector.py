"""Testes do TJPRConnector piloto."""

import pytest

from app.connectors.registry import ConnectorRegistry
from app.connectors.tjpr import TJPRConnector
from app.core.errors import ConnectorNotImplementedError


class TestTJPRConnectorFixturesMode:
    @pytest.fixture(autouse=True)
    def fixture_mode(self, monkeypatch):
        monkeypatch.setattr("app.connectors.tjpr.settings.TJPR_CONNECTOR_ENABLED", True)
        monkeypatch.setattr("app.connectors.tjpr.settings.TJPR_CONNECTOR_MODE", "fixtures")
        monkeypatch.setattr(
            "app.connectors.tjpr.settings.TJPR_FIXTURES_DIR",
            "tests/fixtures/tjpr",
        )

    @pytest.mark.asyncio
    async def test_fixtures_sucesso(self):
        conn = TJPRConnector()
        result = await conn.buscar_processo_por_numero("0003537-95.2026.8.16.0058")
        assert result.ok is True
        assert result.process is not None
        assert result.process.numero_cnj == "0003537-95.2026.8.16.0058"
        assert len(result.movements) == 5
        assert result.source == "tjpr_fixture"

    @pytest.mark.asyncio
    async def test_fixtures_not_found(self):
        conn = TJPRConnector()
        result = await conn.buscar_processo_por_numero("0000000-00.0000.0.00.0000")
        assert result.ok is True
        assert result.process is None
        assert result.error_code == "NOT_FOUND"

    @pytest.mark.asyncio
    async def test_listar_documentos(self):
        conn = TJPRConnector()
        result = await conn.listar_documentos("123")
        assert result.ok is True
        assert result.error_code == "DOCUMENTS_NOT_IMPLEMENTED"

    @pytest.mark.asyncio
    async def test_baixar_documento(self):
        conn = TJPRConnector()
        with pytest.raises(ConnectorNotImplementedError) as exc_info:
            await conn.baixar_documento("123")
        assert exc_info.value.details.get("error_code") == "DOCUMENT_DOWNLOAD_NOT_IMPLEMENTED"

    @pytest.mark.asyncio
    async def test_login_not_implemented(self):
        conn = TJPRConnector()
        with pytest.raises(ConnectorNotImplementedError) as exc_info:
            await conn.login({"user": "x"})
        assert exc_info.value.details.get("error_code") == "AUTH_NOT_IMPLEMENTED"

    @pytest.mark.asyncio
    async def test_healthcheck_fixtures(self):
        conn = TJPRConnector()
        health = await conn.healthcheck()
        assert health.status == "ok"
        assert health.details["mode"] == "fixtures"


class TestTJPRConnectorPublicHttpMode:
    @pytest.fixture(autouse=True)
    def public_mode(self, monkeypatch):
        monkeypatch.setattr("app.connectors.tjpr.settings.TJPR_CONNECTOR_ENABLED", True)
        monkeypatch.setattr("app.connectors.tjpr.settings.TJPR_CONNECTOR_MODE", "public_http")
        monkeypatch.setattr("app.connectors.tjpr.settings.TJPR_PUBLIC_SEARCH_URL", None)

    @pytest.mark.asyncio
    async def test_public_http_not_configured(self):
        conn = TJPRConnector()
        result = await conn.buscar_processo_por_numero("0003537-95.2026.8.16.0058")
        assert result.ok is True
        assert result.error_code == "NOT_CONFIGURED"
        assert "TJPR_PUBLIC_SEARCH_URL" in result.error_message

    @pytest.mark.asyncio
    async def test_healthcheck_public_not_configured(self):
        conn = TJPRConnector()
        health = await conn.healthcheck()
        assert health.status == "not_configured"
        assert health.details["mode"] == "public_http"


class TestTJPRConnectorDisabled:
    @pytest.fixture(autouse=True)
    def disabled(self, monkeypatch):
        monkeypatch.setattr("app.connectors.tjpr.settings.TJPR_CONNECTOR_ENABLED", False)

    @pytest.mark.asyncio
    async def test_disabled(self):
        conn = TJPRConnector()
        result = await conn.buscar_processo_por_numero("0003537-95.2026.8.16.0058")
        assert result.ok is True
        assert result.error_code == "NOT_CONFIGURED"
        assert "desabilitado" in result.error_message

    @pytest.mark.asyncio
    async def test_healthcheck_disabled(self):
        conn = TJPRConnector()
        health = await conn.healthcheck()
        assert health.status == "disabled"


class TestRegistry:
    def test_registry_with_tjpr_enabled(self, monkeypatch):
        monkeypatch.setattr("app.connectors.registry.settings.TJPR_CONNECTOR_ENABLED", True)
        reg = ConnectorRegistry()
        reg._connectors = {}
        reg._register_defaults()
        tjpr = reg.get("tjpr")
        assert tjpr is not None
        assert isinstance(tjpr, TJPRConnector)

    def test_registry_with_tjpr_disabled(self, monkeypatch):
        monkeypatch.setattr("app.connectors.registry.settings.TJPR_CONNECTOR_ENABLED", False)
        from app.connectors.tjpr_stub import TJPRConnectorStub
        reg = ConnectorRegistry()
        reg._connectors = {}
        reg._register_defaults()
        tjpr = reg.get("tjpr")
        assert tjpr is not None
        assert isinstance(tjpr, TJPRConnectorStub)
