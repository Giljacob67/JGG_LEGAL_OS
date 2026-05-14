"""Gerencia documentos capturados no schema monitoring."""
import asyncpg
from datetime import datetime, timezone
from typing import Optional
import uuid


async def salvar_documento(
    pool: asyncpg.Pool,
    processo_cnj: str,
    processo_id: Optional[str],
    tribunal_id: str,
    id_tribunal: str,
    nome: str,
    tipo_doc: str,
    storage_key: str,
    storage_url: str,
    hash_sha256: str,
    captura_id: Optional[str] = None,
    data_doc=None,
    mime_type: str = "application/pdf",
    tamanho_bytes: Optional[int] = None,
) -> Optional[str]:
    """Insere documento capturado. Retorna None se hash já existe (dedup)."""
    doc_id = str(uuid.uuid4())
    async with pool.acquire() as conn:
        try:
            await conn.execute(
                """INSERT INTO monitoring.documento_capturado
                   (id, processo_cnj, processo_id, tribunal_id, id_tribunal,
                    nome, tipo_doc, data_doc, mime_type, tamanho_bytes,
                    storage_key, storage_url, hash_sha256, captura_id, created_at)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)""",
                doc_id,
                processo_cnj,
                processo_id,
                tribunal_id,
                id_tribunal,
                nome,
                tipo_doc,
                data_doc,
                mime_type,
                tamanho_bytes,
                storage_key,
                storage_url,
                hash_sha256,
                captura_id,
                datetime.now(timezone.utc),
            )
            return doc_id
        except asyncpg.UniqueViolationError:
            return None


async def listar_documentos_processo(
    pool: asyncpg.Pool,
    processo_cnj: str,
) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT id, tribunal_id, nome, tipo_doc, data_doc,
                      mime_type, tamanho_bytes, storage_key, storage_url, created_at
               FROM monitoring.documento_capturado
               WHERE processo_cnj = $1 AND disponivel = TRUE
               ORDER BY data_doc DESC NULLS LAST, created_at DESC""",
            processo_cnj,
        )
        return [dict(r) for r in rows]
