"""Tarefas background executadas via RQ.

Jobs:
- sync_process
- sync_active_processes
- retry_failed_processes
- connector_healthcheck
"""

from app.config import settings
from app.connectors.registry import registry
from app.core.cnj import extrair_tribunal, normalizar
from app.core.errors import ProcessMonitorError
from app.logging_config import get_logger, log_operation
from app.models.schemas import ConnectorResult

logger = get_logger("workers.tasks")


def sync_process(
    numero_cnj: str,
    tribunal: str | None = None,
    jgg_processo_id: str | None = None,
    prioridade: str = "normal",
    force: bool = False,
    capturar_documentos: bool = False,
) -> dict:
    """Sincroniza um processo a partir de fontes disponíveis."""
    cnj_digits = normalizar(numero_cnj)
    tribunal_detectado = tribunal or _detectar_tribunal(cnj_digits)

    with log_operation(
        logger,
        operation="sync_process",
        tribunal=tribunal_detectado,
        numero_cnj=cnj_digits,
    ):
        # 1. Tentar DataJud como fonte auxiliar
        datajud = registry.get("datajud")
        result: ConnectorResult | None = None
        if datajud:
            try:
                result = datajud.buscar_processo_por_numero(cnj_digits)
                logger.info(
                    "sync_datajud_result",
                    extra={
                        "numero_cnj": cnj_digits,
                        "ok": result.ok,
                        "movements_count": len(result.movements),
                    },
                )
            except ProcessMonitorError as exc:
                logger.warning(
                    "sync_datajud_failed",
                    extra={
                        "numero_cnj": cnj_digits,
                        "error_code": exc.error_code,
                        "error_message": exc.message,
                    },
                )

        # 2. Tentar conector específico do tribunal (stub nesta fase)
        tribunal_conn = registry.get(tribunal_detectado)
        if tribunal_conn and tribunal_conn.tribunal != "datajud":
            try:
                tribunal_result = tribunal_conn.buscar_processo_por_numero(cnj_digits)
                logger.info(
                    "sync_tribunal_result",
                    extra={
                        "numero_cnj": cnj_digits,
                        "tribunal": tribunal_detectado,
                        "ok": tribunal_result.ok,
                    },
                )
                # Preferir resultado do tribunal se disponível
                if tribunal_result.ok and tribunal_result.process:
                    result = tribunal_result
            except ProcessMonitorError as exc:
                logger.warning(
                    "sync_tribunal_failed",
                    extra={
                        "numero_cnj": cnj_digits,
                        "tribunal": tribunal_detectado,
                        "error_code": exc.error_code,
                    },
                )

        return {
            "numero_cnj": cnj_digits,
            "tribunal": tribunal_detectado,
            "jgg_processo_id": jgg_processo_id,
            "ok": result.ok if result else False,
            "movements_synced": len(result.movements) if result else 0,
            "documents_synced": len(result.documents) if result else 0,
        }


def sync_active_processes() -> dict:
    """Sincroniza todos os processos ativos. Skeleton nesta fase."""
    logger.info("sync_active_processes_started")
    # Futuramente: buscar do banco processos ativos e enfileirar sync
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
