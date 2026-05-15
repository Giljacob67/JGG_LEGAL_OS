"""Conexão com PostgreSQL para o serviço process-monitor usando SQLAlchemy 2.0."""

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.config import settings
from app.logging_config import get_logger
from app.persistence.models import Base

logger = get_logger("persistence.db")

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@contextmanager
def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_schema() -> None:
    """Cria tabelas se não existirem. Não falha fatalmente se DB não estiver disponível."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("schema_initialized")
    except Exception as exc:
        logger.warning("db_not_available_skip_schema_init", extra={"error": str(exc)})
