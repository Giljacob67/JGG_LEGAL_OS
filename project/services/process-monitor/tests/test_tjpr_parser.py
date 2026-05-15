"""Testes do parser TJPR com fixtures HTML sintéticas."""

import pathlib

import pytest

from app.connectors.parsers.tjpr import (
    detect_tjpr_captcha_or_block,
    detect_tjpr_error_page,
    parse_tjpr_movements,
    parse_tjpr_process_page,
)
from app.core.errors import ParseError


FIXTURES_DIR = pathlib.Path(__file__).parent / "fixtures" / "tjpr"


def _load_fixture(name: str) -> str:
    return (FIXTURES_DIR / name).read_text(encoding="utf-8")


class TestDetectCaptchaOrBlock:
    def test_captcha_page(self):
        html = _load_fixture("captcha_detectado.html")
        assert detect_tjpr_captcha_or_block(html) is True

    def test_normal_page(self):
        html = _load_fixture("processo_publico_basico.html")
        assert detect_tjpr_captcha_or_block(html) is False

    def test_erro_generico(self):
        html = _load_fixture("erro_generico.html")
        assert detect_tjpr_captcha_or_block(html) is False


class TestDetectErrorPage:
    def test_not_found(self):
        html = _load_fixture("processo_nao_encontrado.html")
        assert detect_tjpr_error_page(html) == "not_found"

    def test_captcha(self):
        html = _load_fixture("captcha_detectado.html")
        assert detect_tjpr_error_page(html) == "captcha_or_block"

    def test_system_error(self):
        html = _load_fixture("erro_generico.html")
        assert detect_tjpr_error_page(html) == "system_error"

    def test_normal_page(self):
        html = _load_fixture("processo_publico_basico.html")
        assert detect_tjpr_error_page(html) is None


class TestParseProcessPage:
    def test_processo_publico_basico(self):
        html = _load_fixture("processo_publico_basico.html")
        process = parse_tjpr_process_page(html)
        assert process.numero_cnj == "0003537-95.2026.8.16.0058"
        assert process.classe == "Ação Civil Pública"
        assert process.assunto == "Dano Ambiental"
        assert process.data_distribuicao == "2024-01-15"
        assert process.orgao_julgador == "1ª Vara Cível de Curitiba"
        assert process.vara == "1ª Vara Cível"
        assert process.comarca == "Curitiba"
        assert process.status_raw == "Em andamento"
        assert process.valor_causa == 50000.0
        assert process.tribunal == "tjpr"
        assert process.sistema == "projudi"

    def test_processo_nao_encontrado(self):
        html = _load_fixture("processo_nao_encontrado.html")
        with pytest.raises(ParseError) as exc_info:
            parse_tjpr_process_page(html)
        assert exc_info.value.details.get("error_code") == "NOT_FOUND"

    def test_captcha_detectado(self):
        html = _load_fixture("captcha_detectado.html")
        with pytest.raises(ParseError) as exc_info:
            parse_tjpr_process_page(html)
        assert "captcha" in exc_info.value.message.lower()

    def test_layout_alterado(self):
        html = _load_fixture("layout_alterado.html")
        process = parse_tjpr_process_page(html)
        assert process.numero_cnj == "0003537-95.2026.8.16.0058"
        assert process.classe == "Ação Civil Pública"
        assert process.comarca == "Curitiba"

    def test_erro_generico(self):
        html = _load_fixture("erro_generico.html")
        with pytest.raises(ParseError) as exc_info:
            parse_tjpr_process_page(html)
        assert exc_info.value.details.get("error_code") == "TRIBUNAL_ERROR"


class TestParseMovements:
    def test_processo_publico_basico(self):
        html = _load_fixture("processo_publico_basico.html")
        movements = parse_tjpr_movements(html)
        assert len(movements) == 5
        assert movements[0].descricao_original == "Distribuído por dependência para 1ª Vara Cível"
        assert movements[0].data == "2024-01-15"
        assert movements[0].tipo_evento == "Distribuição"
        assert movements[1].descricao_original == "Intimados os réus para apresentar resposta no prazo de 15 dias"
        assert movements[2].descricao_original == "Decisão: deferido o pedido de tutela antecipada"
        assert movements[2].tipo_evento == "Decisão"
        assert movements[3].descricao_original == "Designada audiência de conciliação para 15/04/2024 às 14h00"
        assert movements[3].tipo_evento == "Audiência"

    def test_processo_sem_andamentos(self):
        html = _load_fixture("processo_sem_andamentos.html")
        movements = parse_tjpr_movements(html)
        assert len(movements) == 0

    def test_layout_alterado(self):
        html = _load_fixture("layout_alterado.html")
        movements = parse_tjpr_movements(html)
        assert len(movements) == 3
        assert "Distribuído" in movements[0].descricao_original
        assert "Intimação" in movements[1].descricao_original
        assert "Decisão deferida" in movements[2].descricao_original

    def test_hash_deterministic(self):
        html = _load_fixture("processo_publico_basico.html")
        movements1 = parse_tjpr_movements(html)
        movements2 = parse_tjpr_movements(html)
        assert len(movements1) == len(movements2)
        for m1, m2 in zip(movements1, movements2):
            assert m1.hash == m2.hash
