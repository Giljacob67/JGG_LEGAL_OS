"""Repositórios de acesso a dados do process-monitor com SQLAlchemy 2.0."""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.logging_config import get_logger
from app.persistence.models import (
    MonitoringCaptureRun,
    MonitoringConnectorHealth,
    MonitoringMovement,
    MonitoringProcess,
    MonitoringProcessSource,
    MonitoringRawSnapshot,
)

logger = get_logger("persistence.repositories")


class MonitoringProcessRepository:
    @staticmethod
    def upsert(
        session: Session,
        numero_cnj: str,
        numero_cnj_digits: str,
        status_monitoramento: str = "desconhecido",
        tribunal_preferencial: str | None = None,
        jgg_processo_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> MonitoringProcess:
        stmt = select(MonitoringProcess).where(MonitoringProcess.numero_cnj == numero_cnj)
        existing = session.execute(stmt).scalar_one_or_none()
        if existing:
            existing.status_monitoramento = status_monitoramento
            if tribunal_preferencial is not None:
                existing.tribunal_preferencial = tribunal_preferencial
            if jgg_processo_id is not None:
                existing.jgg_processo_id = jgg_processo_id
            if metadata:
                existing.metadata_.update(metadata)
            session.flush()
            logger.info("process_updated", extra={"numero_cnj": numero_cnj})
            return existing

        process = MonitoringProcess(
            numero_cnj=numero_cnj,
            numero_cnj_digits=numero_cnj_digits,
            status_monitoramento=status_monitoramento,
            tribunal_preferencial=tribunal_preferencial,
            jgg_processo_id=jgg_processo_id,
            metadata_=metadata or {},
        )
        session.add(process)
        session.flush()
        logger.info("process_created", extra={"numero_cnj": numero_cnj})
        return process

    @staticmethod
    def get_by_cnj(session: Session, cnj: str) -> MonitoringProcess | None:
        stmt = select(MonitoringProcess).where(
            (MonitoringProcess.numero_cnj == cnj) | (MonitoringProcess.numero_cnj_digits == cnj)
        )
        return session.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_by_id(session: Session, process_id: UUID) -> MonitoringProcess | None:
        stmt = select(MonitoringProcess).where(MonitoringProcess.id == process_id)
        return session.execute(stmt).scalar_one_or_none()


class MonitoringProcessSourceRepository:
    @staticmethod
    def upsert(
        session: Session,
        process_id: UUID,
        tribunal: str,
        sistema: str | None = None,
        processo_id_tribunal: str | None = None,
        status_sync: str = "sem_fonte",
        raw_meta: dict[str, Any] | None = None,
    ) -> MonitoringProcessSource:
        stmt = select(MonitoringProcessSource).where(
            MonitoringProcessSource.monitoring_process_id == process_id,
            MonitoringProcessSource.tribunal == tribunal,
        )
        existing = session.execute(stmt).scalar_one_or_none()
        if existing:
            existing.status_sync = status_sync
            if sistema is not None:
                existing.sistema = sistema
            if processo_id_tribunal is not None:
                existing.processo_id_tribunal = processo_id_tribunal
            if raw_meta:
                existing.raw_meta.update(raw_meta)
            session.flush()
            return existing

        source = MonitoringProcessSource(
            monitoring_process_id=process_id,
            tribunal=tribunal,
            sistema=sistema,
            processo_id_tribunal=processo_id_tribunal,
            status_sync=status_sync,
            raw_meta=raw_meta or {},
        )
        session.add(source)
        session.flush()
        return source


class MonitoringMovementRepository:
    @staticmethod
    def upsert(
        session: Session,
        process_id: UUID,
        hash: str,
        descricao_original: str,
        data_movimento: datetime | None = None,
        tipo_evento: str | None = None,
        status_processo: str | None = None,
        orgao_julgador: str | None = None,
        external_id: str | None = None,
        raw: dict[str, Any] | None = None,
    ) -> MonitoringMovement | None:
        from sqlalchemy import select
        stmt = select(MonitoringMovement).where(MonitoringMovement.hash == hash)
        existing = session.execute(stmt).scalar_one_or_none()
        if existing:
            return None  # já existe, não duplicar

        movement = MonitoringMovement(
            monitoring_process_id=process_id,
            hash=hash,
            descricao_original=descricao_original,
            data_movimento=data_movimento,
            tipo_evento=tipo_evento,
            status_processo=status_processo,
            orgao_julgador=orgao_julgador,
            external_id=external_id,
            raw=raw or {},
        )
        session.add(movement)
        session.flush()
        return movement

    @staticmethod
    def list_by_process(session: Session, process_id: UUID) -> list[MonitoringMovement]:
        stmt = (
            select(MonitoringMovement)
            .where(MonitoringMovement.monitoring_process_id == process_id)
            .order_by(MonitoringMovement.data_movimento.desc())
        )
        return list(session.execute(stmt).scalars().all())


class MonitoringCaptureRunRepository:
    @staticmethod
    def create(
        session: Session,
        tribunal: str,
        connector: str,
        operation: str,
        status: str = "running",
        monitoring_process_id: UUID | None = None,
    ) -> MonitoringCaptureRun:
        run = MonitoringCaptureRun(
            monitoring_process_id=monitoring_process_id,
            tribunal=tribunal,
            connector=connector,
            operation=operation,
            status=status,
        )
        session.add(run)
        session.flush()
        logger.info("capture_run_created", extra={"run_id": str(run.id), "tribunal": tribunal})
        return run

    @staticmethod
    def finish(
        session: Session,
        run_id: UUID,
        status: str,
        duration_ms: int | None = None,
        error_code: str | None = None,
        error_message: str | None = None,
        stats: dict[str, Any] | None = None,
    ) -> None:
        from datetime import datetime, timezone
        stmt = select(MonitoringCaptureRun).where(MonitoringCaptureRun.id == run_id)
        run = session.execute(stmt).scalar_one_or_none()
        if run:
            run.status = status
            run.finished_at = datetime.now(timezone.utc)
            run.duration_ms = duration_ms
            run.error_code = error_code
            run.error_message = error_message
            run.stats = stats or {}
            session.flush()
            logger.info("capture_run_finished", extra={"run_id": str(run_id), "status": status})

    @staticmethod
    def list_by_process(session: Session, process_id: UUID, limit: int = 20) -> list[MonitoringCaptureRun]:
        stmt = (
            select(MonitoringCaptureRun)
            .where(MonitoringCaptureRun.monitoring_process_id == process_id)
            .order_by(MonitoringCaptureRun.started_at.desc())
            .limit(limit)
        )
        return list(session.execute(stmt).scalars().all())


class MonitoringRawSnapshotRepository:
    @staticmethod
    def create(
        session: Session,
        source: str,
        payload: dict[str, Any],
        hash: str,
        process_id: UUID | None = None,
        capture_run_id: UUID | None = None,
    ) -> MonitoringRawSnapshot:
        snapshot = MonitoringRawSnapshot(
            monitoring_process_id=process_id,
            capture_run_id=capture_run_id,
            source=source,
            payload=payload,
            hash=hash,
        )
        session.add(snapshot)
        session.flush()
        return snapshot


class MonitoringConnectorHealthRepository:
    @staticmethod
    def upsert(
        session: Session,
        tribunal: str,
        connector: str,
        status: str,
        last_success_at: datetime | None = None,
        last_error_at: datetime | None = None,
        last_error_code: str | None = None,
        last_error_message: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> MonitoringConnectorHealth:
        from sqlalchemy import select
        stmt = select(MonitoringConnectorHealth).where(
            MonitoringConnectorHealth.tribunal == tribunal,
            MonitoringConnectorHealth.connector == connector,
        )
        existing = session.execute(stmt).scalar_one_or_none()
        if existing:
            existing.status = status
            if last_success_at:
                existing.last_success_at = last_success_at
            if last_error_at:
                existing.last_error_at = last_error_at
            if last_error_code:
                existing.last_error_code = last_error_code
            if last_error_message:
                existing.last_error_message = last_error_message
            if details:
                existing.details.update(details)
            session.flush()
            return existing

        health = MonitoringConnectorHealth(
            tribunal=tribunal,
            connector=connector,
            status=status,
            last_success_at=last_success_at,
            last_error_at=last_error_at,
            last_error_code=last_error_code,
            last_error_message=last_error_message,
            details=details or {},
        )
        session.add(health)
        session.flush()
        return health
