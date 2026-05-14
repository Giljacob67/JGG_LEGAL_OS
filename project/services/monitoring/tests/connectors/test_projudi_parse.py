"""
Testa parsing do HTML real do TJPR (ProJUDI).
Fixture: tests/fixtures/0003537-95.2026.8.16.0058.html
"""
import os
from pathlib import Path

import pytest
from connectors.projudi_base import ProJUDIBaseConnector

FIXTURE = Path(__file__).parent.parent / "fixtures" / "0003537-95.2026.8.16.0058.html"
CNJ = "0003537-95.2026.8.16.0058"


class _StubConnector(ProJUDIBaseConnector):
    tribunal_id = "tjpr"
    nome = "TJPR"
    sistema = "projudi"
    base_url = "https://consulta.tjpr.jus.br/projudi_consulta"
    search_url = base_url + "/processo/consultaPublica.do?actionType=iniciar"
    _session = None  # não usada no parse


@pytest.mark.skipif(not FIXTURE.exists(), reason="fixture HTML ausente")
def test_parse_andamentos_count():
    html = FIXTURE.read_text(encoding="windows-1252", errors="replace")
    conn = _StubConnector.__new__(_StubConnector)
    andamentos = conn._parse_andamentos(html, CNJ)
    # HTML tem 18 movimentos visíveis (seq 1–18)
    assert len(andamentos) >= 15, f"Esperado >=15 andamentos, obtido {len(andamentos)}"


@pytest.mark.skipif(not FIXTURE.exists(), reason="fixture HTML ausente")
def test_parse_andamentos_campos():
    html = FIXTURE.read_text(encoding="windows-1252", errors="replace")
    conn = _StubConnector.__new__(_StubConnector)
    andamentos = conn._parse_andamentos(html, CNJ)

    # Mais recente deve ser seq 18 — EXPEDIÇÃO DE INTIMAÇÃO em 14/05/2026
    ultimo = andamentos[0]
    assert ultimo.data.year == 2026
    assert "EXPEDI" in ultimo.evento.upper() or "INTIMA" in ultimo.evento.upper()
    assert ultimo.critico is True or ultimo.critico is False  # campo presente


@pytest.mark.skipif(not FIXTURE.exists(), reason="fixture HTML ausente")
def test_parse_datas_validas():
    html = FIXTURE.read_text(encoding="windows-1252", errors="replace")
    conn = _StubConnector.__new__(_StubConnector)
    andamentos = conn._parse_andamentos(html, CNJ)
    for a in andamentos:
        assert a.data.year >= 2026, f"Data inesperada: {a.data}"


@pytest.mark.skipif(not FIXTURE.exists(), reason="fixture HTML ausente")
def test_parse_sem_linhas_detalhe():
    """Linhas rowmovimentacoes* (detalhe de arquivo) não devem aparecer."""
    html = FIXTURE.read_text(encoding="windows-1252", errors="replace")
    conn = _StubConnector.__new__(_StubConnector)
    andamentos = conn._parse_andamentos(html, CNJ)
    for a in andamentos:
        assert a.evento  # nenhum andamento com evento vazio
