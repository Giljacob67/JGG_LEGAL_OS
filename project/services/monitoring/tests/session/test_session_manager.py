"""Testa SessionManager: throttle, reuso de client, rate limit."""
import asyncio
import time
import pytest

from session.manager import SessionManager


@pytest.mark.asyncio
async def test_get_client_retorna_mesmo_cliente():
    sm = SessionManager("tjpr")
    c1 = await sm.get_client()
    c2 = await sm.get_client()
    assert c1 is c2
    await sm.close()


@pytest.mark.asyncio
async def test_close_recria_cliente():
    sm = SessionManager("tjpr")
    c1 = await sm.get_client()
    await sm.close()
    c2 = await sm.get_client()
    assert c1 is not c2
    await sm.close()


@pytest.mark.asyncio
async def test_throttle_respeita_delay():
    sm = SessionManager("tjpr")
    sm._delay_s = 0.1  # reduz delay para teste rápido

    t0 = time.monotonic()
    await sm.get_client()
    await sm.get_client()
    elapsed = time.monotonic() - t0

    assert elapsed >= 0.05  # pelo menos metade do delay esperado
    await sm.close()
