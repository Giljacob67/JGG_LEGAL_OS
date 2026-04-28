import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Briefcase,
  Scale,
  Banknote,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatDate, formatRelativeDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const hoje = new Date();
  const seteDias = new Date(hoje);
  seteDias.setDate(hoje.getDate() + 7);
  const trintaDias = new Date(hoje);
  trintaDias.setDate(hoje.getDate() + 30);
  const trintaDiasAtras = new Date(hoje);
  trintaDiasAtras.setDate(hoje.getDate() - 30);

  // ============================================================
  // KPIs
  // ============================================================
  const [
    processosAtivos,
    valorLitigio,
    prazosCriticos,
    prazosSemana,
    receitasPendentes,
    receitasAtrasadas,
    tarefasAbertas,
    movimentacoesRecentes,
    clientesAtivos,
    distribuicaoArea,
  ] = await Promise.all([
    // Processos ativos
    prisma.processo.count({
      where: { status: "em_andamento", deletedAt: null },
    }),

    // Valor em litígio
    prisma.processo.aggregate({
      where: { status: "em_andamento", deletedAt: null },
      _sum: { valorCausa: true },
    }),

    // Prazos críticos (≤ 7 dias)
    prisma.prazo.count({
      where: {
        status: "aberto",
        deletedAt: null,
        vence: { lte: seteDias },
      },
    }),

    // Prazos da semana
    prisma.prazo.findMany({
      where: {
        status: "aberto",
        deletedAt: null,
        vence: { lte: seteDias },
      },
      orderBy: { vence: "asc" },
      take: 5,
      include: {
        processo: { select: { cnj: true, cliente: { select: { nome: true } } } },
        responsavel: { select: { nome: true } },
      },
    }),

    // Receitas pendentes
    prisma.fatura.aggregate({
      where: {
        status: "pendente",
        deletedAt: null,
      },
      _sum: { valor: true },
    }),

    // Receitas atrasadas
    prisma.fatura.aggregate({
      where: {
        status: "atrasado",
        deletedAt: null,
      },
      _sum: { valor: true },
    }),

    // Tarefas abertas
    prisma.task.count({
      where: {
        status: { in: ["aberta", "em_andamento"] },
        deletedAt: null,
      },
    }),

    // Movimentações recentes
    prisma.andamento.findMany({
      where: {
        data: { gte: trintaDiasAtras },
        deletedAt: null,
      },
      orderBy: { data: "desc" },
      take: 6,
      include: {
        processo: { select: { cnj: true, cliente: { select: { nome: true } } } },
      },
    }),

    // Clientes ativos
    prisma.cliente.count({
      where: { status: "ativo", deletedAt: null },
    }),

    // Distribuição por área
    prisma.processo.groupBy({
      by: ["area"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
  ]);

  const totalReceitasPendentes =
    (receitasPendentes._sum.valor?.toNumber() || 0) +
    (receitasAtrasadas._sum.valor?.toNumber() || 0);

  const areaLabels: Record<string, string> = {
    bancario: "Bancário",
    agrario: "Agrário",
    tributario: "Tributário",
    trabalhista: "Trabalhista",
    civil: "Civil",
    empresarial: "Empresarial",
    penal: "Penal",
  };

  const areaColors: Record<string, string> = {
    bancario: "bg-blue-500",
    agrario: "bg-emerald-500",
    tributario: "bg-amber-500",
    trabalhista: "bg-rose-500",
    civil: "bg-violet-500",
    empresarial: "bg-cyan-500",
    penal: "bg-slate-500",
  };

  const totalProcessosPorArea = distribuicaoArea.reduce(
    (sum, a) => sum + a._count.id,
    0
  );

  return (
    <div className="p-6 max-w-[1480px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            Bom dia, {user.nome.split(" ")[0]}.
          </h1>
          <p className="text-sm text-muted-foreground">
            JGG GROUP · {user.role === "socio" ? "Sócio" : user.role === "advogado" ? "Advogado" : user.role} · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Processos Ativos"
          value={String(processosAtivos)}
          subtitle={`${clientesAtivos} clientes ativos`}
          color="bg-[var(--jgg-navy-700)]"
          icon={<Briefcase className="w-4 h-4" />}
        />
        <KpiCard
          label="Valor em Litígio"
          value={formatCurrency(valorLitigio._sum.valorCausa?.toNumber() || 0)}
          subtitle="Soma de todas as causas ativas"
          color="bg-[var(--jgg-bordo-700)]"
          icon={<Scale className="w-4 h-4" />}
        />
        <KpiCard
          label="A Receber"
          value={formatCurrency(totalReceitasPendentes)}
          subtitle={`${receitasAtrasadas._sum.valor ? formatCurrency(receitasAtrasadas._sum.valor.toNumber()) + " atrasado" : "Nenhuma atrasada"}`}
          color="bg-[var(--jgg-gold-700)]"
          icon={<Banknote className="w-4 h-4" />}
        />
        <KpiCard
          label="Prazos Críticos"
          value={String(prazosCriticos)}
          subtitle={`${tarefasAbertas} tarefas abertas`}
          color="bg-destructive"
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Prazos críticos */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Prazos críticos da semana
            </h3>
            <a
              href="/agenda"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Ver agenda <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          {prazosSemana.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Nenhum prazo crítico nos próximos 7 dias. Bom trabalho!
            </div>
          ) : (
            <div className="space-y-2">
              {prazosSemana.map((prazo) => {
                const dias = Math.ceil(
                  (new Date(prazo.vence).getTime() - hoje.getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const diasLabel =
                  dias < 0
                    ? `${Math.abs(dias)}d atrasado`
                    : dias === 0
                    ? "Hoje"
                    : dias === 1
                    ? "Amanhã"
                    : `${dias}d`;
                const diasColor =
                  dias <= 1
                    ? "text-destructive bg-destructive/10"
                    : dias <= 3
                    ? "text-amber-600 bg-amber-50"
                    : "text-muted-foreground bg-muted";

                return (
                  <div
                    key={prazo.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors"
                  >
                    <div className={`text-xs font-medium px-2 py-1 rounded-md ${diasColor}`}>
                      {diasLabel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {prazo.titulo}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {prazo.processo?.cliente?.nome || "—"} ·{" "}
                        {prazo.processo?.cnj || "—"} ·{" "}
                        {formatDate(prazo.vence)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {prazo.responsavel?.nome || "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Distribuição por área */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-[15px] font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Distribuição por área
          </h3>

          {distribuicaoArea.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Nenhum processo cadastrado.
            </div>
          ) : (
            <div className="space-y-3">
              {distribuicaoArea.map((area) => {
                const pct = totalProcessosPorArea
                  ? Math.round((area._count.id / totalProcessosPorArea) * 100)
                  : 0;
                return (
                  <div key={area.area}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${areaColors[area.area] || "bg-slate-400"}`}
                        />
                        {areaLabels[area.area] || area.area}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {area._count.id} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${areaColors[area.area] || "bg-slate-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Movimentações recentes */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Movimentações recentes
            </h3>
            <a
              href="/processos"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Ver processos <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          {movimentacoesRecentes.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma movimentação nos últimos 30 dias.
            </div>
          ) : (
            <div className="space-y-2">
              {movimentacoesRecentes.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{mov.evento}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {mov.descricao}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {mov.processo?.cliente?.nome || "—"} ·{" "}
                      {formatDate(mov.data)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clientes em atendimento */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clientes em atendimento
            </h3>
            <a
              href="/clientes"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Ver clientes <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="text-2xl font-serif font-semibold">{clientesAtivos}</div>
              <div className="text-xs text-muted-foreground">Clientes ativos</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="text-2xl font-serif font-semibold">{processosAtivos}</div>
              <div className="text-xs text-muted-foreground">Processos ativos</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="text-2xl font-serif font-semibold">
                {formatCurrency(totalReceitasPendentes)}
              </div>
              <div className="text-xs text-muted-foreground">A receber</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="text-2xl font-serif font-semibold">{tarefasAbertas}</div>
              <div className="text-xs text-muted-foreground">Tarefas abertas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
  color,
  icon,
}: {
  label: string;
  value: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${color}`} />
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="text-[28px] font-serif font-semibold text-foreground leading-none mt-1.5">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1.5">{subtitle}</div>
    </div>
  );
}
