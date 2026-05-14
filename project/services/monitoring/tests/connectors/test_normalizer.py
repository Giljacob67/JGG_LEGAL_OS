"""Testa regras de normalização de andamentos."""
import pytest
from normalizer.movements import classificar_evento, enriquecer_andamentos
from connectors.base import AndamentoCapturado
from datetime import date


@pytest.mark.parametrize("texto,tipo_esperado,critico_esperado", [
    ("Sentença publicada", "sentenca", True),
    ("Despacho determinando citação", "despacho", False),
    ("Trânsito em julgado certificado", "transito_julgado", True),
    ("Juntada de petição inicial", "peticao", False),
    ("Bloqueio BACEN decretado", "constricao", True),
    ("Audiência de instrução designada", "audiencia", True),
    ("Extinção do feito sem resolução", "extincao", True),
    ("Informação genérica do cartório", "outros", False),
    ("Acórdão proferido pelo colegiado", "acordao", True),
])
def test_classificar_evento(texto, tipo_esperado, critico_esperado):
    cls = classificar_evento(texto)
    assert cls.tipo == tipo_esperado
    assert cls.critico == critico_esperado


def test_enriquecer_andamentos_preenche_tipo():
    andamentos = [
        AndamentoCapturado(date(2026, 1, 10), "Sentença", "Sentença condenatória"),
        AndamentoCapturado(date(2026, 1, 15), "Certidão", "Certidão de trânsito em julgado"),
    ]
    enriquecer_andamentos(andamentos)
    assert andamentos[0].tipo_normalizado == "sentenca"
    assert andamentos[0].critico is True
    assert andamentos[1].tipo_normalizado == "transito_julgado"
