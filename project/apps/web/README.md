# JGG Legal OS

Sistema jurídico integrado da **JGG Group** — escritório Jacob, Greczyszn & Greczyszn, especializado em Direito Agrário, Bancário e Tributário.

> Plataforma segura, moderna e modular para centralizar a operação do escritório: processos, clientes, prazos, documentos, financeiro, CRM, integrações e IA jurídica.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | Next.js Route Handlers (API versionada) |
| Banco de dados | PostgreSQL 16 + Prisma ORM |
| Cache / Filas | Redis 7 (BullMQ para jobs futuros) |
| Autenticação | Clerk |
| Autorização | RBAC granular (roles + permissions) |
| IA | Camada abstrata — OpenAI, Ollama Cloud, etc. |
| Integrações | DataJud (CNJ), Google Workspace (Drive, Calendar, Gmail) |
| Deploy | Docker Compose (dev) / Vercel (prod) |

---

## Requisitos

- Node.js 20+
- Docker + Docker Compose
- Conta no [Clerk](https://clerk.com) (autenticação)
- Conta no [DataJud](https://datajud.cnj.jus.br) (opcional — para busca de processos)

---

## Instalação

### 1. Clone e entre no diretório

```bash
cd project/apps/web
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas chaves:
- `DATABASE_URL` — já funciona com Docker Compose
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY` — obtenha em [dashboard.clerk.com](https://dashboard.clerk.com)
- `CLERK_WEBHOOK_SECRET` — configure um webhook em `https://seu-dominio.com/api/webhooks/clerk` e copie o Signing Secret
- `DATAJUD_API_KEY` — obtenha em [datajud.cnj.jus.br](https://datajud.cnj.jus.br)

### 3. Suba a infraestrutura com Docker Compose

```bash
docker-compose up -d
```

Isso sobe:
- PostgreSQL na porta `5432`
- Redis na porta `6379`

### 4. Instale as dependências

```bash
npm install
```

### 5. Execute as migrations do Prisma

```bash
npx prisma migrate dev
```

### 6. Execute o seed (dados iniciais)

```bash
npx prisma db seed
```

O seed cria:
- 5 usuários com roles e permissões (sócio, advogado, financeiro, comercial, estagiário)
- 5 clientes (PF e PJ)
- 3 processos com prazos, andamentos e documentos
- Contratos de honorários, faturas e timesheets
- Templates de IA e configurações do sistema

### 7. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Scripts Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npx prisma migrate dev` | Cria e aplica migrations |
| `npx prisma migrate deploy` | Aplica migrations (produção) |
| `npx prisma db seed` | Executa o seed |
| `npx prisma studio` | Abre Prisma Studio (GUI do banco) |
| `npx prisma generate` | Regenera o Prisma Client |

---

## Estrutura do Projeto

```
app/
  (app)/              # Área protegida (dashboard, processos, clientes, etc.)
  api/
    v1/               # API versionada (CRUDs)
    webhooks/clerk/   # Sync Clerk ↔ Prisma
    integrations/     # DataJud, Google, etc.
components/
  shell/              # Sidebar, Topbar
  ui/                 # Componentes base (shadcn)
lib/
  auth.ts             # RBAC, permissões, sync
  db.ts               # Prisma singleton
  validations/        # Schemas Zod
  utils/              # Formatters, errors
  ai/                 # Gateway de IA + providers
  integrations/       # Serviços de integração
prisma/
  schema.prisma       # Schema completo do banco
  seed.ts             # Dados iniciais
```

---

## Arquitetura de Autorização (RBAC)

O sistema usa **dois níveis** de proteção:

1. **Proxy (middleware)** — verifica autenticação e role básica
2. **API routes + Server Components** — verifica permissões granulares

### Roles disponíveis

| Role | Descrição |
|------|-----------|
| `admin` | Acesso total ao sistema |
| `socio` | Acesso total exceto configurações técnicas de admin |
| `advogado` | Processos, clientes, prazos, documentos, IA |
| `estagiario` | Visualização e tarefas básicas |
| `financeiro` | Financeiro, relatórios, faturas |
| `comercial` | CRM, leads, propostas, clientes |

### Permissões

Cada role recebe um conjunto padrão de permissões no momento da criação do usuário (via webhook do Clerk). Permissões podem ser ajustadas individualmente por usuário.

---

## Integrações

### DataJud (CNJ)
- Busca pública por número de processo (CNJ)
- Endpoint: `/api/datajud?cnj=...`
- Requer `DATAJUD_API_KEY`

### Google Workspace (Fase 2)
- Google Drive: armazenamento de documentos
- Google Calendar: sincronização de agenda
- Gmail: leitura e classificação de e-mails
- Requer OAuth 2.0 configurado

---

## Roadmap

### Fase 0 — Fundação ✅ (em andamento)
- [x] Docker Compose (PostgreSQL + Redis)
- [x] Schema Prisma expandido (soft delete, permissões, configurações)
- [x] RBAC com roles e permissões granulares
- [x] Webhook Clerk ↔ Prisma
- [x] API CRUD de clientes
- [x] Página de clientes funcional
- [x] Seed completo

### Fase 1 — MVP Operacional
- [ ] Dashboard real (consulta ao banco)
- [ ] CRUD completo de processos
- [ ] CRUD de tarefas e prazos
- [ ] Upload de documentos (storage local)
- [ ] Onboarding wizard

### Fase 2 — Integrações
- [ ] Jobs de sincronização DataJud (BullMQ)
- [ ] Google Drive, Calendar, Gmail (OAuth 2.0)
- [ ] Notificações internas e por e-mail
- [ ] Financeiro avançado (emissão de faturas, recibos)

### Fase 3 — IA e BI
- [ ] Provider OpenAI real (substituir mock)
- [ ] RAG com documentos do escritório
- [ ] Relatórios e indicadores
- [ ] Módulo de administração

### Fase 4 — Portal e Escala
- [ ] Portal do cliente (visualização restrita)
- [ ] Testes unitários e de integração
- [ ] CI/CD com GitHub Actions
- [ ] Performance e cache

---

## Segurança e LGPD

- **Autenticação segura** via Clerk (OAuth 2.0, MFA disponível)
- **Autorização granular** — cada usuário tem apenas as permissões necessárias
- **Audit log** — toda operação CRUD em entidades sensíveis é registrada
- **Soft delete** — dados nunca são removidos fisicamente do banco
- **Criptografia de tokens** — tokens de integração externos são criptografados
- **Nenhuma chave hardcoded** — todas as credenciais via variáveis de ambiente
- **IA com aviso obrigatório** — todo conteúdo gerado por IA exibe: "Conteúdo gerado por IA para revisão profissional"
- **Isolamento de dados** — dados de clientes diferentes nunca são misturados em contexto de IA

---

## Licença

Proprietário — JGG Group. Todos os direitos reservados.
