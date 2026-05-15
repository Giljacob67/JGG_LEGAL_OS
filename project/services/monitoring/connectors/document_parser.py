"""
Extrator genérico de links de documentos judiciais a partir de HTML.
Cada tribunal expõe documentos de forma diferente; este módulo tenta
os padrões mais comuns e retorna metadados normalizados.
"""
from __future__ import annotations

import logging
import re
from datetime import date
from typing import Optional
from urllib.parse import urljoin, unquote

from bs4 import BeautifulSoup

from connectors.base import DocumentoCapturado

logger = logging.getLogger(__name__)

# Extensões de arquivo que consideramos "documentos"
_DOC_EXTENSIONS = re.compile(r"\.(pdf|docx?|txt|zip)$", re.IGNORECASE)

# Padrões de texto que indicam link para documento
_DOC_PATTERNS = [
    r"documento",
    r"visualizar",
    r"download",
    r"anexo",
    r"peti",
    r"despacho",
    r"decis",
    r"senten",
    r"acord",
    r"certid",
    r"laudo",
    r"procur",
    r"contrato",
    r"notifica",
    r"intima",
    r"cart",
    r"anexo",
    r"ato",
    r"termo",
    r"despacho",
]


def _looks_like_document(href: str, text: str, title: str = "") -> bool:
    """Heurística para decidir se um link aponta para um documento processual."""
    combined = f"{href} {text} {title}".lower()
    has_extension = bool(_DOC_EXTENSIONS.search(href))
    has_pattern = any(re.search(p, combined) for p in _DOC_PATTERNS)
    return has_extension or has_pattern


def _guess_type_from_text(text: str) -> str:
    t = text.lower()
    if "senten" in t:
        return "sentenca"
    if "acord" in t:
        return "acordao"
    if "decis" in t:
        return "decisao"
    if "despacho" in t:
        return "despacho"
    if "certid" in t:
        return "certidao"
    if "peti" in t:
        return "peticao"
    if "procur" in t:
        return "procuracao"
    if "contrato" in t:
        return "contrato"
    if "notifica" in t or "intima" in t:
        return "notificacao"
    if "laudo" in t or "peric" in t:
        return "laudo"
    if "embarg" in t:
        return "embargos"
    if "recurso" in t or "apela" in t:
        return "recurso"
    if "cart" in t:
        return "cart_precatoria"
    if _DOC_EXTENSIONS.search(text):
        return "pdf"
    return "outro"


def _parse_date_from_text(text: str) -> Optional[date]:
    """Tenta extrair data de strings como '12/05/2024' ou '2024-05-12'."""
    from datetime import datetime
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d/%m/%y"):
        for m in re.finditer(r"\b\d{2}/\d{2}/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{2}/\d{2}/\d{2}\b", text):
            try:
                return datetime.strptime(m.group(), fmt).date()
            except ValueError:
                continue
    return None


def extrair_documentos_do_html(
    html: str,
    base_url: str,
    tribunal_id: str,
    cnj: str,
) -> list[DocumentoCapturado]:
    """
    Extrai todos os links que parecem ser documentos processuais.
    Retorna lista de DocumentoCapturado com URL relativa resolvida.
    """
    soup = BeautifulSoup(html, "lxml")
    docs: list[DocumentoCapturado] = []
    seen_urls: set[str] = set()

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        text = a.get_text(strip=True) or ""
        title = a.get("title", "")

        if not _looks_like_document(href, text, title):
            continue

        # Resolve URL relativa
        full_url = urljoin(base_url, href)
        if full_url in seen_urls:
            continue
        seen_urls.add(full_url)

        # Gera ID estável a partir da URL (último segmento ou hash)
        id_tribunal = _extract_doc_id(href) or f"doc_{len(docs)+1}"

        doc = DocumentoCapturado(
            id_tribunal=id_tribunal,
            nome=text or title or f"Documento {len(docs)+1}",
            tipo_doc=_guess_type_from_text(text or title or href),
            data_doc=_parse_date_from_text(text or title),
            url_download=full_url,
            mime_type="application/pdf" if full_url.lower().endswith(".pdf") else "application/octet-stream",
        )
        docs.append(doc)

    logger.info("documentos_extraidos tribunal=%s cnj=%s docs=%d", tribunal_id, cnj, len(docs))
    return docs


def _extract_doc_id(href: str) -> Optional[str]:
    """Tenta extrair um ID do documento da própria URL."""
    # Padrões comuns: ?idDoc=123, /documento/123, /download/123.pdf
    for pattern in [
        r"[?&]idDoc[=:](\w+)",
        r"[?&]documento[=:](\w+)",
        r"[?&]id[=:](\w+)",
        r"/documento[s]?/(\w+)",
        r"/download[s]?/(\w+)",
        r"/arquivo[s]?/(\w+)",
    ]:
        m = re.search(pattern, href, re.IGNORECASE)
        if m:
            return m.group(1)
    # Fallback: último path segmento sem extensão
    parts = href.rstrip("/").split("/")
    if parts:
        last = unquote(parts[-1]).split("?")[0].split("#")[0]
        if last and len(last) > 3:
            return last[:100]
    return None
