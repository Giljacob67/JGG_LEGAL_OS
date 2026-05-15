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
| GET | `/api/internal/process-monitor/processes/{id}/documents` | `processo_view` | Documentos |

## Componentes

| Componente | Localização | Uso |
|------------|-------------|-----|
| `ProcessMonitorStatusBadge` | `components/processos-v2/process-monitor-status.tsx` | Badge de saúde do serviço |
| `ProcessMonitorConnectors` | `components/processos-v2/process-monitor-connectors.tsx` | Tabela de conectores |
| `ProcessoMonitorPanel` | `components/processos-v2/processo-monitor-panel.tsx` | Painel no detalhe do processo |

## Páginas integradas

| Página | O que mostra |
|--------|--------------|
| `/processos-v2` | Badge de saúde do monitoramento no header |
| `/processos-v2/[id]` | Painel de monitoramento externo na coluna lateral |
| `/processos-v2/monitoramento` | Página dedicada: saúde, conectores, formulário manual |

## Como rodar local

1. Subir o process-monitor:
```bash
cd project/services/process-monitor
source .venv/bin/activate
uvicorn app.main:app --port 8001
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

## Limitações

1. **Stubs ativos**: Conectores reais de tribunais ainda não implementados.
2. **DataJud**: Fonte auxiliar de metadados públicos apenas.
3. **Sem scraping**: Nenhuma automação de login, captcha ou download de autos.
4. **Polling simples**: O painel de detalhe faz polling leve de job por 30s.
5. **Não persiste estado no app web**: O link entre processo local e monitoramento ainda é volátil.

## Próximos passos

1. Implementar primeiro conector real autorizado (ex: TJPR ProJUDI com login OAB).
2. Adicionar webhook do process-monitor → Next.js para notificar novas movimentações.
3. Persistir `monitoringExternalId` no modelo `Processo` do Prisma.
4. Melhorar agendamento de jobs (Celery ou APScheduler avançado).
5. Adicionar histórico de sync na UI com timeline.
