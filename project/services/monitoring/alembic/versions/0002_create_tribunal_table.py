"""create tribunal table

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-15
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS monitoring.tribunal (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tribunal_id TEXT NOT NULL UNIQUE,
            nome        TEXT NOT NULL,
            sistema     TEXT NOT NULL,
            base_url    TEXT NOT NULL,
            ativo       BOOLEAN NOT NULL DEFAULT TRUE,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    # Seed com tribunais suportados
    op.execute("""
        INSERT INTO monitoring.tribunal (tribunal_id, nome, sistema, base_url, ativo)
        VALUES
            ('tjpr', 'Tribunal de Justiça do Paraná', 'projudi', 'https://consulta.tjpr.jus.br/projudi_consulta', TRUE),
            ('tjmt', 'Tribunal de Justiça de Mato Grosso', 'pje', 'https://pje.tjmt.jus.br/pje', TRUE),
            ('trf4', 'Tribunal Regional Federal da 4ª Região', 'eproc', 'https://eproc.trf4.jus.br/eproc', TRUE),
            ('trf1', 'Tribunal Regional Federal da 1ª Região', 'pje', 'https://pje.trf1.jus.br/pje', TRUE)
        ON CONFLICT (tribunal_id) DO NOTHING
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS monitoring.tribunal")
