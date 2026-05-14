"""Entrypoint: FastAPI + APScheduler."""
import logging
import logging.config

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager
from fastapi import FastAPI

from config import settings
from db.connection import close_pool, get_pool
from api.routes import router
from scheduler.jobs import (
    health_check_tribunais,
    retry_capturas_falhas,
    sync_processos_arquivados,
    sync_processos_ativos,
)

logging.basicConfig(
    level=settings.log_level,
    format='{"timestamp":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}',
)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="America/Sao_Paulo")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    pool = await get_pool(settings.database_url)
    app.state.pool = pool
    logger.info("db_pool_pronto dsn_parcial=%s", settings.database_url[:30])

    # Registra jobs
    scheduler.add_job(
        sync_processos_ativos, "interval",
        minutes=settings.sync_ativos_intervalo_min,
        args=[pool], id="sync_ativos", replace_existing=True,
    )
    scheduler.add_job(
        sync_processos_arquivados, "cron",
        hour=settings.sync_arquivados_hora, minute=0,
        args=[pool], id="sync_arquivados", replace_existing=True,
    )
    scheduler.add_job(
        retry_capturas_falhas, "interval",
        hours=settings.retry_falhas_intervalo_h,
        args=[pool], id="retry_falhas", replace_existing=True,
    )
    scheduler.add_job(
        health_check_tribunais, "interval",
        minutes=settings.health_check_intervalo_min,
        args=[pool], id="health_check", replace_existing=True,
    )

    scheduler.start()
    logger.info("scheduler_iniciado jobs=%d", len(scheduler.get_jobs()))

    yield

    # Shutdown
    scheduler.shutdown(wait=False)
    await close_pool()
    logger.info("shutdown_concluido")


app = FastAPI(
    title="JGG Monitoring Service",
    version="0.1.0",
    lifespan=lifespan,
)
app.include_router(router)
