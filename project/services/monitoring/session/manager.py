import asyncio
import time
from typing import Optional

import httpx

TRIBUNAL_HEADERS: dict[str, dict] = {
    "tjpr": {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
    "tjmt": {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
    "trf4": {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    "trf1": {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
}

# Req/min e delay mínimo entre requisições para cada tribunal
RATE_LIMITS: dict[str, dict] = {
    "tjpr": {"req_per_min": 20, "delay_s": 3.0},
    "tjmt": {"req_per_min": 20, "delay_s": 3.0},
    "trf4": {"req_per_min": 30, "delay_s": 2.0},
    "trf1": {"req_per_min": 20, "delay_s": 3.0},
}

# Semáforos globais — max capturas simultâneas por tribunal
_semaphores: dict[str, asyncio.Semaphore] = {}
MAX_CONCURRENT = {"tjpr": 3, "tjmt": 3, "trf4": 5, "trf1": 3}


def get_semaphore(tribunal_id: str) -> asyncio.Semaphore:
    if tribunal_id not in _semaphores:
        _semaphores[tribunal_id] = asyncio.Semaphore(
            MAX_CONCURRENT.get(tribunal_id, 2)
        )
    return _semaphores[tribunal_id]


class SessionManager:
    def __init__(self, tribunal_id: str, credentials: Optional[dict] = None):
        self._tribunal_id = tribunal_id
        self._credentials = credentials
        self._client: Optional[httpx.AsyncClient] = None
        self._authenticated = False
        self._last_req_at: float = 0.0
        rl = RATE_LIMITS.get(tribunal_id, {"req_per_min": 10, "delay_s": 6.0})
        self._delay_s: float = rl["delay_s"]

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers=TRIBUNAL_HEADERS.get(self._tribunal_id, {}),
                follow_redirects=True,
                timeout=httpx.Timeout(30.0, connect=10.0),
                limits=httpx.Limits(
                    max_connections=5,
                    max_keepalive_connections=2,
                ),
            )
        await self._throttle()
        return self._client

    async def ensure_authenticated(self) -> None:
        if self._authenticated or not self._credentials:
            return
        await self._login()

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
        self._client = None
        self._authenticated = False

    async def _throttle(self) -> None:
        elapsed = time.monotonic() - self._last_req_at
        wait = self._delay_s - elapsed
        if wait > 0:
            await asyncio.sleep(wait)
        self._last_req_at = time.monotonic()

    async def _login(self) -> None:
        """Sobrescrever nos conectores que precisam de autenticação."""
        pass
