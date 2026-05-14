"""Loga execuções de captura no schema monitoring."""
import asyncpg
from datetime import datetime, timezone
from typing import Optional
import uuid


async def criar_execucao(
    pool: asyncpg.Pool,
    processo_cnj: str,
    tribunal_id: str,
    tentativa: int = 1,
) -> str:
    exec_id = str(uuid.uuid4())
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO monitoring.captura_execucao
               (id, processo_cnj, tribunal_id, iniciado_em, status, tentativa)
               VALUES ($1, $2, $3, $4, 'running', $5)""",
            exec_id,
            processo_cnj,
            tribunal_id,
            datetime.now(timezone.utc),
            tentativa,
        )
    return exec_id


async def finalizar_execucao(
    pool: asyncpg.Pool,
    exec_id: str,
    status: str,
    andamentos_novos: int = 0,
    documentos_novos: int = 0,
    erro: Optional[str] = None,
    duracao_ms: Optional[int] = None,
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE monitoring.captura_execucao
               SET status = $1,
                   concluido_em = $2,
                   andamentos_novos = $3,
                   documentos_novos = $4,
                   erro = $5,
                   duracao_ms = $6
               WHERE id = $7""",
            status,
            datetime.now(timezone.utc),
            andamentos_novos,
            documentos_novos,
            erro,
            duracao_ms,
            exec_id,
        )


async def buscar_ultimo_status(
    pool: asyncpg.Pool,
    processo_cnj: str,
    tribunal_id: Optional[str] = None,
) -> list[dict]:
    async with pool.acquire() as conn:
        if tribunal_id:
            rows = await conn.fetch(
                """SELECT * FROM monitoring.captura_execucao
                   WHERE processo_cnj = $1 AND tribunal_id = $2
                   ORDER BY iniciado_em DESC LIMIT 1""",
                processo_cnj,
                tribunal_id,
            )
        else:
            rows = await conn.fetch(
                """SELECT DISTINCT ON (tribunal_id) *
                   FROM monitoring.captura_execucao
                   WHERE processo_cnj = $1
                   ORDER BY tribunal_id, iniciado_em DESC""",
                processo_cnj,
            )
        return [dict(r) for r in rows]


async def contar_falhas_recentes(
    pool: asyncpg.Pool,
    processo_cnj: str,
    tribunal_id: str,
    horas: int = 24,
) -> int:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            """SELECT COUNT(*) FROM monitoring.captura_execucao
               WHERE processo_cnj = $1
                 AND tribunal_id = $2
                 AND status IN ('falha', 'captcha', 'indisponivel')
                 AND iniciado_em > NOW() - ($3 || ' hours')::INTERVAL""",
            processo_cnj,
            tribunal_id,
            str(horas),
        )
