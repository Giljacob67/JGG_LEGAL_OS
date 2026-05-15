# JGG Process Monitor

Serviço isolado de monitoramento processual e conectores de tribunais do **JGG Legal OS**.

## Objetivo

Capturar, armazenar e sincronizar dados processuais de tribunais brasileiros de forma **segura, auditável e respeitosa** com os limites dos sistemas de justiça.

Este serviço é **independente** do app Next.js. Não substitui `/processos` nem `/processos-v2`.

## Arquitetura

```
app/
  api/          — FastAPI endpoints
  connectors/   — Interface + DataJud + stubs
  core/         — CNJ, rate limit, session manager, storage
  models/       — Pydantic schemas + enums
  persistence/  — PostgreSQL schema + repositories
  workers/      — RQ jobs
```

## Tecnologias

- Python 3.12+
- FastAPI + Uvicorn
- Pydantic
- httpx
- PostgreSQL + psycopg2
- Redis + RQ
- pytest + respx

> **Por que RQ nesta fase?**
> RQ foi escolhido por simplicidade operacional — pouca configuração, visibilidade direta via Redis, e facilidade de debug. Se no futuro houver necessidade de orquestração complexa, retries distribuídos, agendamento avançado e múltiplos workers especializados, **Celery pode ser adotado** sem quebra de contratos.

## Como rodar

### Local (sem Docker)

```bash
cd project/services/process-monitor
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

cp .env.example .env
# Editar .env conforme necessário

# Subir PostgreSQL e Redis localmente (ou usar docker-compose apenas para infra)
# Rodar a API:
uvicorn app.main:app --reload --port 8001
```

### Com Docker Compose

```bash
cd project/services/process-monitor
cp .env.example .env
# Editar .env se necessário

docker-compose up --build
```

A API estará em `http://localhost:8001`.

## Endpoints principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Healthcheck do serviço |
| GET | `/connectors` | Lista conectores registrados |
| GET | `/connectors/{id}/health` | Health de um conector |
| POST | `/monitoramento/processos` | Enfileira sync de processo |
| POST | `/monitoramento/processos/{id}/sincronizar` | Força re-sync |
| GET | `/monitoramento/processos/{id}/andamentos` | Lista andamentos (stub) |
| GET | `/monitoramento/processos/{id}/documentos` | Lista documentos (stub) |
| GET | `/monitoramento/jobs/{job_id}` | Status de job na fila |

## Conectores

| Conector | Tribunal | Sistema | Status |
|----------|----------|---------|--------|
| `datajud` | TJPR, TJMT, TRF4, TRF1, TJRS, TJSP, TRF3 | API Pública CNJ | **Ativo (metadados)** |
| `tjpr_stub` | TJPR | ProJUDI | Stub |
| `tjmt_stub` | TJMT | PJe | Stub |
| `trf4_stub` | TRF4 | e-Proc | Stub |
| `trf1_stub` | TRF1 | PJe | Stub |

### DataJud

- Fonte **auxiliar** de metadados públicos.
- Fornece: capa do processo, movimentações, partes.
- **NÃO** fornece documentos/autos.
- **NÃO** substitui conectores oficiais.

### Stubs

- Quando `MOCK_CONNECTORS=true`: retornam dados mockados para testes.
- Quando `MOCK_CONNECTORS=false`: retornam `NOT_IMPLEMENTED`.
- Scraping real será implementado em fases futuras, tribunal por tribunal, com revisão de conformidade.

## Política de uso seguro

1. **NÃO** implementamos scraping indevido.
2. **NÃO** fazemos bypass de captcha.
3. **NÃO** usamos solvers automáticos de captcha.
4. **NÃO** automatizamos login em sistemas que proíbam.
5. **NÃO** baixamos autos ou documentos protegidos sem autorização.
6. Respeitamos rate limits e circuit breakers.
7. DataJud é usado apenas para metadados públicos.

## Testes

```bash
cd project/services/process-monitor
pytest -v
```

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379/1` | Redis para RQ |
| `DATAJUD_API_KEY` | — | API Key DataJud |
| `MOCK_CONNECTORS` | `true` | Stubs retornam mocks |
| `LOG_LEVEL` | `INFO` | Nível de log |
| `LOG_JSON` | `true` | Logs em JSON |
| `DEFAULT_RATE_LIMIT_SECONDS` | `5.0` | Intervalo base |
| `CIRCUIT_BREAKER_FAILURES` | `5` | Falhas para abrir circuito |
| `CIRCUIT_BREAKER_COOLDOWN_SECONDS` | `300` | Tempo de cooldown |

## Modelo de dados

Ver `app/persistence/schema.sql`.

Tabelas com prefixo `monitoring_`:
- `monitoring_process` — processos monitorados
- `monitoring_process_source` — fontes de sync
- `monitoring_movement` — andamentos
- `monitoring_document` — documentos
- `monitoring_capture_run` — execuções de captura
- `monitoring_raw_snapshot` — snapshots brutos
- `monitoring_connector_health` — saúde dos conectores

## Próximos passos sugeridos

1. Implementar conector TJPR (ProJUDI) com login OAB e parser.
2. Implementar conector TJMT (PJe) com autenticação.
3. Adicionar webhook para notificar o app Next.js sobre novas movimentações.
4. Integrar com `/processos-v2` para exibir dados capturados.
5. Adicionar agendamento de jobs (active, retry, healthcheck).
6. Avaliar migração para Celery se escala exigir.
