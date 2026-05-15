"""Testes do rate limiter e circuit breaker."""

import time

import pytest

from app.core.errors import CircuitOpenError
from app.core.rate_limit import RateLimiter


class TestRateLimiter:
    def test_respeita_intervalo_minimo(self):
        rl = RateLimiter()
        rl._defaults["test_tribunal"] = 0.5
        start = time.time()
        rl.wait_if_needed("test_tribunal")
        # Primeira vez não espera
        assert time.time() - start < 0.1

    def test_aguarda_segunda_request(self):
        rl = RateLimiter()
        rl._defaults["test_tribunal"] = 0.3
        rl.record_success("test_tribunal")
        start = time.time()
        rl.wait_if_needed("test_tribunal")
        elapsed = time.time() - start
        assert elapsed >= 0.2  # deve ter esperado pelo menos parte do intervalo

    def test_backoff_apos_falha(self):
        rl = RateLimiter()
        rl._defaults["test_tribunal"] = 0.1
        rl.record_failure("test_tribunal")
        state = rl._state("test_tribunal")
        assert state.consecutive_failures == 1
        assert state.current_backoff == 0.1

        rl.record_failure("test_tribunal")
        assert state.consecutive_failures == 2
        assert state.current_backoff == 0.2

    def test_circuit_breaker_abre_apos_n_falhas(self):
        rl = RateLimiter()
        rl._defaults["test_tribunal"] = 0.01
        # Forçar circuit breaker com poucas falhas para teste
        for _ in range(5):
            rl.record_failure("test_tribunal")

        with pytest.raises(CircuitOpenError):
            rl.wait_if_needed("test_tribunal")

    def test_circuit_breaker_fecha_apos_cooldown(self):
        rl = RateLimiter()
        rl._defaults["test_tribunal"] = 0.01
        for _ in range(5):
            rl.record_failure("test_tribunal")

        # Simular passagem do tempo
        state = rl._state("test_tribunal")
        state.circuit_open_until = time.time() - 1

        # Deve permitir agora
        rl.wait_if_needed("test_tribunal")

    def test_sucesso_reseta_falhas(self):
        rl = RateLimiter()
        rl._defaults["test_tribunal"] = 0.01
        rl.record_failure("test_tribunal")
        rl.record_failure("test_tribunal")
        assert rl._state("test_tribunal").consecutive_failures == 2
        rl.record_success("test_tribunal")
        assert rl._state("test_tribunal").consecutive_failures == 0
