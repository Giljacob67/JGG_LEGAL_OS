"""Testes de validação e normalização de CNJ."""

import pytest

from app.core.cnj import extrair_tribunal, formatar, normalizar, validar
from app.core.errors import CNJInvalidoError


class TestNormalizar:
    def test_remove_mascara(self):
        assert normalizar("0003537-95.2026.8.16.0058") == "00035379520268160058"

    def test_ja_digitos(self):
        assert normalizar("00035379520268160058") == "00035379520268160058"

    def test_rejeita_invalido(self):
        with pytest.raises(CNJInvalidoError):
            normalizar("123")

    def test_rejeita_vazio(self):
        with pytest.raises(CNJInvalidoError):
            normalizar("")


class TestFormatar:
    def test_formata_digitos(self):
        assert formatar("00035379520268160058") == "0003537-95.2026.8.16.0058"

    def test_rejeita_tamanho_errado(self):
        with pytest.raises(CNJInvalidoError):
            formatar("123")


class TestExtrairTribunal:
    def test_tjpr(self):
        assert extrair_tribunal("00035379520268160058") == "16"

    def test_trf4(self):
        assert extrair_tribunal("00000000000004040000") == "04"


class TestValidar:
    def test_valido_com_mascara(self):
        assert validar("0003537-95.2026.8.16.0058") is True

    def test_valido_sem_mascara(self):
        assert validar("00035379520268160058") is True

    def test_invalido(self):
        assert validar("invalido") is False
