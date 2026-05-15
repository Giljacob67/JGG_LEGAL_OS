"""Parser isolado para HTML do TJPR (ProJUDI).

Não faz requests HTTP.
100% testável com fixtures.
"""

import hashlib
import re
from datetime import datetime
from typing import Any

from app.core.errors import ParseError
from app.logging_config import get_logger
from app.models.schemas import TribunalMovement, TribunalProcess

logger = get_logger("connectors.parsers.tjpr")

# Padrões de detecção de erro/captcha/bloqueio
_BLOCK_PATTERNS = [
    re.compile(r"captcha", re.IGNORECASE),
    re.compile(r"recaptcha", re.IGNORECASE),
    re.compile(r"verifica[çc][aã]o de seguran[çc]a", re.IGNORECASE),
    re.compile(r"acesso negado", re.IGNORECASE),
    re.compile(r"muitas requisi[çc][oõ]es", re.IGNORECASE),
    re.compile(r"bloqueado", re.IGNORECASE),
    re.compile(r"forbidden", re.IGNORECASE),
    re.compile(r"robot", re.IGNORECASE),
    re.compile(r"rob[ôo]", re.IGNORECASE),
]

_ERROR_PATTERNS = [
    re.compile(r"erro no sistema", re.IGNORECASE),
    re.compile(r"erro inesperado", re.IGNORECASE),
    re.compile(r"n[ãa]o encontrado", re.IGNORECASE),
    re.compile(r"processo n[ãa]o encontrado", re.IGNORECASE),
]


def detect_tjpr_captcha_or_block(html: str) -> bool:
    """Detecta se o HTML contém indicativo de captcha ou bloqueio."""
    return any(p.search(html) for p in _BLOCK_PATTERNS)


def detect_tjpr_error_page(html: str) -> str | None:
    """Detecta se o HTML é uma página de erro e retorna o tipo."""
    text = html.lower()
    if any(p.search(text) for p in _BLOCK_PATTERNS):
        return "captcha_or_block"
    if re.search(r"processo n[ãa]o encontrado", text):
        return "not_found"
    if re.search(r"erro (no sistema|inesperado)", text):
        return "system_error"
    return None


def _extract_field(html: str, patterns: list[str]) -> str | None:
    """Tenta extrair valor após padrões de label usando regex."""
    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
        if match:
            return match.group(1).strip()
    return None


def _extract_field_flexible(html: str, label: str) -> str | None:
    """Extrai valor após label, tolerando múltiplos formatos HTML.

    Padrões suportados:
    - <th>Label</th><td>Valor</td>
    - <dt>Label</dt><dd>Valor</dd>
    - <div><span>Label</span> Valor</div>
    - <p>Label: Valor</p>
    """
    # Padrão 1: th/td ou dt/dd
    match = re.search(
        rf"{re.escape(label)}[:\s]*</(?:th|dt)>\s*<(?:td|dd)[^>]*>([^<]+)",
        html, re.IGNORECASE | re.DOTALL,
    )
    if match:
        return match.group(1).strip()

    # Padrão 2: label dentro de tag, valor na próxima tag irmã
    match = re.search(
        rf">{re.escape(label)}[:\s]*</[^>]+>\s*<[^>]+>([^<]+)",
        html, re.IGNORECASE | re.DOTALL,
    )
    if match:
        return match.group(1).strip()

    # Padrão 3: label seguido de valor em tags separadas com possíveis atributos
    match = re.search(
        rf">{re.escape(label)}[:\s]*</\w+>\s*<\w+[^>]*>([^<]+)",
        html, re.IGNORECASE | re.DOTALL,
    )
    if match:
        return match.group(1).strip()

    # Padrão 4: label em texto puro seguido de valor
    match = re.search(
        rf"{re.escape(label)}[:\s]*([^<\n]+?)(?:<|\n|$)",
        html, re.IGNORECASE | re.DOTALL,
    )
    if match:
        return match.group(1).strip()

    return None


