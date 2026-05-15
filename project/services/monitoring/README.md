# JGG Monitoring Service

Serviço Python de **monitoramento processual** do JGG Legal OS.

Substitui soluções terceirizadas (LinkLei etc.) com código próprio de captura, normalização e armazenamento de andamentos e documentos judiciais.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Next.js App (porta 3000)                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │ /monitoramento│  │ Proxy API    │  │ Webhooks     │                      │
│  │ Dashboard     │  │ /api/v1/…    │  │ (recebe)     │                      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                      │
└─────────┼─────────────────┼─────────────────┼───────────────────────────────┘
          │                 │                 │
          │ HTTP            │ HTTP            │ POST
          │                 │                 │
┌─────────┼─────────────────┼─────────────────┼───────────────────────────────┐
│  Monitoring Service (porta 8001)                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ FastAPI                                                                ││
│  │  ├── GET  /health               → status do serviço                    ││
│  │  ├── GET  /health/tribunais     → status dos tribunais               ││
│  │  ├── POST /sync/{cnj}           → captura manual                     ││
│  │  ├── GET  /sync/status/{cnj}    → última captura                     ││
│  │  ├── GET  /documentos/{cnj}     → lista documentos                   ││
│  │  ├── GET  /metrics              → métricas 24h                       ││
│  │  └── POST /config/{cnj}         → configura frequência               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ APScheduler                                                            ││
│  │  ├── sync_processos_ativos    → a cada 30min (em_andamento, suspenso) ││
│  │  ├── sync_processos_arquivados→ 1x/dia às 02:00 (arquivado, encerrado)││
│  │  ├── retry_capturas_falhas    → a cada 1h (máx 3 tentativas)          ││
│  │  └── health_check_tribunais   → a cada 15min                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ TJPR     │  │ TJMT     │  │ TRF4     │  │ TRF1     │  │ + tribunais  │ │
│  │ ProJUDI  │  │ PJe      │  │ eproc    │  │ PJe      │  │   futuros    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
          │                 │
          │ asyncpg         │ redis
          │                 │
┌─────────┼─────────────────┼─────────────────────────────────────────────────┐
│  PostgreSQL (schema public + monitoring)                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ public.Processo  → dados principais (Prisma)                          │ │
│  │ public.Andamento → andamentos (Prisma)                                │ │
│  │ public.ProcessoFonte → status de sync por fonte (Prisma)              │ │
│  │ monitoring.captura_execucao      → log de execuções                   │ │
│  │ monitoring.documento_capturado   → metadados de documentos            │ │
│  │ monitoring.processo_config       → frequência/pausa por processo      │ │
│  │ monitoring.tribunal_credencial   → credenciais criptografadas         │ │
│  │ monitoring.andamento_tipo_regra  → regras de normalização             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          │ MinIO / S3
          │
┌─────────┼───────────────────────────────────────────────────────────────────┐
│  Object Storage                                                            │
│  bucket: documentos-tribunais                                              │
│  key:    processos/{cnj}/{tribunal_id}_{id_doc}.pdf                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tecnologias

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| API / Jobs | FastAPI + APScheduler | Assíncrono nativo, leve, fácil de manter |
| HTTP | httpx | Async, http/2, bem mantido |
| Parsing HTML | BeautifulSoup4 + lxml | Robusto, tolerante a HTML malformado |
| Banco | asyncpg + SQLAlchemy/Alembic | Performance, migrations versionadas |
| Storage | MinIO (S3-compatível) | Open source, self-hosted, barato |
| Fila / PubSub | Redis | Leve, já usado pelo Next.js |
| Logs | python-json-logger | Estruturado, pronto para Loki/ELK |
| Resiliência | tenacity | Retry, backoff, circuit breaker |

---

## Conectores de Tribunal

