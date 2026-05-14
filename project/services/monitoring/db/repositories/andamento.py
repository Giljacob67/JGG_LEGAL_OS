"""
Grava andamentos no schema public (tabela Prisma existente).
Usa fingerprint idêntico ao import pipeline do Next.js para dedup.
"""
import asyncpg
from datetime import date, datetime, timezone
from typing import Optional
import uuid


async def upsert_andamentos(
    pool: asyncpg.Pool,
    processo_cnj: str,
    andamentos: list[dict],  # {data, evento, descricao_bruta, fonte, critico}
) -> int:
    """
    Insere andamentos novos, ignorando duplicatas por fingerprint.
    Retorna quantidade inserida.
    """
    if not andamentos:
        return 0

    # Busca processo_id pelo CNJ
    async with pool.acquire() as conn:
        processo_id = await conn.fetchval(
            'SELECT id FROM public."Processo" WHERE cnj = $1 AND "deletedAt" IS NULL',
            processo_cnj,
        )
        if not processo_id:
            return 0

        # Busca fingerprints já existentes para evitar duplicata
        existing = await conn.fetch(
            '''SELECT CONCAT(
                TO_CHAR(data, 'YYYY-MM-DD'), '|',
                SUBSTRING(evento, 1, 100)
               ) AS fp
               FROM public."Andamento"
               WHERE "processoId" = $1''',
            processo_id,
        )
        existing_fps = {r["fp"] for r in existing}

        inserted = 0
        for a in andamentos:
            data_val: date = a["data"]
            evento = a["evento"]
            fp = f"{data_val.isoformat()}|{evento[:100]}"
            if fp in existing_fps:
                continue

            await conn.execute(
                '''INSERT INTO public."Andamento"
                   (id, "processoId", data, evento, descricao, fonte, critico, "createdAt")
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)''',
                str(uuid.uuid4()),
                processo_id,
                datetime.combine(data_val, datetime.min.time()).replace(tzinfo=timezone.utc),
                evento,
                a.get("descricao_bruta", evento),
                a.get("fonte", "pje"),
                a.get("critico", False),
                datetime.now(timezone.utc),
            )
            existing_fps.add(fp)
            inserted += 1

        if inserted > 0:
            await conn.execute(
                'UPDATE public."Processo" SET "ultimoAndamento" = $1, "updatedAt" = $2 WHERE id = $3',
                datetime.now(timezone.utc),
                datetime.now(timezone.utc),
                processo_id,
            )

        return inserted


async def update_processo_fonte_status(
    pool: asyncpg.Pool,
    processo_cnj: str,
    fonte: str,
    tribunal: Optional[str],
    status: str,  # ok, failed, auth_error, stale
    erro: Optional[str] = None,
) -> None:
    async with pool.acquire() as conn:
        processo_id = await conn.fetchval(
            'SELECT id FROM public."Processo" WHERE cnj = $1',
            processo_cnj,
        )
        if not processo_id:
            return

        await conn.execute(
            '''INSERT INTO public."ProcessoFonte"
               (id, "processoId", fonte, tribunal, "ultimaSync", "statusSync", "erroUltimaSync", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT ("processoId", fonte, tribunal)
               DO UPDATE SET
                 "ultimaSync" = EXCLUDED."ultimaSync",
                 "statusSync" = EXCLUDED."statusSync",
                 "erroUltimaSync" = EXCLUDED."erroUltimaSync",
                 "updatedAt" = EXCLUDED."updatedAt"''',
            str(uuid.uuid4()),
            processo_id,
            fonte,
            tribunal,
            datetime.now(timezone.utc),
            status,
            erro,
            datetime.now(timezone.utc),
            datetime.now(timezone.utc),
        )
