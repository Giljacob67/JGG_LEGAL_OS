"""Endpoints de jobs/fila."""

from fastapi import APIRouter, HTTPException

from app.logging_config import get_logger
from app.workers.queue import get_job_status

router = APIRouter(tags=["jobs"])
logger = get_logger("api.jobs")


@router.get("/monitoramento/jobs/{job_id}")
async def get_job(job_id: str) -> dict:
    status = get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    return status
