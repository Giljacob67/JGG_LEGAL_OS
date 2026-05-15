"""Schemas Pydantic do domínio de monitoramento processual."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TribunalProcess(BaseModel):
    numero_cnj: str
    tribunal: str
    sistema: str | None = None
    processo_id_tribunal: str | None = None
    classe: str | None = None
    assunto: str | None = None
    orgao_julgador: str | None = None
    comarca: str | None = None
    vara: str | None = None
    data_distribuicao: str | None = None
    valor_causa: float | None = None
    status_raw: str | None = None
    raw: dict[str, Any] = Field(default_factory=dict)


class TribunalMovement(BaseModel):
    external_id: str | None = None
    data: str | None = None
    descricao_original: str
    tipo_evento: str | None = None
    orgao_julgador: str | None = None
    raw: dict[str, Any] = Field(default_factory=dict)
    hash: str


class TribunalDocument(BaseModel):
    external_id: str | None = None
    nome: str
    tipo: str | None = None
    data: str | None = None
    mime_type: str | None = None
    tamanho: int | None = None
    url_origem: str | None = None
    raw: dict[str, Any] = Field(default_factory=dict)
    hash: str | None = None


class ConnectorResult(BaseModel):
    ok: bool
    tribunal: str
    source: str
    process: TribunalProcess | None = None
    movements: list[TribunalMovement] = Field(default_factory=list)
    documents: list[TribunalDocument] = Field(default_factory=list)
    error_code: str | None = None
    error_message: str | None = None
    raw: dict[str, Any] | None = None


class ConnectorHealth(BaseModel):
    tribunal: str
    connector: str
    status: str
    last_success_at: str | None = None
    last_error_at: str | None = None
    last_error_code: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)


class MonitoramentoPayload(BaseModel):
    numero_cnj: str = Field(..., min_length=20, max_length=25)
    tribunal: str
    jgg_processo_id: str | None = None
    prioridade: str = "normal"
    preferred_connector: str | None = None


class SincronizarPayload(BaseModel):
    force: bool = False
    capturar_documentos: bool = False


class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str


class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ConnectorInfo(BaseModel):
    id: str
    tribunais: list[str]
    supports: dict[str, Any] = Field(default_factory=dict)


class ProcessoStatusResponse(BaseModel):
    monitoring_process_id: str
    numero_cnj: str
    status_monitoramento: str
    fontes: list[dict[str, Any]] = Field(default_factory=list)
