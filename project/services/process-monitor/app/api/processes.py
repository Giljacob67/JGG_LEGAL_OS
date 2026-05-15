"""Endpoints de monitoramento de processos."""

from uuid import UUID

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
from app.persistence.db import get_session
from app.persistence.repositories import (
    MonitoringCaptureRunRepository,
    MonitoringMovementRepository,
    MonitoringProcessRepository,
)
from app.workers.queue import enqueue_sync_process

router = APIRouter(tags=["monitoramento"])
logger = get_logger("api.processes")


@router.post("/monitoramento/processos", response_model=dict)
async def criar_monitoramento(payload: MonitoramentoPayload) -> dict:
    try:
        cnj_digits = normalizar(payload.numero_cnj)
    except CNJInvalidoError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    with get_session() as session:
        process = MonitoringProcessRepository.upsert(
            session=session,
            numero_cnj=payload.numero_cnj,
            numero_cnj_digits=cnj_digits,
            tribunal_preferencial=payload.tribunal,
            jgg_processo_id=payload.jgg_processo_id,
            status_monitoramento="desconhecido",
        )
        process_id = str(process.id)

    job_id = enqueue_sync_process(
        process_id=process_id,
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
            "process_id": process_id,
        },
    )

    return {
        "ok": True,
        "process_id": process_id,
        "job_id": job_id,
        "status": "queued",
        "message": "Sincronização enfileirada com sucesso",
    }


@router.post("/monitoramento/processos/{id}/sincronizar", response_model=dict)
async def sincronizar_processo(id: str, payload: SincronizarPayload) -> dict:
    with get_session() as session:
        process = MonitoringProcessRepository.get_by_id(session, UUID(id))
        if not process:
            process = MonitoringProcessRepository.get_by_cnj(session, id)
        if not process:
            raise HTTPException(status_code=404, detail="Processo não encontrado")

    job_id = enqueue_sync_process(
        process_id=str(process.id),
        numero_cnj=process.numero_cnj_digits,
        tribunal=process.tribunal_preferencial,
        force=payload.force,
        capturar_documentos=payload.capturar_documentos,
    )
    return {
        "ok": True,
        "process_id": str(process.id),
        "job_id": job_id,
        "status": "queued",
        "message": "Sincronização forçada enfileirada",
    }


@router.get("/monitoramento/processos/{id}/andamentos")
async def listar_andamentos(id: str) -> dict:
    with get_session() as session:
        process = MonitoringProcessRepository.get_by_id(session, UUID(id))
        if not process:
            process = MonitoringProcessRepository.get_by_cnj(session, id)
        if not process:
            raise HTTPException(status_code=404, detail="Processo não encontrado")

        movements = MonitoringMovementRepository.list_by_process(session, process.id)
        return {
            "ok": True,
            "monitoring_process_id": str(process.id),
            "numero_cnj": process.numero_cnj,
            "andamentos": [
                {
                    "id": str(m.id),
                    "data_movimento": m.data_movimento.isoformat() if m.data_movimento else None,
                    "descricao_original": m.descricao_original,
                    "tipo_evento": m.tipo_evento,
                    "status_processo": m.status_processo,
                    "orgao_julgador": m.orgao_julgador,
                    "hash": m.hash,
                }
                for m in movements
            ],
        }


@router.get("/monitoramento/processos/{id}/documentos")
async def listar_documentos(id: str) -> dict:
    with get_session() as session:
        process = MonitoringProcessRepository.get_by_id(session, UUID(id))
        if not process:
            process = MonitoringProcessRepository.get_by_cnj(session, id)
        if not process:
            raise HTTPException(status_code=404, detail="Processo não encontrado")

    return {
        "ok": True,
        "monitoring_process_id": str(process.id),
        "numero_cnj": process.numero_cnj,
        "documentos": [],
        "message": "Captura de documentos ainda não implementada neste MVP",
    }


@router.get("/monitoramento/processos/{id}/capturas")
async def listar_capturas(id: str) -> dict:
    with get_session() as session:
        process = MonitoringProcessRepository.get_by_id(session, UUID(id))
        if not process:
            process = MonitoringProcessRepository.get_by_cnj(session, id)
        if not process:
            raise HTTPException(status_code=404, detail="Processo não encontrado")

        captures = MonitoringCaptureRunRepository.list_by_process(session, process.id, limit=20)
        return {
            "ok": True,
            "monitoring_process_id": str(process.id),
            "numero_cnj": process.numero_cnj,
            "capturas": [
                {
                    "id": str(c.id),
                    "tribunal": c.tribunal,
                    "connector": c.connector,
                    "operation": c.operation,
                    "status": c.status,
                    "started_at": c.started_at.isoformat() if c.started_at else None,
                    "finished_at": c.finished_at.isoformat() if c.finished_at else None,
                    "duration_ms": c.duration_ms,
                    "error_code": c.error_code,
                    "error_message": c.error_message,
                    "stats": c.stats,
                }
                for c in captures
            ],
        }
