"""Consultas de processos no schema public (Prisma)."""
import asyncpg
from typing import Optional


async def listar_processos_para_captura(
    pool: asyncpg.Pool,
    status_processos: list[str] | None = None,
    limite: int = 100,
) -> list[dict]:
    """
    Retorna processos que precisam ser capturados agora,
    baseado em processo_config.proximo_check <= NOW().
    Fallback: processos sem config que nunca foram capturados.
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                p.id,
                p.cnj,
                p.tribunal,
                p.status,
                COALESCE(pc.frequencia, 'normal') AS frequencia,
                COALESCE(pc.tribunal_ids, ARRAY[]::TEXT[]) AS tribunal_ids,
                pc.proximo_check
            FROM public."Processo" p
            LEFT JOIN monitoring.processo_config pc ON pc.processo_cnj = p.cnj
            WHERE
                p."deletedAt" IS NULL
                AND ($1::TEXT[] IS NULL OR p.status = ANY($1))
                AND (
                    pc.ativo IS NULL OR pc.ativo = TRUE
                )
                AND (
                    pc.proximo_check IS NULL
                    OR pc.proximo_check <= NOW()
                )
                AND (pc.frequencia IS NULL OR pc.frequencia != 'pausa')
            ORDER BY pc.proximo_check ASC NULLS FIRST
            LIMIT $2
            """,
            status_processos,
            limite,
        )
        return [dict(r) for r in rows]


async def buscar_processo_por_cnj(
    pool: asyncpg.Pool,
    cnj: str,
) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            'SELECT id, cnj, tribunal, status FROM public."Processo" WHERE cnj = $1 AND "deletedAt" IS NULL',
            cnj,
        )
        return dict(row) if row else None


async def atualizar_proximo_check(
    pool: asyncpg.Pool,
    processo_cnj: str,
    proximo_check_iso: str,
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO monitoring.processo_config (processo_cnj, ultimo_check, proximo_check)
               VALUES ($1, NOW(), $2::TIMESTAMPTZ)
               ON CONFLICT (processo_cnj) DO UPDATE
               SET ultimo_check = NOW(), proximo_check = $2::TIMESTAMPTZ, updated_at = NOW()""",
            processo_cnj,
            proximo_check_iso,
        )
