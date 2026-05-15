"""Stub do conector TRF1 (PJe).

Não implementa scraping real nesta fase.
"""

from typing import Any

from app.config import settings
from app.core.errors import ConnectorNotImplementedError
from app.models.schemas import ConnectorHealth, ConnectorResult
from app.connectors.base import TribunalConnector


class TRF1ConnectorStub(TribunalConnector):
    @property
    def tribunal(self) -> str:
        return "trf1"

    @property
    def nome(self) -> str:
        return "TRF1 (PJe) — stub"

    async def login(self, credentials: dict[str, Any]) -> bool:
        if settings.MOCK_CONNECTORS:
            return True
        raise ConnectorNotImplementedError("Login TRF1 não implementado nesta fase")

    async def buscar_processo_por_numero(self, numero_cnj: str) -> ConnectorResult:
        if settings.MOCK_CONNECTORS:
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="trf1_stub_mock",
                process=None,
                movements=[],
                documents=[],
            )
        raise ConnectorNotImplementedError("Busca TRF1 não implementada nesta fase")

    async def listar_andamentos(self, processo_id_tribunal: str) -> ConnectorResult:
        if settings.MOCK_CONNECTORS:
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="trf1_stub_mock",
                process=None,
                movements=[],
                documents=[],
            )
        raise ConnectorNotImplementedError("Andamentos TRF1 não implementados nesta fase")

    async def listar_documentos(self, processo_id_tribunal: str) -> ConnectorResult:
        if settings.MOCK_CONNECTORS:
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="trf1_stub_mock",
                process=None,
                movements=[],
                documents=[],
            )
        raise ConnectorNotImplementedError("Documentos TRF1 não implementados nesta fase")

    async def baixar_documento(self, documento_id_tribunal: str) -> bytes:
        raise ConnectorNotImplementedError("Download TRF1 não implementado nesta fase")

    async def healthcheck(self) -> ConnectorHealth:
        return ConnectorHealth(
            tribunal=self.tribunal,
            connector="trf1_stub",
            status="healthy" if settings.MOCK_CONNECTORS else "unknown",
            details={"mode": "mock" if settings.MOCK_CONNECTORS else "stub_not_implemented"},
        )
