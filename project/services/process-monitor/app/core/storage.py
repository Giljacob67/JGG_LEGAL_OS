"""Abstração de storage para documentos e snapshots.

Nesta fase: interface mínima com stub em disco.
Futuramente: MinIO/S3.
"""

import hashlib
from pathlib import Path
from typing import Any

from app.logging_config import get_logger

logger = get_logger("core.storage")

STORAGE_ROOT = Path("/tmp/process-monitor-storage")


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


async def store_document(
    tribunal: str,
    numero_cnj: str,
    content: bytes,
    filename: str,
    metadata: dict[str, Any] | None = None,
) -> str:
    """Armazena documento localmente. Retorna storage_key."""
    _ensure_dir(STORAGE_ROOT / tribunal)
    key_hash = hashlib.sha256(f"{numero_cnj}:{filename}".encode()).hexdigest()[:16]
    storage_key = f"{tribunal}/{numero_cnj}_{key_hash}_{filename}"
    path = STORAGE_ROOT / storage_key
    path.write_bytes(content)
    logger.info(
        "document_stored",
        extra={
            "tribunal": tribunal,
            "numero_cnj": numero_cnj,
            "storage_key": storage_key,
            "size_bytes": len(content),
        },
    )
    return storage_key


async def store_snapshot(
    tribunal: str,
    numero_cnj: str,
    payload: dict[str, Any],
) -> str:
    """Armazena snapshot JSON. Retorna storage_key."""
    _ensure_dir(STORAGE_ROOT / "snapshots" / tribunal)
    import json

    content = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
    key_hash = hashlib.sha256(content).hexdigest()[:16]
    storage_key = f"snapshots/{tribunal}/{numero_cnj}_{key_hash}.json"
    path = STORAGE_ROOT / storage_key
    path.write_bytes(content)
    return storage_key