| Tribunal | Sistema | Status | Autenticação |
|----------|---------|--------|--------------|
| TJPR | ProJUDI | ✅ Parse validado contra HTML real | Pública |
| TJMT | PJe | ✅ Herda PJeBaseConnector | Pública |
| TRF4 | eproc | ✅ Parse de tabela de eventos | Pública |
| TRF1 | PJe | ✅ Herda PJeBaseConnector | Pública |

Cada conector herda de `TribunalConnector` (ABC) e implementa:
- `buscar_processo(cnj)` → `ResultadoCaptura`
- `buscar_andamentos(cnj, desde)` → `list[AndamentoCapturado]`
- `buscar_documentos(cnj)` → `list[DocumentoCapturado]`

---

## Normalização de Andamentos

Regras regex em `normalizer/movements.py` classificam eventos brutos em tipos unificados:

- `sentenca`, `acordao`, `decisao_interlocutoria`, `despacho`
- `audiencia`, `citacao`, `intimacao`, `peticao`
- `arquivamento`, `distribuicao`, `constricao` (penhora/bloqueio)
- `tutela`, `extincao`, `transito_julgado`

Cada regra define se o evento é **crítico** (gera notificação) e se muda o **status do processo**.

---

## Agendamento

| Job | Frequência | Lógica |
|-----|-----------|--------|
| `sync_processos_ativos` | A cada 30min | Processos `em_andamento` e `suspenso` |
| `sync_processos_arquivados` | 1x/dia às 02:00 | Processos `arquivado` e `encerrado` |
| `retry_capturas_falhas` | A cada 1h | Re-tenta falhas nas últimas 24h (máx 3x) |
| `health_check_tribunais` | A cada 15min | Verifica se sites dos tribunais respondem |

A frequência por processo pode ser override via `/config/{cnj}`:
- `rapida` → a cada 5min
- `normal` → a cada 30min (padrão)
- `lenta` → a cada 24h
- `pausa` → desliga

---

## Segurança

- Todas as rotas (exceto `/health`) exigem header `X-API-Key`
- Credenciais de tribunal criptografadas com Fernet (`MONITORING_ENCRYPTION_KEY`)
- Rate limiting por tribunal no `SessionManager` (delay + semáforo)
- Semáforo global limita capturas simultâneas por tribunal

---

## Eventos

### Redis Pub/Sub
Canal `jgg:eventos` recebe JSON:
```json
{
  "tipo": "andamentos_novos",
  "cnj": "0001234-56.2026.8.16.0001",
  "tribunal": "tjpr",
  "quantidade": 3,
  "criticos": 1,
  "andamentos_criticos": [{"data": "2026-05-15", "evento": "Sentença"}],
  "timestamp": "2026-05-15T14:30:00+00:00"
}
```

### Webhook (opcional)
Se `WEBHOOK_URL` estiver configurado, eventos também são POSTados para o Next.js com assinatura HMAC-SHA256.

---

## Desenvolvimento

```bash
cd project/services/monitoring

# 1. Copie e edite as variáveis de ambiente
cp .env.example .env

# 2. Instale dependências
pip install -e ".[dev]"

# 3. Rode migrações
alembic upgrade head

# 4. Execute
uvicorn main:app --reload --port 8001

# 5. Testes
pytest tests/ -v
```

## Docker

```bash
# Subir monitoring + minio + redis
docker-compose up --build

# Apenas o serviço
docker build -t jgg-monitoring .
docker run -p 8001:8001 --env-file .env jgg-monitoring
```

---

## Roadmap / Próximos Passos

1. **Autenticação avançada**: login OAB/certificado digital nos tribunais que exigem
2. **Playwright**: fallback para tribunais que bloqueiam HTTP puro (captchas complexos)
3. **Mais tribunais**: TJRS, TJSP, TRF3 (prioridade conforme carteira JGG)
4. **ML de classificação**: substituir regex por modelo leve de NLP para classificação de eventos
5. **Dashboard avançado**: gráficos de volume, taxa de sucesso, tempo médio de resposta
