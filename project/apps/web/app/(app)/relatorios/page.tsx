import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Banknote,
  Scale,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  ReceitaMensalChart,
  ProcessosPorAreaChart,
  ProcessosPorStatusChart,
  FaturasPorStatusChart,
  TopClientesChart,
} from "./charts";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const hoje = new Date();
  const inicioAno = new Date(hoje.getFullYear(), 0, 1);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const dozeMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1);

  const [
    // KPIs
    receitaTotal,
    receitaPendente,
    receitaAtrasada,
    processosAtivos,
    processosEncerrados,
    valorLitigioTotal,
    clientesAtivos,
    clientesInativos,
    faturasEmitidasMes,
    horasTrabalhadasMes,

    // Gráficos
    receitaPorMes,
    processosPorArea,
    processosPorStatus,
    faturasPorStatus,
    topClientes,
    rankingAdvogados,
    processosMaisAntigos,
    tarefasPorStatus,
  ] = await Promise.all([
    // Receita total (faturas pagas)
    prisma.fatura.aggregate({
      _sum: { valor: true },
      where: { status: "pago", deletedAt: null },
    }),

    // Receita pendente
    prisma.fatura.aggregate({
      _sum: { valor: true },
      where: { status: "pendente", deletedAt: null },
    }),

    // Receita atrasada
    prisma.fatura.aggregate({
      _sum: { valor: true },
      where: { status: "atrasado", deletedAt: null },
    }),

    // Processos ativos
    prisma.processo.count({
      where: { status: { not: "encerrado" }, deletedAt: null },
    }),

    // Processos encerrados
    prisma.processo.count({
      where: { status: "encerrado", deletedAt: null },
    }),

    // Valor em litigio total
    prisma.processo.aggregate({
      _sum: { valorCausa: true },
      where: { deletedAt: null },
    }),

    // Clientes ativos
    prisma.cliente.count({
      where: { status: "ativo", deletedAt: null },
    }),

    // Clientes inativos
    prisma.cliente.count({
      where: { status: "inativo", deletedAt: null },
    }),

    // Faturas emitidas no mes
    prisma.fatura.count({
      where: { createdAt: { gte: inicioMes }, deletedAt: null },
    }),

    // Horas trabalhadas no mes
    prisma.timesheet.aggregate({
      _sum: { horas: true },
      where: { data: { gte: inicioMes }, deletedAt: null },
    }),

    // === GRAFICOS ===

    // Receita por mes (ultimos 12 meses)
    prisma.fatura.groupBy({
      by: ["ano", "mes"],
      _sum: { valor: true },
      where: {
        status: "pago",
        createdAt: { gte: dozeMesesAtras },
        deletedAt: null,
      },
      orderBy: [{ ano: "asc" }, { mes: "asc" }],
    }),

    // Processos por area
    prisma.processo.groupBy({
      by: ["area"],
      _count: { id: true },
      _sum: { valorCausa: true },
      where: { deletedAt: null },
    }),

    // Processos por status
    prisma.processo.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { deletedAt: null },
    }),

    // Faturas por status
    prisma.fatura.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { valor: true },
      where: { deletedAt: null },
    }),

    // Top 10 clientes por valor em causa
    prisma.cliente.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        nome: true,
        _count: { select: { processos: true } },
      },
      orderBy: { processos: { _count: "desc" } },
      take: 10,
    }),

    // Ranking de advogados por horas
    prisma.timesheet.groupBy({
      by: ["userId"],
      _sum: { horas: true },
      where: { deletedAt: null, data: { gte: inicioAno } },
      orderBy: { _sum: { horas: "desc" } },
      take: 10,
    }),

    // Processos mais antigos em aberto
    prisma.processo.findMany({
      where: { status: { not: "encerrado" }, deletedAt: null },
      select: {
        id: true,
        cnj: true,
        tipo: true,
        area: true,
        valorCausa: true,
        distribuicao: true,
        cliente: { select: { nome: true } },
      },
      orderBy: { distribuicao: "asc" },
      take: 10,
    }),

    // Tarefas por status
    prisma.task.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { deletedAt: null },
    }),
  ]);

  // Buscar nomes dos advogados para o ranking
  const advogadoIds = rankingAdvogados.map((r) => r.userId);
  const advogados = await prisma.user.findMany({
    where: { id: { in: advogadoIds } },
    select: { id: true, nome: true },
  });
  const advogadoMap = new Map(advogados.map((a) => [a.id, a.nome]));

  const kpis = [
    {
      label: "Receita Total",
      value: formatCurrency(Number(receitaTotal._sum.valor ?? 0)),
      icon: Banknote,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "A Receber",
      value: formatCurrency(Number(receitaPendente._sum.valor ?? 0)),
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Em Atraso",
      value: formatCurrency(Number(receitaAtrasada._sum.valor ?? 0)),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Processos Ativos",
      value: processosAtivos.toString(),
      icon: Briefcase,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Encerrados",
      value: processosEncerrados.toString(),
      icon: CheckCircle2,
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
    {
      label: "Valor em Litigio",
      value: formatCurrency(Number(valorLitigioTotal._sum.valorCausa ?? 0)),
      icon: Scale,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Clientes Ativos",
      value: clientesAtivos.toString(),
      icon: Users,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      label: "Horas (Mes)",
      value: `${Number(horasTrabalhadasMes._sum.horas ?? 0).toFixed(1)}h`,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="p-6 max-w-[1480px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold">Relatorios & BI</h1>
        <p className="text-sm text-muted-foreground">
          Dashboard executivo com indicadores-chave do escritorio
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon size={16} className={kpi.color} />
              </div>
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <div className="text-xl font-semibold tabular-nums">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Graficos - Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReceitaMensalChart data={receitaPorMes} />
        <ProcessosPorAreaChart data={processosPorArea} />
      </div>

      {/* Graficos - Linha 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProcessosPorStatusChart data={processosPorStatus} />
        <FaturasPorStatusChart data={faturasPorStatus} />
        <TopClientesChart data={topClientes} />
      </div>

      {/* Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Advogados */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 size={16} className="text-muted-foreground" />
              Ranking de Advogados (horas / ano)
            </h2>
          </div>
          <div className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Advogado</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Horas</th>
                </tr>
              </thead>
              <tbody>
                {rankingAdvogados.map((r, i) => (
                  <tr key={r.userId} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        {advogadoMap.get(r.userId) || "Desconhecido"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {Number(r._sum.horas ?? 0).toFixed(1)}h
                    </td>
                  </tr>
                ))}
                {rankingAdvogados.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      Nenhum registro de horas no ano
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Processos mais antigos */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Clock size={16} className="text-muted-foreground" />
              Processos mais antigos em aberto
            </h2>
          </div>
          <div className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Processo</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Valor</th>
                </tr>
              </thead>
              <tbody>
                {processosMaisAntigos.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="font-mono text-xs text-muted-foreground">{p.cnj}</div>
                      <div className="text-xs">{p.tipo}</div>
                    </td>
                    <td className="px-4 py-2.5 text-xs">{p.cliente?.nome || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-xs">
                      {formatCurrency(Number(p.valorCausa ?? 0))}
                    </td>
                  </tr>
                ))}
                {processosMaisAntigos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      Nenhum processo em aberto
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tarefas por status */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" />
            Distribuicao de Tarefas
          </h2>
        </div>
        <div className="p-4">
          <div className="flex gap-4 flex-wrap">
            {tarefasPorStatus.map((t) => (
              <div
                key={t.status}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    t.status === "concluida"
                      ? "bg-emerald-500"
                      : t.status === "em_andamento"
                      ? "bg-blue-500"
                      : t.status === "cancelada"
                      ? "bg-red-400"
                      : "bg-amber-400"
                  }`}
                />
                <span className="capitalize">{t.status.replace(/_/g, " ")}</span>
                <span className="font-semibold tabular-nums">{t._count.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
