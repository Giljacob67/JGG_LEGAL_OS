"""Registro central de conectores de tribunais."""

from app.config import settings
from app.connectors.base import TribunalConnector
from app.connectors.datajud import DataJudConnector
from app.connectors.tjmt import TJMTConnector
from app.connectors.tjmt_stub import TJMTConnectorStub
from app.connectors.tjpr import TJPRConnector
from app.connectors.tjpr_stub import TJPRConnectorStub
from app.connectors.tjrs import TJRSConnector
from app.connectors.tjrs_stub import TJRSConnectorStub
from app.connectors.tjsp import TJSPConnector
from app.connectors.tjsp_stub import TJSPConnectorStub
from app.connectors.trf1 import TRF1Connector
from app.connectors.trf1_stub import TRF1ConnectorStub
from app.connectors.trf4 import TRF4Connector
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

        # TJPR
        if settings.TJPR_CONNECTOR_ENABLED:
            self.register(TJPRConnector())
        else:
            self.register(TJPRConnectorStub())

        # TRF4
        if settings.TRF4_CONNECTOR_ENABLED:
            self.register(TRF4Connector())
        else:
            self.register(TRF4ConnectorStub())

        # TJMT (PJe)
        if settings.TJMT_CONNECTOR_ENABLED:
            self.register(TJMTConnector())
        else:
            self.register(TJMTConnectorStub())

        # TRF1 (PJe)
        if settings.TRF1_CONNECTOR_ENABLED:
            self.register(TRF1Connector())
        else:
            self.register(TRF1ConnectorStub())

        # TJSP (e-SAJ)
        if settings.TJSP_CONNECTOR_ENABLED:
            self.register(TJSPConnector())
        else:
            self.register(TJSPConnectorStub())

        # TJRS (e-SAJ)
        if settings.TJRS_CONNECTOR_ENABLED:
            self.register(TJRSConnector())
        else:
            self.register(TJRSConnectorStub())

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
