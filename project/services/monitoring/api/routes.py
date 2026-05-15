import asyncio
import logging
import time
from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader
from fastapi.responses import RedirectResponse

from config import settings
from db.repositories import capture as capture_repo
from db.repositories import documento as doc_repo
from db.repositories import processo as processo_repo
from scheduler.jobs import _capturar_processo, health_check_tribunais
from scheduler.registry import listar_tribunais_ativos
from api.schemas import (
    ConfigRequest,
    ConfigResponse,
    DocumentosListResponse,
    HealthResponse,
    MetricsResponse,
    SyncRequest,
    SyncResponse,
    SyncResultItem,
    SyncStatusResponse,
    SyncStatusTribunal,
    TribunalCreate,
    TribunalResponse,
    TribunalCredencialRequest,
    TribunalCredencialResponse,
    TribunalMetrica,
)

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

@router.get("/health", response_model=HealthResponse)
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

@router.post("/sync/{cnj:path}", dependencies=[Depends(verify_api_key)], response_model=SyncResponse)
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

    resultados: list[SyncResultItem] = []
    for tid in tribunal_ids:
        t0 = time.monotonic()
        resultado = await _capturar_processo(pool, cnj, tid)
        resultados.append(SyncResultItem(
            tribunal_id=tid,
            sucesso=resultado.sucesso,
            andamentos_novos=len(resultado.andamentos) if resultado.sucesso else 0,
            documentos_novos=len(resultado.documentos) if resultado.sucesso else 0,
            captcha=resultado.captcha_detectado,
            erro=resultado.erro,
            duracao_ms=int((time.monotonic() - t0) * 1000),
        ))

    return {"cnj": cnj, "resultados": resultados}


@router.get("/sync/status/{cnj:path}", dependencies=[Depends(verify_api_key)], response_model=SyncStatusResponse)
async def status_sync(cnj: str, pool: asyncpg.Pool = Depends(get_pool)):
    processo = await processo_repo.buscar_processo_por_cnj(pool, cnj)
    if not processo:
        raise HTTPException(status_code=404, detail=f"Processo {cnj} não encontrado")

    execucoes = await capture_repo.buscar_ultimo_status(pool, cnj)
    tribunais: dict[str, SyncStatusTribunal] = {}
    for e in execucoes:
        tribunais[e["tribunal_id"]] = SyncStatusTribunal(
            status=e["status"],
            andamentos_novos=e["andamentos_novos"],
            documentos_novos=e["documentos_novos"],
            duracao_ms=e["duracao_ms"],
            ultimo_check=e["iniciado_em"].isoformat() if e["iniciado_em"] else None,
        )

    return {"cnj": cnj, "tribunais": tribunais}


# ------------------------------------------------------------------ #
# Config                                                              #
# ------------------------------------------------------------------ #

@router.post("/config/{cnj:path}", dependencies=[Depends(verify_api_key)], response_model=ConfigResponse)
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

@router.get("/documentos/{cnj:path}", dependencies=[Depends(verify_api_key)], response_model=DocumentosListResponse)
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

@router.get("/metrics", dependencies=[Depends(verify_api_key)], response_model=MetricsResponse)
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
    return {
        "periodo": "24h",
        "tribunais": [
            TribunalMetrica(
                tribunal_id=r["tribunal_id"],
                total_ok=r["total_ok"],
                total_falha=r["total_falha"],
                total_captcha=r["total_captcha"],
                total_indisponivel=r["total_indisponivel"],
                avg_duracao_ms=float(r["avg_duracao_ms"]) if r["avg_duracao_ms"] else None,
                ultimo_run=r["ultimo_run"],
            )
            for r in rows
        ],
    }


# ------------------------------------------------------------------ #
# Admin — Tribunais                                                   #
# ------------------------------------------------------------------ #

@router.get("/admin/tribunais", dependencies=[Depends(verify_api_key)], response_model=list[TribunalResponse])
async def listar_tribunais(pool: asyncpg.Pool = Depends(get_pool)):
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, tribunal_id, nome, sistema, base_url, ativo, updated_at FROM monitoring.tribunal ORDER BY nome"
        )
    return [dict(r) for r in rows]


@router.post("/admin/tribunais", dependencies=[Depends(verify_api_key)], response_model=TribunalResponse, status_code=201)
async def criar_tribunal(body: TribunalCreate, pool: asyncpg.Pool = Depends(get_pool)):
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """INSERT INTO monitoring.tribunal (tribunal_id, nome, sistema, base_url, ativo, updated_at)
                   VALUES ($1, $2, $3, $4, $5, NOW())
                   RETURNING id, tribunal_id, nome, sistema, base_url, ativo, updated_at""",
                body.tribunal_id, body.nome, body.sistema, body.base_url, body.ativo,
            )
            return dict(row)
        except asyncpg.UniqueViolationError:
            raise HTTPException(status_code=409, detail=f"Tribunal {body.tribunal_id} já existe")


@router.get("/admin/tribunais/{tribunal_id}/credencial", dependencies=[Depends(verify_api_key)], response_model=TribunalCredencialResponse)
async def obter_credencial(tribunal_id: str, pool: asyncpg.Pool = Depends(get_pool)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT id, tribunal_id, sistema, login, oab_uf, oab_numero, ativo, updated_at
               FROM monitoring.tribunal_credencial WHERE tribunal_id = $1""",
            tribunal_id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="Credencial não encontrada")
    return dict(row)


@router.post("/admin/tribunais/{tribunal_id}/credencial", dependencies=[Depends(verify_api_key)], response_model=TribunalCredencialResponse)
async def salvar_credencial(
    tribunal_id: str,
    body: TribunalCredencialRequest,
    pool: asyncpg.Pool = Depends(get_pool),
):
    from cryptography.fernet import Fernet

    fernet = Fernet(settings.encryption_key.encode())
    senha_enc = fernet.encrypt(body.senha.encode()).decode() if body.senha else None

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO monitoring.tribunal_credencial
               (tribunal_id, sistema, login, senha_enc, oab_uf, oab_numero, ativo, obs, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
               ON CONFLICT (tribunal_id) DO UPDATE SET
                 login = EXCLUDED.login,
                 senha_enc = COALESCE(EXCLUDED.senha_enc, monitoring.tribunal_credencial.senha_enc),
                 oab_uf = EXCLUDED.oab_uf,
                 oab_numero = EXCLUDED.oab_numero,
                 ativo = EXCLUDED.ativo,
                 obs = EXCLUDED.obs,
                 updated_at = NOW()
               RETURNING id, tribunal_id, sistema, login, oab_uf, oab_numero, ativo, updated_at""",
            tribunal_id,
            "pje",  # sistema padrão — ajustar conforme tribunal
            body.login,
            senha_enc,
            body.oab_uf,
            body.oab_numero,
            body.ativo,
            body.obs,
        )
    return dict(row)
