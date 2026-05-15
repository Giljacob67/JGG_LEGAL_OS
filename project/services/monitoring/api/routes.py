import asyncio
import logging
import time
from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from config import settings
from db.repositories import capture as capture_repo
from db.repositories import documento as doc_repo
from db.repositories import processo as processo_repo
from scheduler.jobs import _capturar_processo, health_check_tribunais
from scheduler.registry import listar_tribunais_ativos

logger = logging.getLogger(__name__)
router = APIRouter()

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(x_api_key: Optional[str] = Security(api_key_header)) -> None:
    """Rejeita requisições sem X-API-Key válido."""
    if not x_api_key or x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key",
        )


def get_pool(request: Request) -> asyncpg.Pool:
    return request.app.state.pool


# ------------------------------------------------------------------ #
# Health                                                              #
# ------------------------------------------------------------------ #

@router.get("/health")
async def health():
    return {"status": "ok", "service": "jgg-monitoring"}


@router.get("/health/tribunais", dependencies=[Depends(verify_api_key)])
async def health_tribunais(pool: asyncpg.Pool = Depends(get_pool)):
    results = await health_check_tribunais(pool)
    status = "ok" if all(results.values()) else "degradado"
    return {"status": status, "tribunais": results}


# ------------------------------------------------------------------ #
# Sync                                                                #
# ------------------------------------------------------------------ #

class SyncRequest(BaseModel):
    tribunal_id: Optional[str] = None
    prioridade: str = "normal"  # normal | alta | urgente


@router.post("/sync/{cnj:path}", dependencies=[Depends(verify_api_key)])
async def sync_processo(
    cnj: str,
    body: SyncRequest = SyncRequest(),
    pool: asyncpg.Pool = Depends(get_pool),
):
    processo = await processo_repo.buscar_processo_por_cnj(pool, cnj)
    if not processo:
        raise HTTPException(status_code=404, detail=f"Processo {cnj} não encontrado")

    tribunal_ids: list[str]
    if body.tribunal_id:
        if body.tribunal_id not in listar_tribunais_ativos():
            raise HTTPException(status_code=422, detail=f"Tribunal não suportado: {body.tribunal_id}")
        tribunal_ids = [body.tribunal_id]
    else:
        from scheduler.jobs import _inferir_tribunais
        tribunal_ids = _inferir_tribunais(processo.get("tribunal"))
        if not tribunal_ids:
            tribunal_ids = listar_tribunais_ativos()

    resultados = []
    for tid in tribunal_ids:
        t0 = time.monotonic()
        resultado = await _capturar_processo(pool, cnj, tid)
        resultados.append({
            "tribunal_id": tid,
            "sucesso": resultado.sucesso,
            "andamentos_novos": len(resultado.andamentos) if resultado.sucesso else 0,
            "captcha": resultado.captcha_detectado,
            "erro": resultado.erro,
            "duracao_ms": int((time.monotonic() - t0) * 1000),
        })

    return {"cnj": cnj, "resultados": resultados}


@router.get("/sync/status/{cnj:path}", dependencies=[Depends(verify_api_key)])
async def status_sync(cnj: str, pool: asyncpg.Pool = Depends(get_pool)):
    processo = await processo_repo.buscar_processo_por_cnj(pool, cnj)
    if not processo:
        raise HTTPException(status_code=404, detail=f"Processo {cnj} não encontrado")

    execucoes = await capture_repo.buscar_ultimo_status(pool, cnj)
    tribunais: dict = {}
    for e in execucoes:
        tribunais[e["tribunal_id"]] = {
            "status": e["status"],
            "andamentos_novos": e["andamentos_novos"],
            "documentos_novos": e["documentos_novos"],
            "duracao_ms": e["duracao_ms"],
            "ultimo_check": e["iniciado_em"].isoformat() if e["iniciado_em"] else None,
        }

    return {"cnj": cnj, "tribunais": tribunais}


# ------------------------------------------------------------------ #
# Config                                                              #
# ------------------------------------------------------------------ #

class ConfigRequest(BaseModel):
    ativo: Optional[bool] = None
    frequencia: Optional[str] = None  # normal | rapida | lenta | pausa
    tribunal_ids: Optional[list[str]] = None


@router.post("/config/{cnj:path}", dependencies=[Depends(verify_api_key)])
async def atualizar_config(
    cnj: str,
    body: ConfigRequest,
    pool: asyncpg.Pool = Depends(get_pool),
):
    processo = await processo_repo.buscar_processo_por_cnj(pool, cnj)
    if not processo:
        raise HTTPException(status_code=404, detail=f"Processo {cnj} não encontrado")

    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO monitoring.processo_config
               (processo_cnj, ativo, frequencia, tribunal_ids, updated_at)
               VALUES ($1, COALESCE($2, TRUE), COALESCE($3, 'normal'), $4, NOW())
               ON CONFLICT (processo_cnj) DO UPDATE SET
                 ativo = COALESCE($2, monitoring.processo_config.ativo),
                 frequencia = COALESCE($3, monitoring.processo_config.frequencia),
                 tribunal_ids = COALESCE($4, monitoring.processo_config.tribunal_ids),
                 updated_at = NOW()""",
            cnj,
            body.ativo,
            body.frequencia,
            body.tribunal_ids,
        )

    return {"cnj": cnj, "atualizado": True}


# ------------------------------------------------------------------ #
# Documentos                                                          #
# ------------------------------------------------------------------ #

@router.get("/documentos/{cnj:path}", dependencies=[Depends(verify_api_key)])
async def listar_documentos(cnj: str, pool: asyncpg.Pool = Depends(get_pool)):
    docs = await doc_repo.listar_documentos_processo(pool, cnj)
    return {"cnj": cnj, "documentos": docs}


@router.get("/documentos/{cnj:path}/{doc_id}/download", dependencies=[Depends(verify_api_key)])
async def download_documento(cnj: str, doc_id: str, pool: asyncpg.Pool = Depends(get_pool)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT storage_url FROM monitoring.documento_capturado WHERE id = $1 AND processo_cnj = $2",
            doc_id, cnj,
        )
    if not row:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    return RedirectResponse(url=row["storage_url"])


# ------------------------------------------------------------------ #
# Métricas                                                            #
# ------------------------------------------------------------------ #

@router.get("/metrics", dependencies=[Depends(verify_api_key)])
async def metrics(pool: asyncpg.Pool = Depends(get_pool)):
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT
                 tribunal_id,
                 COUNT(*) FILTER (WHERE status = 'ok')            AS total_ok,
                 COUNT(*) FILTER (WHERE status = 'falha')         AS total_falha,
                 COUNT(*) FILTER (WHERE status = 'captcha')       AS total_captcha,
                 COUNT(*) FILTER (WHERE status = 'indisponivel')  AS total_indisponivel,
                 AVG(duracao_ms) FILTER (WHERE status = 'ok')     AS avg_duracao_ms,
                 MAX(iniciado_em)                                  AS ultimo_run
               FROM monitoring.captura_execucao
               WHERE iniciado_em > NOW() - INTERVAL '24 hours'
               GROUP BY tribunal_id""",
        )
    return {"periodo": "24h", "tribunais": [dict(r) for r in rows]}
