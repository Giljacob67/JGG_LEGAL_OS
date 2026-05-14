from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date
from typing import TYPE_CHECKING, Optional

import httpx

if TYPE_CHECKING:
    from session.manager import SessionManager


@dataclass
class AndamentoCapturado:
    data: date
    evento: str
    descricao_bruta: str
    orgao: Optional[str] = None
    tipo_normalizado: Optional[str] = None
    critico: bool = False


@dataclass
class DocumentoCapturado:
    id_tribunal: str
    nome: str
    tipo_doc: str
    data_doc: Optional[date] = None
    url_download: Optional[str] = None
    mime_type: str = "application/pdf"


@dataclass
class ResultadoCaptura:
    cnj: str
    tribunal_id: str
    sucesso: bool
    andamentos: list[AndamentoCapturado] = field(default_factory=list)
    documentos: list[DocumentoCapturado] = field(default_factory=list)
    payload_bruto: Optional[dict] = None
    erro: Optional[str] = None
    captcha_detectado: bool = False


class TribunalConnector(ABC):
    tribunal_id: str
    nome: str
    sistema: str  # pje, eproc, esaj, projudi
    base_url: str

    def __init__(self, session_manager: SessionManager):
        self._session = session_manager

    @abstractmethod
    async def buscar_processo(self, cnj: str) -> ResultadoCaptura: ...

    @abstractmethod
    async def buscar_andamentos(
        self, cnj: str, desde: Optional[date] = None
    ) -> list[AndamentoCapturado]: ...

    async def buscar_documentos(self, cnj: str) -> list[DocumentoCapturado]:
        return []

    async def baixar_documento(
        self, doc: DocumentoCapturado, client: httpx.AsyncClient
    ) -> Optional[bytes]:
        if not doc.url_download:
            return None
        r = await client.get(doc.url_download, timeout=60)
        r.raise_for_status()
        return r.content

    async def health_check(self) -> bool:
        try:
            client = await self._session.get_client()
            r = await client.get(self.base_url, timeout=10)
            return r.status_code < 500
        except Exception:
            return False
