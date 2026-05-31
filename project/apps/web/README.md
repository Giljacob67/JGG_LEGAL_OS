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
| Cache / Filas | Redis 7 (preparado para BullMQ) |
| Autenticação | Clerk |
| Autorização | RBAC granular (roles + permissions) |
| IA | Camada abstrata — OpenAI real, Ollama Cloud. Providers não implementados marcados como indisponíveis. |
| Integrações | DataJud (CNJ), Google Workspace (preparado) |
| Deploy | Docker Compose (dev) / Vercel (prod) |

---

## Segurança e Conformidade (Premium)

### Criptografia de Credenciais

- Todas as credenciais de integração (Google, DataJud, etc.) são criptografadas com **AES-256-GCM** usando `lib/crypto.ts`.
- Chaves derivadas com `scrypt` + salt único por ambiente.
- **Nunca** commite chaves reais. Use sempre variáveis de ambiente.

**Geração recomendada de chaves seguras:**

```bash
# Chave de criptografia (mínimo 32 caracteres)
openssl rand -base64 32

# Salt para derivação de chave
openssl rand -base64 16
```

**Variáveis obrigatórias relacionadas:**
- `INTEGRATION_ENCRYPTION_KEY`
- `CRYPTO_SALT`

O módulo `lib/crypto.ts` valida essas variáveis na inicialização e recomenda rotação periódica em produção.

### LGPD e Acesso a Sistemas de Tribunais

- O serviço `process-monitor` possui políticas explícitas de uso seguro.
- Logs estruturados (`LOG_JSON=true`) são recomendados para auditoria de acessos a tribunais.
- Todo acesso a dados sensíveis é registrado em `AuditLog`.

Consulte `project/services/process-monitor/README.md` para a política completa de compliance.

---

## Requisitos

- Node.js 22 LTS+
- Docker + Docker Compose (para dev local)
- Conta no [Clerk](https://clerk.com) (autenticação)
- Conta no [DataJud](https://datajud.cnj.jus.br) (opcional — para busca de processos)

---

## Instalação

### 1. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas chaves:
- `DATABASE_URL` — funciona com Docker Compose local
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET` — configure em `https://seu-dominio.com/api/webhooks/clerk`
- `DATAJUD_API_KEY` — obtenha em [datajud.cnj.jus.br](https://datajud.cnj.jus.br)
- `INTEGRATION_ENCRYPTION_KEY` — chave de 32+ caracteres para criptografia de tokens

### 2. Suba a infraestrutura

```bash
docker-compose up -d
```

### 3. Instale dependências e aplique migrations

```bash
npm install
npx prisma migrate dev
npx prisma db seed
```

### 4. Inicie o servidor

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | Linter (ESLint) |
| `npm run test` | Testes unitários (Jest) |
| `npm run test:ci` | Testes com cobertura (CI) |
| `npx prisma migrate dev` | Cria e aplica migrations |
| `npx prisma migrate deploy` | Aplica migrations (produção) |
| `npx prisma db seed` | Dados iniciais |
| `npx prisma studio` | GUI do banco |

---

## Documentação da API

O contrato OpenAPI 3.1 está disponível em [`openapi.yaml`](./openapi.yaml).  
Importe no Postman, Insomnia ou Swagger UI para explorar os endpoints versionados (`/api/v1/*`), schemas e autenticação.

---

## Estrutura

```
app/
  (app)/              # Área protegida (dashboard, processos, etc.)
  api/
    v1/               # API REST versionada (CRUDs com RBAC)
    webhooks/clerk/   # Sync Clerk ↔ Prisma
    datajud/          # Busca CNJ com autenticação e rate limit
    ai/chat/          # Stream OpenAI com permissão ia_use
components/
  shell/              # Sidebar, Topbar
  ui/                 # shadcn/ui
lib/
  auth.ts             # RBAC, sync, permissões
  db.ts               # Prisma singleton
  validations/        # Zod schemas com whitelists
  utils/              # Formatters, AppError, handleApiError
  ai/                 # Gateway + providers
  crypto.ts           # AES-256-GCM para tokens
  integration-secure.ts # Wrapper criptografado
  content/            # Taxonomia, templates, prompts, microcopy, onboarding
prisma/
  schema.prisma       # Schema com soft delete e relações
  seed.ts             # Dados iniciais
```

---

## Autorização (RBAC)

Dois níveis de proteção:

1. **Middleware (`proxy.ts`)** — autenticação, roles básicas, rotas financeiras protegidas
2. **API routes + Server Components** — permissões granulares via `getAuthUser()` + `hasPermission()`

### Roles

| Role | Descrição |
|------|-----------|
| `admin` | Acesso total |
| `socio` | Acesso total exceto configurações técnicas |
| `advogado` | Processos, clientes, prazos, documentos, IA |
| `estagiario` | Visualização e tarefas básicas |
| `financeiro` | Financeiro, relatórios, faturas |
| `comercial` | CRM, leads, propostas, clientes |

---

## Segurança

- **APIs protegidas** — `/api/(.*)` requer autenticação (exceto webhooks e upload)
- **DataJud autenticado** — requer `processo_view` + rate limit + validação CNJ
- **Erros seguros** — mensagens internas só em log server-side; cliente recebe genérico em 500
- **Tokens criptografados** — `IntegrationAccount.accessToken` e `refreshToken` via AES-256-GCM
- **Audit log** — toda operação CRUD sensível é registrada
- **Soft delete** — dados nunca removidos fisicamente
- **IA com aviso** — "A IA é uma ferramenta de apoio. A revisão final do advogado é obrigatória."
- **LGPD** — disclaimers de confidencialidade e consentimento integrados

---

## Roadmap

### Sprint 1 — Blindagem de Segurança ✅
- [x] APIs protegidas, DataJud autenticado
- [x] Erros seguros (handleApiError)
- [x] Webhook Clerk corrigido
- [x] Rate limiting

### Sprint 2 — RBAC + Prisma ✅
- [x] Permissões aplicadas em páginas e APIs
- [x] Relações Prisma corrigidas
- [x] Criptografia de tokens
- [x] Whitelist de sortBy por recurso

### Sprint 3 — Documentos e Upload ✅
- [x] Upload único com metadados (mimeType, tamanho)
- [x] Editor funcional com campo `conteudo` separado de `url`
- [x] Versionamento real de documentos

### Sprint 4 — Conteúdo Jurídico ✅
- [x] Taxonomia (áreas, tipos de ação, fases, riscos)
- [x] Templates: procuração, contrato, petição, contestação, parecer
- [x] Prompts versionados (resumo, liminar, teses bancária/agrária/tributária, checklist)
- [x] Microcopy operacional + LGPD + onboarding

### Sprint 5 — Relatórios e Dashboard ✅
- [x] Indicadores de risco (carteira, processos em risco alto)
- [x] Dashboard operacional (prazos vencidos, críticos)
- [x] Relatórios executivos (receita, produtividade, ranking)
- [x] API consolidada `/api/v1/reports/dashboard`

### Sprint 6 — Testes e CI 🔄
- [x] Jest configurado
- [x] Testes de RBAC, errors, CNJ, crypto, Zod
- [x] GitHub Actions (lint, typecheck, test, build)
- [ ] Rodar `npm install` e `npm test` para validar

---

## Licença

Proprietário — JGG Group. Todos os direitos reservados.
