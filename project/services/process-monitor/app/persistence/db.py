"""Conexão com PostgreSQL para o serviço process-monitor.

Nesta fase: interface mínima usando psycopg2.
Futuramente: SQLAlchemy/asyncpg se necessário.
"""

import contextlib
from typing import Any, Generator

import psycopg2
from psycopg2.extras import RealDictCursor

from app.config import settings
from app.logging_config import get_logger

logger = get_logger("persistence.db")


def get_connection() -> psycopg2.extensions.connection:
    return psycopg2.connect(settings.DATABASE_URL)


@contextlib.contextmanager
def get_cursor() -> Generator[Any, None, None]:
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_schema() -> None:
    """Executa schema.sql se as tabelas ainda não existirem.

    Não falha fatalmente se o banco não estiver disponível.
    """
    import pathlib

    schema_path = pathlib.Path(__file__).parent / "schema.sql"
    if not schema_path.exists():
        logger.warning("schema.sql não encontrado")
        return

    sql = schema_path.read_text(encoding="utf-8")
    try:
        conn = get_connection()
    except Exception as exc:
        logger.warning("db_not_available_skip_schema_init", extra={"error": str(exc)})
        return

    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        logger.info("schema_initialized")
    except Exception as exc:
        logger.warning("schema_init_skipped", extra={"error": str(exc)})
    finally:
        conn.close()
