"""Ponto de entrada FastAPI do serviço process-monitor."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import config, connectors, health, jobs, metrics, processes
from app.config import settings
from app.core.scheduler import shutdown_scheduler, start_scheduler
from app.logging_config import configure_logging
from app.persistence.db import init_schema

configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_schema()
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(
    title="JGG Process Monitor",
    description="Serviço isolado de monitoramento processual e conectores de tribunais",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-Internal-API-Key"],
)

app.include_router(health.router)
app.include_router(connectors.router)
app.include_router(processes.router)
app.include_router(jobs.router)
app.include_router(config.router)
app.include_router(metrics.router)


@app.get("/")
async def root() -> dict:
    return {
        "service": settings.SERVICE_NAME,
        "version": "0.1.0",
        "docs": "/docs",
    }
