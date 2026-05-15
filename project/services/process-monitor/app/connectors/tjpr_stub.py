"""Stub do conector TJPR (ProJUDI).

Não implementa scraping real nesta fase.
Quando MOCK_CONNECTORS=true, retorna dados mockados.
Quando MOCK_CONNECTORS=false, retorna NOT_IMPLEMENTED.
"""

from typing import Any

from app.config import settings
from app.core.errors import ConnectorNotImplementedError
from app.models.schemas import ConnectorHealth, ConnectorResult
from app.connectors.base import TribunalConnector


class TJPRConnectorStub(TribunalConnector):
    @property
    def tribunal(self) -> str:
        return "tjpr"

    @property
    def nome(self) -> str:
        return "TJPR (ProJUDI) — stub"

    async def login(self, credentials: dict[str, Any]) -> bool:
        if settings.MOCK_CONNECTORS:
            return True
        raise ConnectorNotImplementedError("Login TJPR não implementado nesta fase")

    async def buscar_processo_por_numero(self, numero_cnj: str) -> ConnectorResult:
        if settings.MOCK_CONNECTORS:
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr_stub_mock",
                process=None,
                movements=[],
                documents=[],
            )
        raise ConnectorNotImplementedError("Busca TJPR não implementada nesta fase")

    async def listar_andamentos(self, processo_id_tribunal: str) -> ConnectorResult:
        if settings.MOCK_CONNECTORS:
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr_stub_mock",
                process=None,
                movements=[],
                documents=[],
            )
        raise ConnectorNotImplementedError("Andamentos TJPR não implementados nesta fase")

    async def listar_documentos(self, processo_id_tribunal: str) -> ConnectorResult:
        if settings.MOCK_CONNECTORS:
            return ConnectorResult(
                ok=True,
                tribunal=self.tribunal,
                source="tjpr_stub_mock",
                process=None,
                movements=[],
                documents=[],
            )
        raise ConnectorNotImplementedError("Documentos TJPR não implementados nesta fase")

    async def baixar_documento(self, documento_id_tribunal: str) -> bytes:
        raise ConnectorNotImplementedError("Download TJPR não implementado nesta fase")

    async def healthcheck(self) -> ConnectorHealth:
        return ConnectorHealth(
            tribunal=self.tribunal,
            connector="tjpr_stub",
            status="healthy" if settings.MOCK_CONNECTORS else "unknown",
            details={"mode": "mock" if settings.MOCK_CONNECTORS else "stub_not_implemented"},
        )
