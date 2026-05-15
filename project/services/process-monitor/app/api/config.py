"""Endpoints de configuração pública do serviço."""

from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["config"])


@router.get("/config")
async def get_public_config() -> dict:
    """Retorna configurações públicas do serviço (sem secrets)."""
    return {
        "connectors": {
            "tjpr": {
                "enabled": settings.TJPR_CONNECTOR_ENABLED,
                "mode": settings.TJPR_CONNECTOR_MODE,
                "has_public_url": bool(settings.TJPR_PUBLIC_SEARCH_URL),
            },
            "trf4": {
                "enabled": settings.TRF4_CONNECTOR_ENABLED,
                "mode": settings.TRF4_CONNECTOR_MODE,
                "has_public_url": bool(settings.TRF4_PUBLIC_SEARCH_URL),
            },
        },
        "webhook": {
            "enabled": settings.WEBHOOK_NEW_MOVEMENTS_ENABLED,
            "has_url": bool(settings.WEBHOOK_NEW_MOVEMENTS_URL),
        },
        "fallback": {
            "datajud_enabled": settings.ENABLE_DATAJUD_FALLBACK,
        },
    }
