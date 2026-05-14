from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Banco de dados — mesmo PostgreSQL do app Next.js
    database_url: str = Field(..., description="postgresql+asyncpg://...")

    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_channel_eventos: str = "jgg:eventos"

    # MinIO
    minio_endpoint: str = "minio:9000"
    minio_access_key: str
    minio_secret_key: str
    minio_bucket_documentos: str = "documentos-tribunais"
    minio_secure: bool = False

    # Segurança
    encryption_key: str = Field(..., validation_alias="MONITORING_ENCRYPTION_KEY", description="Chave Fernet base64 para senhas de tribunal")
    api_key: str = Field(..., validation_alias="MONITORING_API_KEY", description="Chave para chamadas do app Next.js → monitoring")

    # Servidor
    host: str = "0.0.0.0"
    port: int = 8001
    log_level: str = "INFO"

    # Scheduler
    sync_ativos_intervalo_min: int = 30
    sync_arquivados_hora: int = 2
    health_check_intervalo_min: int = 15
    retry_falhas_intervalo_h: int = 1
    max_tentativas_captura: int = 3


settings = Settings()
