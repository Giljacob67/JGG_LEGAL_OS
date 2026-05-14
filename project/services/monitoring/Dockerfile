FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir \
    "fastapi>=0.115" \
    "uvicorn[standard]>=0.32" \
    "httpx>=0.28" \
    "beautifulsoup4>=4.13" \
    "lxml>=5.3" \
    "asyncpg>=0.30" \
    "redis>=5.2" \
    "minio>=7.2" \
    "pydantic>=2.10" \
    "pydantic-settings>=2.7" \
    "apscheduler>=3.10,<4.0" \
    "alembic>=1.14" \
    "sqlalchemy>=2.0" \
    "cryptography>=44" \
    "python-json-logger>=3.2" \
    "tenacity>=9.0" \
    "psycopg2-binary>=2.9"

COPY . .
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

CMD ["/entrypoint.sh"]
