"""Redis publisher — envia eventos de captura para o canal jgg:eventos."""
import json
import logging
from datetime import datetime, timezone

import redis.asyncio as aioredis

from config import settings

logger = logging.getLogger(__name__)
_client: aioredis.Redis | None = None


async def _get_client() -> aioredis.Redis:
    global _client
    if _client is None:
        _client = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _client


async def publicar_andamentos_novos(
    cnj: str,
    tribunal: str,
    quantidade_novos: int,
    andamentos_criticos: list[dict],
) -> None:
    if quantidade_novos == 0:
        return
    try:
        r = await _get_client()
        payload = json.dumps({
            "tipo": "andamentos_novos",
            "cnj": cnj,
            "tribunal": tribunal,
            "quantidade": quantidade_novos,
            "criticos": len(andamentos_criticos),
            "andamentos_criticos": andamentos_criticos,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }, ensure_ascii=False)
        await r.publish(settings.redis_channel_eventos, payload)
        logger.info(
            "redis_evento_publicado canal=%s cnj=%s novos=%d criticos=%d",
            settings.redis_channel_eventos, cnj, quantidade_novos, len(andamentos_criticos),
        )
    except Exception as exc:
        logger.warning("redis_publish_falhou erro=%s", exc)
