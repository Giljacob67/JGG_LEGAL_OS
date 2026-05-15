"""Testes do DataJudConnector com mocks HTTP."""

import pytest
import respx
from httpx import Response

from app.connectors.datajud import DataJudConnector
from app.core.errors import ProcessMonitorError


class TestDataJudConnectorSearch:
    @pytest.fixture
    def connector(self):
        return DataJudConnector()

    @pytest.mark.asyncio
    async def test_sucesso_com_resultado(self, connector, monkeypatch):
        monkeypatch.setattr("app.connectors.datajud.settings.DATAJUD_API_KEY", "test-key")
        with respx.mock:
            route = respx.post("https://api-publica.datajud.cnj.jus.br/api_publica_tjpr/_search").mock(
                return_value=Response(
                    200,
                    json={
                        "hits": {
                            "hits": [
                                {
                                    "_source": {
                                        "numeroProcesso": "00035379520268160058",
                                        "classe": {"nome": "Ação Civil Pública"},
                                        "assunto": [{"nome": "Dano Ambiental"}],
                                        "orgaoJulgador": {"nome": "1ª Vara Cível", "codigoMunicipioIBGE": "4106902"},
                                        "dataAjuizamento": "2024-01-15T10:00:00Z",
                                        "valorCausa": 50000.0,
                                        "situacao": {"nome": "Em andamento"},
                                        "movimentos": [
                                            {"codigo": "1", "dataHora": "2024-01-15T10:00:00Z", "nome": "Distribuído", "tipo": "Distribuição"},
                                            {"codigo": "2", "dataHora": "2024-02-01T14:30:00Z", "nome": "Decisão de deferimento", "tipo": "Decisão"},
                                        ],
                                    }
                                }
                            ]
                        }
                    },
                )
            )
            result = await connector.buscar_processo_por_numero("0003537-95.2026.8.16.0058")
            assert result.ok is True
            assert result.process is not None
            assert result.process.classe == "Ação Civil Pública"
            assert len(result.movements) == 2
            assert result.movements[0].descricao_original == "Distribuído"
            assert route.called

    @pytest.mark.asyncio
    async def test_nao_encontrado(self, connector, monkeypatch):
        monkeypatch.setattr("app.connectors.datajud.settings.DATAJUD_API_KEY", "test-key")
        with respx.mock:
            route = respx.post("https://api-publica.datajud.cnj.jus.br/api_publica_tjpr/_search").mock(
                return_value=Response(200, json={"hits": {"hits": []}})
            )
            result = await connector.buscar_processo_por_numero("0000000-00.0000.0.00.0000", tribunal="tjpr")
            assert result.ok is True
            assert result.process is None
            assert route.called

    @pytest.mark.asyncio
    async def test_401_auth_error(self, connector, monkeypatch):
        monkeypatch.setattr("app.connectors.datajud.settings.DATAJUD_API_KEY", "test-key")
        with respx.mock:
            route = respx.post("https://api-publica.datajud.cnj.jus.br/api_publica_tjpr/_search").mock(
                return_value=Response(401, text="Unauthorized")
            )
            with pytest.raises(ProcessMonitorError) as exc_info:
                await connector.buscar_processo_por_numero("0003537-95.2026.8.16.0058", tribunal="tjpr")
            assert exc_info.value.error_code == "DATAJUD_AUTH_ERROR"
            assert route.called

    @pytest.mark.asyncio
    async def test_429_rate_limit(self, connector, monkeypatch):
        monkeypatch.setattr("app.connectors.datajud.settings.DATAJUD_API_KEY", "test-key")
        with respx.mock:
            route = respx.post("https://api-publica.datajud.cnj.jus.br/api_publica_tjpr/_search").mock(
                return_value=Response(429, text="Too Many Requests")
            )
            with pytest.raises(ProcessMonitorError) as exc_info:
                await connector.buscar_processo_por_numero("0003537-95.2026.8.16.0058", tribunal="tjpr")
            assert exc_info.value.error_code == "RATE_LIMIT"
            assert route.called

    @pytest.mark.asyncio
    async def test_timeout(self, connector, monkeypatch):
        monkeypatch.setattr("app.connectors.datajud.settings.DATAJUD_API_KEY", "test-key")
        with respx.mock:
            import httpx
            route = respx.post("https://api-publica.datajud.cnj.jus.br/api_publica_tjpr/_search").mock(
                side_effect=httpx.TimeoutException("Timeout")
            )
            with pytest.raises(ProcessMonitorError) as exc_info:
                await connector.buscar_processo_por_numero("0003537-95.2026.8.16.0058", tribunal="tjpr")
            assert exc_info.value.error_code == "TIMEOUT"
            assert route.called

    @pytest.mark.asyncio
    async def test_config_missing(self, connector, monkeypatch):
        monkeypatch.setattr("app.connectors.datajud.settings.DATAJUD_API_KEY", "")
        with pytest.raises(ProcessMonitorError) as exc_info:
            await connector.buscar_processo_por_numero("0003537-95.2026.8.16.0058")
        assert exc_info.value.error_code == "CONFIG_MISSING"

    @pytest.mark.asyncio
    async def test_payload_inesperado(self, connector, monkeypatch):
        monkeypatch.setattr("app.connectors.datajud.settings.DATAJUD_API_KEY", "test-key")
        with respx.mock:
            route = respx.post("https://api-publica.datajud.cnj.jus.br/api_publica_tjpr/_search").mock(
                return_value=Response(200, text="not json")
            )
            with pytest.raises(ProcessMonitorError) as exc_info:
                await connector.buscar_processo_por_numero("0003537-95.2026.8.16.0058", tribunal="tjpr")
            assert exc_info.value.error_code == "PARSER_ERROR"
            assert route.called
