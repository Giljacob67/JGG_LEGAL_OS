"""Configuração de logs estruturados em JSON para o process-monitor."""

import logging
import sys
import time
from contextlib import contextmanager
from typing import Any

from pythonjsonlogger.json import JsonFormatter

from app.config import settings


class JGGJsonFormatter(JsonFormatter):
    """Formatter JSON com campos padronizados JGG."""

    def add_fields(
        self,
        log_record: dict[str, Any],
        record: logging.LogRecord,
        message_dict: dict[str, Any],
    ) -> None:
        super().add_fields(log_record, record, message_dict)
        log_record["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(record.created))
        log_record["level"] = record.levelname
        log_record["service"] = settings.SERVICE_NAME
        if not log_record.get("message"):
            log_record["message"] = record.getMessage()


def configure_logging() -> None:
    """Configura logging global do serviço."""
    handler = logging.StreamHandler(sys.stdout)
    if settings.LOG_JSON:
        formatter = JGGJsonFormatter(
            "%(timestamp)s %(level)s %(service)s %(message)s",
            rename_fields={"levelname": "level"},
        )
    else:
        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        )
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))


def get_logger(name: str) -> logging.Logger:
    """Retorna logger nomeado com contexto do serviço."""
    return logging.getLogger(name)


@contextmanager
def log_operation(
    logger: logging.Logger,
    operation: str,
    tribunal: str | None = None,
    connector: str | None = None,
    numero_cnj: str | None = None,
    job_id: str | None = None,
    extra: dict[str, Any] | None = None,
):
    """Context manager para logar início/fim de operações com duração."""
    start = time.time()
    ctx = {
        "operation": operation,
        "tribunal": tribunal,
        "connector": connector,
        "numero_cnj": numero_cnj,
        "job_id": job_id,
        "status": "started",
    }
    if extra:
        ctx.update(extra)
    logger.info("operation_started", extra=ctx)
    try:
        yield
        ctx["status"] = "success"
    except Exception as exc:
        ctx["status"] = "error"
        ctx["error_code"] = getattr(exc, "error_code", type(exc).__name__)
        ctx["error_message"] = str(exc)
        raise
    finally:
        ctx["duration_ms"] = round((time.time() - start) * 1000, 2)
        logger.info("operation_finished", extra=ctx)
