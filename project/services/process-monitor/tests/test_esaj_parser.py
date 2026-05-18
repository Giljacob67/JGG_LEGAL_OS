"""Testes do parser e-SAJ genérico com fixtures HTML sintéticas.

Funciona para TJSP, TJRS, TJMG e outros tribunais e-SAJ.
"""

import pathlib

import pytest

from app.connectors.parsers.esaj import (
    detect_esaj_captcha_or_block,
    detect_esaj_error_page,
    parse_esaj_movements,
    parse_esaj_process_page,
)
from app.core.errors import ParseError

FIXTURES_DIR = pathlib.Path(__file__).parent / "fixtures"


def _load_fixture(tribunal: str, name: str) -> str:
    return (FIXTURES_DIR / tribunal / name).read_text(encoding="utf-8")


class TestDetectCaptchaOrBlock:
    def test_captcha_page_tjsp(self):
        html = _load_fixture("tjsp", "captcha_detectado.html")
        assert detect_esaj_captcha_or_block(html) is True

    def test_captcha_page_tjrs(self):
        html = _load_fixture("tjrs", "captcha_detectado.html")
        assert detect_esaj_captcha_or_block(html) is True

    def test_normal_page_tjsp(self):
        html = _load_fixture("tjsp", "processo_publico_basico.html")
        assert detect_esaj_captcha_or_block(html) is False

    def test_normal_page_tjrs(self):
        html = _load_fixture("tjrs", "processo_publico_basico.html")
        assert detect_esaj_captcha_or_block(html) is False

    def test_erro_generico_tjsp(self):
        html = _load_fixture("tjsp", "erro_generico.html")
        assert detect_esaj_captcha_or_block(html) is False


class TestDetectErrorPage:
    def test_not_found_tjsp(self):
        html = _load_fixture("tjsp", "processo_nao_encontrado.html")
        assert detect_esaj_error_page(html) == "not_found"

    def test_not_found_tjrs(self):
        html = _load_fixture("tjrs", "processo_nao_encontrado.html")
        assert detect_esaj_error_page(html) == "not_found"

    def test_system_error_tjsp(self):
        html = _load_fixture("tjsp", "erro_generico.html")
        assert detect_esaj_error_page(html) == "system_error"

    def test_system_error_tjrs(self):
        html = _load_fixture("tjrs", "erro_generico.html")
        assert detect_esaj_error_page(html) == "system_error"

    def test_normal_page_tjsp(self):
        html = _load_fixture("tjsp", "processo_publico_basico.html")
        assert detect_esaj_error_page(html) is None

    def test_normal_page_tjrs(self):
        html = _load_fixture("tjrs", "processo_publico_basico.html")
        assert detect_esaj_error_page(html) is None


class TestParseProcessPage:
    def test_processo_publico_basico_tjsp(self):
        html = _load_fixture("tjsp", "processo_publico_basico.html")
        process = parse_esaj_process_page(html, tribunal="tjsp")
        assert process.numero_cnj == "0003333-44.2026.8.26.0000"
        assert process.classe == "Ação Civil Pública"
        assert process.assunto == "Dano Moral"
        assert process.data_distribuicao == "2026-04-20"
        assert process.orgao_julgador == "2ª Vara Cível"
        assert process.vara == "2ª Vara Cível"
        assert process.comarca == "São Paulo"
        assert process.status_raw == "Em andamento"
        assert process.valor_causa == 200000.0
        assert process.tribunal == "tjsp"
        assert process.sistema == "esaj"

    def test_processo_publico_basico_tjrs(self):
        html = _load_fixture("tjrs", "processo_publico_basico.html")
        process = parse_esaj_process_page(html, tribunal="tjrs")
        assert process.numero_cnj == "0004444-55.2026.8.21.0000"
        assert process.classe == "Ação Civil Pública"
        assert process.assunto == "Dano Ambiental"
        assert process.data_distribuicao == "2026-05-01"
        assert process.orgao_julgador == "3ª Vara Cível"
        assert process.vara == "3ª Vara Cível"
        assert process.comarca == "Porto Alegre"
        assert process.status_raw == "Em andamento"
        assert process.valor_causa == 75000.0
        assert process.tribunal == "tjrs"
        assert process.sistema == "esaj"

    def test_processo_nao_encontrado_tjsp(self):
        html = _load_fixture("tjsp", "processo_nao_encontrado.html")
        with pytest.raises(ParseError) as exc_info:
            parse_esaj_process_page(html)
        assert exc_info.value.details.get("error_code") == "NOT_FOUND"

    def test_captcha_detectado_tjsp(self):
        html = _load_fixture("tjsp", "captcha_detectado.html")
        with pytest.raises(ParseError) as exc_info:
            parse_esaj_process_page(html)
        assert "captcha" in exc_info.value.message.lower()
        assert exc_info.value.details.get("error_code") == "CAPTCHA_OR_BLOCK"

    def test_erro_generico_tjrs(self):
        html = _load_fixture("tjrs", "erro_generico.html")
        with pytest.raises(ParseError) as exc_info:
            parse_esaj_process_page(html)
        assert exc_info.value.details.get("error_code") == "TRIBUNAL_ERROR"

    def test_layout_alterado_tjsp(self):
        html = _load_fixture("tjsp", "layout_alterado.html")
        process = parse_esaj_process_page(html, tribunal="tjsp")
        assert process.numero_cnj == "0003333-44.2026.8.26.0000"
        assert process.classe == "Ação Civil Pública"
        assert process.comarca == "São Paulo"

    def test_layout_alterado_tjrs(self):
        html = _load_fixture("tjrs", "layout_alterado.html")
        process = parse_esaj_process_page(html, tribunal="tjrs")
        assert process.numero_cnj == "0004444-55.2026.8.21.0000"
        assert process.classe == "Ação Civil Pública"
        assert process.comarca == "Porto Alegre"


