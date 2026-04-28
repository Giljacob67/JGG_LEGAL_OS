# JGG Legal OS — Plano de Arquitetura e Implementação

## 1. Diagnóstico do Estado Atual

### O que já funciona bem
- Schema Prisma com 11 models, 8 enums, relations corretas, AuditLog presente
- Shell completo (sidebar, topbar, tema dark/light)
- Processos: lista real do banco + busca DataJud integrada
- Agenda/Prazos: lista real + 3 visualizações (kanban, lista, calendário)
- Financeiro: dados reais (contratos, faturas, timesheet)
- Documentos: lista real, mas upload é placeholder e editor é mock
- Autenticação Clerk ativa protegendo rotas
- Seed básico funcional (2 users, 4 clientes, 3 processos, 4 prazos)

### O que está quebrado ou incompleto
- **Clientes**: página vazia (placeholder)
- **Relatórios/BI**: página vazia
- **Blueprint**: página vazia
- **Dashboard**: KPIs hardcoded, não consulta o banco
- **IA**: interface bonita mas só Ollama Cloud é real; demais providers mock
- **Auth**: sem sincronização Clerk ↔ Prisma (User.clerkId existe mas não é populado)
- **RBAC**: schema tem enum `Role` mas não há controle de acesso por permissão
- **Docker**: inexistente
- **Testes**: inexistentes
- **Google Workspace**: inexistente (Drive, Gmail, Calendar)
- **API Routes**: apenas `/api/datajud`, nenhum CRUD próprio

---

## 2. Arquitetura Proposta

### Stack (mantendo o que funciona)
- **Frontend**: Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn/ui
- **Backend**: Next.js Route Handlers (API dentro do App Router)
- **Banco**: PostgreSQL via Prisma ORM
- **Auth**: Clerk (já configurado) + sync para Prisma
- **Filas**: Redis + BullMQ (para jobs de sincronização, notificações)
- **Storage**: Google Drive (OAuth 2.0) para arquivos; metadados no banco
- **IA**: Camada abstrata `AIService` + provider real (OpenAI) + mock para dev
- **Deploy**: Docker Compose para dev local; Vercel para produção

### Estrutura de Diretórios (evolução gradual)
```
app/
  (app)/                    # Área protegida
    dashboard/
    processos/
    clientes/
    agenda/
    documentos/
    financeiro/
    ia/
    relatorios/
    admin/
    layout.tsx              # Auth + Sidebar + Topbar
  api/                      # Route handlers
    v1/                     # Versionamento da API
      clients/
      matters/
      tasks/
      documents/
      finance/
      ai/
      admin/
    integrations/
      datajud/
      google/
    webhooks/
      clerk/                # Sync Clerk ↔ Prisma
components/
  shell/                    # Sidebar, Topbar, Layout
  ui/                       # shadcn/ui base
  dashboard/
  processos/
  clientes/
  agenda/
  documentos/
  financeiro/
  ia/
  relatorios/
lib/
  db.ts                     # Prisma singleton
  auth.ts                   # Clerk helpers + RBAC
  ai/
    gateway.ts              # Multi-provider gateway
    providers/
    templates/
  integrations/
    datajud.ts              # DataJudService
    google/
      drive.ts              # DriveService
      calendar.ts           # CalendarService
      gmail.ts              # GmailService
  validations/
    zod-schemas.ts          # Schemas de validação
  utils/
    formatters.ts           # CPF, CNPJ, moeda, datas
    errors.ts               # AppError class
hooks/
  use-auth.ts               # Hook de permissões
  use-toast.ts              # Notificações
types/
  index.ts                  # Tipos globais
prisma/
  schema.prisma             # Schema completo
  seed.ts                   # Seed completo
```

### Padrões Arquiteturais
1. **Server Components por padrão**, Client Components apenas quando necessário (interatividade, hooks)
2. **API Routes versionadas** (`/api/v1/...`) com validação Zod
3. **Serviços de integração isolados** — cada integração externa é uma classe/service separado
4. **RBAC no middleware/proxy** — o proxy verifica `user.role` e bloqueia rotas não autorizadas
5. **Audit Log automático** — toda operação CRUD em entidades sensíveis gera log
6. **Erros padronizados** — `AppError` com status code, message e code

---

## 3. Plano de Implementação por Fases

### Fase 0 — Fundação (Esta é a prioridade agora)
Objetivo: tornar o projeto profissional, seguro e pronto para escalar.

1. **Docker Compose** para desenvolvimento
   - PostgreSQL, Redis, app Next.js
   - `.env.example` completo

2. **Schema Prisma — expansão completa**
   - Adicionar models: `Contact`, `Task`, `Deadline`, `EmailRecord`, `DriveFile`, `DocumentVersion`, `FeeContract`, `Invoice`, `Expense`, `Payment`, `CRMLead`, `CRMActivity`, `AIConversation`, `AIMessage`, `AIUsageLog`, `PromptTemplate`, `IntegrationAccount`, `IntegrationToken`, `SystemSetting`, `Tag`, `TagRelation`
   - Adicionar enums: `ContactType`, `TaskStatus`, `TaskPriority`, `InvoiceStatus`, `PaymentMethod`, `CRMStage`, `DocumentStatus`, `AIProvider`, `IntegrationType`
   - Criar `Permission` e `UserPermission` para RBAC granular
   - Soft delete (`deletedAt`) em entidades críticas

