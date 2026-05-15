"""Fila de jobs usando RQ + Redis.

Nesta fase: skeleton funcional com Redis.
"""

from typing import Any

import redis
from rq import Queue

from app.config import settings
from app.logging_config import get_logger

logger = get_logger("workers.queue")

_redis_conn: redis.Redis | None = None
_queue: Queue | None = None


def _get_redis() -> redis.Redis:
    global _redis_conn
    if _redis_conn is None:
        _redis_conn = redis.from_url(settings.REDIS_URL)
    return _redis_conn


def _get_queue() -> Queue:
    global _queue
    if _queue is None:
        _queue = Queue(connection=_get_redis())
    return _queue


def enqueue_sync_process(
    numero_cnj: str,
    tribunal: str | None = None,
    jgg_processo_id: str | None = None,
    prioridade: str = "normal",
    force: bool = False,
    capturar_documentos: bool = False,
) -> str:
    """Enfileira job de sincronização de processo. Retorna job_id."""
    from app.workers.tasks import sync_process

    q = _get_queue()
    job = q.enqueue(
        sync_process,
        numero_cnj=numero_cnj,
        tribunal=tribunal,
        jgg_processo_id=jgg_processo_id,
        prioridade=prioridade,
        force=force,
        capturar_documentos=capturar_documentos,
    )
    logger.info(
        "job_enqueued",
        extra={
            "job_id": job.id,
            "numero_cnj": numero_cnj,
            "tribunal": tribunal,
            "prioridade": prioridade,
        },
    )
    return str(job.id)


def get_job_status(job_id: str) -> dict[str, Any] | None:
    """Retorna status de um job pelo ID."""
    from rq.job import Job

    try:
        job = Job.fetch(job_id, connection=_get_redis())
        return {
            "job_id": job.id,
            "status": job.get_status(),
            "result": job.result,
            "exc_info": job.exc_info,
            "created_at": str(job.created_at) if job.created_at else None,
            "ended_at": str(job.ended_at) if job.ended_at else None,
        }
    except Exception:
        return None
