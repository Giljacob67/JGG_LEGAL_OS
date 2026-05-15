"""Gerenciamento seguro de sessões HTTP para conectores de tribunais.

Responsabilidades:
- Criar/reutilizar httpx.AsyncClient por tribunal
- Manter cookies por sessão
- Aplicar timeout
- Headers padrão
- Retry com backoff simples
- Detectar situações de bloqueio/captcha

REGRA IMPORTANTE:
Ao detectar captcha ou bloqueio:
- NÃO tentar resolver automaticamente
- NÃO usar solver externo
- NÃO tentar contornar
- Retornar erro controlado CAPTCHA_OR_BLOCK
- Registrar log estruturado
- Sinalizar para reduzir frequência do tribunal
"""

import re
from typing import Any

import httpx

from app.core.errors import CaptchaOrBlockError, RateLimitError
from app.logging_config import get_logger

logger = get_logger("core.session_manager")

# Padrões de detecção de bloqueio no corpo da resposta
_BLOCK_PATTERNS = [
    re.compile(r"captcha", re.IGNORECASE),
    re.compile(r"recaptcha", re.IGNORECASE),
    re.compile(r"bloqueio", re.IGNORECASE),
    re.compile(r"acesso\s+negado", re.IGNORECASE),
    re.compile(r"muitas\s+requisições", re.IGNORECASE),
    re.compile(r"too\s+many\s+requests", re.IGNORECASE),
    re.compile(r"cloudflare", re.IGNORECASE),
    re.compile(r"access\s+denied", re.IGNORECASE),
]

DEFAULT_TIMEOUT = httpx.Timeout(30.0, connect=10.0)
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
}


class SessionManager:
    """Gerencia clientes HTTP por tribunal com detecção de bloqueio."""

    def __init__(self, tribunal: str) -> None:
        self.tribunal = tribunal
        self._client: httpx.AsyncClient | None = None
        self._logger = get_logger(f"session.{tribunal}")

    async def client(self) -> httpx.AsyncClient:
        """Retorna ou cria AsyncClient para o tribunal."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=DEFAULT_TIMEOUT,
                headers=DEFAULT_HEADERS,
                follow_redirects=True,
            )
            self._logger.debug("client_created")
        return self._client

    async def request(
        self,
        method: str,
        url: str,
        **kwargs: Any,
    ) -> httpx.Response:
        """Executa request com detecção de bloqueio."""
        client = await self.client()
        resp = await client.request(method, url, **kwargs)
        self._check_response(resp, url)
        return resp

    async def close(self) -> None:
        """Fecha o cliente HTTP."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None
            self._logger.debug("client_closed")

    def _check_response(self, resp: httpx.Response, url: str) -> None:
        """Detecta bloqueios, captchas e rate limits."""
        # HTTP status codes explícitos
        if resp.status_code == 429:
            raise RateLimitError(
                f"Rate limit detectado (HTTP 429) em {url}",
                details={"tribunal": self.tribunal, "url": url},
            )

        if resp.status_code == 403:
            raise CaptchaOrBlockError(
                f"Bloqueio detectado (HTTP 403) em {url}",
                details={
                    "tribunal": self.tribunal,
                    "url": url,
                    "snippet": resp.text[:500],
                },
            )

        # Detecção por padrões no corpo
        text = resp.text
        for pattern in _BLOCK_PATTERNS:
            if pattern.search(text):
                raise CaptchaOrBlockError(
                    f"Possível captcha/bloqueio detectado em {url}",
                    details={
                        "tribunal": self.tribunal,
                        "url": url,
                        "pattern": pattern.pattern,
                        "snippet": text[:500],
                    },
                )

    async def __aenter__(self) -> "SessionManager":
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()
