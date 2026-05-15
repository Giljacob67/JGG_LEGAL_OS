"""Repositórios de acesso a dados do process-monitor.

Nesta fase: stubs mínimos com logs.
Futuramente: implementar CRUD completo.
"""

from typing import Any

from app.logging_config import get_logger
from app.persistence.db import get_cursor

logger = get_logger("persistence.repositories")


class MonitoringProcessRepository:
    @staticmethod
    def upsert(
        numero_cnj: str,
        numero_cnj_digits: str,
        status_monitoramento: str = "desconhecido",
        tribunal_preferencial: str | None = None,
        jgg_processo_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        with get_cursor() as cur:
            cur.execute(
                """
                INSERT INTO monitoring_process (
                    numero_cnj, numero_cnj_digits, status_monitoramento,
                    tribunal_preferencial, jgg_processo_id, metadata
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (numero_cnj) DO UPDATE SET
                    status_monitoramento = EXCLUDED.status_monitoramento,
                    tribunal_preferencial = EXCLUDED.tribunal_preferencial,
                    jgg_processo_id = EXCLUDED.jgg_processo_id,
                    metadata = EXCLUDED.metadata,
                    updated_at = now()
                RETURNING *
                """,
                (
                    numero_cnj,
                    numero_cnj_digits,
                    status_monitoramento,
                    tribunal_preferencial,
                    jgg_processo_id,
                    metadata or {},
                ),
            )
            row = cur.fetchone()
            logger.info("process_upserted", extra={"numero_cnj": numero_cnj})
            return dict(row) if row else {}

    @staticmethod
    def get_by_cnj(cnj_digits: str) -> dict[str, Any] | None:
        with get_cursor() as cur:
            cur.execute(
                "SELECT * FROM monitoring_process WHERE numero_cnj_digits = %s",
                (cnj_digits,),
            )
            row = cur.fetchone()
            return dict(row) if row else None


class MonitoringMovementRepository:
    @staticmethod
    def upsert(
        monitoring_process_id: str,
        hash: str,
        descricao_original: str,
        data_movimento: str | None = None,
        tipo_evento: str | None = None,
        orgao_julgador: str | None = None,
        external_id: str | None = None,
        raw: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        with get_cursor() as cur:
            cur.execute(
                """
                INSERT INTO monitoring_movement (
                    monitoring_process_id, hash, descricao_original,
                    data_movimento, tipo_evento, orgao_julgador, external_id, raw
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (hash) DO UPDATE SET
                    descricao_original = EXCLUDED.descricao_original,
                    raw = EXCLUDED.raw
                RETURNING *
                """,
                (
                    monitoring_process_id,
                    hash,
                    descricao_original,
                    data_movimento,
                    tipo_evento,
                    orgao_julgador,
                    external_id,
                    raw or {},
                ),
            )
            row = cur.fetchone()
            return dict(row) if row else {}


class CaptureRunRepository:
    @staticmethod
    def create(
        tribunal: str,
        connector: str,
        operation: str,
        status: str,
        monitoring_process_id: str | None = None,
    ) -> str:
        with get_cursor() as cur:
            cur.execute(
                """
                INSERT INTO monitoring_capture_run (
                    monitoring_process_id, tribunal, connector, operation, status
                )
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (monitoring_process_id, tribunal, connector, operation, status),
            )
            row = cur.fetchone()
            run_id = str(row["id"]) if row else ""
            logger.info("capture_run_created", extra={"run_id": run_id, "tribunal": tribunal})
            return run_id

    @staticmethod
    def finish(
        run_id: str,
        status: str,
        duration_ms: int | None = None,
        error_code: str | None = None,
        error_message: str | None = None,
        stats: dict[str, Any] | None = None,
    ) -> None:
        with get_cursor() as cur:
            cur.execute(
                """
                UPDATE monitoring_capture_run
                SET status = %s,
                    finished_at = now(),
                    duration_ms = %s,
                    error_code = %s,
                    error_message = %s,
                    stats = %s
                WHERE id = %s
                """,
                (status, duration_ms, error_code, error_message, stats or {}, run_id),
            )
            logger.info("capture_run_finished", extra={"run_id": run_id, "status": status})
