// Blueprint Técnico — handoff completo para o Claude Code

const { useState: useStateB } = React;

function BlueprintView() {
  const [section, setSection] = useStateB('overview');

  const sections = [
    { id: 'overview', l: 'Visão geral' },
    { id: 'stack', l: 'Stack & decisões' },
    { id: 'pastas', l: 'Estrutura de pastas' },
    { id: 'erd', l: 'ERD PostgreSQL' },
    { id: 'fluxos', l: 'Fluxos de dados' },
    { id: 'api', l: 'Contratos de API' },
    { id: 'rbac', l: 'RBAC matrix' },
    { id: 'lgpd', l: 'LGPD & sigilo' },
    { id: 'roadmap', l: 'Roadmap & sprints' },
  ];

  return (
    <div style={{display: 'grid', gridTemplateColumns: '220px 1fr', height: 'calc(100vh - 56px)'}}>
      <nav style={{borderRight: '1px solid var(--border-default)', padding: '20px 12px', overflowY: 'auto', background: 'var(--bg-surface-2)'}}>
        <div style={{fontSize: 10.5, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, padding: '0 10px 10px'}}>Blueprint técnico</div>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 4,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: section === s.id ? 'var(--bg-surface)' : 'transparent',
            color: section === s.id ? 'var(--accent)' : 'var(--fg-default)',
            fontWeight: section === s.id ? 600 : 400,
            fontSize: 12.5, marginBottom: 1,
            borderLeft: section === s.id ? '3px solid var(--accent)' : '3px solid transparent',
          }}>{s.l}</button>
        ))}
        <div style={{margin: '20px 10px', padding: 12, background: 'var(--gold-soft)', borderRadius: 6, fontSize: 11, color: 'var(--fg-default)', lineHeight: 1.5}}>
          <b style={{color: 'var(--gold)'}}>Para Claude Code:</b> este blueprint é a especificação técnica de referência. Cada seção contém os contratos formais necessários para implementação.
        </div>
      </nav>
      <div style={{overflowY: 'auto', padding: '28px 36px'}}>
        {section === 'overview' && <BPOverview />}
        {section === 'stack' && <BPStack />}
        {section === 'pastas' && <BPPastas />}
        {section === 'erd' && <BPERD />}
        {section === 'fluxos' && <BPFluxos />}
        {section === 'api' && <BPApi />}
        {section === 'rbac' && <BPRBAC />}
        {section === 'lgpd' && <BPLGPD />}
        {section === 'roadmap' && <BPRoadmap />}
      </div>
    </div>
  );
}

const BPSection = ({ title, sub, children }) => (
  <div style={{maxWidth: 980}}>
    <h1 style={{fontSize: 26, marginBottom: 6}}>{title}</h1>
    {sub && <div style={{fontSize: 13, color: 'var(--fg-muted)', marginBottom: 22, lineHeight: 1.5}}>{sub}</div>}
    {children}
  </div>
);

const Code = ({ children, lang }) => (
  <pre style={{
    background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
    borderRadius: 6, padding: 16, fontSize: 12, fontFamily: 'var(--font-mono)',
    overflow: 'auto', lineHeight: 1.55, color: 'var(--fg-default)',
    margin: '12px 0',
  }}>{children}</pre>
);

const H2 = ({ children }) => <h2 style={{fontSize: 17, marginTop: 26, marginBottom: 10, fontFamily: 'var(--font-serif)'}}>{children}</h2>;
const H3 = ({ children }) => <h3 style={{fontSize: 14, marginTop: 18, marginBottom: 8, color: 'var(--fg-strong)'}}>{children}</h3>;
const P = ({ children }) => <p style={{fontSize: 13.5, color: 'var(--fg-default)', lineHeight: 1.65, marginBottom: 12}}>{children}</p>;

function BPOverview() {
  return (
    <BPSection title="JGG Legal OS — Blueprint Arquitetural"
      sub="Sistema jurídico interno · multi-tenant-ready · IA-first · foco Agro/Bancário/Tributário · jurisdições PR, MT, SC, RS, GO + federal">
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22}}>
        {[
          { l: 'Módulos', v: '10', s: 'M1-M10 · todos especificados' },
          { l: 'Schema PG', v: '23 tabelas', s: '7 core + 9 funcionais + 7 audit' },
          { l: 'Endpoints', v: '~120', s: 'tRPC + REST + webhooks' },
          { l: 'Integrações', v: '7', s: 'DataJud, TJs, Asaas, Anthropic, Clerk, R2, Telegram' },
          { l: 'Tribunais', v: '5+1', s: 'TJPR, TJMT, TJSC, TJRS, TJGO + DataJud CNJ' },
          { l: 'IA stack', v: 'híbrida', s: 'Claude (estratégia) + Ollama (volume/sigilo)' },
        ].map((k, i) => (
          <div key={i} className="surface" style={{padding: 16}}>
            <div style={{fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4}}>{k.l}</div>
            <div style={{fontSize: 22, fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--fg-strong)', marginBottom: 4}}>{k.v}</div>
            <div style={{fontSize: 11.5, color: 'var(--fg-muted)'}}>{k.s}</div>
          </div>
        ))}
      </div>

      <H2>Diagrama de alto nível</H2>
      <ArquiteturaDiagram />

      <H2>Princípios arquiteturais</H2>
      <ol style={{fontSize: 13.5, color: 'var(--fg-default)', lineHeight: 1.7, paddingLeft: 22}}>
        <li><b>IA com camada de soberania:</b> dados sensíveis (CPF, dados de processo segredo de justiça, conteúdo de petições inéditas) só passam por Ollama local. Apenas dados anonimizados ou consentidos seguem para Anthropic API.</li>
        <li><b>Multi-tenant desde o dia 1:</b> toda tabela carrega <code>org_id</code> com Row-Level Security ativo no Postgres — facilita expansão futura para outros escritórios sem refatoração.</li>
        <li><b>Source of truth no Postgres:</b> Neon como banco principal com pgvector. Filas e cache em Redis (Upstash). Storage de arquivos em R2 com presigned URLs.</li>
        <li><b>Audit-log imutável:</b> tabela <code>audit_logs</code> com triggers Postgres em todas as operações de CRUD sobre entidades sensíveis. Append-only (sem UPDATE/DELETE).</li>
        <li><b>Resiliência de scrapers:</b> jobs idempotentes, BullMQ com retry exponencial, health-check por tribunal, fallback para DataJud.</li>
        <li><b>Frontend desacoplado:</b> Next.js 15 chama tRPC interno + APIs do worker Python. Worker Python isolado no Hetzner cuida de scraping, IA pesada, OCR de PDFs.</li>
      </ol>
    </BPSection>
  );
}

