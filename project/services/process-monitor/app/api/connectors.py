"""Endpoints de conectores e healthcheck por tribunal."""

from fastapi import APIRouter, HTTPException

from app.connectors.registry import registry
from app.models.schemas import ConnectorHealth, ConnectorInfo

router = APIRouter(tags=["connectors"])


@router.get("/connectors", response_model=list[ConnectorInfo])
async def list_connectors() -> list[ConnectorInfo]:
    result: list[ConnectorInfo] = []
    for conn in registry.list_all():
        result.append(
            ConnectorInfo(
                id=conn.tribunal,
                tribunais=[conn.tribunal],
                supports={
                    "login": True,
                    "buscar_processo": True,
                    "listar_andamentos": True,
                    "listar_documentos": True,
                    "baixar_documento": True,
                },
            )
        )
    return result


@router.get("/connectors/{connector_id}/health", response_model=ConnectorHealth)
async def connector_health(connector_id: str) -> ConnectorHealth:
    conn = registry.get(connector_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connector not found")
    return await conn.healthcheck()
