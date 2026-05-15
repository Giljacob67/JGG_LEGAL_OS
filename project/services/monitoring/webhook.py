"""
Webhook notifier — envia eventos críticos para o Next.js.
Usado como fallback/alternativa ao Redis pub/sub.
"""
import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)


class WebhookNotifier:
    def __init__(
        self,
        url: Optional[str] = None,
        secret: Optional[str] = None,
    ):
        self._url = url or settings.webhook_url
        self._secret = secret or settings.webhook_secret

    def _sign(self, payload: str) -> str:
        if not self._secret:
            return ""
        return hmac.new(
            self._secret.encode(),
            payload.encode(),
            hashlib.sha256,
        ).hexdigest()

    async def _send(self, event_type: str, payload: dict) -> bool:
        if not self._url:
            return False

        body = {
            "event": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        }
        body_json = json.dumps(body, ensure_ascii=False)
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": self._sign(body_json),
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.post(self._url, content=body_json, headers=headers)
                if r.status_code < 300:
                    logger.info("webhook_enviado event=%s status=%d", event_type, r.status_code)
                    return True
                logger.warning("webhook_falhou event=%s status=%d body=%s", event_type, r.status_code, r.text[:200])
                return False
        except Exception as exc:
            logger.warning("webhook_erro event=%s erro=%s", event_type, exc)
            return False

    async def andamentos_novos(
        self,
        cnj: str,
        tribunal: str,
        quantidade: int,
        criticos: list[dict],
    ) -> bool:
        return await self._send("andamentos_novos", {
            "cnj": cnj,
            "tribunal": tribunal,
            "quantidade": quantidade,
            "criticos": len(criticos),
            "andamentos_criticos": criticos,
        })

    async def captura_falhou(
        self,
        cnj: str,
        tribunal: str,
        erro: str,
        tentativa: int,
    ) -> bool:
        return await self._send("captura_falhou", {
            "cnj": cnj,
            "tribunal": tribunal,
            "erro": erro,
            "tentativa": tentativa,
        })

    async def documento_novo(
        self,
        cnj: str,
        tribunal: str,
        doc_nome: str,
        doc_tipo: str,
    ) -> bool:
        return await self._send("documento_novo", {
            "cnj": cnj,
            "tribunal": tribunal,
            "documento": doc_nome,
            "tipo": doc_tipo,
        })


# Singleton global
_notifier: Optional[WebhookNotifier] = None


def get_notifier() -> WebhookNotifier:
    global _notifier
    if _notifier is None:
        _notifier = WebhookNotifier()
    return _notifier