function ArquiteturaDiagram() {
  return (
    <div className="surface" style={{padding: 24}}>
      <svg viewBox="0 0 920 460" style={{width: '100%', height: 'auto', fontFamily: 'var(--font-sans)', fontSize: 11}}>
        {/* Layer headers */}
        <text x={20} y={18} fill="var(--fg-muted)" fontSize={10} textTransform="uppercase" fontWeight={600}>CLIENTE</text>
        <text x={20} y={138} fill="var(--fg-muted)" fontSize={10} fontWeight={600}>EDGE / VERCEL</text>
        <text x={20} y={258} fill="var(--fg-muted)" fontSize={10} fontWeight={600}>VPS HETZNER (workers)</text>
        <text x={20} y={378} fill="var(--fg-muted)" fontSize={10} fontWeight={600}>SERVIÇOS</text>

        {/* Cliente layer */}
        <Box x={140} y={30} w={150} h={50} title="Browser (advogados)" sub="Next.js 15 PWA" />
        <Box x={310} y={30} w={150} h={50} title="Portal do Cliente" sub="Next.js subdomain" />
        <Box x={480} y={30} w={150} h={50} title="Bot Telegram" sub="Telegraf.js" />
        <Box x={650} y={30} w={150} h={50} title="Email" sub="Resend" />

        {/* Vercel */}
        <Box x={140} y={150} w={200} h={60} title="Next.js 15 (App Router)" sub="React Server Components · TS · Tailwind v4" accent />
        <Box x={360} y={150} w={150} h={60} title="tRPC" sub="API tipada interna" />
        <Box x={530} y={150} w={150} h={60} title="Clerk" sub="Auth · roles · MFA" />
        <Box x={700} y={150} w={150} h={60} title="Edge funcs" sub="Webhooks · CRON" />

        {/* Workers */}
        <Box x={140} y={270} w={140} h={60} title="Worker Scraping" sub="Playwright · TJPR/MT/SC/RS/GO" />
        <Box x={300} y={270} w={140} h={60} title="Worker IA" sub="LangChain · RAG · Ollama" accent />
        <Box x={460} y={270} w={140} h={60} title="Worker Notif." sub="BullMQ · Telegram + Email" />
        <Box x={620} y={270} w={140} h={60} title="OCR Worker" sub="PDF · Tesseract" />

        {/* Serviços externos */}
        <Box x={60} y={390} w={120} h={50} title="DataJud CNJ" sub="REST oficial" />
        <Box x={200} y={390} w={120} h={50} title="Neon (PG+pgvector)" sub="Banco principal" />
        <Box x={340} y={390} w={120} h={50} title="Cloudflare R2" sub="Storage" />
        <Box x={480} y={390} w={120} h={50} title="Anthropic API" sub="Claude 3.5" gold />
        <Box x={620} y={390} w={120} h={50} title="Asaas" sub="Cobrança" />
        <Box x={760} y={390} w={120} h={50} title="BRy" sub="Assinatura digital" />

        {/* Connectors */}
        {[
          [215, 80, 215, 150], [385, 80, 385, 150], [555, 80, 555, 150], [725, 80, 725, 150],
          [240, 210, 215, 270], [340, 210, 370, 270], [480, 210, 530, 270],
          [240, 330, 250, 390], [375, 330, 380, 390], [530, 330, 540, 390], [690, 330, 690, 390],
        ].map((c, i) => <line key={i} x1={c[0]} y1={c[1]} x2={c[2]} y2={c[3]} stroke="var(--border-strong)" strokeWidth={1.2} strokeDasharray="3 3" />)}
      </svg>
    </div>
  );
}

function Box({ x, y, w, h, title, sub, accent, gold }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6}
        fill={accent ? 'var(--accent-soft)' : gold ? 'var(--gold-soft)' : 'var(--bg-surface-2)'}
        stroke={accent ? 'var(--accent)' : gold ? 'var(--gold)' : 'var(--border-strong)'} strokeWidth={1.4} />
      <text x={x + w/2} y={y + 22} textAnchor="middle" fontWeight={600} fill="var(--fg-strong)" fontSize={12}>{title}</text>
      <text x={x + w/2} y={y + 38} textAnchor="middle" fill="var(--fg-muted)" fontSize={10}>{sub}</text>
    </g>
  );
}

