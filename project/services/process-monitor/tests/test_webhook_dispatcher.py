"""Testes do webhook dispatcher."""

import pytest
import respx
from httpx import Response

from app.core.webhook_dispatcher import dispatch_new_movements_webhook


class TestDispatchNewMovementsWebhook:
    @pytest.mark.asyncio
    async def test_disabled(self, monkeypatch):
        monkeypatch.setattr("app.core.webhook_dispatcher.settings.WEBHOOK_NEW_MOVEMENTS_ENABLED", False)
        monkeypatch.setattr("app.core.webhook_dispatcher.settings.WEBHOOK_NEW_MOVEMENTS_URL", "https://example.com/webhook")
        result = await dispatch_new_movements_webhook(
            process_id="abc",
            numero_cnj="123",
            tribunal="tjpr",
            new_movements_count=2,
            movements=[{"data": "2026-01-10", "descricao_original": "Test"}],
        )
        assert result["sent"] is False
        assert result["reason"] == "webhook disabled"

    @pytest.mark.asyncio
    async def test_not_configured(self, monkeypatch):
        monkeypatch.setattr("app.core.webhook_dispatcher.settings.WEBHOOK_NEW_MOVEMENTS_ENABLED", True)
        monkeypatch.setattr("app.core.webhook_dispatcher.settings.WEBHOOK_NEW_MOVEMENTS_URL", None)
        result = await dispatch_new_movements_webhook(
            process_id="abc",
            numero_cnj="123",
            tribunal="tjpr",
            new_movements_count=2,
            movements=[{"data": "2026-01-10", "descricao_original": "Test"}],
        )
        assert result["sent"] is False
        assert "WEBHOOK_NEW_MOVEMENTS_URL" in result["reason"]

    @pytest.mark.asyncio
    async def test_success(self, monkeypatch):
        monkeypatch.setattr("app.core.webhook_dispatcher.settings.WEBHOOK_NEW_MOVEMENTS_ENABLED", True)
        monkeypatch.setattr(
            "app.core.webhook_dispatcher.settings.WEBHOOK_NEW_MOVEMENTS_URL",
            "https://example.com/webhook",
        )
        with respx.mock:
            route = respx.post("https://example.com/webhook").mock(
                return_value=Response(200, text="ok")
            )
            result = await dispatch_new_movements_webhook(
                process_id="abc",
                numero_cnj="12345678901234567890",
                tribunal="tjpr",
                new_movements_count=2,
                movements=[
                    {"data": "2026-01-10", "descricao_original": "Autuação"},
                    {"data": "2026-01-12", "descricao_original": "Distribuição"},
                ],
            )
            assert result["sent"] is True
            assert result["status_code"] == 200
            assert route.called
            payload = route.calls[0].request.content
            assert b"new_movements" in payload
            assert b"abc" in payload

    @pytest.mark.asyncio
    async def test_http_error(self, monkeypatch):
        monkeypatch.setattr("app.core.webhook_dispatcher.settings.WEBHOOK_NEW_MOVEMENTS_ENABLED", True)
        monkeypatch.setattr(
            "app.core.webhook_dispatcher.settings.WEBHOOK_NEW_MOVEMENTS_URL",
            "https://example.com/webhook",
        )
        with respx.mock:
            route = respx.post("https://example.com/webhook").mock(
                return_value=Response(500, text="Internal Server Error")
            )
            result = await dispatch_new_movements_webhook(
                process_id="abc",
                numero_cnj="123",
                tribunal="tjpr",
                new_movements_count=1,
                movements=[{"data": "2026-01-10", "descricao_original": "Test"}],
            )
            assert result["sent"] is False
            assert result["error"] == "http_error"
            assert result["status_code"] == 500

    @pytest.mark.asyncio
    async def test_custom_headers(self, monkeypatch):
        monkeypatch.setattr("app.core.webhook_dispatcher.settings.WEBHOOK_NEW_MOVEMENTS_ENABLED", True)
        monkeypatch.setattr(
            "app.core.webhook_dispatcher.settings.WEBHOOK_NEW_MOVEMENTS_URL",
            "https://example.com/webhook",
        )
        monkeypatch.setattr(
            "app.core.webhook_dispatcher.settings.WEBHOOK_NEW_MOVEMENTS_HEADERS",
            '{"Authorization": "Bearer secret123", "X-Custom": "value"}',
        )
        with respx.mock:
            route = respx.post("https://example.com/webhook").mock(
                return_value=Response(200, text="ok")
            )
            result = await dispatch_new_movements_webhook(
                process_id="abc",
                numero_cnj="123",
                tribunal="tjpr",
                new_movements_count=1,
                movements=[{"data": "2026-01-10", "descricao_original": "Test"}],
            )
            assert result["sent"] is True
            req = route.calls[0].request
            assert req.headers["Authorization"] == "Bearer secret123"
            assert req.headers["X-Custom"] == "value"
