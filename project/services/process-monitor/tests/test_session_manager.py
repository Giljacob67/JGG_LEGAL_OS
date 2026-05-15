"""Testes do SessionManager com detecção de bloqueio."""

import pytest
import respx
from httpx import Response

from app.core.errors import CaptchaOrBlockError, RateLimitError
from app.core.session_manager import SessionManager


class TestDetectaBloqueio:
    @pytest.mark.asyncio
    async def test_detecta_403(self):
        with respx.mock:
            route = respx.get("https://fake.tribunal/test").mock(return_value=Response(403))
            sm = SessionManager("tjpr")
            with pytest.raises(CaptchaOrBlockError):
                await sm.request("GET", "https://fake.tribunal/test")
            assert route.called

    @pytest.mark.asyncio
    async def test_detecta_429(self):
        with respx.mock:
            route = respx.get("https://fake.tribunal/test").mock(return_value=Response(429))
            sm = SessionManager("tjpr")
            with pytest.raises(RateLimitError):
                await sm.request("GET", "https://fake.tribunal/test")
            assert route.called

    @pytest.mark.asyncio
    async def test_detecta_captcha_no_corpo(self):
        with respx.mock:
            route = respx.get("https://fake.tribunal/test").mock(
                return_value=Response(200, text="<html>por favor resolva o captcha</html>")
            )
            sm = SessionManager("tjpr")
            with pytest.raises(CaptchaOrBlockError) as exc_info:
                await sm.request("GET", "https://fake.tribunal/test")
            assert "captcha" in str(exc_info.value.message).lower()
            assert route.called

    @pytest.mark.asyncio
    async def test_nao_tenta_resolver_captcha(self):
        """Garante que ao detectar captcha, apenas levanta exceção."""
        with respx.mock:
            respx.get("https://fake.tribunal/test").mock(
                return_value=Response(200, text="recaptcha v2 required")
            )
            sm = SessionManager("tjpr")
            with pytest.raises(CaptchaOrBlockError):
                await sm.request("GET", "https://fake.tribunal/test")
            # Não deve haver retry automático ou tentativa de resolução

    @pytest.mark.asyncio
    async def test_request_normal(self):
        with respx.mock:
            route = respx.get("https://fake.tribunal/test").mock(
                return_value=Response(200, text="OK")
            )
            sm = SessionManager("tjpr")
            resp = await sm.request("GET", "https://fake.tribunal/test")
            assert resp.status_code == 200
            assert route.called
