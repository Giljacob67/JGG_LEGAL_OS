"""Endpoints para gerenciamento de credenciais de tribunal."""

from typing import Any

from fastapi import APIRouter

from app.persistence.db import get_session
from app.persistence.models import TribunalCredential

router = APIRouter(tags=["credentials"])


@router.get("/credentials")
async def list_credentials() -> dict[str, Any]:
    """Lista todas as credenciais configuradas (sem dados sensíveis)."""
    with get_session() as session:
        creds = session.query(TribunalCredential).all()
        return {
            "ok": True,
            "data": [
                {
                    "id": str(c.id),
                    "tribunal": c.tribunal,
                    "sistema": c.sistema,
                    "descricao": c.descricao,
                    "tipo_auth": c.tipo_auth,
                    "ativo": c.ativo,
                    "ultimo_teste": c.ultimo_teste.isoformat() if c.ultimo_teste else None,
                    "status_teste": c.status_teste,
                    "created_at": c.created_at.isoformat(),
                    "updated_at": c.updated_at.isoformat(),
                }
                for c in creds
            ],
        }


@router.get("/credentials/{tribunal}")
async def get_credential(tribunal: str) -> dict[str, Any]:
    """Busca credencial ativa para um tribunal específico."""
    with get_session() as session:
        cred = (
            session.query(TribunalCredential)
            .where(TribunalCredential.tribunal == tribunal)
            .where(TribunalCredential.ativo.is_(True))
            .first()
        )
        if not cred:
            return {"ok": False, "error_code": "NOT_FOUND", "error_message": "Nenhuma credencial encontrada"}
        return {
            "ok": True,
            "data": {
                "id": str(cred.id),
                "tribunal": cred.tribunal,
                "sistema": cred.sistema,
                "tipo_auth": cred.tipo_auth,
                # encrypted_credential NAO eh retornado aqui por seguranca
            },
        }
