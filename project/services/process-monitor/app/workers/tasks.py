"""Tarefas background executadas via RQ.

Jobs:
- sync_process
- sync_active_processes
- retry_failed_processes
- connector_healthcheck
"""

import time
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from app.config import settings
from app.connectors.registry import registry
from app.core.cnj import extrair_tribunal, normalizar
from app.core.errors import ProcessMonitorError
from app.core.normalization import (
    build_movement_hash,
    infer_process_status_from_movement,
    normalize_movement_type,
)
from app.logging_config import get_logger, log_operation
from app.models.schemas import ConnectorResult
from app.persistence.db import get_session
from app.persistence.repositories import (
    MonitoringCaptureRunRepository,
    MonitoringConnectorHealthRepository,
    MonitoringMovementRepository,
    MonitoringProcessRepository,
    MonitoringProcessSourceRepository,
    MonitoringRawSnapshotRepository,
)

logger = get_logger("workers.tasks")


def sync_process(
    process_id: str | None = None,
    numero_cnj: str | None = None,
    tribunal: str | None = None,
    jgg_processo_id: str | None = None,
    force: bool = False,
    capturar_documentos: bool = False,
) -> dict:
    """Sincroniza um processo a partir de fontes disponíveis."""
    start_time = time.time()
    cnj_digits = normalizar(numero_cnj) if numero_cnj else None
    tribunal_detectado = tribunal or _detectar_tribunal(cnj_digits) if cnj_digits else "unknown"

    with get_session() as session:
        # 1. Criar capture_run
        capture_run = MonitoringCaptureRunRepository.create(
            session=session,
            tribunal=tribunal_detectado,
            connector="datajud",
            operation="sync_process",
            status="running",
            monitoring_process_id=UUID(process_id) if process_id else None,
        )

        # 2. Buscar ou criar monitoring_process
        process: Any = None
        if process_id:
            process = MonitoringProcessRepository.get_by_id(session, UUID(process_id))
        if not process and cnj_digits:
            process = MonitoringProcessRepository.get_by_cnj(session, cnj_digits)
        if not process and cnj_digits:
            process = MonitoringProcessRepository.upsert(
                session=session,
                numero_cnj=cnj_digits,
                numero_cnj_digits=cnj_digits,
                status_monitoramento="desconhecido",
                tribunal_preferencial=tribunal_detectado,
                jgg_processo_id=jgg_processo_id,
            )

        if process:
            capture_run.monitoring_process_id = process.id
            session.flush()

        stats = {
            "movements_found": 0,
            "movements_created": 0,
            "snapshots_created": 0,
            "tribunal_used": tribunal_detectado,
            "connector": "datajud",
            "documents_skipped_reason": "documents_not_supported_in_mvp" if capturar_documentos else None,
        }

        result: ConnectorResult | None = None
        error_code: str | None = None
        error_message: str | None = None

        try:
            with log_operation(
                logger,
                operation="sync_process",
                tribunal=tribunal_detectado,
                numero_cnj=cnj_digits or "",
            ):
                # 3. Chamar DataJudConnector
                datajud = registry.get("datajud")
                if datajud:
                    result = datajud.buscar_processo_por_numero(cnj_digits or "", tribunal=tribunal_detectado)
                    logger.info(
                        "sync_datajud_result",
                        extra={
                            "numero_cnj": cnj_digits,
                            "ok": result.ok,
                            "movements_count": len(result.movements),
                        },
                    )

                if result and result.ok and result.process:
                    # 4. Criar raw_snapshot
                    import hashlib
                    import json as _json

                    raw_payload = result.raw or result.process.raw if result.process else {}
                    raw_json = _json.dumps(raw_payload, sort_keys=True, ensure_ascii=False)
                    raw_hash = hashlib.sha256(raw_json.encode("utf-8")).hexdigest()

                    snapshot = MonitoringRawSnapshotRepository.create(
                        session=session,
                        source="datajud",
                        payload=raw_payload,
                        hash=raw_hash,
                        process_id=process.id if process else None,
                        capture_run_id=capture_run.id,
                    )
                    stats["snapshots_created"] = 1

                    # 5. Criar/atualizar source
                    source = MonitoringProcessSourceRepository.upsert(
                        session=session,
                        process_id=process.id,
                        tribunal=result.tribunal,
                        sistema="datajud",
                        processo_id_tribunal=result.process.processo_id_tribunal,
                        status_sync="ok",
                        raw_meta=result.process.raw,
                    )
                    source.last_sync_at = datetime.now(timezone.utc)
                    session.flush()

                    # 6. Inserir movimentos
                    stats["movements_found"] = len(result.movements)
                    for m in result.movements:
                        mov_hash = build_movement_hash(
                            numero_cnj=cnj_digits or "",
                            tribunal=result.tribunal,
                            data=m.data,
                            descricao_original=m.descricao_original,
                        )
                        tipo_evento = normalize_movement_type(m.descricao_original, m.external_id)
                        status_processo = infer_process_status_from_movement(m.descricao_original)

                        created = MonitoringMovementRepository.upsert(
                            session=session,
                            process_id=process.id,
                            hash=mov_hash,
                            descricao_original=m.descricao_original,
                            data_movimento=datetime.fromisoformat(m.data.replace("Z", "+00:00")) if m.data else None,
                            tipo_evento=tipo_evento,
                            status_processo=status_processo,
                            orgao_julgador=m.orgao_julgador,
                            external_id=m.external_id,
                            raw=m.raw,
                        )
                        if created:
                            stats["movements_created"] += 1

                    # 7. Atualizar process metadata
                    process.status_monitoramento = infer_process_status_from_movement(
                        result.movements[0].descricao_original if result.movements else ""
                    ) or "em_andamento"
                    process.metadata_.update({
                        "classe": result.process.classe,
                        "assunto": result.process.assunto,
                        "orgao_julgador": result.process.orgao_julgador,
                        "data_distribuicao": result.process.data_distribuicao,
                        "valor_causa": result.process.valor_causa,
                        "status_raw": result.process.status_raw,
                    })
                    session.flush()

                    # 8. Finalizar capture_run
                    duration_ms = round((time.time() - start_time) * 1000)
                    MonitoringCaptureRunRepository.finish(
                        session=session,
                        run_id=capture_run.id,
                        status="success",
                        duration_ms=duration_ms,
                        stats=stats,
                    )
                    session.commit()

                    return {
                        "ok": True,
                        "process_id": str(process.id),
                        "numero_cnj": cnj_digits,
                        "tribunal": tribunal_detectado,
                        "movements_synced": stats["movements_created"],
                        "snapshots_created": stats["snapshots_created"],
                    }

                elif result and not result.process:
                    # Processo não encontrado
                    error_code = "NOT_FOUND"
                    error_message = "Processo não encontrado nos aliases configurados"
                    if process:
                        process.status_monitoramento = "desconhecido"
                        MonitoringProcessSourceRepository.upsert(
                            session=session,
                            process_id=process.id,
                            tribunal=tribunal_detectado,
                            status_sync="not_found",
                        )
                    duration_ms = round((time.time() - start_time) * 1000)
                    MonitoringCaptureRunRepository.finish(
                        session=session,
                        run_id=capture_run.id,
                        status="partial",
                        duration_ms=duration_ms,
                        error_code=error_code,
                        error_message=error_message,
                        stats=stats,
                    )
                    session.commit()
                    return {
                        "ok": True,
                        "process_id": str(process.id) if process else None,
                        "numero_cnj": cnj_digits,
                        "warning": error_message,
                        "movements_synced": 0,
                    }

        except ProcessMonitorError as exc:
            error_code = exc.error_code
            error_message = exc.message
            logger.warning(
                "sync_controlled_error",
                extra={
                    "numero_cnj": cnj_digits,
                    "error_code": error_code,
                    "error_message": error_message,
                },
            )
            if process:
                MonitoringProcessSourceRepository.upsert(
                    session=session,
                    process_id=process.id,
                    tribunal=tribunal_detectado,
                    status_sync="failed",
                )
                source = session.query(MonitoringProcessSource).filter_by(
                    monitoring_process_id=process.id, tribunal=tribunal_detectado
                ).first()
                if source:
                    source.last_error_code = error_code
                    source.last_error_message = error_message
                    session.flush()
        except Exception as exc:
            error_code = "UNEXPECTED_ERROR"
            error_message = str(exc)
            logger.error(
                "sync_unexpected_error",
                extra={
                    "numero_cnj": cnj_digits,
                    "error": error_message,
                },
                exc_info=True,
            )

        # Finalizar capture_run em caso de erro
        duration_ms = round((time.time() - start_time) * 1000)
        MonitoringCaptureRunRepository.finish(
            session=session,
            run_id=capture_run.id,
            status="failed",
            duration_ms=duration_ms,
            error_code=error_code,
            error_message=error_message,
            stats=stats,
        )
        session.commit()

        return {
            "ok": False,
            "process_id": str(process.id) if process else None,
            "numero_cnj": cnj_digits,
            "error_code": error_code,
            "error_message": error_message,
        }