3. **RBAC + Sync Clerk ↔ Prisma**
   - Webhook `/api/webhooks/clerk` para sync user create/update/delete
   - Middleware `proxy.ts` verificando permissões por role
   - Helper `lib/auth.ts` com `requireRole()`, `requirePermission()`
   - Seed com perfis e permissões iniciais

4. **Estrutura de serviços e validações**
   - `lib/validations/zod-schemas.ts` — schemas para todos os forms/APIs
   - `lib/utils/errors.ts` — `AppError` class
   - `lib/utils/formatters.ts` — CPF/CNPJ, moeda, datas

5. **API Routes CRUD base**
   - `/api/v1/clients` — CRUD completo
   - `/api/v1/matters` — CRUD completo
   - `/api/v1/tasks` — CRUD completo
   - `/api/v1/documents` — CRUD + metadados

6. **Seed completo**
   - Usuários com roles reais
   - Clientes, processos, prazos, documentos
   - Configurações do sistema

7. **README profissional**
   - Instruções de instalação, Docker, env vars, migrations, seed, testes

---

### Fase 1 — MVP Operacional
Objetivo: todas as páginas principais funcionando com dados reais.

1. **Dashboard real** — consulta banco: processos ativos, prazos próximos, tarefas pendentes, receitas a receber
2. **Clientes CRUD completo** — página com tabela, filtros, formulário create/edit, delete soft
3. **Processos aprimorado** — formulário create/edit, vínculo de partes, upload de documentos vinculado
4. **Tarefas/Prazos** — CRUD completo, atribuição, prioridade, status, checklist
5. **Documentos** — upload real para storage local (Google Drive na Fase 3), versões, metadados
6. **Onboarding** — wizard funcional: criar primeiro processo, convidar equipe, conectar integrações

---

### Fase 2 — Integrações e Automatizações
Objetivo: conectar o escritório ao mundo digital.

1. **DataJud aprimorado**
   - Job de sincronização periódica (BullMQ)
   - Tela de histórico de sincronizações
   - Alertas de nova movimentação
   - Interface `CourtProviderAdapter` para futuras fontes

2. **Google Workspace**
   - OAuth 2.0 para Drive, Calendar, Gmail
   - DriveService: upload, pastas, permissões
   - CalendarService: sync bidirecional
   - GmailService: leitura, rascunhos, classificação

3. **Notificações**
   - Sistema interno de notificações (toast + badge)
   - Jobs de lembrete de prazos, tarefas vencidas

4. **Financeiro aprimorado**
   - Emissão de faturas, recibos
   - Contas a pagar/receber
   - Relatórios financeiros básicos

---

### Fase 3 — IA, Relatórios e Admin
Objetivo: inteligência e governança.

1. **IA Jurídica completa**
   - Provider real (OpenAI) substituindo mock
   - PromptTemplateService com templates jurídicos
   - DocumentContextService para RAG local
   - Logs de uso (AIUsageLog)
   - Avisos de "revisão profissional obrigatória"

2. **Relatórios e BI**
   - Relatórios por módulo
   - Indicadores do escritório
   - Exportação PDF/Excel

3. **Administração**
   - Gestão de usuários e permissões
   - Configurações do sistema
   - Auditoria (visualização de logs)
   - Integrações e chaves

---

### Fase 4 — Portal do Cliente e Escalabilidade
Objetivo: expandir para clientes externos e otimizar.

1. **Portal do Cliente** — área restrita para clientes visualizarem processos, documentos e mensagens
2. **Performance** — cache Redis, queries otimizadas, pagination
3. **Testes** — unitários (Jest/Vitest) + integração para CRUDs críticos
4. **CI/CD** — GitHub Actions para testes e deploy

---

## 4. O que propor para começar AGORA

Recomendo **Fase 0 — Fundação**. Sem ela, cada módulo novo será construído sobre areia movediça.

### Entregáveis da Fase 0:
1. `docker-compose.yml` rodando PostgreSQL + Redis + app
2. Schema Prisma expandido (models faltantes + soft delete + permissões)
3. `proxy.ts` com RBAC por role
4. `/api/webhooks/clerk` — sync Clerk ↔ Prisma
5. `lib/auth.ts` — helpers de permissão
6. `/api/v1/clients` — CRUD completo
7. Página `/clientes` funcionando com dados reais
8. Seed completo com roles e permissões
9. `.env.example` e README profissional

### Tempo estimado: 2-3 sessões de trabalho

---

## 5. Riscos Técnicos Identificados

| Risco | Mitigação |
|-------|-----------|
| Clerk v7 + Next.js 16 ainda têm edges cases | Manter proxy.ts simples, usar redirect manual |
| Schema grande pode gerar migrations complexas | Expandir incrementalmente, testar localmente |
| Google OAuth é complexo e sensível | Implementar na Fase 2, deixar estrutura preparada na Fase 0 |
| IA com dados sensíveis (LGPD) | Nunca persistir dados de cliente em provider externo; usar contexto controlado |
| Performance com muitos processos/prazos | Adicionar índices, paginação e cache na Fase 3 |
