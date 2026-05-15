"""Parser genérico 100% síncrono para HTML do PJe (CNJ).

Funciona para: TJMT, TRF1, TRF2, TRF3, TRF5, TRT*, TST, etc.
NÃO faz requests HTTP.
"""

import hashlib
import re
from datetime import datetime

from app.core.errors import ParseError
from app.models.schemas import TribunalMovement, TribunalProcess


def detect_pje_captcha_or_block(html: str) -> bool:
    markers = [
        "captcha", "recaptcha", "acesso negado", "acesso restrito",
        "bloqueio", "muitas requisições", "too many requests",
        "cloudflare", "access denied", "sessão expirada", "session expired",
    ]
    lower = html.lower()
    return any(marker in lower for marker in markers)


def detect_pje_error_page(html: str) -> str | None:
    lower = html.lower()
    if "não encontrado" in lower or "processo não localizado" in lower:
        return "not_found"
    if "processo inexistente" in lower or "não existe processo" in lower:
        return "not_found"
    if "erro no sistema" in lower or "erro interno" in lower:
        return "system_error"
    return None


def _extract_field_flexible(html: str, label: str) -> str | None:
    match = re.search(
        rf"{re.escape(label)}[:\s]*</(?:th|td|dt|dd|label|span)[^>]*>\s*<(?:td|dd|span|div)[^>]*>([^<]+)",
        html, re.IGNORECASE | re.DOTALL,
    )
    if match:
        return match.group(1).strip()
    match = re.search(
        rf">{re.escape(label)}[:\s]*</[^>]+>\s*<[^>]+>([^<]+)",
        html, re.IGNORECASE | re.DOTALL,
    )
    if match:
        return match.group(1).strip()
    match = re.search(
        rf"{re.escape(label)}[:\s]*([^<\n]+?)(?:<|\n|$)",
        html, re.IGNORECASE | re.DOTALL,
    )
    if match:
        val = match.group(1).strip()
        if val and not val.lower().startswith("class="):
            return val
    return None


def _parse_date_br(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip()
    for fmt in ("%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def _parse_money(value: str | None) -> float | None:
    if not value:
        return None
    cleaned = re.sub(r"[^\d,\.]", "", value.strip())
    if "," in cleaned and "." in cleaned:
        if cleaned.rfind(",") > cleaned.rfind("."):
            cleaned = cleaned.replace(".", "").replace(",", ".")
        else:
            cleaned = cleaned.replace(",", "")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_pje_process_page(html: str, tribunal: str = "pje") -> TribunalProcess:
    if detect_pje_captcha_or_block(html):
        raise ParseError("Captcha ou bloqueio detectado", details={"error_code": "CAPTCHA_OR_BLOCK"})
    err = detect_pje_error_page(html)
    if err == "not_found":
        raise ParseError("Processo não encontrado", details={"error_code": "NOT_FOUND"})
    if err:
        raise ParseError("Erro no sistema", details={"error_code": "TRIBUNAL_ERROR"})

    numero_cnj = (
        _extract_field_flexible(html, "Número do Processo")
        or _extract_field_flexible(html, "Processo")
    )
    if not numero_cnj:
        raise ParseError("Número do processo não encontrado", details={"error_code": "PARSE_ERROR"})

    return TribunalProcess(
        numero_cnj=numero_cnj,
        tribunal=tribunal,
        sistema="pje",
        classe=_extract_field_flexible(html, "Classe") or _extract_field_flexible(html, "Classe Processual"),
        assunto=_extract_field_flexible(html, "Assunto") or _extract_field_flexible(html, "Assunto Principal"),
        data_distribuicao=_parse_date_br(
            _extract_field_flexible(html, "Data de Distribuição")
            or _extract_field_flexible(html, "Distribuição")
            or _extract_field_flexible(html, "Data de Autuação")
        ),
        orgao_julgador=_extract_field_flexible(html, "Órgão Julgador") or _extract_field_flexible(html, "Relator"),
        vara=_extract_field_flexible(html, "Vara") or _extract_field_flexible(html, "Juízo"),
        comarca=_extract_field_flexible(html, "Comarca") or _extract_field_flexible(html, "Seção Judiciária") or _extract_field_flexible(html, "UF"),
        status_raw=_extract_field_flexible(html, "Situação") or _extract_field_flexible(html, "Status"),
        valor_causa=_parse_money(
            _extract_field_flexible(html, "Valor da Causa") or _extract_field_flexible(html, "Valor")
        ),
        raw={"html_snippet": html[:2000]},
    )


def parse_pje_movements(html: str) -> list[TribunalMovement]:
    movements: list[TribunalMovement] = []
    seen: set[str] = set()

    # Padrão PJe: tabela com data + descrição
    pattern = re.compile(
        r"<tr[^>]*>\s*<td[^>]*>(\d{2}/\d{2}/\d{4})</td>\s*<td[^>]*>(.*?)</td>",
        re.IGNORECASE | re.DOTALL,
    )
    for match in pattern.finditer(html):
        data_str = match.group(1)
        desc = re.sub(r"<[^>]+>", "", match.group(2)).strip()
        if not desc:
            continue
        dt = _parse_date_br(data_str)
        mov_hash = hashlib.sha256(f"{dt or data_str}:{desc}".encode()).hexdigest()[:16]
        if mov_hash in seen:
            continue
        seen.add(mov_hash)
        movements.append(
            TribunalMovement(
                data=dt,
                descricao_original=desc,
                tipo_evento=_normalize_movement_type(desc),
                hash=mov_hash,
            )
        )

    return movements


def _normalize_movement_type(desc: str) -> str:
    lower = desc.lower()
    if any(k in lower for k in ("sentença", "decisão", "deferimento", "indeferimento", "julgamento")):
        return "sentenca"
    if any(k in lower for k in ("intimação", "notificação", "citação", "penhora", "bloqueio")):
        return "intimacao"
    if any(k in lower for k in ("audiência", "sessão", "julgamento")):
        return "audiencia"
    if any(k in lower for k in ("arquivamento", "baixa", "remessa")):
        return "arquivamento"
    if any(k in lower for k in ("transito em julgado", "trânsito", "julgado")):
        return "transito_julgado"
    if any(k in lower for k in ("distribuição", "autuação", "recebimento")):
        return "distribuicao"
    if any(k in lower for k in ("conclusos", "conclusão", "decisão")):
        return "conclusao"
    return "outro"
