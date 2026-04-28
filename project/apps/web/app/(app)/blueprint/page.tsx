import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Database,
  Shield,
  Users,
  FileText,
  Scale,
  Banknote,
  Calendar,
  Brain,
  Layers,
  Server,
  Lock,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BlueprintPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const sections = [
    {
      icon: Layers,
      title: "Arquitetura",
      color: "text-blue-600",
      bg: "bg-blue-50",
      items: [
        { label: "Framework", value: "Next.js 16.2.4 + React 19 + TypeScript" },
        { label: "Build", value: "Turbopack" },
        { label: "Styling", value: "Tailwind CSS v4 + shadcn/ui" },
        { label: "Runtime", value: "Node.js 22 LTS" },
      ],
    },
    {
      icon: Database,
      title: "Banco de Dados",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      items: [
        { label: "Engine", value: "PostgreSQL 15+ (Neon Serverless)" },
        { label: "ORM", value: "Prisma 5.22.0" },
        { label: "Modelos", value: "30+ tabelas com soft delete" },
        { label: "Migrations", value: "Prisma Migrate" },
      ],
    },
    {
      icon: Shield,
      title: "Autenticação & RBAC",
      color: "text-violet-600",
      bg: "bg-violet-50",
      items: [
        { label: "Provider", value: "Clerk v7" },
        { label: "Middleware", value: "proxy.ts (Next.js 16 convention)" },
        { label: "Roles", value: "admin, socio, advogado, estagiario, financeiro, comercial" },
        { label: "Permissões", value: "40+ granular permissions via UserPermission" },
      ],
    },
    {
      icon: Server,
      title: "API & Backend",
      color: "text-orange-600",
      bg: "bg-orange-50",
      items: [
        { label: "Padrão", value: "REST API com Next.js Route Handlers" },
        { label: "Validação", value: "Zod schemas" },
        { label: "Auditoria", value: "AuditLog automático em todas as operações" },
        { label: "Resposta", value: "JSON padronizado com { data, meta }" },
      ],
    },
  ];

  const modules = [
    {
      icon: Users,
      name: "Clientes",
      route: "/clientes",
      api: "/api/v1/clients",
      status: "Completo",
      color: "bg-emerald-500",
    },
    {
      icon: Scale,
      name: "Processos",
      route: "/processos",
      api: "/api/v1/processes",
      status: "Completo",
      color: "bg-emerald-500",
    },
    {
      icon: Calendar,
      name: "Prazos",
      route: "/agenda",
      api: "/api/v1/deadlines",
      status: "Completo",
      color: "bg-emerald-500",
    },
    {
      icon: FileText,
      name: "Documentos",
      route: "/documentos",
      api: "/api/v1/documents",
      status: "Completo",
      color: "bg-emerald-500",
    },
    {
      icon: Banknote,
      name: "Financeiro",
      route: "/financeiro",
      api: "/api/v1/invoices, /api/v1/contracts",
      status: "Completo",
      color: "bg-emerald-500",
    },
    {
      icon: Brain,
      name: "IA",
      route: "/ia",
      api: "—",
      status: "Completo",
      color: "bg-emerald-500",
    },
    {
      icon: Zap,
      name: "Relatórios & BI",
      route: "/relatorios",
      api: "—",
      status: "Completo",
      color: "bg-emerald-500",
    },
  ];

  const integrations = [
    { name: "Clerk", purpose: "Auth & user management", status: "Ativo" },
    { name: "Neon PostgreSQL", purpose: "Banco de dados serverless", status: "Ativo" },
    { name: "DataJud API", purpose: "Busca de processos por CNJ", status: "Ativo" },
    { name: "Vercel", purpose: "Hospedagem & CDN", status: "Ativo" },
  ];

  return (
    <div className="p-6 max-w-[1480px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold">Blueprint Técnico</h1>
        <p className="text-sm text-muted-foreground">
          Documentação da arquitetura e stack tecnológica do JGG Legal OS
        </p>
      </div>

      {/* Architecture cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((s) => (
          <div key={s.title} className="rounded-xl border bg-card shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon size={14} className={s.color} />
                </div>
                {s.title}
              </h2>
            </div>
            <div className="p-4 space-y-2.5">
              {s.items.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modules table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Lock size={16} className="text-muted-foreground" />
            Módulos & APIs
          </h2>
        </div>
        <div className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Módulo</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Rota</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">API REST</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.name} className="border-b last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2">
                      <m.icon size={14} className="text-muted-foreground" />
                      {m.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{m.route}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{m.api}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.color}`} />
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integrations */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Zap size={16} className="text-muted-foreground" />
            Integrações
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {integrations.map((i) => (
              <div key={i.name} className="rounded-lg border bg-muted/30 p-3">
                <div className="text-sm font-medium">{i.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{i.purpose}</div>
                <div className="text-xs text-emerald-600 font-medium mt-1.5">{i.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schema diagram placeholder */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Database size={16} className="text-muted-foreground" />
            Schema do Banco de Dados
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
            {[
              "User", "UserPermission", "Cliente", "Contact", "Processo", "Andamento",
              "Prazo", "Task", "Documento", "DocumentVersion", "Expense", "Note",
              "Tag", "TagRelation", "ContratoHonorarios", "Fatura", "Timesheet",
              "JurisprudenciaTrecho", "SystemSetting", "IntegrationAccount",
              "PromptTemplate", "AIConversation", "AIMessage", "AIUsageLog", "AuditLog",
            ].map((model) => (
              <div key={model} className="px-2 py-1.5 rounded bg-muted/50 text-center font-mono text-muted-foreground">
                {model}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
