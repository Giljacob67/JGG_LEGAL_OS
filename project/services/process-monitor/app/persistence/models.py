"""Modelos SQLAlchemy 2.0 para o process-monitor."""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, String, Text, DateTime, Float, Integer, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    type_annotation_map = {
        dict[str, Any]: JSON,
        list[Any]: JSON,
    }


class MonitoringProcess(Base):
    __tablename__ = "monitoring_process"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jgg_processo_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    numero_cnj: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    numero_cnj_digits: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    status_monitoramento: Mapped[str] = mapped_column(Text, default="desconhecido")
    tribunal_preferencial: Mapped[str | None] = mapped_column(Text, nullable=True)
    cliente_jgg_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    sources: Mapped[list["MonitoringProcessSource"]] = relationship(
        back_populates="process", cascade="all, delete-orphan", lazy="selectin"
    )
    movements: Mapped[list["MonitoringMovement"]] = relationship(
        back_populates="process", cascade="all, delete-orphan", lazy="selectin"
    )
    capture_runs: Mapped[list["MonitoringCaptureRun"]] = relationship(
        back_populates="process", cascade="all, delete-orphan", lazy="selectin"
    )
    snapshots: Mapped[list["MonitoringRawSnapshot"]] = relationship(
        back_populates="process", cascade="all, delete-orphan", lazy="selectin"
    )


class MonitoringProcessSource(Base):
    __tablename__ = "monitoring_process_source"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    monitoring_process_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("monitoring_process.id", ondelete="CASCADE"), nullable=False
    )
    tribunal: Mapped[str] = mapped_column(Text, nullable=False)
    sistema: Mapped[str | None] = mapped_column(Text, nullable=True)
    processo_id_tribunal: Mapped[str | None] = mapped_column(Text, nullable=True)
    status_sync: Mapped[str] = mapped_column(Text, default="sem_fonte")
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_meta: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    process: Mapped["MonitoringProcess"] = relationship(back_populates="sources")


class MonitoringMovement(Base):
    __tablename__ = "monitoring_movement"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    monitoring_process_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("monitoring_process.id", ondelete="CASCADE"), nullable=False
    )
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("monitoring_process_source.id", ondelete="SET NULL"), nullable=True
    )
    external_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_movimento: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    descricao_original: Mapped[str] = mapped_column(Text, nullable=False)
    tipo_evento: Mapped[str | None] = mapped_column(Text, nullable=True)
    status_processo: Mapped[str | None] = mapped_column(Text, nullable=True)
    orgao_julgador: Mapped[str | None] = mapped_column(Text, nullable=True)
    hash: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    raw: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    process: Mapped["MonitoringProcess"] = relationship(back_populates="movements")

    __table_args__ = (
        Index("idx_mm_process_id", "monitoring_process_id"),
        Index("idx_mm_hash", "hash"),
        Index("idx_mm_data", "data_movimento"),
    )


class MonitoringCaptureRun(Base):
    __tablename__ = "monitoring_capture_run"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    monitoring_process_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("monitoring_process.id", ondelete="SET NULL"), nullable=True
    )
    tribunal: Mapped[str] = mapped_column(Text, nullable=False)
    connector: Mapped[str] = mapped_column(Text, nullable=False)
    operation: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    stats: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    process: Mapped["MonitoringProcess"] = relationship(back_populates="capture_runs")

    __table_args__ = (
        Index("idx_mcr_process_id", "monitoring_process_id"),
        Index("idx_mcr_tribunal", "tribunal"),
        Index("idx_mcr_status", "status"),
    )


class MonitoringRawSnapshot(Base):
    __tablename__ = "monitoring_raw_snapshot"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    monitoring_process_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("monitoring_process.id", ondelete="SET NULL"), nullable=True
    )
    capture_run_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("monitoring_capture_run.id", ondelete="SET NULL"), nullable=True
    )
    source: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    hash: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    process: Mapped["MonitoringProcess"] = relationship(back_populates="snapshots")

    __table_args__ = (
        Index("idx_mrs_process_id", "monitoring_process_id"),
        Index("idx_mrs_hash", "hash"),
    )


class MonitoringConnectorHealth(Base):
    __tablename__ = "monitoring_connector_health"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tribunal: Mapped[str] = mapped_column(Text, nullable=False)
    connector: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    last_success_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    details: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    __table_args__ = (
        UniqueConstraint("tribunal", "connector", name="uq_mch_tribunal_connector"),
        Index("idx_mch_tribunal", "tribunal"),
        Index("idx_mch_status", "status"),
    )
