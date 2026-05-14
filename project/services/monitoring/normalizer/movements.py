"""
Classifica eventos brutos de andamento em tipos normalizados.
Regras em REGRAS_PADRAO são avaliadas em ordem de prioridade (primeiro match vence).
"""
import re
from dataclasses import dataclass
from typing import Optional

from connectors.base import AndamentoCapturado


@dataclass
class ClassificacaoEvento:
    tipo: str
    status_processo: Optional[str]
    critico: bool


# (pattern regex, tipo_evento, novo_status_processo, critico)
REGRAS_PADRAO: list[tuple[str, str, Optional[str], bool]] = [
    (r"trânsito em julgado|transitou em julgado|certidão de trânsito",
     "transito_julgado", "encerrado", True),
    (r"sentença",                              "sentenca",                "sentenca",     True),
    (r"acórdão|acordao",                       "acordao",                 None,           True),
    (r"decisão interlocut|decisao interlocut", "decisao_interlocutoria",  None,           False),
    (r"\bdecisão\b|\bdecisao\b",               "decisao",                 None,           False),
    (r"despacho",                              "despacho",                None,           False),
    (r"audiência|audiencia",                   "audiencia",               None,           True),
    (r"citação|citacao",                       "citacao",                 None,           False),
    (r"intimação|intimacao",                   "intimacao",               None,           False),
    (r"juntada|petição|peticao",               "peticao",                 None,           False),
    (r"arquivamento|baixa definitiva|arquivado", "arquivamento",          "arquivado",    True),
    (r"suspensão|suspensao|processo suspenso", "suspensao",               "suspenso",     True),
    (r"distribuição|distribuicao",             "distribuicao",            None,           False),
    (r"recurso|apelação|apelacao",             "recurso",                 None,           False),
    (r"penhora|bloqueio bacen|renajud|sisbajud", "constricao",            None,           True),
    (r"tutela|liminar|antecipação de tutela",  "tutela",                  None,           True),
    (r"embargos",                              "embargos",                None,           False),
    (r"agravo",                                "agravo",                  None,           False),
    (r"laudo|perícia|pericia",                 "pericia",                 None,           False),
    (r"conciliação|conciliacao|acordo",        "conciliacao",             None,           True),
    (r"extinção|extincao",                     "extincao",                "encerrado",    True),
]


def classificar_evento(texto: str) -> ClassificacaoEvento:
    t = texto.lower()
    for pattern, tipo, status, critico in REGRAS_PADRAO:
        if re.search(pattern, t, re.IGNORECASE):
            return ClassificacaoEvento(tipo=tipo, status_processo=status, critico=critico)
    return ClassificacaoEvento(tipo="outros", status_processo=None, critico=False)


def enriquecer_andamentos(andamentos: list[AndamentoCapturado]) -> list[AndamentoCapturado]:
    """Preenche tipo_normalizado e critico em cada andamento."""
    for a in andamentos:
        texto = f"{a.evento} {a.descricao_bruta}"
        cls = classificar_evento(texto)
        a.tipo_normalizado = cls.tipo
        a.critico = cls.critico
    return andamentos
