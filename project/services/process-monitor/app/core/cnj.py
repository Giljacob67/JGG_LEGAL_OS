"""Utilitários para validação e normalização de números CNJ."""

import re

from app.core.errors import CNJInvalidoError


# Padrão CNJ com separadores: NNNNNNN-DD.AAAA.J.TR.OOOO
CNJ_MASKED_PATTERN = re.compile(
    r"^(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$"
)

# Apenas 20 dígitos
CNJ_DIGITS_PATTERN = re.compile(r"^\d{20}$")


def _digito_verificador_modulo97(numero: str) -> str:
    """Calcula dígitos verificadores do CNJ via módulo 97."""
    # NNNNNNN AAAA J TR OOOO -> NNNNNNN AAAA J TR OOOO -> DV sobre NNNNNNN+AAAA+J+TR+OOOO
    # Algoritmo: concatena tudo sem DV, aplica módulo 97
    base = numero[:7] + numero[9:13] + numero[14:15] + numero[16:18] + numero[19:23]
    resto = int(base) % 97
    dv = 98 - resto
    return f"{dv:02d}"


def normalizar(cnj: str) -> str:
    """Remove máscara e retorna apenas 20 dígitos. Valida formato."""
    cnj = cnj.strip()
    if CNJ_DIGITS_PATTERN.match(cnj):
        return cnj
    match = CNJ_MASKED_PATTERN.match(cnj)
    if not match:
        raise CNJInvalidoError(f"Formato de CNJ inválido: {cnj}")
    digits = "".join(match.groups())
    if len(digits) != 20:
        raise CNJInvalidoError(f"CNJ não possui 20 dígitos: {cnj}")
    return digits


def formatar(cnj_digits: str) -> str:
    """Formata 20 dígitos no padrão CNJ com máscara."""
    if len(cnj_digits) != 20:
        raise CNJInvalidoError("CNJ deve ter 20 dígitos para formatação")
    return (
        f"{cnj_digits[:7]}-{cnj_digits[7:9]}."
        f"{cnj_digits[9:13]}.{cnj_digits[13]}."
        f"{cnj_digits[14:16]}.{cnj_digits[16:20]}"
    )


def extrair_tribunal(cnj_digits: str) -> str:
    """Extrai código do tribunal a partir dos dígitos 14-15 (TR)."""
    if len(cnj_digits) != 20:
        raise CNJInvalidoError("CNJ deve ter 20 dígitos")
    return cnj_digits[14:16]


def validar(cnj: str) -> bool:
    """Valida formato básico (não verifica DV)."""
    try:
        normalizar(cnj)
        return True
    except CNJInvalidoError:
        return False
