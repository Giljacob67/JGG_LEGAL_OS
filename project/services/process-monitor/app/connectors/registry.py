"""Registro central de conectores de tribunais."""

from app.config import settings
from app.connectors.base import TribunalConnector
from app.connectors.datajud import DataJudConnector
from app.connectors.tjmt_stub import TJMTConnectorStub
from app.connectors.tjpr import TJPRConnector
from app.connectors.tjpr_stub import TJPRConnectorStub
from app.connectors.trf1_stub import TRF1ConnectorStub
from app.connectors.trf4_stub import TRF4ConnectorStub


class ConnectorRegistry:
    """Registry singleton de conectores disponíveis."""

    _instance: "ConnectorRegistry | None" = None
    _connectors: dict[str, TribunalConnector]

    def __new__(cls) -> "ConnectorRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._connectors = {}
            cls._instance._register_defaults()
        return cls._instance

    def _register_defaults(self) -> None:
        self.register(DataJudConnector())
        # TJPR: conector real quando habilitado, stub quando desabilitado
        if settings.TJPR_CONNECTOR_ENABLED:
            self.register(TJPRConnector())
        else:
            self.register(TJPRConnectorStub())
        self.register(TJMTConnectorStub())
        self.register(TRF4ConnectorStub())
        self.register(TRF1ConnectorStub())

    def register(self, connector: TribunalConnector) -> None:
        self._connectors[connector.tribunal] = connector

    def get(self, tribunal: str) -> TribunalConnector | None:
        return self._connectors.get(tribunal)

    def list_all(self) -> list[TribunalConnector]:
        return list(self._connectors.values())

    def list_ids(self) -> list[str]:
        return list(self._connectors.keys())


# Export singleton
registry = ConnectorRegistry()
