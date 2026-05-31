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
  core/         — CNJ, rate limit, session manager, normalization
  models/       — Pydantic schemas + enums
  persistence/  — PostgreSQL + SQLAlchemy 2.0 + repositories
  workers/      — RQ jobs
```

## Tecnologias

- Python 3.12+
- FastAPI + Uvicorn
- Pydantic + Pydantic Settings
- httpx
- PostgreSQL + SQLAlchemy 2.0
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

# Em outro terminal, rodar o worker RQ:
source .venv/bin/activate
rq worker --url redis://localhost:6379/1
```

### Com Docker Compose

```bash
cd project/services/process-monitor
cp .env.example .env
# Editar .env se necessário

docker-compose up --build
```

A API estará em `http://localhost:8001`.

## Configurar DataJud

1. Obtenha uma API Key em: https://api-publica.datajud.cnj.jus.br
2. Adicione ao `.env`:

```env
DATAJUD_API_KEY="sua-api-key-aqui"
DATAJUD_BASE_URL="https://api-publica.datajud.cnj.jus.br"
DATAJUD_DEFAULT_ALIASES="api_publica_tjpr,api_publica_tjmt,api_publica_trf4,api_publica_trf1"
DATAJUD_TIMEOUT_SECONDS=20
```

3. Teste com curl:

```bash
curl -X POST http://localhost:8001/monitoramento/processos \
  -H "Content-Type": "application/json" \
  -d '{"numero_cnj":"0003537-95.2026.8.16.0058","tribunal":"tjpr","prioridade":"normal"}'
```

## Endpoints principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Healthcheck do serviço |
| GET | `/connectors` | Lista conectores registrados |
| GET | `/connectors/{id}/health` | Health de um conector (live=false por padrão) |
| POST | `/monitoramento/processos` | Cria processo monitorado e enfileira sync |
| POST | `/monitoramento/processos/{id}/sincronizar` | Força re-sync |
| GET | `/monitoramento/processos/{id}/andamentos` | Lista andamentos persistidos |
| GET | `/monitoramento/processos/{id}/documentos` | Lista documentos (vazio nesta fase) |
| GET | `/monitoramento/processos/{id}/capturas` | Histórico de execuções de captura |
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
- Aliases configuráveis via `DATAJUD_DEFAULT_ALIASES`.
- Timeout configurável via `DATAJUD_TIMEOUT_SECONDS`.

### Stubs

- Quando `MOCK_CONNECTORS=true`: retornam dados mockados para testes.
- Quando `MOCK_CONNECTORS=false`: retornam `NOT_IMPLEMENTED`.
- Scraping real será implementado em fases futuras, tribunal por tribunal, com revisão de conformidade.

## Persistência

O serviço usa **SQLAlchemy 2.0** com modelos declarativos. As tabelas são criadas automaticamente na inicialização (`Base.metadata.create_all`).

Tabelas principais:
- `monitoring_process` — processos monitorados
- `monitoring_process_source` — fontes de sync por processo
- `monitoring_movement` — andamentos (com hash único para deduplicação)
- `monitoring_capture_run` — execuções de captura com stats
- `monitoring_raw_snapshot` — snapshots brutos dos payloads
- `monitoring_connector_health` — saúde dos conectores

## Pipeline de sync

```
POST /monitoramento/processos
  ↓
enfileira job RQ: sync_process
  ↓
worker executa:
  1. Cria monitoring_capture_run (running)
  2. Busca/cria monitoring_process
  3. Chama DataJudConnector
  4. Salva raw_snapshot
  5. Salva/atualiza process_source
  6. Normaliza e insere movimentos (hash evita duplicidade)
  7. Atualiza metadata do processo
  8. Finaliza capture_run (success/partial/failed)
```

## Normalização de movimentos

Movimentações são normalizadas heurísticamente em tipos padronizados:

- `distribuicao`, `decisao`, `despacho`, `sentenca`, `acordao`
- `intimacao`, `audiencia`, `juntada`, `peticao`, `certidao`
- `arquivamento`, `transito_julgado`, `outro`

E o status do processo é inferido:
- `em_andamento`, `sentenca`, `recurso`, `arquivado`, `transito_julgado`, `suspenso`, `desconhecido`

