"""
Decoradores de resiliência para conectores de tribunal.
Usa tenacity para retry exponencial e circuit breaker simples.
"""
import functools
import logging
from typing import Callable, TypeVar

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Exceções transitivas que justificam retry
RETRY_EXCEPTIONS = (
    ConnectionError,
    TimeoutError,
    OSError,
)


def with_retry(
    max_attempts: int = 3,
    min_wait: float = 2.0,
    max_wait: float = 30.0,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorator: retry com backoff exponencial em erros de rede."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @retry(
            retry=retry_if_exception_type(RETRY_EXCEPTIONS),
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
            before_sleep=before_sleep_log(logger, logging.WARNING),
            reraise=True,
        )
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator


def with_retry_async(
    max_attempts: int = 3,
    min_wait: float = 2.0,
    max_wait: float = 30.0,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorator async: retry com backoff exponencial em erros de rede."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @retry(
            retry=retry_if_exception_type(RETRY_EXCEPTIONS),
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
            before_sleep=before_sleep_log(logger, logging.WARNING),
            reraise=True,
        )
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return async_wrapper
    return decorator