class TestParseMovements:
    def test_processo_publico_basico_tjsp(self):
        html = _load_fixture("tjsp", "processo_publico_basico.html")
        movements = parse_esaj_movements(html)
        assert len(movements) == 2
        assert movements[0].descricao_original == "Distribuição"
        assert movements[0].data == "2026-04-20"
        assert movements[0].tipo_evento == "distribuicao"
        assert movements[1].descricao_original == "Conclusos"
        assert movements[1].data == "2026-04-25"
        assert movements[1].tipo_evento == "conclusao"

    def test_processo_publico_basico_tjrs(self):
        html = _load_fixture("tjrs", "processo_publico_basico.html")
        movements = parse_esaj_movements(html)
        assert len(movements) == 2
        assert movements[0].descricao_original == "Distribuição"
        assert movements[0].data == "2026-05-01"
        assert movements[1].descricao_original == "Audiência designada"
        assert movements[1].tipo_evento == "audiencia"

    def test_processo_sem_andamentos_tjsp(self):
        html = _load_fixture("tjsp", "processo_sem_andamentos.html")
        movements = parse_esaj_movements(html)
        assert len(movements) == 0

    def test_processo_sem_andamentos_tjrs(self):
        html = _load_fixture("tjrs", "processo_sem_andamentos.html")
        movements = parse_esaj_movements(html)
        assert len(movements) == 0

    def test_layout_alterado_tjsp(self):
        html = _load_fixture("tjsp", "layout_alterado.html")
        movements = parse_esaj_movements(html)
        assert len(movements) == 3
        assert "Distribuição eletrônica" in movements[0].descricao_original
        assert "Intimação das partes" in movements[1].descricao_original
        assert "Decisão deferida tutela antecipada" in movements[2].descricao_original
        assert movements[2].tipo_evento == "sentenca"

    def test_layout_alterado_tjrs(self):
        html = _load_fixture("tjrs", "layout_alterado.html")
        movements = parse_esaj_movements(html)
        assert len(movements) == 3
        assert "Distribuição eletrônica" in movements[0].descricao_original
        assert "Audiência designada" in movements[1].descricao_original
        assert "Conclusos para decisão" in movements[2].descricao_original

    def test_hash_deterministic(self):
        html = _load_fixture("tjsp", "processo_publico_basico.html")
        movements1 = parse_esaj_movements(html)
        movements2 = parse_esaj_movements(html)
        assert len(movements1) == len(movements2)
        for m1, m2 in zip(movements1, movements2):
            assert m1.hash == m2.hash

    def test_deduplicacao(self):
        html = _load_fixture("tjsp", "processo_publico_basico.html")
        # Concatena o mesmo HTML duas vezes para simular movimentações duplicadas
        movements = parse_esaj_movements(html + html)
        # Deve deduplicar e retornar apenas 2 movimentações únicas
        assert len(movements) == 2
