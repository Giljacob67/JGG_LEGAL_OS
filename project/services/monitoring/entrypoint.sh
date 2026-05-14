#!/bin/bash
set -e

echo "Rodando migrações Alembic..."
alembic upgrade head

echo "Iniciando uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port 8001
