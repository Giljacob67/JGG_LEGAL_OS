"""Endpoints de monitoramento de processos."""

from fastapi import APIRouter, HTTPException

from app.core.cnj import normalizar, validar
from app.core.errors import CNJInvalidoError
from app.logging_config import get_logger
from app.models.schemas import (
    JobResponse,
    MonitoramentoPayload,
    ProcessoStatusResponse,
    SincronizarPayload,
)
from app.workers.queue import enqueue_sync_process

router = APIRouter(tags=["monitoramento"])
logger = get_logger("api.processes")


@router.post("/monitoramento/processos", response_model=JobResponse)
async def criar_monitoramento(payload: MonitoramentoPayload) -> JobResponse:
    try:
        cnj_digits = normalizar(payload.numero_cnj)
    except CNJInvalidoError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    job_id = enqueue_sync_process(
        numero_cnj=cnj_digits,
        tribunal=payload.tribunal,
        jgg_processo_id=payload.jgg_processo_id,
        prioridade=payload.prioridade,
    )

    logger.info(
        "monitoramento_criado",
        extra={
            "numero_cnj": cnj_digits,
            "tribunal": payload.tribunal,
            "job_id": job_id,
        },
    )

    return JobResponse(
        job_id=job_id,
        status="queued",
        message="Sincronização enfileirada com sucesso",
    )


@router.post("/monitoramento/processos/{id}/sincronizar", response_model=JobResponse)
async def sincronizar_processo(id: str, payload: SincronizarPayload) -> JobResponse:
    job_id = enqueue_sync_process(
        numero_cnj=id,
        force=payload.force,
        capturar_documentos=payload.capturar_documentos,
    )
    return JobResponse(
        job_id=job_id,
        status="queued",
        message="Sincronização forçada enfileirada",
    )


@router.get("/monitoramento/processos/{id}/andamentos")
async def listar_andamentos(id: str) -> dict:
    if not validar(id):
        raise HTTPException(status_code=422, detail="CNJ inválido")
    # Nesta fase: stub controlado
    return {
        "monitoring_process_id": id,
        "andamentos": [],
        "message": "Endpoint em construção — use POST /monitoramento/processos para enfileirar sync",
    }


@router.get("/monitoramento/processos/{id}/documentos")
async def listar_documentos(id: str) -> dict:
    if not validar(id):
        raise HTTPException(status_code=422, detail="CNJ inválido")
    return {
        "monitoring_process_id": id,
        "documentos": [],
        "message": "Endpoint em construção",
    }