def _parse_date_br(date_str: str | None) -> str | None:
    """Converte data DD/MM/YYYY para ISO format."""
    if not date_str:
        return None
    try:
        dt = datetime.strptime(date_str.strip(), "%d/%m/%Y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        return None


def _parse_valor_causa(valor_str: str | None) -> float | None:
    """Converte valor monetário brasileiro para float."""
    if not valor_str:
        return None
    cleaned = valor_str.replace("R$", "").replace(".", "").replace(",", ".").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_tjpr_process_page(html: str) -> TribunalProcess:
    """Parseia página HTML de processo do TJPR.

    Aceita múltiplos formatos de layout (table, dl, divs).
    Levanta ParseError se campos obrigatórios não forem encontrados.
    """
    error = detect_tjpr_error_page(html)
    if error == "captcha_or_block":
        raise ParseError("Captcha ou bloqueio detectado na página do TJPR")
    if error == "not_found":
        raise ParseError("Processo não encontrado no TJPR", details={"error_code": "NOT_FOUND"})
    if error == "system_error":
        raise ParseError("Erro no sistema do TJPR", details={"error_code": "TRIBUNAL_ERROR"})

    # Extração flexível por label
    numero_cnj = _extract_field_flexible(html, "Número do processo") or _extract_field_flexible(html, "Processo")
    classe = _extract_field_flexible(html, "Classe")
    assunto = _extract_field_flexible(html, "Assunto")
    data_distribuicao = _extract_field_flexible(html, "Data de distribuição") or _extract_field_flexible(html, "Distribuição")
    orgao_julgador = _extract_field_flexible(html, "Órgão julgador")
    vara = _extract_field_flexible(html, "Vara")
    comarca = _extract_field_flexible(html, "Comarca")
    status_raw = _extract_field_flexible(html, "Situação")
    valor_causa_str = _extract_field_flexible(html, "Valor da causa") or _extract_field_flexible(html, "Valor")

    if not numero_cnj:
        raise ParseError(
            "Número do processo não encontrado no HTML do TJPR",
            details={"snippet": html[:500]},
        )

    return TribunalProcess(
        numero_cnj=numero_cnj.strip(),
        tribunal="tjpr",
        sistema="projudi",
        classe=classe,
        assunto=assunto,
        orgao_julgador=orgao_julgador,
        comarca=comarca,
        vara=vara,
        data_distribuicao=_parse_date_br(data_distribuicao),
        valor_causa=_parse_valor_causa(valor_causa_str),
        status_raw=status_raw,
        raw={"html_snippet": html[:2000]},
    )


def parse_tjpr_movements(html: str) -> list[TribunalMovement]:
    """Extrai movimentações do HTML do TJPR.

    Tenta múltiplos formatos de tabela e lista.
    """
    movements: list[TribunalMovement] = []

    # Padrão 1: tabela com colunas Data, Andamento, Tipo
    table_pattern = re.compile(
        r"<tr[^>]*>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>(?:\s*<td[^>]*>(.*?)</td>)?\s*</tr>",
        re.IGNORECASE | re.DOTALL,
    )

    # Buscar apenas dentro da seção de andamentos
    andamento_sections = re.findall(
        r"<div[^>]*class=[\"']andamentos[\"'][^>]*>(.*?)</div>",
        html, re.IGNORECASE | re.DOTALL,
    )
    if not andamento_sections:
        andamento_sections = re.findall(
            r"<section[^>]*class=[\"']historico[\"'][^>]*>(.*?)</section>",
            html, re.IGNORECASE | re.DOTALL,
        )

    search_html = andamento_sections[0] if andamento_sections else html

    # Limpar tags HTML para extração de texto
    def strip_tags(text: str) -> str:
        return re.sub(r"<[^>]+>", " ", text).strip()

    for match in table_pattern.finditer(search_html):
        data_raw = strip_tags(match.group(1))
        descricao = strip_tags(match.group(2))
        tipo = strip_tags(match.group(3)) if match.group(3) else None

        if not descricao or len(descricao) < 3:
            continue

        data_iso = _parse_date_br(data_raw)
        payload = f"{data_iso or ''}:{descricao}:{tipo or ''}"
        mov_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

        movements.append(
            TribunalMovement(
                external_id=None,
                data=data_iso,
                descricao_original=descricao,
                tipo_evento=tipo,
                orgao_julgador=None,
                raw={"data_raw": data_raw, "tipo_raw": tipo},
                hash=mov_hash,
            )
        )

    # Padrão 2: lista <ul><li><time>... — </time> descrição</li>
    li_pattern = re.compile(
        r"<li[^>]*>\s*(?:<time[^>]*>(.*?)</time>)?\s*(?:[—\-–])?\s*(.*?)\s*</li>",
        re.IGNORECASE | re.DOTALL,
    )
    for match in li_pattern.finditer(search_html):
        data_raw = strip_tags(match.group(1) or "")
        descricao = strip_tags(match.group(2))
        if not descricao or len(descricao) < 3:
            continue
        data_iso = _parse_date_br(data_raw)
        payload = f"{data_iso or ''}:{descricao}"
        mov_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        movements.append(
            TribunalMovement(
                external_id=None,
                data=data_iso,
                descricao_original=descricao,
                tipo_evento=None,
                orgao_julgador=None,
                raw={"data_raw": data_raw},
                hash=mov_hash,
            )
        )

    return movements
