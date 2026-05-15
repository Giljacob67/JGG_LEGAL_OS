"""Testes de contrato dos conectores de tribunal."""

import pytest

from app.config import settings
from app.connectors.base import TribunalConnector
from app.connectors.datajud import DataJudConnector
from app.connectors.registry import ConnectorRegistry, registry
from app.connectors.tjmt_stub import TJMTConnectorStub
from app.connectors.tjpr_stub import TJPRConnectorStub
from app.connectors.trf1_stub import TRF1ConnectorStub
from app.connectors.trf4_stub import TRF4ConnectorStub
from app.core.errors import ConnectorNotImplementedError


class TestRegistry:
    def test_lista_conectores(self):
        ids = registry.list_ids()
        assert "datajud" in ids
        assert "tjpr" in ids
        assert "tjmt" in ids
        assert "trf4" in ids
        assert "trf1" in ids

    def test_todos_implementam_base(self):
        for conn in registry.list_all():
            assert isinstance(conn, TribunalConnector)
            assert conn.tribunal
            assert conn.nome


class TestStubsMockMode:
    @pytest.fixture(autouse=True)
    def mock_on(self, monkeypatch):
        monkeypatch.setattr(settings, "MOCK_CONNECTORS", True)

    @pytest.mark.asyncio
    async def test_tjpr_stub_busca_mock(self):
        conn = TJPRConnectorStub()
        result = await conn.buscar_processo_por_numero("0003537-95.2026.8.16.0058")
        assert result.ok is True
        assert result.source == "tjpr_stub_mock"

    @pytest.mark.asyncio
    async def test_tjmt_stub_busca_mock(self):
        conn = TJMTConnectorStub()
        result = await conn.buscar_processo_por_numero("0003537-95.2026.8.16.0058")
        assert result.ok is True
        assert result.source == "tjmt_stub_mock"

    @pytest.mark.asyncio
    async def test_trf4_stub_busca_mock(self):
        conn = TRF4ConnectorStub()
        result = await conn.buscar_processo_por_numero("0003537-95.2026.8.16.0058")
        assert result.ok is True
        assert result.source == "trf4_stub_mock"

    @pytest.mark.asyncio
    async def test_trf1_stub_busca_mock(self):
        conn = TRF1ConnectorStub()
        result = await conn.buscar_processo_por_numero("0003537-95.2026.8.16.0058")
        assert result.ok is True
        assert result.source == "trf1_stub_mock"


class TestStubsNotImplementedMode:
    @pytest.fixture(autouse=True)
    def mock_off(self, monkeypatch):
        monkeypatch.setattr(settings, "MOCK_CONNECTORS", False)

    @pytest.mark.asyncio
    async def test_tjpr_stub_rejeita(self):
        conn = TJPRConnectorStub()
        with pytest.raises(ConnectorNotImplementedError):
            await conn.buscar_processo_por_numero("0003537-95.2026.8.16.0058")

    @pytest.mark.asyncio
    async def test_tjmt_stub_rejeita(self):
        conn = TJMTConnectorStub()
        with pytest.raises(ConnectorNotImplementedError):
            await conn.buscar_processo_por_numero("0003537-95.2026.8.16.0058")


class TestDataJudConnector:
    @pytest.mark.asyncio
    async def test_healthcheck_structure(self):
        conn = DataJudConnector()
        health = await conn.healthcheck()
        assert health.tribunal == "datajud"
        assert health.connector == "datajud"
        assert health.status in ("healthy", "down", "not_configured", "configured", "unavailable")
