"""
Schemas Pydantic para a API de monitoramento.
Geram documentação OpenAPI automática no Swagger UI (/docs).
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------- #
# Health                                                                      #
# --------------------------------------------------------------------------- #
class HealthResponse(BaseModel):
    status: str
    service: str


class TribunalHealthItem(BaseModel):
    status: str
    tribunais: dict[str, bool]


# --------------------------------------------------------------------------- #
# Sync                                                                        #
# --------------------------------------------------------------------------- #
class SyncRequest(BaseModel):
    tribunal_id: Optional[str] = Field(None, description="ID do tribunal (ex: tjpr). Se omitido, infere do processo.")
    prioridade: str = Field("normal", pattern=r"^(normal|alta|urgente)$")


class SyncResultItem(BaseModel):
    tribunal_id: str
    sucesso: bool
    andamentos_novos: int
    documentos_novos: int
    captcha: bool
    erro: Optional[str]
    duracao_ms: int


class SyncResponse(BaseModel):
    cnj: str
    resultados: list[SyncResultItem]


class SyncStatusTribunal(BaseModel):
    status: str
    andamentos_novos: int
    documentos_novos: int
    duracao_ms: Optional[int]
    ultimo_check: Optional[str]


class SyncStatusResponse(BaseModel):
    cnj: str
    tribunais: dict[str, SyncStatusTribunal]


# --------------------------------------------------------------------------- #
# Config                                                                      #
# --------------------------------------------------------------------------- #
class ConfigRequest(BaseModel):
    ativo: Optional[bool] = Field(None, description="Ativa/desativa monitoramento deste processo")
    frequencia: Optional[str] = Field(None, pattern=r"^(normal|rapida|lenta|pausa)$")
    tribunal_ids: Optional[list[str]] = Field(None, description="Lista de tribunais a consultar")


class ConfigResponse(BaseModel):
    cnj: str
    atualizado: bool


# --------------------------------------------------------------------------- #
# Documentos                                                                  #
# --------------------------------------------------------------------------- #
class DocumentoResponse(BaseModel):
    id: str
    tribunal_id: str
    nome: str
    tipo_doc: str
    data_doc: Optional[date]
    mime_type: str
    tamanho_bytes: Optional[int]
    storage_key: Optional[str]
    storage_url: Optional[str]
    created_at: datetime


class DocumentosListResponse(BaseModel):
    cnj: str
    documentos: list[DocumentoResponse]


# --------------------------------------------------------------------------- #
# Métricas                                                                    #
# --------------------------------------------------------------------------- #
class TribunalMetrica(BaseModel):
    tribunal_id: str
    total_ok: int
    total_falha: int
    total_captcha: int
    total_indisponivel: int
    avg_duracao_ms: Optional[float]
    ultimo_run: Optional[datetime]


class MetricsResponse(BaseModel):
    periodo: str
    tribunais: list[TribunalMetrica]


# --------------------------------------------------------------------------- #
# Tribunal (admin)                                                            #
# --------------------------------------------------------------------------- #
class TribunalCreate(BaseModel):
    tribunal_id: str = Field(..., min_length=3, max_length=20)
    nome: str = Field(..., min_length=3)
    sistema: str = Field(..., pattern=r"^(pje|eproc|esaj|projudi|outro)$")
    base_url: str = Field(..., min_length=10)
    ativo: bool = True


class TribunalResponse(BaseModel):
    id: str
    tribunal_id: str
    nome: str
    sistema: str
    base_url: str
    ativo: bool
    updated_at: datetime


class TribunalCredencialRequest(BaseModel):
    login: Optional[str] = None
    senha: Optional[str] = None
    oab_uf: Optional[str] = None
    oab_numero: Optional[str] = None
    ativo: bool = True
    obs: Optional[str] = None


class TribunalCredencialResponse(BaseModel):
    id: str
    tribunal_id: str
    sistema: str
    login: Optional[str]
    oab_uf: Optional[str]
    oab_numero: Optional[str]
    ativo: bool
    updated_at: datetime
