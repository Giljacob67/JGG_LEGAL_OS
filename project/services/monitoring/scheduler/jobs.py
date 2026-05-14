"""
Jobs APScheduler.
Cada job busca processos do banco, dispara capturas e grava resultados.
"""
import asyncio
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

import asyncpg

from connectors.base import ResultadoCaptura
from db.repositories import andamento as andamento_repo
from db.repositories import capture as capture_repo
from db.repositories import processo as processo_repo
from normalizer.movements import enriquecer_andamentos
from redis_pub import publicar_andamentos_novos
from scheduler.registry import get_connector, health_check_todos
from session.manager import get_semaphore

logger = logging.getLogger(__name__)

# Status PJe que mapeiam para frequência de captura
FREQ_POR_STATUS = {
    "em_andamento": timedelta(minutes=30),
    "suspenso":     timedelta(hours=4),
    "arquivado":    timedelta(hours=24),
    "encerrado":    timedelta(days=7),
}

FREQ_OVERRIDE = {
    "rapida": timedelta(minutes=5),
    "normal": timedelta(minutes=30),
    "lenta":  timedelta(hours=24),
    "pausa":  None,
}


def _proximo_check(status: str, frequencia: str) -> datetime:
    override = FREQ_OVERRIDE.get(frequencia)
    if override is not None:
        return datetime.now(timezone.utc) + override
    delta = FREQ_POR_STATUS.get(status, timedelta(minutes=30))
    return datetime.now(timezone.utc) + delta


async def _capturar_processo(
    pool: asyncpg.Pool,
    cnj: str,
    tribunal_id: str,
    tentativa: int = 1,
) -> ResultadoCaptura:
    exec_id = await capture_repo.criar_execucao(pool, cnj, tribunal_id, tentativa)
    t0 = time.monotonic()

    connector = get_connector(tribunal_id)
    sem = get_semaphore(tribunal_id)

    async with sem:
        resultado = await connector.buscar_processo(cnj)

    duracao_ms = int((time.monotonic() - t0) * 1000)

    if resultado.sucesso and resultado.andamentos:
        enriquecer_andamentos(resultado.andamentos)
        andamentos_dict = [
            {
                "data": a.data,
                "evento": a.evento,
                "descricao_bruta": a.descricao_bruta,
                "fonte": tribunal_id,
                "critico": a.critico,
            }
            for a in resultado.andamentos
        ]
        novos = await andamento_repo.upsert_andamentos(pool, cnj, andamentos_dict)
        if novos > 0:
            criticos = [
                {"data": a["data"].isoformat(), "evento": a["evento"]}
                for a in andamentos_dict if a.get("critico")
            ]
            await publicar_andamentos_novos(cnj, tribunal_id, novos, criticos)
    else:
        novos = 0

    status_exec = "ok" if resultado.sucesso else (
        "captcha" if resultado.captcha_detectado else "falha"
    )

    await capture_repo.finalizar_execucao(
        pool, exec_id,
        status=status_exec,
        andamentos_novos=novos,
        erro=resultado.erro,
        duracao_ms=duracao_ms,
    )

    fonte = resultado.tribunal_id
    await andamento_repo.update_processo_fonte_status(
        pool, cnj, fonte, tribunal_id,
        status="ok" if resultado.sucesso else "failed",
        erro=resultado.erro,
    )

    logger.info(
        "captura_concluida tribunal=%s cnj=%s status=%s andamentos_novos=%d duracao_ms=%d",
        tribunal_id, cnj, status_exec, novos, duracao_ms,
    )

    return resultado


async def sync_processos_ativos(pool: asyncpg.Pool) -> None:
    """Job principal: captura andamentos de processos em_andamento."""
    processos = await processo_repo.listar_processos_para_captura(
        pool,
        status_processos=["em_andamento", "suspenso"],
        limite=50,
    )

    logger.info("sync_ativos processos_para_captura=%d", len(processos))

    tasks = []
    for p in processos:
        tribunal_ids = p["tribunal_ids"] or _inferir_tribunais(p["tribunal"])
        for tid in tribunal_ids:
            tasks.append(_capturar_processo(pool, p["cnj"], tid))

        # Agenda próximo check
        proximo = _proximo_check(p["status"], p["frequencia"])
        await processo_repo.atualizar_proximo_check(pool, p["cnj"], proximo.isoformat())

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


async def sync_processos_arquivados(pool: asyncpg.Pool) -> None:
    processos = await processo_repo.listar_processos_para_captura(
        pool,
        status_processos=["arquivado", "encerrado"],
        limite=100,
    )
    logger.info("sync_arquivados processos_para_captura=%d", len(processos))

    for p in processos:
        tribunal_ids = p["tribunal_ids"] or _inferir_tribunais(p["tribunal"])
        for tid in tribunal_ids:
            await _capturar_processo(pool, p["cnj"], tid)
        proximo = _proximo_check(p["status"], p["frequencia"])
        await processo_repo.atualizar_proximo_check(pool, p["cnj"], proximo.isoformat())


async def retry_capturas_falhas(pool: asyncpg.Pool) -> None:
    """Reprocessa capturas que falharam nas últimas 24h (máx 3 tentativas)."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT DISTINCT processo_cnj, tribunal_id, COUNT(*) AS tentativas
               FROM monitoring.captura_execucao
               WHERE status IN ('falha') AND captcha_detectado = FALSE
                 AND iniciado_em > NOW() - INTERVAL '24 hours'
               GROUP BY processo_cnj, tribunal_id
               HAVING COUNT(*) < 3
               ORDER BY MAX(iniciado_em) ASC
               LIMIT 20""",
        )

    for r in rows:
        await _capturar_processo(
            pool, r["processo_cnj"], r["tribunal_id"],
            tentativa=int(r["tentativas"]) + 1,
        )


async def health_check_tribunais(pool: asyncpg.Pool) -> dict[str, bool]:
    results = await health_check_todos()
    logger.info("health_check %s", results)

    for tribunal_id, ok in results.items():
        if not ok:
            logger.warning("tribunal_indisponivel tribunal=%s", tribunal_id)

    return results


def _inferir_tribunais(tribunal_str: Optional[str]) -> list[str]:
    """Mapeia campo tribunal do Processo para IDs de conectores."""
    if not tribunal_str:
        return []
    t = tribunal_str.lower()
    if "tjpr" in t or "paraná" in t or "parana" in t:
        return ["tjpr"]
    if "tjmt" in t or "mato grosso" in t:
        return ["tjmt"]
    if "trf4" in t or "trf 4" in t or "4ª região" in t:
        return ["trf4"]
    if "trf1" in t or "trf 1" in t or "1ª região" in t:
        return ["trf1"]
    return []
