"""Endpoints de métricas e estatísticas do serviço."""

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter
from sqlalchemy import func

from app.persistence.db import get_session
from app.persistence.models import MonitoringCaptureRun, MonitoringMovement, MonitoringProcess

router = APIRouter(tags=["metrics"])


@router.get("/metrics")
async def get_metrics() -> dict[str, Any]:
    """Retorna métricas agregadas do serviço de monitoramento."""
    with get_session() as session:
        total_processes = session.query(func.count(MonitoringProcess.id)).scalar() or 0
        active_processes = (
            session.query(func.count(MonitoringProcess.id))
            .where(MonitoringProcess.status_monitoramento != "arquivado")
            .scalar()
            or 0
        )

        # Capturas nas últimas 24h
        since_24h = datetime.now(timezone.utc) - timedelta(hours=24)
        captures_24h = (
            session.query(func.count(MonitoringCaptureRun.id))
            .where(MonitoringCaptureRun.started_at >= since_24h)
            .scalar()
            or 0
        )

        captures_success_24h = (
            session.query(func.count(MonitoringCaptureRun.id))
            .where(MonitoringCaptureRun.started_at >= since_24h)
            .where(MonitoringCaptureRun.status == "success")
            .scalar()
            or 0
        )

        captures_failed_24h = (
            session.query(func.count(MonitoringCaptureRun.id))
            .where(MonitoringCaptureRun.started_at >= since_24h)
            .where(MonitoringCaptureRun.status == "failed")
            .scalar()
            or 0
        )

        avg_duration_ms = (
            session.query(func.avg(MonitoringCaptureRun.duration_ms))
            .where(MonitoringCaptureRun.started_at >= since_24h)
            .where(MonitoringCaptureRun.status == "success")
            .scalar()
        )

        # Movimentações nas últimas 24h
        movements_24h = (
            session.query(func.count(MonitoringMovement.id))
            .where(MonitoringMovement.created_at >= since_24h)
            .scalar()
            or 0
        )

        # Top tribunais por captura
        top_tribunals = (
            session.query(
                MonitoringCaptureRun.tribunal,
                func.count(MonitoringCaptureRun.id).label("count"),
            )
            .where(MonitoringCaptureRun.started_at >= since_24h)
            .group_by(MonitoringCaptureRun.tribunal)
            .order_by(func.count(MonitoringCaptureRun.id).desc())
            .limit(5)
            .all()
        )

        # Status dos processos
        status_counts = (
            session.query(
                MonitoringProcess.status_monitoramento,
                func.count(MonitoringProcess.id).label("count"),
            )
            .group_by(MonitoringProcess.status_monitoramento)
            .all()
        )

    return {
        "processes": {
            "total": total_processes,
            "active": active_processes,
            "status_breakdown": {s: c for s, c in status_counts},
        },
        "captures_24h": {
            "total": captures_24h,
            "success": captures_success_24h,
            "failed": captures_failed_24h,
            "success_rate": round(captures_success_24h / max(captures_24h, 1) * 100, 1),
            "avg_duration_ms": round(avg_duration_ms or 0, 1),
        },
        "movements_24h": movements_24h,
        "top_tribunals": [{"tribunal": t, "captures": c} for t, c in top_tribunals],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