function BPStack() {
  return (
    <BPSection title="Stack & decisões arquiteturais" sub="Cada decisão registrada com motivação e alternativas consideradas">
      <H2>Stack consolidada</H2>
      <table style={{width: '100%', fontSize: 12.5, borderCollapse: 'collapse', marginTop: 8}}>
        <thead>
          <tr style={{background: 'var(--bg-surface-2)'}}>
            <th style={{padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>Camada</th>
            <th style={{padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>Tecnologia</th>
            <th style={{padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>Versão / spec</th>
            <th style={{padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>Justificativa</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Frontend', 'Next.js + TypeScript', '15.x · App Router · RSC', 'Tipagem estrita; SSR p/ SEO do portal cliente; RSC reduz JS bundle'],
            ['UI', 'Tailwind CSS', 'v4', 'Performance · DX; tokens via CSS vars (multi-tema)'],
            ['API tipada', 'tRPC', '11.x', 'Tipos compartilhados front↔back, sem OpenAPI manual'],
            ['Banco', 'PostgreSQL (Neon)', '16 + pgvector 0.7', 'Serverless · branching · pgvector p/ RAG nativo'],
            ['ORM', 'Prisma', '5.x', 'Migrations versionadas; tipagem; melhor DX que Drizzle p/ schema complexo'],
            ['Auth', 'Clerk', 'latest', 'MFA, SSO Google, RBAC nativo, magic-links p/ portal cliente'],
            ['Storage', 'Cloudflare R2', '—', 'S3-compat sem egress fee; presigned URLs'],
            ['Filas', 'BullMQ + Redis (Upstash)', '5.x', 'Jobs persistentes, retry, idempotência'],
            ['IA · estratégia', 'Anthropic Claude 3.5 Sonnet', 'API · 200k context', 'Maior qualidade jurídica BR; context window p/ peças longas'],
            ['IA · volume/sigilo', 'Ollama + Llama 3.1 70B', 'Self-hosted Hetzner', 'Dados sigilosos não saem do VPS; menor custo p/ batch'],
            ['Embeddings', 'text-embedding-3-large', 'OpenAI · 3072d', 'Qualidade superior; custo aceitável p/ índice estático'],
            ['Scraping', 'Playwright', '1.4x', 'Cobertura TJPR/MT/SC/RS/GO via Projudi/PJe'],
            ['Notif.', 'Telegraf.js + Resend', '—', 'Telegram p/ time + Email p/ formal/cliente'],
            ['Pagamentos', 'Asaas', 'API v3', 'Boleto/Pix/cartão BR; integração simples'],
            ['Assinatura', 'BRy', 'API', 'Padrão ICP-Brasil aceito em PJe'],
            ['Deploy front', 'Vercel', '—', 'Edge Network; Preview Deployments por PR'],
            ['Deploy back', 'Hetzner CX31', '—', 'EUR 12/mês · 4vCPU/8GB · suficiente p/ workers + Ollama 7B local'],
            ['Container', 'Docker Compose', '—', 'Workers + Redis + Ollama em um stack'],
          ].map((r, i) => (
            <tr key={i} style={{borderBottom: '1px solid var(--border-subtle)'}}>
              <td style={{padding: 10, fontWeight: 500}}>{r[0]}</td>
              <td style={{padding: 10, fontFamily: 'var(--font-mono)', fontSize: 11.5}}>{r[1]}</td>
              <td style={{padding: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 11}}>{r[2]}</td>
              <td style={{padding: 10, color: 'var(--fg-default)'}}>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <H2>Architectural Decision Records (ADRs)</H2>
      {[
        { id: 'ADR-001', t: 'Híbrido Claude + Ollama para IA jurídica', d: 'Claude 3.5 Sonnet trata estratégia (geração de teses, análise complexa). Ollama 70B local trata embeddings de documentos sigilosos, primeira linha de extração de PDFs e classificação. Dados de processo em segredo de justiça nunca saem do VPS sem consentimento explícito do advogado.' },
        { id: 'ADR-002', t: 'DataJud como fonte primária + scrapers como complemento', d: 'DataJud cobre 100% dos andamentos públicos, gratuito, contrato estável. Scrapers de TJPR/MT/SC/RS/GO via Playwright capturam: (a) intimações eletrônicas, (b) peças completas, (c) andamentos com latência menor (DataJud tem D+1).' },
        { id: 'ADR-003', t: 'Multi-tenant via Row-Level Security do Postgres', d: 'Em vez de schemas separados por tenant ou bancos isolados, RLS no Postgres usando políticas baseadas em current_setting(\'app.org_id\'). Aplicação seta a variável a cada conexão. Custo zero adicional, escalável até centenas de tenants.' },
        { id: 'ADR-004', t: 'pgvector em vez de Pinecone/Weaviate', d: 'Manter banco vetorial dentro do Postgres elimina sincronização de IDs, simplifica backup/restore, reduz complexidade operacional. Performance suficiente até ~1M trechos com índice HNSW.' },
        { id: 'ADR-005', t: 'Audit-log via triggers, não middleware', d: 'Triggers em Postgres garantem que NENHUMA operação CRUD escapa do log, mesmo se um endpoint for adicionado sem o middleware. Append-only (rejeita UPDATE/DELETE em audit_logs).' },
      ].map(a => (
        <div key={a.id} className="surface" style={{padding: 16, marginBottom: 10}}>
          <div style={{fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600, marginBottom: 4}}>{a.id}</div>
          <div style={{fontSize: 14.5, fontWeight: 600, color: 'var(--fg-strong)', marginBottom: 6}}>{a.t}</div>
          <div style={{fontSize: 12.5, color: 'var(--fg-default)', lineHeight: 1.6}}>{a.d}</div>
        </div>
      ))}
    </BPSection>
  );
}

function BPPastas() {
  return (
    <BPSection title="Estrutura de pastas — Next.js 15" sub="App Router · TS strict · módulos por domínio · workers Python isolados">
      <Code>{`jgg-legal-os/
├── apps/
│   ├── web/                          # Next.js 15 (Vercel)
│   │   ├── app/
│   │   │   ├── (auth)/               # Login, MFA, recovery
│   │   │   ├── (app)/                # App autenticado
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── processos/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [id]/page.tsx
│   │   │   │   │   └── novo/page.tsx
│   │   │   │   ├── agenda/page.tsx
│   │   │   │   ├── documentos/
│   │   │   │   ├── financeiro/
│   │   │   │   ├── ia/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── mata-mata/page.tsx
│   │   │   │   ├── clientes/
│   │   │   │   ├── imoveis/
│   │   │   │   └── relatorios/
│   │   │   ├── (portal-cliente)/     # Portal do cliente · subdomain
│   │   │   │   └── [token]/page.tsx
│   │   │   ├── api/
│   │   │   │   ├── trpc/[trpc]/route.ts
│   │   │   │   ├── webhooks/
│   │   │   │   │   ├── clerk/route.ts
│   │   │   │   │   ├── asaas/route.ts
│   │   │   │   │   └── datajud/route.ts
│   │   │   │   └── cron/
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                   # primitivos · shadcn-style
│   │   │   ├── shell/
│   │   │   ├── processos/
│   │   │   ├── ia/
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── trpc/                 # Client + server tRPC
│   │   │   ├── auth/                 # Clerk helpers + RBAC
│   │   │   ├── db/                   # Prisma client (RLS-aware)
│   │   │   ├── ai/                   # Claude client wrapper
│   │   │   ├── storage/              # R2 presigned URLs
│   │   │   └── utils/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   └── worker/                       # FastAPI/Python · Hetzner VPS
│       ├── app/
│       │   ├── main.py
│       │   ├── routers/
│       │   │   ├── ia_pecas.py       # POST /ia/gerar-peca
│       │   │   ├── ia_contrato.py    # POST /ia/analisar-contrato
│       │   │   ├── ia_mata_mata.py   # POST /ia/mata-mata
│       │   │   ├── ia_rag.py         # POST /ia/buscar-jurisprudencia
│       │   │   └── scraping.py       # POST /scraping/sync
│       │   ├── services/
│       │   │   ├── llm/
│       │   │   │   ├── claude.py
│       │   │   │   ├── ollama.py
│       │   │   │   └── router.py     # decide qual modelo usar
│       │   │   ├── rag/
│       │   │   │   ├── embeddings.py
│       │   │   │   ├── pgvector.py
│       │   │   │   └── retrieval.py
│       │   │   ├── scrapers/
│       │   │   │   ├── tjpr.py
│       │   │   │   ├── tjmt.py
│       │   │   │   ├── tjsc.py
│       │   │   │   ├── tjrs.py
│       │   │   │   ├── tjgo.py
│       │   │   │   └── datajud.py
│       │   │   ├── ocr/
│       │   │   └── notifications/
│       │   ├── prompts/              # Prompt templates
│       │   │   ├── mata_mata.md
│       │   │   ├── pecas/
│       │   │   └── analise_contrato.md
│       │   └── core/
│       │       ├── config.py
│       │       └── security.py
│       ├── tests/
│       ├── docker-compose.yml        # FastAPI + Redis + Ollama
│       ├── Dockerfile
│       └── pyproject.toml
│
├── packages/
│   ├── db-types/                     # Tipos compartilhados Prisma
│   ├── ui-core/                      # Componentes compartilhados (futuro: portal admin)
│   └── eslint-config/
│
├── infra/
│   ├── docker-compose.dev.yml        # Stack local
│   ├── neon.config.ts                # Branching de DBs por env
│   └── hetzner/
│       ├── caddy.json                # Reverse proxy + TLS
│       └── deploy.sh
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md                   # LGPD + sigilo
│   ├── PROMPTS.md                    # Library de prompts versionados
│   └── RUNBOOKS/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-web.yml
│       └── deploy-worker.yml
│
├── package.json                      # Turborepo
├── turbo.json
└── README.md`}</Code>
    </BPSection>
  );
}

function BPERD() {
  return (
    <BPSection title="ERD — Schema PostgreSQL" sub="Prisma schema · multi-tenant via org_id + RLS · pgvector p/ RAG">
      <H2>Diagrama de entidades (núcleo)</H2>
      <ERDDiagram />

      <H2>Schema Prisma — extrato</H2>
      <Code>{`// prisma/schema.prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL"); extensions = [pgvector(map: "vector")] }

model Org {
  id          String     @id @default(cuid())
  nome        String
  cnpj        String?    @unique
  createdAt   DateTime   @default(now())
  // multi-tenant root
  users       User[]
  clientes    Cliente[]
  processos   Processo[]
}

model User {
  id        String   @id            // = Clerk userId
  orgId     String
  email     String   @unique
  nome      String
  oab       String?
  role      Role     @default(advogado)
  cor       String?
  createdAt DateTime @default(now())
  org       Org      @relation(fields: [orgId], references: [id])
  @@index([orgId])
}
enum Role { admin socio advogado estagiario }

model Cliente {
  id            String     @id @default(cuid())
  orgId         String
  tipo          PessoaTipo
  nome          String
  cpfCnpj       String
  email         String?
  whatsapp      String?
  endereco      Json?
  area          Area
  status        ClienteStatus @default(ativo)
  desde         DateTime   @default(now())
  // ...
  processos     Processo[]
  imoveis       Imovel[]
  honorarios    ContratoHonorarios[]
  @@unique([orgId, cpfCnpj])
  @@index([orgId, status])
}
enum PessoaTipo { PF PJ }
enum Area { Bancario Agrario Tributario }
enum ClienteStatus { ativo inativo prospecto }

model Processo {
  id              String    @id @default(cuid())
  orgId           String
  cnj             String    // 0008421-55.2024.8.16.0017
  tribunal        String    // TJPR, TJMT, TRF4...
  vara            String?
  comarca         String?
  area            Area
  tipo            String    // "Embargos à Execução — CCB Rural"
  status          ProcessoStatus @default(em_andamento)
  risco           Risco     @default(medio)
  valor           Decimal   @db.Decimal(14, 2)
  responsavelId   String
  tese            String?
  tagMataMata     Boolean   @default(false)
  distribuicao    DateTime
  ultimoAndamento DateTime?

  clienteId       String
  cliente         Cliente   @relation(fields: [clienteId], references: [id])
  responsavel     User      @relation("Responsavel", fields: [responsavelId], references: [id])
  equipe          User[]    @relation("Equipe")
  adversos        ParteAdversa[]
  andamentos      Andamento[]
  prazos          Prazo[]
  documentos      Documento[]
  cadeiaMataMata  CCBChain[]

  @@unique([orgId, cnj])
  @@index([orgId, status])
  @@index([orgId, area])
  @@index([orgId, tagMataMata])
}
enum ProcessoStatus { em_andamento suspenso arquivado encerrado }
enum Risco { alto medio baixo }

model Andamento {
  id          String   @id @default(cuid())
  processoId  String
  data        DateTime
  evento      String
  descricao   String   @db.Text
  fonte       String   // "DataJud", "TJPR", "manual"
  critico     Boolean  @default(false)
  hashConteudo String  @unique  // dedup p/ idempotência de scrapers
  createdAt   DateTime @default(now())
  processo    Processo @relation(fields: [processoId], references: [id])
  @@index([processoId, data])
}

model Prazo {
  id            String   @id @default(cuid())
  processoId    String
  tipo          PrazoTipo
  titulo        String
  vence         DateTime
  responsavelId String
  status        PrazoStatus @default(aberto)
  notifTelegram Boolean  @default(true)
  notifEmail    Boolean  @default(true)
  alertas       Json     @default("[15, 7, 3, 1]")  // dias de antecedência
  createdAt     DateTime @default(now())
  // ...
  @@index([responsavelId, vence])
  @@index([vence, status])
}
enum PrazoTipo { fatal dilacao audiencia reuniao tarefa }
enum PrazoStatus { aberto cumprido perdido }

model Documento {
  id           String   @id @default(cuid())
  orgId        String
  processoId   String?
  clienteId    String?
  nome         String
  tipo         DocumentoTipo
  versao       Int      @default(1)
  versaoDoId   String?              // FK auto-relacional p/ versionamento
  r2Key        String   @unique     // chave no R2
  tamanho      Int                  // bytes
  hash         String
  embedding    Unsupported("vector(3072)")?
  textoExtraido String? @db.Text   // p/ full-text
  tags         String[]
  autorId      String
  signed       Boolean  @default(false)
  signatureRef String?              // BRy reference
  segredo      Boolean  @default(false) // sigilo profissional/segredo de justiça
  createdAt    DateTime @default(now())
  // ...
  @@index([orgId, processoId])
  @@index([orgId, tipo])
}
enum DocumentoTipo { peticao contrato extrato decisao certidao parecer planilha outro }

model CCBChain {
  // Cadeia de contratos da operação Mata-Mata
  id                String   @id @default(cuid())
  processoId        String
  ordem             Int
  contratoNumero    String
  data              DateTime
  valor             Decimal  @db.Decimal(14, 2)
  taxa              String
  finalidadeDeclarada String
  destinacaoReal      String
  anomalia          Boolean  @default(false)
  anomaliaDescricao String?  @db.Text
  // metadados extraídos pela IA
  diasParaDebito    Int?
  percentualDisp    Decimal? @db.Decimal(5, 2)
  processo          Processo @relation(fields: [processoId], references: [id])
  @@index([processoId, ordem])
}

model JurisprudenciaTrecho {
  id          String   @id @default(cuid())
  orgao       String   // STJ, TRF4, TJPR...
  identificador String // "Súmula 286" | "REsp 1.061.530/RS"
  ementa      String   @db.Text
  trecho      String   @db.Text
  ano         Int
  url         String?  // Jusbrasil
  embedding   Unsupported("vector(3072)")
  tags        String[]
  // global · não tem orgId (compartilhado entre tenants)
  @@index([orgao])
  @@index([tags])
}

model ContratoHonorarios {
  id           String   @id @default(cuid())
  orgId        String
  clienteId    String
  processoId   String?
  modalidade   ModalidadeHonorario
  valorFixo    Decimal? @db.Decimal(14, 2)
  percentual   Decimal? @db.Decimal(5, 2)
  baseExito    String?  // "proveito_economico" | "valor_causa"
  taxaHora     Decimal? @db.Decimal(8, 2)
  vigente      Boolean  @default(true)
  inicio       DateTime
  fim          DateTime?
  // ...
  faturas      Fatura[]
}
enum ModalidadeHonorario { fixo_mensal exito hora combinado }

model Timesheet {
  id         String   @id @default(cuid())
  orgId      String
  userId     String
  processoId String
  data       DateTime
  horas      Decimal  @db.Decimal(4, 2)
  atividade  String
  faturado   Boolean  @default(false)
  // ...
  @@index([userId, data])
}

model AuditLog {
  // append-only via trigger; UPDATE/DELETE rejeitados
  id          BigInt   @id @default(autoincrement())
  orgId       String?
  userId      String?
  acao        String   // "CREATE", "UPDATE", "DELETE", "READ_SENSITIVE"
  entidade    String   // "Processo", "Documento"...
  entidadeId  String
  diff        Json?    // jsonpatch
  ip          String?
  userAgent   String?
  createdAt   DateTime @default(now())
  @@index([orgId, createdAt])
  @@index([entidade, entidadeId])
}`}</Code>
    </BPSection>
  );
}

function ERDDiagram() {
  return (
    <div className="surface" style={{padding: 20, overflowX: 'auto'}}>
      <svg viewBox="0 0 880 520" style={{width: '100%', minWidth: 800, fontFamily: 'var(--font-mono)', fontSize: 10}}>
        <Entity x={20} y={20} title="Org" fields={['id PK','nome','cnpj']} accent />
        <Entity x={20} y={130} title="User" fields={['id PK (Clerk)','orgId FK','email','role','oab']} />
        <Entity x={200} y={20} title="Cliente" fields={['id PK','orgId FK','tipo','nome','cpfCnpj','area','status']} />
        <Entity x={400} y={20} title="Processo" fields={['id PK','orgId FK','cnj UQ','tribunal','area','tipo','status','risco','valor','tagMataMata','clienteId FK','responsavelId FK']} accent />
        <Entity x={620} y={20} title="ParteAdversa" fields={['id PK','processoId FK','nome','tipo']} />
        <Entity x={400} y={250} title="Andamento" fields={['id PK','processoId FK','data','evento','descricao','fonte','hashConteudo UQ']} />
        <Entity x={620} y={250} title="Prazo" fields={['id PK','processoId FK','tipo','titulo','vence','responsavelId','alertas[]']} />
        <Entity x={200} y={250} title="Documento" fields={['id PK','orgId FK','processoId FK?','versao','r2Key UQ','embedding vector','segredo']} />
        <Entity x={20} y={250} title="CCBChain" fields={['id PK','processoId FK','ordem','contratoNumero','valor','anomalia','% disp']} gold />
        <Entity x={620} y={400} title="ContratoHonorarios" fields={['id PK','clienteId FK','modalidade','valorFixo','percentual']} />
        <Entity x={400} y={400} title="Timesheet" fields={['id PK','userId FK','processoId FK','horas','atividade']} />
        <Entity x={200} y={400} title="JurisprudenciaTrecho" fields={['id PK','orgao','identificador','ementa','embedding vector','tags[]']} accent />
        <Entity x={20} y={400} title="AuditLog" fields={['id PK','orgId','userId','acao','entidade','diff jsonb']} />

        {/* connectors */}
        {[[140, 60, 200, 60], [140, 60, 60, 130], [320, 60, 400, 60], [520, 60, 620, 60], [460, 130, 460, 250], [460, 130, 580, 250], [460, 130, 280, 250], [460, 130, 100, 250], [320, 60, 280, 250]].map((c, i) => (
          <line key={i} x1={c[0]} y1={c[1]} x2={c[2]} y2={c[3]} stroke="var(--border-strong)" strokeDasharray="2 2" strokeWidth={1.2} />
        ))}
      </svg>
    </div>
  );
}

function Entity({ x, y, title, fields, accent, gold }) {
  const w = 170, headH = 22, rowH = 13;
  const h = headH + fields.length * rowH + 6;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4}
        fill="var(--bg-surface)" stroke={accent ? 'var(--accent)' : gold ? 'var(--gold)' : 'var(--border-strong)'} strokeWidth={accent || gold ? 1.6 : 1} />
      <rect x={x} y={y} width={w} height={headH} rx={4}
        fill={accent ? 'var(--accent)' : gold ? 'var(--gold)' : 'var(--jgg-navy-700)'} />
      <text x={x + 8} y={y + 15} fill="white" fontWeight={700} fontSize={11} fontFamily="var(--font-sans)">{title}</text>
      {fields.map((f, i) => (
        <text key={i} x={x + 8} y={y + headH + 11 + i * rowH} fontSize={9.5} fill="var(--fg-default)">{f}</text>
      ))}
    </g>
  );
}

function BPFluxos() {
  return (
    <BPSection title="Fluxos de dados críticos" sub="Sequências para os 5 cenários mais relevantes">

      <H2>1. Sincronização DataJud → Notificação Telegram</H2>
      <Code>{`┌─────────┐   ┌─────────────┐   ┌──────────┐   ┌───────────┐   ┌──────────┐   ┌──────────┐
│ Cron 30m│──▶│ Worker Sync │──▶│ DataJud  │──▶│ Diff vs  │──▶│ Insert    │──▶│ Telegraf │
│ (Vercel)│   │  (Hetzner)  │   │ REST API │   │ Postgres │   │ Andamento │   │ Bot      │
└─────────┘   └─────────────┘   └──────────┘   └───────────┘   └──────────┘   └──────────┘
                    │                                                  │
                    │ idempotência via hashConteudo (SHA-256)           │
                    │                                                  ▼
                    │                                            ┌───────────┐
                    │                                            │ AuditLog  │
                    │                                            └───────────┘
                    ▼
              ┌─────────────┐
              │ BullMQ retry│ exponential backoff (1m, 5m, 30m, 2h)
              └─────────────┘`}</Code>
      <P>
        <b>Garantias:</b> idempotência por hash do conteúdo (mesmo andamento nunca é inserido 2×). Notificação só dispara se andamento.critico = true OU se processo tem tag de prioridade do advogado.
      </P>

      <H2>2. Geração de peça Mata-Mata pela IA</H2>
      <Code>{`Browser ──tRPC──▶ Next.js ──HTTP──▶ Worker IA (FastAPI)
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼                       ▼                       ▼
            ┌──────────┐          ┌──────────────┐         ┌──────────────┐
            │ Carrega  │          │ Carrega      │         │ Recupera RAG │
            │ processo │          │ documentos   │         │ (pgvector)   │
            │ + cadeia │          │ do R2        │         │ top 8 trechos│
            └──────────┘          └──────────────┘         └──────────────┘
                  │                       │                       │
                  └─────┬─────────────────┴───────┬───────────────┘
                        ▼                         ▼
            ┌────────────────────────┐  ┌──────────────────────┐
            │ Validação: dados OK?   │  │ Anonimização opcional │
            │ Documentos suficientes?│  │ (CPF, valores, nomes) │
            └────────────────────────┘  └──────────────────────┘
                        │                         │
                        └────────┬────────────────┘
                                 ▼
                  ┌─────────────────────────────┐
                  │ Roteamento (router.py):      │
                  │  · Sigilo? → Ollama 70B      │
                  │  · Standard? → Claude 3.5    │
                  └─────────────────────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │ Streaming SSE de volta ao   │
                  │ browser via Worker → Next   │
                  └─────────────────────────────┘
                                 │
                                 ▼
                  ┌─────────────────────────────┐
                  │ Persist: Documento (rascunho)│
                  │  + AuditLog (gen-id)         │
                  └─────────────────────────────┘`}</Code>

      <H2>3. Cálculo automático de prazos CPC</H2>
      <P>
        Quando um andamento é inserido com tipo "intimação", um job calcula automaticamente o prazo decorrente: (a) consulta tipo de peça aplicável, (b) aplica regra do CPC (15 dias úteis para contestação, 5 dias para embargos de declaração, etc.), (c) considera calendário oficial do tribunal (TJPR, TJMT…) para excluir feriados, (d) cria registro <code>Prazo</code> e agenda notificações nos D-15, D-7, D-3 e D-1.
      </P>

      <H2>4. Upload de documento + indexação semântica</H2>
      <Code>{`Browser ──▶ presigned URL R2 ──▶ Upload direto S3-compat
                                            │
                                            ▼
                                    Webhook R2 → Worker
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                 ▼                 ▼
                    ┌──────────┐      ┌──────────┐      ┌──────────┐
                    │ OCR (se  │      │ Extração │      │ Hash &   │
                    │ scanned) │      │ texto    │      │ dedup    │
                    └──────────┘      └──────────┘      └──────────┘
                                            │
                                            ▼
                                ┌────────────────────────┐
                                │ Chunking (1k chars      │
                                │  + 200 overlap)         │
                                └────────────────────────┘
                                            │
                                            ▼
                                ┌────────────────────────┐
                                │ Embedding              │
                                │ (text-embedding-3-large)│
                                └────────────────────────┘
                                            │
                                            ▼
                                  Documento.embedding ◀── índice HNSW`}</Code>

      <H2>5. Portal do cliente (acesso restrito)</H2>
      <P>
        Cada cliente recebe link único <code>/portal/[token]</code> via WhatsApp/Email. Token JWT assinado contém <code>clienteId</code> + scope <code>cliente:view</code>. RLS no Postgres garante que queries retornem APENAS dados desse <code>clienteId</code>. Sem login com senha — magic-link via Clerk com expiração de 30min e re-emissão sob demanda.
      </P>
    </BPSection>
  );
}

function BPApi() {
  return (
    <BPSection title="Contratos de API (tRPC)" sub="Procedures principais · types compartilhados front↔back">
      <Code>{`// apps/web/lib/trpc/routers/processos.ts
export const processosRouter = router({
  list: procedure
    .input(z.object({
      area: z.enum(['Bancario','Agrario','Tributario']).optional(),
      status: z.enum(['em_andamento','suspenso','arquivado','encerrado']).optional(),
      mataMata: z.boolean().optional(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      // RLS aplicado automaticamente via ctx.db (orgId set)
      return ctx.db.processo.findMany({
        where: { ...input },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: { cliente: true, responsavel: true },
        orderBy: { ultimoAndamento: 'desc' },
      });
    }),

  byId: procedure.input(z.string()).query(async ({ ctx, input }) => {
    const p = await ctx.db.processo.findUnique({
      where: { id: input },
      include: {
        cliente: true,
        responsavel: true,
        equipe: true,
        andamentos: { orderBy: { data: 'desc' }, take: 50 },
        prazos: { where: { status: 'aberto' } },
        documentos: { take: 100 },
        cadeiaMataMata: { orderBy: { ordem: 'asc' } },
      },
    });
    if (!p) throw new TRPCError({ code: 'NOT_FOUND' });
    await audit(ctx, 'READ', 'Processo', p.id);
    return p;
  }),

  create: procedure.input(processoCreateSchema).mutation(/* ... */),
  update: procedure.input(processoUpdateSchema).mutation(/* ... */),
});

// apps/web/lib/trpc/routers/ia.ts
export const iaRouter = router({
  gerarTeseMataMata: procedure
    .input(z.object({
      processoId: z.string(),
      tipoPeca: z.enum(['embargos','razoes_finais','apelacao','contestacao','replica','memoriais']),
      tesesAtivas: z.array(z.enum([
        'simulacao_166_167', 'sumula_286', 'sumula_298',
        'capitalizacao_cdi', 'mora_dl167', 'impenhorabilidade'
      ])),
      anonimizar: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Carrega contexto do processo
      const proc = await ctx.db.processo.findUnique({
        where: { id: input.processoId },
        include: { cliente: true, cadeiaMataMata: true, andamentos: true },
      });
      // 2. Chama worker Python
      const response = await fetch(\`\${WORKER_URL}/ia/mata-mata\`, {
        method: 'POST',
        headers: { Authorization: \`Bearer \${WORKER_TOKEN}\` },
        body: JSON.stringify({ processo: proc, ...input }),
      });
      // 3. Persiste rascunho + audit
      const draft = await ctx.db.documento.create({ /* ... */ });
      await audit(ctx, 'CREATE', 'Documento', draft.id, { generated: true });
      return { documentoId: draft.id, modeloUsado: response.modelo };
    }),

  buscarJurisprudencia: procedure
    .input(z.object({ pergunta: z.string().min(3), top: z.number().default(8) }))
    .query(/* RAG sobre JurisprudenciaTrecho */),

  analisarContrato: procedure.input(/* ... */).mutation(/* ... */),
});

// apps/worker/app/routers/ia_mata_mata.py (Python · FastAPI)
@router.post("/ia/mata-mata")
async def gerar_tese(req: MataMataRequest, _: User = Depends(verify_internal_jwt)):
    contexto = format_processo_contexto(req.processo)
    rag_trechos = await rag_service.buscar(
        query=f"Operação Mata-Mata {req.tipo_peca}",
        filtros={"tags": ["mata-mata", "credito-rural"]},
        top_k=8,
    )
    prompt = render_template(
        "prompts/mata_mata.md",
        contexto=contexto,
        rag_trechos=rag_trechos,
        teses=req.teses_ativas,
        tipo_peca=req.tipo_peca,
    )
    modelo = router_llm.escolher(req.processo, req.anonimizar)
    return StreamingResponse(modelo.stream(prompt), media_type="text/event-stream")`}</Code>
    </BPSection>
  );
}

function BPRBAC() {
  return (
    <BPSection title="RBAC matrix" sub="Permissões por role · aplicada na camada tRPC + RLS Postgres">
      <table style={{width: '100%', fontSize: 12, borderCollapse: 'collapse', marginTop: 10}}>
        <thead>
          <tr style={{background: 'var(--bg-surface-2)'}}>
            <th style={{...thR, width: 200}}>Recurso / Ação</th>
            <th style={thR}>admin</th>
            <th style={thR}>sócio</th>
            <th style={thR}>advogado</th>
            <th style={thR}>estagiário</th>
            <th style={thR}>cliente</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Processo · listar', 'all', 'all', 'próprios + equipe', 'atribuídos', '—'],
            ['Processo · criar/editar', '✓', '✓', 'próprios', 'rascunho', '—'],
            ['Processo · excluir', '✓', '—', '—', '—', '—'],
            ['Processo · marcar segredo', '✓', '✓', '✓', '—', '—'],
            ['Documento · upload', '✓', '✓', 'próprios', 'rascunho', '—'],
            ['Documento · ler segredo', '✓', '✓', 'se na equipe', '—', '—'],
            ['Documento · baixar em lote', '✓', '✓', 'próprios', '—', '—'],
            ['IA · gerar peça', '✓', '✓', '✓', '—', '—'],
            ['IA · gerar peça em segredo', '✓', '✓', 'se na equipe', '—', '—'],
            ['IA · análise de contrato', '✓', '✓', '✓', '✓', '—'],
            ['Financeiro · ver receita global', '✓', '✓', '—', '—', '—'],
            ['Financeiro · ver próprio timesheet', '✓', '✓', '✓', '✓', '—'],
            ['Financeiro · criar fatura', '✓', '✓', '—', '—', '—'],
            ['Cliente · listar', 'all', 'all', 'vinculados', 'vinculados', '—'],
            ['Cliente · ver dados sensíveis', '✓', '✓', 'se responsável', 'masked', 'próprios'],
            ['Audit log · consultar', '✓', '✓', '—', '—', '—'],
            ['Configurações · gerenciar org', '✓', '✓', '—', '—', '—'],
            ['Portal do cliente · acesso', '—', '—', '—', '—', 'próprio'],
          ].map((r, i) => (
            <tr key={i} style={{borderBottom: '1px solid var(--border-subtle)'}}>
              <td style={{padding: '8px 10px', fontWeight: 500}}>{r[0]}</td>
              {r.slice(1).map((c, j) => (
                <td key={j} style={{padding: '8px 10px', textAlign: 'center', fontSize: 11.5, color: c === '—' ? 'var(--fg-subtle)' : c === '✓' ? 'var(--status-success)' : 'var(--fg-default)'}}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <H2>Implementação · RLS Postgres</H2>
      <Code>{`-- Habilita RLS em todas as tabelas multi-tenant
ALTER TABLE "Processo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Documento" ENABLE ROW LEVEL SECURITY;
-- ...

-- Policy: sócio/admin vê tudo da org
CREATE POLICY socio_full ON "Processo"
  FOR ALL TO PUBLIC
  USING (
    "orgId" = current_setting('app.org_id')::text
    AND current_setting('app.role')::text IN ('admin','socio')
  );

-- Policy: advogado vê próprios + equipe
CREATE POLICY adv_own ON "Processo"
  FOR SELECT TO PUBLIC
  USING (
    "orgId" = current_setting('app.org_id')::text
    AND current_setting('app.role')::text = 'advogado'
    AND ("responsavelId" = current_setting('app.user_id')::text
         OR EXISTS (
           SELECT 1 FROM "_Equipe" e
           WHERE e."A" = id AND e."B" = current_setting('app.user_id')::text
         ))
  );

-- Policy: documento sob segredo só para equipe
CREATE POLICY doc_segredo ON "Documento"
  FOR SELECT TO PUBLIC
  USING (
    "orgId" = current_setting('app.org_id')::text
    AND (segredo = false OR EXISTS (
      SELECT 1 FROM "Processo" p
      WHERE p.id = "processoId"
        AND (p."responsavelId" = current_setting('app.user_id')::text OR ... )
    ))
  );`}</Code>
    </BPSection>
  );
}
const thR = {textAlign: 'left', padding: '10px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500};

function BPLGPD() {
  return (
    <BPSection title="LGPD & Sigilo Profissional" sub="Conformidade jurídica · Lei 13.709/2018 + Art. 7º EOAB + segredo de justiça (CPC art. 189)">
      <H2>Bases legais aplicáveis (LGPD)</H2>
      <table style={{width: '100%', fontSize: 12.5, borderCollapse: 'collapse'}}>
        <thead><tr style={{background: 'var(--bg-surface-2)'}}>
          <th style={{padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>Operação</th>
          <th style={{padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>Base legal LGPD</th>
          <th style={{padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>Artigo</th>
        </tr></thead>
        <tbody>
          {[
            ['Cadastro de cliente PF', 'Execução de contrato', 'Art. 7º, V'],
            ['Tratamento de processo judicial', 'Cumprimento de obrigação legal', 'Art. 7º, II'],
            ['Compartilhamento com peritos/parceiros', 'Exercício regular de direitos', 'Art. 7º, VI'],
            ['Análise de contratos por IA externa', 'Consentimento (com anonimização opcional)', 'Art. 7º, I'],
            ['Audit log + retenção', 'Cumprimento de obrigação legal (Art. 34 OAB)', 'Art. 7º, II'],
            ['Backup e recuperação', 'Proteção do crédito (legítimo interesse)', 'Art. 7º, IX'],
          ].map((r, i) => (
            <tr key={i} style={{borderBottom: '1px solid var(--border-subtle)'}}>
              <td style={{padding: 10}}>{r[0]}</td>
              <td style={{padding: 10, color: 'var(--fg-default)'}}>{r[1]}</td>
              <td style={{padding: 10, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--accent)'}}>{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <H2>Sigilo profissional (Art. 7º, II EOAB; CPC arts. 189 e 207)</H2>
      <P>
        Documentos marcados como <code>segredo: true</code> são tratados em pipeline separado: (a) nunca são enviados a APIs externas (Anthropic) sem anonimização explícita pelo advogado responsável, (b) RLS restringe acesso à equipe vinculada ao processo, (c) URLs presigned do R2 expiram em 5min, (d) audit log registra cada read.
      </P>

      <H2>Camadas de proteção</H2>
      <ol style={{fontSize: 13.5, color: 'var(--fg-default)', lineHeight: 1.7, paddingLeft: 22}}>
        <li><b>Encriptação em trânsito:</b> TLS 1.3 obrigatório (Caddy autorenova certificados Let's Encrypt).</li>
        <li><b>Encriptação em repouso:</b> Neon (AES-256 nativo) · R2 (SSE-S3) · backups encriptados com chave gerenciada pelo escritório.</li>
        <li><b>Controle de acesso:</b> RBAC (Clerk) + RLS (Postgres) + JWT scoped.</li>
        <li><b>Audit log imutável:</b> append-only, hash chain a cada N registros (preparado p/ requisição judicial).</li>
        <li><b>Anonimização IA:</b> dados sigilosos sempre passam por Ollama local; anonimização (CPF, valores absolutos, nomes) opcional para Claude.</li>
        <li><b>DPO designado:</b> Dr. Gilberto Jacob (sócio) registrado como controlador (Art. 41 LGPD).</li>
        <li><b>Direitos do titular:</b> portal cliente expõe export/exclusão de dados não vinculados a obrigações legais ativas.</li>
        <li><b>Retenção:</b> dados de processo encerrado mantidos por 5 anos (Art. 1.025 CC); audit log por 6 anos (Art. 34 EOAB); backups por 30 dias.</li>
        <li><b>Plano de resposta a incidente:</b> notificação ANPD em até 48h (Art. 48 LGPD).</li>
      </ol>
    </BPSection>
  );
}

function BPRoadmap() {
  const sprints = [
    { s: 'Fase 0 · Setup', semanas: '1-2', m: ['Repositório monorepo Turbo', 'CI/CD (Vercel + Hetzner)', 'Auth Clerk', 'Schema Prisma inicial + RLS', 'Layout shell'] },
    { s: 'Sprint 1-2 · Núcleo (M1+M2+M3)', semanas: '3-6', m: ['CRUD Clientes / Processos / Partes', 'Upload de documentos básico', 'Integração DataJud (cron 30min)', 'Listagem + filtros densos', 'Tela de processo (split-view)'] },
    { s: 'Sprint 3 · Prazos (M4)', semanas: '7-8', m: ['Cadastro de prazos', 'Cálculo CPC com calendário tribunais', 'Bot Telegram + Email (Resend)', 'Sincronização Google Calendar'] },
    { s: 'Sprint 4 · Documentos avançado (M6)', semanas: '9-10', m: ['Versionamento', 'Templates Markdown/Docx', 'Editor de peças (Notion-style)', 'Assinatura BRy', 'Indexação pgvector'] },
    { s: 'Sprint 5 · IA Mata-Mata (M8 — núcleo)', semanas: '11-13', m: ['Worker FastAPI no Hetzner', 'RAG sobre jurisprudência (10k trechos)', 'Prompt-engineering Mata-Mata', 'Análise de contratos (CCB/CPR)', 'Streaming SSE + audit', 'Calculadora dívida rural'] },
    { s: 'Sprint 6 · Financeiro (M7)', semanas: '14-15', m: ['Contratos de honorários', 'Timesheet + integração processos', 'Faturamento Asaas', 'Dashboard financeiro'] },
    { s: 'Sprint 7 · Scrapers expandidos', semanas: '16-17', m: ['TJPR + TJMT (núcleo)', 'TJSC + TJRS + TJGO', 'Health monitoring', 'Fallback DataJud'] },
    { s: 'Sprint 8 · Portal cliente (M5) + Imóveis (M9)', semanas: '18-19', m: ['Portal magic-link', 'Mensagens cliente↔escritório', 'CAR/NIRF/CCIR', 'Mapa Leaflet'] },
    { s: 'Sprint 9 · BI (M10) + Polish', semanas: '20-22', m: ['Dashboards Recharts', 'Relatórios PDF/Excel', 'PWA offline', 'A11y audit', 'Testes e2e (Playwright)'] },
    { s: 'Sprint 10 · Hardening + Migração Linkei', semanas: '23-24', m: ['Penetration test', 'Migração de dados Linkei', 'Treinamento equipe', 'Soft-launch'] },
  ];

  return (
    <BPSection title="Roadmap em sprints" sub="24 semanas (~6 meses) · MVP em 8 semanas, V1 com IA em 13 · paralelização possível com 2 devs">
      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        {sprints.map((s, i) => (
          <div key={i} className="surface" style={{padding: 16, display: 'grid', gridTemplateColumns: '180px 80px 1fr', gap: 16, alignItems: 'flex-start'}}>
            <div>
              <div style={{fontSize: 13.5, fontWeight: 600, color: 'var(--fg-strong)'}}>{s.s}</div>
              <div style={{fontSize: 11, color: 'var(--fg-muted)', marginTop: 2, fontFamily: 'var(--font-mono)'}}>Semanas {s.semanas}</div>
            </div>
            <div style={{position: 'relative'}}>
              <div style={{height: 6, background: 'var(--bg-surface-2)', borderRadius: 3, overflow: 'hidden'}}>
                <div style={{width: `${Math.min(100, (i+1)/sprints.length*100)}%`, height: '100%', background: i < 4 ? 'var(--status-success)' : i < 8 ? 'var(--accent)' : 'var(--gold)'}} />
              </div>
              <div style={{fontSize: 10, color: 'var(--fg-muted)', textAlign: 'center', marginTop: 4}}>{((i+1)/sprints.length*100).toFixed(0)}%</div>
            </div>
            <ul style={{margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--fg-default)', lineHeight: 1.6}}>
              {s.m.map((m, j) => <li key={j}>{m}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <H2>Estimativa de custos mensais (operação)</H2>
      <table style={{width: '100%', fontSize: 12.5, borderCollapse: 'collapse', marginTop: 10}}>
        <thead><tr style={{background: 'var(--bg-surface-2)'}}>
          <th style={thR}>Serviço</th>
          <th style={{...thR, textAlign: 'right'}}>50 proc.</th>
          <th style={{...thR, textAlign: 'right'}}>250 proc.</th>
          <th style={{...thR, textAlign: 'right'}}>500 proc.</th>
        </tr></thead>
        <tbody>
          {[
            ['Vercel Pro', 'US$ 20', 'US$ 20', 'US$ 40'],
            ['Neon Postgres', 'US$ 19', 'US$ 69', 'US$ 119'],
            ['Cloudflare R2', 'US$ 5', 'US$ 15', 'US$ 35'],
            ['Hetzner CX31 (worker + Ollama)', '€ 12', '€ 12', '€ 28 (CX41)'],
            ['Anthropic Claude API', 'US$ 80', 'US$ 250', 'US$ 600'],
            ['OpenAI Embeddings (one-shot)', 'US$ 30', 'US$ 30', 'US$ 30'],
            ['Clerk', 'US$ 25', 'US$ 99', 'US$ 99'],
            ['Asaas', '~R$ 50', '~R$ 200', '~R$ 400'],
            ['Resend + Telegram', 'US$ 0', 'US$ 20', 'US$ 20'],
            ['BRy assinatura digital', 'R$ 200', 'R$ 600', 'R$ 1.200'],
          ].map((r, i) => (
            <tr key={i} style={{borderBottom: '1px solid var(--border-subtle)'}}>
              <td style={{padding: 10, fontWeight: 500}}>{r[0]}</td>
              {r.slice(1).map((c, j) => <td key={j} style={{padding: 10, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11.5}}>{c}</td>)}
            </tr>
          ))}
          <tr style={{background: 'var(--accent-soft)', fontWeight: 600}}>
            <td style={{padding: 10}}>Total estimado/mês</td>
            <td style={{padding: 10, textAlign: 'right', fontFamily: 'var(--font-mono)'}}>~R$ 1.500</td>
            <td style={{padding: 10, textAlign: 'right', fontFamily: 'var(--font-mono)'}}>~R$ 4.500</td>
            <td style={{padding: 10, textAlign: 'right', fontFamily: 'var(--font-mono)'}}>~R$ 9.500</td>
          </tr>
        </tbody>
      </table>
      <P style={{fontSize: 12, marginTop: 10, color: 'var(--fg-muted)'}}>
        <i>Câmbio aproximado USD 5,20 / EUR 5,80. Custo Anthropic varia conforme volume de chamadas — projeção considera 200/processo/mês incluindo geração de peças, análise e RAG.</i>
      </P>
    </BPSection>
  );
}

Object.assign(window, { BlueprintView });