> A normalização é heurística inicial e deve evoluir para mapeamento configurável por tribunal/código CNJ.

## Política de uso seguro (Conformidade Jurídica - Premium)

**AVISO LEGAL CRÍTICO (obrigatório antes de produção):**

Este serviço foi projetado com **máxima prioridade em conformidade jurídica e proteção de dados**.

**Antes de habilitar qualquer conector real de scraping (diferente de DataJud):**

1. Obtenha **parecer jurídico formal** por advogado especializado em direito digital, proteção de dados (LGPD) e direito processual.
2. Revise os Termos de Serviço e políticas de cada Tribunal (a maioria proíbe explicitamente acesso automatizado não autorizado).
3. Avalie riscos de LGPD (dados de terceiros em autos públicos ainda podem configurar tratamento).
4. Só proceda após aprovação formal do sócio responsável e, se aplicável, consulta à OAB.

**Regras técnicas invioláveis:**

1. **NÃO** implementamos scraping indevido.
2. **NÃO** fazemos bypass de captcha ou qualquer mecanismo de proteção.
3. **NÃO** usamos solvers, serviços terceiros ou automação para contornar bloqueios.
4. **NÃO** automatizamos login em sistemas que proíbam acesso programático.
5. **NÃO** baixamos autos completos ou documentos protegidos sem autorização explícita do titular e do sistema.
6. Respeitamos rigorosamente rate limits, circuit breakers e janelas de menor carga dos tribunais.
7. DataJud é usado **exclusivamente** para metadados públicos (nunca como fonte primária de autos).

Qualquer desvio deve ser documentado, aprovado por sócio e registrado em AuditLog com justificativa.

**Recomendação para nível Premium:** Mantenha `MOCK_CONNECTORS=true` ou `MODE=fixtures` até que todos os pareceres jurídicos, políticas internas de compliance e (quando aplicável) acordos com os Tribunais estejam formalizados.

## Testes

```bash
cd project/services/process-monitor
pytest -v
```

Cobertura atual:
- CNJ: validação, normalização, formatação
- Conectores: contrato, stubs mock/NOT_IMPLEMENTED, DataJud com mocks HTTP
- SessionManager: detecção de 403, 429, captcha
- RateLimiter: intervalo, backoff, circuit breaker
- Normalização: tipos de movimentação, status do processo, hash

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379/1` | Redis para RQ |
| `DATAJUD_API_KEY` | — | API Key DataJud |
| `DATAJUD_DEFAULT_ALIASES` | `api_publica_tjpr,...` | Aliases para consulta |
| `DATAJUD_TIMEOUT_SECONDS` | `20` | Timeout DataJud |
| `MOCK_CONNECTORS` | `true` | Stubs retornam mocks |
| `LOG_LEVEL` | `INFO` | Nível de log |
| `LOG_JSON` | `true` | Logs em JSON |
| `DEFAULT_RATE_LIMIT_SECONDS` | `5.0` | Intervalo base |
| `CIRCUIT_BREAKER_FAILURES` | `5` | Falhas para abrir circuito |
| `CIRCUIT_BREAKER_COOLDOWN_SECONDS` | `300` | Tempo de cooldown |

## Limitações

1. **DataJud apenas metadados**: não fornece documentos/autos.
2. **Documentos não implementados**: captura de documentos é stub.
3. **Conectores reais pendentes**: TJPR, TJMT, TRF4, TRF1 ainda não implementados.
4. **Agendamento básico**: jobs são enfileirados manualmente; agendamento automático é stub.
5. **Normalização heurística**: pode evoluir para mapeamento por código CNJ.
6. **Webhook não implementado**: notificações para o app Next.js ainda não existem.

## Próximos passos sugeridos

1. Implementar conector TJPR (ProJUDI) com login OAB e parser.
2. Adicionar webhook para notificar o app Next.js sobre novas movimentações.
3. Persistir vínculo entre processo local e monitoramento no Prisma do app web.
4. Implementar agendamento automático (processos ativos a cada 30-60 min).
5. Adicionar painel administrativo de jobs e falhas.
6. Avaliar migração para Celery se escala exigir.