def sync_active_processes() -> dict:
    """Sincroniza todos os processos ativos. Skeleton nesta fase."""
    logger.info("sync_active_processes_started")
    return {"status": "skeleton", "message": "Use POST /monitoramento/processos para sincronizar individualmente"}


def retry_failed_processes() -> dict:
    """Reprocessa processos com falha. Skeleton nesta fase."""
    logger.info("retry_failed_processes_started")
    return {"status": "skeleton", "message": "Reprocessamento não implementado nesta fase"}


def connector_healthcheck() -> dict:
    """Executa healthcheck em todos os conectores."""
    results = {}
    for conn in registry.list_all():
        try:
            health = conn.healthcheck()
            results[conn.tribunal] = health.model_dump()
        except Exception as exc:
            results[conn.tribunal] = {
                "status": "error",
                "error": str(exc),
            }
    logger.info("connector_healthcheck_finished", extra={"results": results})
    return results


def _detectar_tribunal(cnj_digits: str) -> str:
    """Detecta tribunal pelo código TR do CNJ."""
    try:
        code = extrair_tribunal(cnj_digits)
        mapping = {
            "41": "tjpr",
            "51": "tjmt",
            "04": "trf4",
            "01": "trf1",
            "21": "tjrs",
            "26": "tjsp",
            "03": "trf3",
        }
        return mapping.get(code, "unknown")
    except Exception:
        return "unknown"
