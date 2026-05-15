"""Testes do parser TRF4 (eProc)."""

import pytest

from app.connectors.parsers.trf4 import (
    detect_trf4_captcha_or_block,
    detect_trf4_error_page,
    parse_trf4_movements,
    parse_trf4_process_page,
)
from app.core.errors import ParseError


class TestDetectCaptchaOrBlock:
    def test_captcha_page(self):
        html = "<html><body>recaptcha v2</body></html>"
        assert detect_trf4_captcha_or_block(html) is True

    def test_normal_page(self):
        html = "<html><body>Processo 123</body></html>"
        assert detect_trf4_captcha_or_block(html) is False

    def test_erro_generico(self):
        html = "<html><body>acesso negado</body></html>"
        assert detect_trf4_captcha_or_block(html) is True


class TestDetectErrorPage:
    def test_not_found(self):
        html = "Processo não localizado"
        assert detect_trf4_error_page(html) == "not_found"

    def test_captcha(self):
        html = "recaptcha"
        assert detect_trf4_error_page(html) is None

    def test_system_error(self):
        html = "Erro interno no servidor"
        assert detect_trf4_error_page(html) == "system_error"

    def test_normal_page(self):
        html = "<html><body>Dados do processo</body></html>"
        assert detect_trf4_error_page(html) is None


class TestParseProcessPage:
    def test_processo_publico_basico(self):
        html = """<table>
            <tr><th>Número do Processo:</th><td>0001234-56.2026.4.04.0000</td></tr>
            <tr><th>Classe:</th><td>Ação Civil Pública</td></tr>
            <tr><th>Assunto:</th><td>Dano Ambiental</td></tr>
            <tr><th>Data de Autuação:</th><td>10/01/2026</td></tr>
            <tr><th>Órgão Julgador:</th><td>1ª Turma</td></tr>
            <tr><th>Vara:</th><td>1ª Vara Federal</td></tr>
            <tr><th>Seção Judiciária:</th><td>Paraná</td></tr>
            <tr><th>Situação:</th><td>Em andamento</td></tr>
            <tr><th>Valor da Causa:</th><td>R$ 50.000,00</td></tr>
        </table>"""
        process = parse_trf4_process_page(html)
        assert process.numero_cnj == "0001234-56.2026.4.04.0000"
        assert process.classe == "Ação Civil Pública"
        assert process.assunto == "Dano Ambiental"
        assert process.data_distribuicao is not None
        assert process.orgao_julgador == "1ª Turma"
        assert process.vara == "1ª Vara Federal"
        assert process.comarca == "Paraná"
        assert process.status_raw == "Em andamento"
        assert process.valor_causa == 50000.0

    def test_processo_nao_encontrado(self):
        html = "Processo não localizado. Não existe processo com o número informado."
        with pytest.raises(ParseError) as exc_info:
            parse_trf4_process_page(html)
        assert exc_info.value.details.get("error_code") == "NOT_FOUND"

    def test_captcha_detectado(self):
        html = "<html><body>recaptcha v2</body></html>"
        with pytest.raises(ParseError) as exc_info:
            parse_trf4_process_page(html)
        assert exc_info.value.details.get("error_code") == "CAPTCHA_OR_BLOCK"

    def test_layout_alterado(self):
        """Deve conseguir extrair dados mesmo com HTML diferente."""
        html = """<div class="card">
            <dl>
                <dt>Processo:</dt><dd>0001234-56.2026.4.04.0000</dd>
                <dt>Natureza:</dt><dd>Ação Civil Pública</dd>
                <dt>Tema:</dt><dd>Dano Ambiental</dd>
                <dt>Autuado em:</dt><dd>10/01/2026</dd>
                <dt>Relator:</dt><dd>1ª Turma</dd>
                <dt>Juízo:</dt><dd>1ª Vara Federal</dd>
                <dt>UF:</dt><dd>Paraná</dd>
                <dt>Status:</dt><dd>Em andamento</dd>
                <dt>Valor:</dt><dd>R$ 50.000,00</dd>
            </dl>
        </div>"""
        process = parse_trf4_process_page(html)
        assert process.numero_cnj == "0001234-56.2026.4.04.0000"
        assert process.classe == "Ação Civil Pública"

    def test_erro_generico(self):
        html = "Erro interno no servidor. Tente novamente mais tarde."
        with pytest.raises(ParseError) as exc_info:
            parse_trf4_process_page(html)
        assert exc_info.value.details.get("error_code") == "TRIBUNAL_ERROR"


class TestParseMovements:
    def test_processo_publico_basico(self):
        html = """<table>
            <tr><td>10/01/2026</td><td>Autuação</td></tr>
            <tr><td>12/01/2026</td><td>Distribuição por sorteio</td></tr>
            <tr><td>15/01/2026</td><td>Intimação das partes</td></tr>
        </table>"""
        movements = parse_trf4_movements(html)
        assert len(movements) == 3
        assert movements[0].descricao_original == "Autuação"
        assert movements[0].data == "2026-01-10"
        assert movements[1].tipo_evento == "distribuicao"
        assert movements[2].tipo_evento == "intimacao"

    def test_processo_sem_andamentos(self):
        html = "Não há movimentações registradas para este processo."
        movements = parse_trf4_movements(html)
        assert movements == []

    def test_layout_alterado(self):
        html = """<ul>
            <li>10/01/2026 - Autuação</li>
            <li>12/01/2026 - Distribuição por sorteio</li>
        </ul>"""
        movements = parse_trf4_movements(html)
        assert len(movements) == 2
        assert movements[0].descricao_original == "Autuação"

    def test_hash_deterministic(self):
        html = """<table>
            <tr><td>10/01/2026</td><td>Autuação</td></tr>
        </table>"""
        movements1 = parse_trf4_movements(html)
        movements2 = parse_trf4_movements(html)
        assert movements1[0].hash == movements2[0].hash
