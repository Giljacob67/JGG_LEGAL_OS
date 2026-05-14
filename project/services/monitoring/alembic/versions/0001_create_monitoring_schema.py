"""create monitoring schema and tables

Revision ID: 0001
Revises:
Create Date: 2026-05-13
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS monitoring")

    op.execute("""
        CREATE TABLE IF NOT EXISTS monitoring.tribunal_credencial (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tribunal_id TEXT NOT NULL UNIQUE,
            sistema     TEXT NOT NULL,
            login       TEXT,
            senha_enc   TEXT,
            oab_uf      TEXT,
            oab_numero  TEXT,
            ativo       BOOLEAN NOT NULL DEFAULT TRUE,
            obs         TEXT,
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS monitoring.captura_execucao (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            processo_cnj     TEXT NOT NULL,
            tribunal_id      TEXT NOT NULL,
            iniciado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            concluido_em     TIMESTAMPTZ,
            status           TEXT NOT NULL DEFAULT 'running',
            andamentos_novos INT NOT NULL DEFAULT 0,
            documentos_novos INT NOT NULL DEFAULT 0,
            erro             TEXT,
            duracao_ms       INT,
            tentativa        INT NOT NULL DEFAULT 1,
            captcha_detectado BOOLEAN NOT NULL DEFAULT FALSE
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_captura_cnj ON monitoring.captura_execucao (processo_cnj)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_captura_tribunal_status ON monitoring.captura_execucao (tribunal_id, status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_captura_iniciado ON monitoring.captura_execucao (iniciado_em)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS monitoring.documento_capturado (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            processo_cnj  TEXT NOT NULL,
            processo_id   TEXT,
            tribunal_id   TEXT NOT NULL,
            id_tribunal   TEXT NOT NULL,
            nome          TEXT,
            tipo_doc      TEXT,
            data_doc      DATE,
            mime_type     TEXT NOT NULL DEFAULT 'application/pdf',
            tamanho_bytes INT,
            storage_key   TEXT,
            storage_url   TEXT,
            hash_sha256   TEXT UNIQUE,
            captura_id    UUID REFERENCES monitoring.captura_execucao(id) ON DELETE SET NULL,
            disponivel    BOOLEAN NOT NULL DEFAULT TRUE,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (tribunal_id, id_tribunal)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_doc_cnj ON monitoring.documento_capturado (processo_cnj)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_doc_tipo ON monitoring.documento_capturado (tipo_doc)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS monitoring.andamento_tipo_regra (
            id               SERIAL PRIMARY KEY,
            pattern          TEXT NOT NULL,
            tipo             TEXT NOT NULL,
            status_processo  TEXT,
            critico          BOOLEAN NOT NULL DEFAULT FALSE,
            prioridade       INT NOT NULL DEFAULT 100,
            ativo            BOOLEAN NOT NULL DEFAULT TRUE,
            criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS monitoring.processo_config (
            processo_cnj  TEXT PRIMARY KEY,
            ativo         BOOLEAN NOT NULL DEFAULT TRUE,
            frequencia    TEXT NOT NULL DEFAULT 'normal',
            ultimo_check  TIMESTAMPTZ,
            proximo_check TIMESTAMPTZ,
            tribunal_ids  TEXT[],
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_config_proximo ON monitoring.processo_config (proximo_check)")

    # Seed de regras padrão de normalização
    op.execute("""
        INSERT INTO monitoring.andamento_tipo_regra (pattern, tipo, status_processo, critico, prioridade)
        VALUES
          ('trânsito em julgado|transitou em julgado', 'transito_julgado', 'encerrado',    TRUE,  10),
          ('sentença',                                  'sentenca',         'sentenca',     TRUE,  20),
          ('acórdão|acordao',                           'acordao',          NULL,           TRUE,  25),
          ('decisão interlocut|decisao interlocut',     'decisao_interlocutoria', NULL,     FALSE, 30),
          ('despacho',                                  'despacho',         NULL,           FALSE, 40),
          ('audiência|audiencia',                       'audiencia',        NULL,           TRUE,  50),
          ('citação|citacao',                           'citacao',          NULL,           FALSE, 60),
          ('intimação|intimacao',                       'intimacao',        NULL,           FALSE, 65),
          ('juntada|petição|peticao',                   'peticao',          NULL,           FALSE, 70),
          ('arquivamento|baixa definitiva',             'arquivamento',     'arquivado',    TRUE,  80),
          ('distribuição|distribuicao',                 'distribuicao',     NULL,           FALSE, 90),
          ('penhora|bloqueio bacen|renajud|sisbajud',   'constricao',       NULL,           TRUE,  95),
          ('tutela|liminar',                            'tutela',           NULL,           TRUE,  96),
          ('extinção|extincao',                         'extincao',         'encerrado',    TRUE,  97)
        ON CONFLICT DO NOTHING
    """)


def downgrade() -> None:
    op.execute("DROP SCHEMA IF EXISTS monitoring CASCADE")
