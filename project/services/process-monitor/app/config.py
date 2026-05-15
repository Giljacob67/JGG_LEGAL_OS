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
    DATAJUD_DEFAULT_ALIASES: str = "api_publica_tjpr,api_publica_tjmt,api_publica_trf4,api_publica_trf1"
    DATAJUD_TIMEOUT_SECONDS: float = 20.0

    # TJPR Connector Piloto
    TJPR_CONNECTOR_ENABLED: bool = False
    TJPR_CONNECTOR_MODE: str = "fixtures"
    TJPR_PUBLIC_SEARCH_URL: str | None = None
    TJPR_PUBLIC_SEARCH_METHOD: str = "GET"  # GET | POST
    TJPR_PUBLIC_SEARCH_HEADERS: str | None = None  # JSON string, ex: '{"User-Agent":"..."}'
    TJPR_RATE_LIMIT_SECONDS: float = 10.0
    TJPR_TIMEOUT_SECONDS: float = 20.0
    TJPR_USE_PLAYWRIGHT: bool = False
    TJPR_FIXTURES_DIR: str = "tests/fixtures/tjpr"

    # TRF4 Connector Piloto
    TRF4_CONNECTOR_ENABLED: bool = False
    TRF4_CONNECTOR_MODE: str = "fixtures"
    TRF4_PUBLIC_SEARCH_URL: str | None = None
    TRF4_PUBLIC_SEARCH_METHOD: str = "GET"
    TRF4_PUBLIC_SEARCH_HEADERS: str | None = None
    TRF4_RATE_LIMIT_SECONDS: float = 10.0
    TRF4_TIMEOUT_SECONDS: float = 20.0
    TRF4_FIXTURES_DIR: str = "tests/fixtures/trf4"

    # Webhooks
    WEBHOOK_NEW_MOVEMENTS_ENABLED: bool = False
    WEBHOOK_NEW_MOVEMENTS_URL: str | None = None
    WEBHOOK_NEW_MOVEMENTS_HEADERS: str | None = None  # JSON string
    WEBHOOK_NEW_MOVEMENTS_KEY: str | None = None  # X-Webhook-Key para app web

    # Fallback
    ENABLE_DATAJUD_FALLBACK: bool = True

    # Scheduler
    SCHEDULER_SYNC_ENABLED: bool = False
    SCHEDULER_SYNC_INTERVAL_MINUTES: int = 60
    SCHEDULER_HEALTHCHECK_ENABLED: bool = True
    SCHEDULER_HEALTHCHECK_INTERVAL_MINUTES: int = 30

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
