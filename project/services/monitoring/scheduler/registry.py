"""Registry de conectores — um por tribunal."""
from typing import Optional

from connectors.base import TribunalConnector
from connectors.tjpr.connector import TJPRConnector
from connectors.tjmt.connector import TJMTConnector
from connectors.trf4.connector import TRF4Connector
from connectors.trf1.connector import TRF1Connector
from session.manager import SessionManager

# Mapa tribunal_id → classe do conector
_CONNECTOR_CLASSES: dict[str, type[TribunalConnector]] = {
    "tjpr": TJPRConnector,
    "tjmt": TJMTConnector,
    "trf4": TRF4Connector,
    "trf1": TRF1Connector,
}

# Instâncias singleton por tribunal (reutilizam SessionManager)
_instances: dict[str, TribunalConnector] = {}


def get_connector(tribunal_id: str, credentials: Optional[dict] = None) -> TribunalConnector:
    if tribunal_id not in _instances:
        cls = _CONNECTOR_CLASSES.get(tribunal_id)
        if not cls:
            raise ValueError(f"Tribunal não suportado: {tribunal_id}")
        session = SessionManager(tribunal_id, credentials)
        _instances[tribunal_id] = cls(session)
    return _instances[tribunal_id]


def listar_tribunais_ativos() -> list[str]:
    return list(_CONNECTOR_CLASSES.keys())


async def health_check_todos() -> dict[str, bool]:
    results: dict[str, bool] = {}
    for tid in _CONNECTOR_CLASSES:
        try:
            conn = get_connector(tid)
            results[tid] = await conn.health_check()
        except Exception:
            results[tid] = False
    return results
