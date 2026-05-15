"""Testes de normalização heurística de movimentações."""

import pytest

from app.core.normalization import (
    build_movement_hash,
    infer_process_status_from_movement,
    normalize_movement_type,
)


class TestNormalizeMovementType:
    def test_sentenca(self):
        assert normalize_movement_type("Proferida sentença") == "sentenca"
        assert normalize_movement_type("Sentença de procedência") == "sentenca"
        assert normalize_movement_type("JULGADA PROCEDENTE") == "sentenca"

    def test_decisao(self):
        assert normalize_movement_type("Decisão de deferimento") == "decisao"
        assert normalize_movement_type("Concedida a tutela antecipada") == "decisao"
        assert normalize_movement_type("Indeferido o pedido") == "decisao"

    def test_intimacao(self):
        assert normalize_movement_type("Intimação das partes") == "intimacao"
        assert normalize_movement_type("Notificação do réu") == "intimacao"
        assert normalize_movement_type("Citado o autor") == "intimacao"

    def test_audiencia(self):
        assert normalize_movement_type("Realizada a audiência") == "audiencia"
        assert normalize_movement_type("Designada audiência de conciliação") == "audiencia"

    def test_arquivamento(self):
        assert normalize_movement_type("Arquivado definitivamente") == "arquivamento"
        assert normalize_movement_type("Baixa definitiva") == "arquivamento"

    def test_transito_julgado(self):
        assert normalize_movement_type("Trânsito em julgado") == "transito_julgado"
        assert normalize_movement_type("Transitado em julgado") == "transito_julgado"

    def test_distribuicao(self):
        assert normalize_movement_type("Distribuído por dependência") == "distribuicao"
        assert normalize_movement_type("Autuado") == "distribuicao"

    def test_fallback_outro(self):
        assert normalize_movement_type("Qualquer outra coisa") == "outro"


class TestInferProcessStatus:
    def test_arquivado(self):
        assert infer_process_status_from_movement("Arquivado") == "arquivado"
        assert infer_process_status_from_movement("Baixa definitiva") == "arquivado"

    def test_transito_julgado(self):
        assert infer_process_status_from_movement("Trânsito em julgado") == "transito_julgado"

    def test_sentenca(self):
        assert infer_process_status_from_movement("Proferida sentença") == "sentenca"

    def test_recurso(self):
        assert infer_process_status_from_movement("Interposto recurso de apelação") == "recurso"
        assert infer_process_status_from_movement("Agravo interposto") == "recurso"

    def test_em_andamento(self):
        assert infer_process_status_from_movement("Distribuído") == "em_andamento"
        assert infer_process_status_from_movement("Conclusos para decisão") == "em_andamento"

    def test_desconhecido_fallback(self):
        assert infer_process_status_from_movement("XYZ") == "desconhecido"


class TestBuildMovementHash:
    def test_deterministic(self):
        h1 = build_movement_hash("0003537-95.2026.8.16.0058", "tjpr", "2024-01-01", "Intimação")
        h2 = build_movement_hash("0003537-95.2026.8.16.0058", "tjpr", "2024-01-01", "Intimação")
        assert h1 == h2

    def test_different_desc(self):
        h1 = build_movement_hash("0003537-95.2026.8.16.0058", "tjpr", "2024-01-01", "Intimação")
        h2 = build_movement_hash("0003537-95.2026.8.16.0058", "tjpr", "2024-01-01", "Decisão")
        assert h1 != h2
