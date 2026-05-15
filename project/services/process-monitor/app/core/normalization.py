"""Normalização heurística de movimentações processuais.

Esta normalização é inicial e deve evoluir para mapeamento configurável
por tribunal/código CNJ no futuro.
"""

import hashlib
import re
from typing import Any


def normalize_movement_type(descricao_original: str, codigo_movimento: str | None = None) -> str:
    """Infere tipo de evento a partir da descrição original.

    Retorna um dos tipos padronizados:
    - distribuicao
    - decisao
    - despacho
    - sentenca
    - acordao
    - intimacao
    - audiencia
    - juntada
    - peticao
    - certidao
    - arquivamento
    - transito_julgado
    - outro
    """
    texto = descricao_original.lower()

    # Sentença
    if any(p in texto for p in ["sentença", "sentenca", "proferida senten", "julgada procedente", "julgada improcedente", "extinção do processo"]):
        return "sentenca"

    # Acórdão
    if any(p in texto for p in ["acórdão", "acordao", "publicação do acord", "embargos de declaração"]):
        return "acordao"

    # Decisão
    if any(p in texto for p in ["decisão", "decisao", "deferido", "indeferido", "concedida a tutela", "negada a tutela", "concedida a liminar", "negada a liminar", "antecipação de tutela"]):
        return "decisao"

    # Despacho
    if any(p in texto for p in ["despacho", "intimem-se", "determino", "designo", "vista ao mp"]):
        return "despacho"

    # Intimação
    if any(p in texto for p in ["intimação", "intimacao", "intimado", "notificação", "notificacao", "citado", "citacao", "citação"]):
        return "intimacao"

    # Audiência
    if any(p in texto for p in ["audiência", "audiencia", "realizada a audi", "designada a audi"]):
        return "audiencia"

    # Juntada
    if any(p in texto for p in ["juntada", "juntado", "anexado", "apensado"]):
        return "juntada"

    # Petição
    if any(p in texto for p in ["petição", "peticao", "requerimento", "pedido", "inicial"]):
        return "peticao"

    # Certidão
    if any(p in texto for p in ["certidão", "certidao", "certificado"]):
        return "certidao"

    # Arquivamento
    if any(p in texto for p in ["arquivado", "arquivamento", "baixado", "baixa definitiva"]):
        return "arquivamento"

    # Trânsito em julgado
    if any(p in texto for p in ["trânsito em julgado", "transito em julgado", "transitado em julgado", "coisa julgada"]):
        return "transito_julgado"

    # Distribuição
    if any(p in texto for p in ["distribuído", "distribuido", "distribuição", "distribuicao", "autuado", "recebido na secretaria"]):
        return "distribuicao"

    return "outro"


def infer_process_status_from_movement(descricao_original: str) -> str:
    """Infere status do processo a partir de uma movimentação.

    Retorna:
    - em_andamento
    - sentenca
    - recurso
    - arquivado
    - transito_julgado
    - suspenso
    - desconhecido
    """
    texto = descricao_original.lower()

    if any(p in texto for p in ["arquivado", "arquivamento", "baixa definitiva"]):
        return "arquivado"

    if any(p in texto for p in ["trânsito em julgado", "transito em julgado", "coisa julgada"]):
        return "transito_julgado"

    if any(p in texto for p in ["suspenso", "suspensão", "suspensao", "stay", "remetidos os autos"]):
        return "suspenso"

    if any(p in texto for p in ["sentença", "sentenca", "proferida senten"]):
        return "sentenca"

    if any(p in texto for p in ["acórdão", "acordao", "recurso", "apelacao", "agravo", "embargos", "remessa oficial"]):
        return "recurso"

    if any(p in texto for p in ["distribuído", "distribuido", "distribuição", "autuado", "recebido", "conclusos"]):
        return "em_andamento"

    return "desconhecido"


def build_movement_hash(numero_cnj: str, tribunal: str, data: str | None, descricao_original: str) -> str:
    """Gera hash determinística para deduplicação de movimentações."""
    payload = f"{numero_cnj}:{tribunal}:{data or ''}:{descricao_original.strip().lower()}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
