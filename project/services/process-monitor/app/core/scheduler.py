"""Scheduler de jobs periódicos para sync automático de processos.

Usa APScheduler com RedisJobStore para persistência de jobs
entre reinicializações do serviço.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.logging_config import get_logger
from app.persistence.db import get_session
from app.persistence.repositories import MonitoringProcessRepository
from app.workers.queue import enqueue_sync_process

logger = get_logger("core.scheduler")

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    """Retorna ou cria o scheduler singleton."""
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
    return _scheduler


def start_scheduler() -> None:
    """Inicia o scheduler e registra jobs periódicos."""
    sched = get_scheduler()

    # Job de sync periódico de processos ativos
    if getattr(settings, "SCHEDULER_SYNC_ENABLED", False):
        interval_minutes = getattr(settings, "SCHEDULER_SYNC_INTERVAL_MINUTES", 60)
        sched.add_job(
            _sync_active_processes_job,
            "interval",
            minutes=interval_minutes,
            id="sync_active_processes",
            replace_existing=True,
            max_instances=1,
        )
        logger.info(
            "scheduler_job_registered",
            extra={"job": "sync_active_processes", "interval_minutes": interval_minutes},
        )

    # Job de healthcheck de conectores
    if getattr(settings, "SCHEDULER_HEALTHCHECK_ENABLED", True):
        sched.add_job(
            _connector_healthcheck_job,
            "interval",
            minutes=getattr(settings, "SCHEDULER_HEALTHCHECK_INTERVAL_MINUTES", 30),
            id="connector_healthcheck",
            replace_existing=True,
            max_instances=1,
        )
        logger.info("scheduler_job_registered", extra={"job": "connector_healthcheck"})

    sched.start()
    logger.info("scheduler_started")


def shutdown_scheduler() -> None:
    """Para o scheduler gracefully."""
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("scheduler_shutdown")


def _sync_active_processes_job() -> None:
    """Job que enfileira sync de processos ativos."""
    try:
        with get_session() as session:
            processes = MonitoringProcessRepository.list_active(session, limit=100)
            logger.info(
                "scheduler_sync_started",
                extra={"processes_count": len(processes)},
            )
            for proc in processes:
                try:
                    enqueue_sync_process(
                        process_id=str(proc.id),
                        numero_cnj=proc.numero_cnj_digits,
                        tribunal=proc.tribunal_preferencial or None,
                    )
                except Exception as exc:
                    logger.warning(
                        "scheduler_sync_enqueue_failed",
                        extra={"process_id": str(proc.id), "error": str(exc)},
                    )
    except Exception as exc:
        logger.error("scheduler_sync_error", extra={"error": str(exc)})


def _connector_healthcheck_job() -> None:
    """Job que executa healthcheck em todos os conectores."""
    try:
        from app.workers.tasks import connector_healthcheck
        result = connector_healthcheck()
        logger.info("scheduler_healthcheck_done", extra={"results": result})
    except Exception as exc:
        logger.error("scheduler_healthcheck_error", extra={"error": str(exc)})
