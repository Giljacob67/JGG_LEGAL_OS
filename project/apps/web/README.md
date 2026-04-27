# JGG GROUP — Legal OS

Sistema juridico integrado do escritorio **Jacob, Greczyszn & Greczyszn**, especializado em direito Agrario, Bancario e Tributario.

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **UI**: shadcn/ui + Lucide icons
- **Auth**: Clerk
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **AI**: Multi-provider gateway (Ollama Cloud Pro, OpenAI, Claude, Kimi, OpenRouter)
- **Integracoes**: DataJud API (CNJ)

## Requisitos

- Node.js 20+
- Conta [Clerk](https://clerk.com)
- Conta [Neon](https://neon.tech)
- Chave API [DataJud](https://datajud-wiki.cnj.jus.br/)
- Chave API [Ollama Cloud Pro](https://ollama.com/cloud) (ou outro provider de IA)

## Variaveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto (`apps/web/.env.local`):

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://usuario:senha@host.neon.tech/jgg_legal_os?sslmode=require"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/cadastro
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# DataJud
DATAJUD_API_KEY="SUA_CHAVE_AQUI"

# Ollama Cloud Pro
OLLAMA_CLOUD_API_KEY="SUA_CHAVE_AQUI"
OLLAMA_CLOUD_BASE_URL="https://api.ollama.ai/v1"
OLLAMA_CLOUD_MODEL="kimi-k2.6:cloud"
```

## Instalacao local

```bash
cd apps/web
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Acesse: http://localhost:3000

## Deploy na Vercel

1. Crie um projeto na [Vercel](https://vercel.com)
2. Conecte este repositorio
3. Adicione as **Environment Variables** acima no dashboard da Vercel
4. Defina o **Root Directory** como `apps/web`
5. Deploy!

## Estrutura de modulos

| Rota | Modulo |
|------|--------|
| `/dashboard` | Visao geral com KPIs |
| `/processos` | Gestao de processos + busca DataJud |
| `/agenda` | Kanban, lista e calendario de prazos |
| `/documentos` | Biblioteca e editor de pecas |
| `/financeiro` | Honorarios, timesheet e faturas |
| `/ia` | Chat juridico multi-provider |
| `/clientes` | Cadastro de clientes |
| `/relatorios` | Dashboards e BI |
| `/blueprint` | Documentacao tecnica |

## Contato

**JGG GROUP** · Jacob, Greczyszn & Greczyszn  
OAB/PR 17.158 · Direito Agrario, Bancario e Tributario