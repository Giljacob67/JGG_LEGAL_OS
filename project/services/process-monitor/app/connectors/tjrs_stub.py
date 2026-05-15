"""Stub do conector TJRS (PJe).

Não implementa scraping real nesta fase.
"""

from typing import Any

from app.config import settings
from app.core.errors import ConnectorNotImplementedError
from app.models.schemas import ConnectorHealth, ConnectorResult
from app.connectors.base import TribunalConnector


class TJRSConnectorStub(TribunalConnector):
    @property
    def tribunal(self) -> str:
        return "tjrs"

    @property
    def nome(self) -> str:
        return "TJRS (PJe) — stub"

    async def login(self, credentials: dict[str, Any]) -> bool:
        if settings.MOCK_CONNECTORS:
            return True
        raise ConnectorNotImplementedError("Login TJRS não implementado nesta fase")

    async def buscar_processo_por_numero(self, numero_cnj: str) -> ConnectorResult:
        if settings.MOCK_CONNECTORS:
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjrs_stub_mock",
                process=None,
                movements=[],
                documents=[],
            )
        raise ConnectorNotImplementedError("Busca TJRS não implementada nesta fase")

    async def listar_andamentos(self, processo_id_tribunal: str) -> ConnectorResult:
        if settings.MOCK_CONNECTORS:
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjrs_stub_mock",
                process=None,
                movements=[],
                documents=[],
            )
        raise ConnectorNotImplementedError("Andamentos TJRS não implementados nesta fase")

    async def listar_documentos(self, processo_id_tribunal: str) -> ConnectorResult:
        if settings.MOCK_CONNECTORS:
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjrs_stub_mock",
                process=None,
                movements=[],
                documents=[],
            )
        raise ConnectorNotImplementedError("Documentos TJRS não implementados nesta fase")

    async def baixar_documento(self, documento_id_tribunal: str) -> bytes:
        raise ConnectorNotImplementedError("Download TJRS não implementado nesta fase")

    async def healthcheck(self) -> ConnectorHealth:
        return ConnectorHealth(
            tribunal=self.tribunal,
            connector="tjrs_stub",
            status="healthy" if settings.MOCK_CONNECTORS else "unknown",
            details={"mode": "mock" if settings.MOCK_CONNECTORS else "stub_not_implemented"},
        )
