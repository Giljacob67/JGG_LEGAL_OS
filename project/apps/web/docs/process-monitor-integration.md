# Integração App Web ⇄ Process Monitor

## Arquitetura

```
Browser
   ↓
Next.js App (client component)
   ↓
/api/internal/process-monitor/*  (Route Handler — server-side)
   ↓
lib/process-monitor/client.ts    ("use server" — server-only)
   ↓
HTTP + X-Internal-API-Key
   ↓
process-monitor (FastAPI Python)  :8001
   ↓
DataJud API / stubs
```

**Regra de ouro:** O browser nunca fala diretamente com o serviço Python. Tudo passa pelas rotas proxy internas do Next.js, que aplicam autenticação Clerk e permissões.

## Variáveis de ambiente

Adicione ao `.env` do app web:

```env
PROCESS_MONITOR_ENABLED="true"
PROCESS_MONITOR_URL="http://localhost:8001"
PROCESS_MONITOR_API_KEY="change-this-internal-api-key-for-process-monitor"
PROCESS_MONITOR_TIMEOUT_MS="10000"
```

| Variável | Descrição |
|----------|-----------|
| `PROCESS_MONITOR_ENABLED` | Liga/desliga a integração |
| `PROCESS_MONITOR_URL` | URL base do serviço Python |
| `PROCESS_MONITOR_API_KEY` | Chave compartilhada entre Next.js e Python |
| `PROCESS_MONITOR_TIMEOUT_MS` | Timeout das requisições HTTP |

## Endpoints proxy

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/api/internal/process-monitor/health` | `processo_view` | Saúde do serviço |
| GET | `/api/internal/process-monitor/connectors` | `processo_view` | Lista conectores |
| GET | `/api/internal/process-monitor/connectors/{id}/health` | `processo_view` | Saúde de um conector |
| POST | `/api/internal/process-monitor/processes` | `processo_create` ou `processo_edit` | Cadastrar processo |
| POST | `/api/internal/process-monitor/processes/{id}/sync` | `processo_edit` | Forçar sync |
| GET | `/api/internal/process-monitor/jobs/{id}` | `processo_view` | Status de job |
| GET | `/api/internal/process-monitor/processes/{id}/movements` | `processo_view` | Andamentos |
| GET | `/api/internal/process-monitor/processes/{id}/documents` | `processo_view` | Documentos (vazio) |
| GET | `/api/internal/process-monitor/processes/{id}/captures` | `processo_view` | Histórico de capturas |

## Componentes

| Componente | Localização | Uso |
|------------|-------------|-----|
| `ProcessMonitorStatusBadge` | `components/processos-v2/process-monitor-status.tsx` | Badge de saúde do serviço |
| `ProcessMonitorConnectors` | `components/processos-v2/process-monitor-connectors.tsx` | Tabela de conectores |
| `ProcessoMonitorPanel` | `components/processos-v2/processo-monitor-panel.tsx` | Painel no detalhe do processo (sync, job, andamentos, capturas) |

## Páginas integradas

| Página | O que mostra |
|--------|--------------|
| `/processos-v2` | Badge de saúde do monitoramento no header |
| `/processos-v2/[id]` | Painel de monitoramento externo na coluna lateral com andamentos, capturas e botão de sync |
| `/processos-v2/monitoramento` | Página dedicada: saúde, conectores, formulário manual de teste |

## Fluxo ponta a ponta

### 1. Cadastrar processo para monitoramento

```bash
curl -X POST http://localhost:3000/api/internal/process-monitor/processes \
  -H "Content-Type: application/json" \
  -d '{"numero_cnj":"0003537-95.2026.8.16.0058","tribunal":"tjpr","prioridade":"normal"}'
```

Resposta:
```json
{
  "ok": true,
  "process_id": "...",
  "job_id": "...",
  "status": "queued"
}
```

### 2. Acompanhar job

```bash
curl http://localhost:3000/api/internal/process-monitor/jobs/{job_id}
```

### 3. Ver andamentos

```bash
curl http://localhost:3000/api/internal/process-monitor/processes/{id}/movements
```

### 4. Ver capturas

```bash
curl http://localhost:3000/api/internal/process-monitor/processes/{id}/captures
```

## Como rodar local

1. Subir o process-monitor (API + Worker + PostgreSQL + Redis):

```bash
cd project/services/process-monitor
cp .env.example .env
# Editar .env com DATAJUD_API_KEY, DATABASE_URL, REDIS_URL
docker-compose up --build
```

Ou manualmente:
```bash
cd project/services/process-monitor
source .venv/bin/activate
uvicorn app.main:app --port 8001
# Em outro terminal:
rq worker --url redis://localhost:6379/1
```

2. Garantir que `.env` do app web tenha:
```env
PROCESS_MONITOR_ENABLED=true
PROCESS_MONITOR_URL=http://localhost:8001
PROCESS_MONITOR_API_KEY=same-key-as-python-service
```

3. Rodar o app web:
```bash
cd project/apps/web
npm run dev
```

4. Acessar:
- http://localhost:3000/processos-v2 → ver badge
- http://localhost:3000/processos-v2/monitoramento → painel completo
- http://localhost:3000/processos-v2/{id} → painel no detalhe

## Como testar com serviço offline

Defina `PROCESS_MONITOR_ENABLED=false` ou pare o serviço Python.

Comportamento esperado:
- Badge mostra "Monitoramento desativado" ou "Offline"
- Botão "Sincronizar agora" fica desabilitado
- Páginas não quebram
- APIs retornam `ok: false` com código apropriado

## Troubleshooting

### DataJud sem API key
- O healthcheck retorna `status: "not_configured"`
- O badge mostra "DataJud não configurado"
- Cadastrar processo retorna erro controlado

### Job não finaliza
- Verifique se o worker RQ está rodando: `rq worker --url redis://localhost:6379/1`
- Verifique logs do worker
- Verifique se Redis está acessível

### Sem andamentos
- Pode ser que o processo não exista no DataJud para os aliases configurados
- Verifique `GET /monitoramento/processos/{id}/capturas` para ver o histórico de tentativas
- DataJud cobre apenas processos de tribunais que disponibilizam API pública

### Processo não encontrado
- DataJud pode não ter o processo indexado ainda
- O CNJ pode estar incorreto
- O tribunal pode não disponibilizar API pública

## Limitações

1. **DataJud apenas metadados**: não fornece documentos/autos.
2. **Stubs ativos**: Conectores reais de tribunais ainda não implementados.
3. **Polling simples**: O painel de detalhe faz polling leve de job por 30s.
4. **Não persiste estado no app web**: O link entre processo local e monitoramento ainda é volátil.
5. **Webhook não implementado**: Notificações automáticas de novas movimentações ainda não existem.

## Próximos passos

1. Implementar primeiro conector real autorizado (ex: TJPR ProJUDI com login OAB).
2. Adicionar webhook do process-monitor → Next.js para notificar novas movimentações.
3. Persistir `monitoringExternalId` no modelo `Processo` do Prisma.
4. Melhorar agendamento de jobs (Celery ou APScheduler avançado).
5. Adicionar histórico de sync na UI com timeline.
