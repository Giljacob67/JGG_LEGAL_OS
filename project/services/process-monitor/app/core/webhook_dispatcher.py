"""Dispatcher de webhooks para notificações de novos andamentos.

Não bloqueia o sync se o webhook falhar.
Registra falhas para retry manual se necessário.
"""

import json
from typing import Any

import httpx

from app.config import settings
from app.logging_config import get_logger

logger = get_logger("core.webhook_dispatcher")

DEFAULT_TIMEOUT = httpx.Timeout(10.0, connect=5.0)


async def dispatch_new_movements_webhook(
    process_id: str,
    numero_cnj: str | None,
    tribunal: str,
    new_movements_count: int,
    movements: list[dict[str, Any]],
) -> dict[str, Any]:
    """Envia webhook para o app web quando novas movimentações são detectadas.

    Retorna dict com status do envio. Não levanta exceções.
    """
    url = getattr(settings, "WEBHOOK_NEW_MOVEMENTS_URL", None)
    if not url:
        return {"sent": False, "reason": "WEBHOOK_NEW_MOVEMENTS_URL not configured"}

    if not getattr(settings, "WEBHOOK_NEW_MOVEMENTS_ENABLED", False):
        return {"sent": False, "reason": "webhook disabled"}

    payload = {
        "event": "new_movements",
        "process_id": process_id,
        "numero_cnj": numero_cnj,
        "tribunal": tribunal,
        "new_movements_count": new_movements_count,
        "movements": movements[:50],  # limitar payload
        "timestamp": _now_iso(),
    }

    headers = {"Content-Type": "application/json"}
    webhook_key = getattr(settings, "WEBHOOK_NEW_MOVEMENTS_KEY", None)
    if webhook_key:
        headers["X-Webhook-Key"] = webhook_key
    custom_headers = _parse_headers(getattr(settings, "WEBHOOK_NEW_MOVEMENTS_HEADERS", None))
    headers.update(custom_headers)

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            logger.info(
                "webhook_dispatched",
                extra={
                    "url": url,
                    "process_id": process_id,
                    "movements_count": new_movements_count,
                    "status_code": resp.status_code,
                },
            )
            return {
                "sent": True,
                "status_code": resp.status_code,
                "response_body": resp.text[:500],
            }
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "webhook_http_error",
            extra={
                "url": url,
                "process_id": process_id,
                "status_code": exc.response.status_code,
                "response": exc.response.text[:500],
            },
        )
        return {"sent": False, "error": "http_error", "status_code": exc.response.status_code}
    except httpx.TimeoutException:
        logger.warning("webhook_timeout", extra={"url": url, "process_id": process_id})
        return {"sent": False, "error": "timeout"}
    except Exception as exc:
        logger.warning("webhook_error", extra={"url": url, "process_id": process_id, "error": str(exc)})
        return {"sent": False, "error": type(exc).__name__}


def _parse_headers(raw: str | None) -> dict[str, str]:
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("invalid_webhook_headers_json", extra={"raw": raw})
        return {}


def _now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
