"""Configuração centralizada do serviço process-monitor."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    SERVICE_NAME: str = "process-monitor"
    DEBUG: bool = False
    PORT: int = 8001

    # PostgreSQL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/process_monitor"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/1"

    # DataJud
    DATAJUD_API_KEY: str | None = None
    DATAJUD_BASE_URL: str = "https://api-publica.datajud.cnj.jus.br"

    # Rate limits (segundos)
    DEFAULT_RATE_LIMIT_SECONDS: float = 5.0
    TJPR_RATE_LIMIT_SECONDS: float = 10.0
    TJMT_RATE_LIMIT_SECONDS: float = 10.0
    TRF4_RATE_LIMIT_SECONDS: float = 10.0
    TRF1_RATE_LIMIT_SECONDS: float = 10.0

    # Circuit breaker
    CIRCUIT_BREAKER_FAILURES: int = 5
    CIRCUIT_BREAKER_COOLDOWN_SECONDS: float = 300.0

    # Conectores
    MOCK_CONNECTORS: bool = True

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_JSON: bool = True


settings = Settings()
