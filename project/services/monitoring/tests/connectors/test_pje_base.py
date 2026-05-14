"""
Testa PJeBaseConnector com HTML fixtures salvos.
Rodar: pytest tests/connectors/test_pje_base.py -v
"""
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import httpx

from connectors.pje_base import PJeBaseConnector
from connectors.base import ResultadoCaptura
from session.manager import SessionManager

FIXTURES = Path(__file__).parent.parent / "fixtures"

# HTML mínimo simulando resposta PJe com andamentos
MOCK_HTML_COM_ANDAMENTOS = """
<html><body>
<form id="fPP">
  <input name="javax.faces.ViewState" value="abc123"/>
</form>
<table class="rich-table">
  <tbody>
    <tr><td>10/01/2026</td><td>Sentença</td><td>Sentença condenatória proferida</td><td>1ª Vara Cível</td></tr>
    <tr><td>15/01/2026</td><td>Certidão</td><td>Certidão de trânsito em julgado</td><td>1ª Vara Cível</td></tr>
  </tbody>
</table>
</body></html>
"""

MOCK_HTML_CAPTCHA = """
<html><body>
<p>Muitas requisições detectadas. Por favor confirme que você é humano.</p>
<div class="g-recaptcha"></div>
</body></html>
"""

MOCK_HTML_VIEWSTATE = """
<html><body>
<form id="fPP">
  <input name="javax.faces.ViewState" value="viewstate-xyz"/>
</form>
</body></html>
"""


class ConcretePJe(PJeBaseConnector):
    tribunal_id = "tjpr"
    nome = "TJPR Teste"
    sistema = "pje"
    base_url = "https://pje.tjpr.jus.br/pje"
    consulta_url = "https://pje.tjpr.jus.br/pje/ConsultaPublica/listView.seam"


@pytest.fixture
def connector():
    session = MagicMock(spec=SessionManager)
    return ConcretePJe(session)


def _mock_client(get_html: str, post_html: str) -> AsyncMock:
    client = AsyncMock(spec=httpx.AsyncClient)
    client.is_closed = False

    get_resp = MagicMock()
    get_resp.text = get_html
    get_resp.raise_for_status = MagicMock()

    post_resp = MagicMock()
    post_resp.text = post_html
    post_resp.raise_for_status = MagicMock()

    client.get = AsyncMock(return_value=get_resp)
    client.post = AsyncMock(return_value=post_resp)
    return client


@pytest.mark.asyncio
async def test_parse_andamentos_retorna_lista(connector):
    andamentos = connector._parse_andamentos(MOCK_HTML_COM_ANDAMENTOS)
    assert len(andamentos) == 2
    assert andamentos[0].evento == "Sentença"
    assert andamentos[1].evento == "Certidão"


@pytest.mark.asyncio
async def test_detectar_captcha_true(connector):
    assert connector._detectar_captcha(MOCK_HTML_CAPTCHA) is True


@pytest.mark.asyncio
async def test_detectar_captcha_false(connector):
    assert connector._detectar_captcha(MOCK_HTML_COM_ANDAMENTOS) is False


@pytest.mark.asyncio
async def test_buscar_processo_sucesso(connector):
    client = _mock_client(MOCK_HTML_VIEWSTATE, MOCK_HTML_COM_ANDAMENTOS)
    connector._session.get_client = AsyncMock(return_value=client)

    resultado = await connector.buscar_processo("0001234-56.2026.8.16.0001")

    assert isinstance(resultado, ResultadoCaptura)
    assert resultado.sucesso is True
    assert len(resultado.andamentos) == 2
    assert resultado.captcha_detectado is False


@pytest.mark.asyncio
async def test_buscar_processo_captcha(connector):
    client = _mock_client(MOCK_HTML_VIEWSTATE, MOCK_HTML_CAPTCHA)
    connector._session.get_client = AsyncMock(return_value=client)

    resultado = await connector.buscar_processo("0001234-56.2026.8.16.0001")

    assert resultado.sucesso is False
    assert resultado.captcha_detectado is True


@pytest.mark.asyncio
async def test_buscar_processo_timeout(connector):
    client = AsyncMock(spec=httpx.AsyncClient)
    client.is_closed = False
    client.get = AsyncMock(side_effect=httpx.TimeoutException("timeout"))
    connector._session.get_client = AsyncMock(return_value=client)

    resultado = await connector.buscar_processo("0001234-56.2026.8.16.0001")

    assert resultado.sucesso is False
    assert "timeout" in resultado.erro


@pytest.mark.asyncio
async def test_parse_date_formatos(connector):
    from datetime import date
    assert connector._parse_date("10/01/2026") == date(2026, 1, 10)
    assert connector._parse_date("2026-01-10") == date(2026, 1, 10)
    assert connector._parse_date("invalido") is None
