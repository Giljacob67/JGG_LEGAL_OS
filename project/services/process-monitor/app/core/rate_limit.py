"""Rate limiting e circuit breaker por tribunal.

Implementa:
- intervalo mínimo por tribunal
- jitter
- backoff após erro
- circuit breaker simples após N falhas consecutivas
- estado por tribunal em memória nesta fase

Não tenta contornar bloqueios.
O objetivo é proteger o escritório e os tribunais.
"""

import random
import time
from dataclasses import dataclass, field

from app.config import settings
from app.core.errors import CircuitOpenError
from app.logging_config import get_logger

logger = get_logger("core.rate_limit")


@dataclass
class _TribunalState:
    last_request_at: float = 0.0
    consecutive_failures: int = 0
    circuit_open_until: float = 0.0
    current_backoff: float = 0.0


class RateLimiter:
    """Rate limiter em memória com circuit breaker por tribunal."""

    def __init__(self) -> None:
        self._states: dict[str, _TribunalState] = {}
        self._defaults = {
            "default": settings.DEFAULT_RATE_LIMIT_SECONDS,
            "tjpr": settings.TJPR_RATE_LIMIT_SECONDS,
            "tjmt": settings.TJMT_RATE_LIMIT_SECONDS,
            "trf4": settings.TRF4_RATE_LIMIT_SECONDS,
            "trf1": settings.TRF1_RATE_LIMIT_SECONDS,
        }

    def _state(self, tribunal: str) -> _TribunalState:
        if tribunal not in self._states:
            self._states[tribunal] = _TribunalState()
        return self._states[tribunal]

    def _min_interval(self, tribunal: str) -> float:
        return self._defaults.get(tribunal, self._defaults["default"])

    def wait_if_needed(self, tribunal: str) -> float:
        """Aguarda se necessário antes de nova request. Retorna segundos esperados."""
        state = self._state(tribunal)
        now = time.time()

        # Circuit breaker
        if now < state.circuit_open_until:
            remaining = round(state.circuit_open_until - now, 2)
            raise CircuitOpenError(
                f"Circuit breaker aberto para {tribunal}. Aguarde {remaining}s",
                details={"tribunal": tribunal, "remaining_seconds": remaining},
            )

        # Rate limit base + jitter
        interval = self._min_interval(tribunal)
        jitter = random.uniform(0, interval * 0.2)
        required = interval + jitter

        elapsed = now - state.last_request_at
        if elapsed < required:
            sleep_time = required - elapsed
            logger.info(
                "rate_limit_wait",
                extra={
                    "tribunal": tribunal,
                    "wait_seconds": round(sleep_time, 2),
                },
            )
            time.sleep(sleep_time)
            return sleep_time
        return 0.0

    def record_success(self, tribunal: str) -> None:
        """Registra sucesso e reseta contadores de falha."""
        state = self._state(tribunal)
        state.last_request_at = time.time()
        state.consecutive_failures = 0
        state.current_backoff = 0.0

    def record_failure(self, tribunal: str, error_code: str | None = None) -> None:
        """Registra falha e aplica backoff/circuit breaker se necessário."""
        state = self._state(tribunal)
        state.last_request_at = time.time()
        state.consecutive_failures += 1

        # Backoff exponencial
        base = self._min_interval(tribunal)
        state.current_backoff = base * (2 ** min(state.consecutive_failures - 1, 5))

        # Circuit breaker
        if state.consecutive_failures >= settings.CIRCUIT_BREAKER_FAILURES:
            state.circuit_open_until = time.time() + settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS
            logger.warning(
                "circuit_breaker_opened",
                extra={
                    "tribunal": tribunal,
                    "failures": state.consecutive_failures,
                    "cooldown_seconds": settings.CIRCUIT_BREAKER_COOLDOWN_SECONDS,
                    "error_code": error_code,
                },
            )
        else:
            logger.info(
                "failure_recorded",
                extra={
                    "tribunal": tribunal,
                    "consecutive_failures": state.consecutive_failures,
                    "backoff_seconds": round(state.current_backoff, 2),
                    "error_code": error_code,
                },
            )

    def health(self, tribunal: str) -> dict:
        """Retorna estado atual do rate limiter para um tribunal."""
        state = self._state(tribunal)
        now = time.time()
        return {
            "tribunal": tribunal,
            "consecutive_failures": state.consecutive_failures,
            "circuit_open": now < state.circuit_open_until,
            "circuit_open_remaining_seconds": max(0, round(state.circuit_open_until - now, 2)),
            "current_backoff_seconds": round(state.current_backoff, 2),
        }
