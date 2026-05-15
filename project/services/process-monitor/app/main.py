"""Ponto de entrada FastAPI do serviço process-monitor."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import connectors, health, jobs, processes
from app.config import settings
from app.logging_config import configure_logging
from app.persistence.db import init_schema

configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_schema()
    yield


app = FastAPI(
    title="JGG Process Monitor",
    description="Serviço isolado de monitoramento processual e conectores de tribunais",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(connectors.router)
app.include_router(processes.router)
app.include_router(jobs.router)


@app.get("/")
async def root() -> dict:
    return {
        "service": settings.SERVICE_NAME,
        "version": "0.1.0",
        "docs": "/docs",
    }
