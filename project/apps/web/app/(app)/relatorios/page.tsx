import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  BarChart3, TrendingUp, TrendingDown, Users, Briefcase,
  Banknote, Scale, Clock, FileText, AlertTriangle, CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import {
  ReceitaMensalChart, ProcessosPorAreaChart, ProcessosPorRiscoChart,
  ProcessosPorStatusChart, FaturasPorStatusChart, TopClientesChart,
} from "./charts";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, Permission.relatorio_view)) redirect("/dashboard");

  const hoje = new Date();
  const inicioAno = new Date(hoje.getFullYear(), 0, 1);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const dozeMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1);

  const [
    receitaTotal, receitaPendente, receitaAtrasada,
    processosAtivos, processosEncerrados, valorLitigioTotal,
    clientesAtivos, clientesInativos,
    faturasEmitidasMes, horasTrabalhadasMes,
    receitaPorMes, processosPorArea, processosPorStatus,
    faturasPorStatus, topClientes,
    rankingAdvogados, processosMaisAntigos, tarefasPorStatus,
    processosPorRisco,
  ] = await Promise.all([
    prisma.fatura.aggregate({ _sum: { valor: true }, where: { status: "pago", deletedAt: null } }),
    prisma.fatura.aggregate({ _sum: { valor: true }, where: { status: "pendente", deletedAt: null } }),
    prisma.fatura.aggregate({ _sum: { valor: true }, where: { status: "atrasado", deletedAt: null } }),
    prisma.processo.count({ where: { status: { not: "encerrado" }, deletedAt: null } }),
    prisma.processo.count({ where: { status: "encerrado", deletedAt: null } }),
    prisma.processo.aggregate({ _sum: { valorCausa: true }, where: { deletedAt: null } }),
    prisma.cliente.count({ where: { status: "ativo", deletedAt: null } }),
    prisma.cliente.count({ where: { status: "inativo", deletedAt: null } }),
    prisma.fatura.count({ where: { createdAt: { gte: inicioMes }, deletedAt: null } }),
    prisma.timesheet.aggregate({ _sum: { horas: true }, where: { data: { gte: inicioMes }, deletedAt: null } }),
    prisma.fatura.groupBy({ by: ["ano", "mes"], _sum: { valor: true }, where: { status: "pago", createdAt: { gte: dozeMesesAtras }, deletedAt: null }, orderBy: [{ ano: "asc" }, { mes: "asc" }] }),
    prisma.processo.groupBy({ by: ["area"], _count: { id: true }, _sum: { valorCausa: true }, where: { deletedAt: null } }),
    prisma.processo.groupBy({ by: ["status"], _count: { id: true }, where: { deletedAt: null } }),
    prisma.fatura.groupBy({ by: ["status"], _count: { id: true }, _sum: { valor: true }, where: { deletedAt: null } }),
    prisma.cliente.findMany({ where: { deletedAt: null }, select: { id: true, nome: true, _count: { select: { processos: true } } }, orderBy: { processos: { _count: "desc" } }, take: 10 }),
    prisma.timesheet.groupBy({ by: ["userId"], _sum: { horas: true }, where: { deletedAt: null, data: { gte: inicioAno } }, orderBy: { _sum: { horas: "desc" } }, take: 10 }),
    prisma.processo.findMany({ where: { status: { not: "encerrado" }, deletedAt: null }, select: { id: true, cnj: true, tipo: true, area: true, valorCausa: true, distribuicao: true, cliente: { select: { nome: true } }, risco: true }, orderBy: { distribuicao: "asc" }, take: 10 }),
    prisma.task.groupBy({ by: ["status"], _count: { id: true }, where: { deletedAt: null } }),
    prisma.processo.groupBy({ by: ["risco"], _count: { id: true }, _sum: { valorCausa: true }, where: { deletedAt: null, status: { not: "encerrado" } } }),
  ]);

  const advogadoIds = rankingAdvogados.map((r) => r.userId);
  const advogados = await prisma.user.findMany({ where: { id: { in: advogadoIds } }, select: { id: true, nome: true } });
  const advogadoMap = new Map(advogados.map((a) => [a.id, a.nome]));

  const totalReceitasPendentes =
    (receitaPendente._sum.valor?.toNumber() || 0) +
    (receitaAtrasada._sum.valor?.toNumber() || 0);

  const riscoAltoCount = processosPorRisco.find((r) => r.risco === "alto")?._count.id || 0;
  const riscoAltoValor = processosPorRisco.find((r) => r.risco === "alto")?._sum.valorCausa?.toNumber() || 0;

  return (
    <div className="p-6 max-w-[1480px] mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Relatórios Executivos</h1>
          <p className="text-sm text-muted-foreground">Indicadores operacionais, financeiros e de risco · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receita Total" value={formatCurrency(receitaTotal._sum.valor?.toNumber() || 0)} subtitle={`${faturasEmitidasMes} faturas no mês`} color="bg-emerald-500" icon={<Banknote className="w-4 h-4" />} />
        <KpiCard label="A Receber" value={formatCurrency(totalReceitasPendentes)} subtitle={`${formatCurrency(receitaAtrasada._sum.valor?.toNumber() || 0)} atrasado`} color="bg-amber-500" icon={<TrendingDown className="w-4 h-4" />} />
        <KpiCard label="Valor em Litígio" value={formatCurrency(valorLitigioTotal._sum.valorCausa?.toNumber() || 0)} subtitle={`${processosAtivos} processos ativos`} color="bg-blue-500" icon={<Scale className="w-4 h-4" />} />
        <KpiCard label="Risco Alto" value={String(riscoAltoCount)} subtitle={`${formatCurrency(riscoAltoValor)} em risco`} color="bg-rose-500" icon={<ShieldAlert className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Processos Ativos" value={String(processosAtivos)} subtitle={`${processosEncerrados} encerrados`} color="bg-[var(--jgg-navy-700)]" icon={<Briefcase className="w-4 h-4" />} />
        <KpiCard label="Clientes Ativos" value={String(clientesAtivos)} subtitle={`${clientesInativos} inativos`} color="bg-[var(--jgg-navy-700)]" icon={<Users className="w-4 h-4" />} />
        <KpiCard label="Horas no Mês" value={`${Number(horasTrabalhadasMes._sum.horas?.toNumber() || 0).toFixed(1)}h`} subtitle="Produtividade" color="bg-[var(--jgg-navy-700)]" icon={<Clock className="w-4 h-4" />} />
        <KpiCard label="Tarefas Abertas" value={String(tarefasPorStatus.filter((t) => t.status !== "concluida" && t.status !== "cancelada").reduce((s, t) => s + t._count.id, 0))} subtitle="Em andamento" color="bg-[var(--jgg-navy-700)]" icon={<FileText className="w-4 h-4" />} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReceitaMensalChart data={receitaPorMes} />
        <ProcessosPorAreaChart data={processosPorArea} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ProcessosPorRiscoChart data={processosPorRisco} />
        <ProcessosPorStatusChart data={processosPorStatus} />
        <FaturasPorStatusChart data={faturasPorStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopClientesChart data={topClientes} />

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
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Risco</th>
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
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-xs">{formatCurrency(Number(p.valorCausa ?? 0))}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${p.risco === "alto" ? "bg-rose-500" : p.risco === "medio" ? "bg-amber-500" : "bg-emerald-500"}`} />
                    </td>
                  </tr>
                ))}
                {processosMaisAntigos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">Nenhum processo em aberto</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        {advogadoMap.get(r.userId) || "Desconhecido"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">{Number(r._sum.horas ?? 0).toFixed(1)}h</td>
                  </tr>
                ))}
                {rankingAdvogados.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground text-sm">Nenhum registro de horas no ano</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tarefas por status */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <FileText size={16} className="text-muted-foreground" />
              Distribuição de Tarefas
            </h2>
          </div>
          <div className="p-4">
            <div className="flex gap-4 flex-wrap">
              {tarefasPorStatus.map((t) => (
                <div key={t.status} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    t.status === "concluida" ? "bg-emerald-500" :
                    t.status === "em_andamento" ? "bg-blue-500" :
                    t.status === "cancelada" ? "bg-red-400" : "bg-amber-400"
                  }`} />
                  <span className="capitalize">{t.status.replace(/_/g, " ")}</span>
                  <span className="font-semibold tabular-nums">{t._count.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, subtitle, color, icon }: {
  label: string; value: string; subtitle: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${color}`} />
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="text-[28px] font-serif font-semibold text-foreground leading-none mt-1.5">{value}</div>
      <div className="text-xs text-muted-foreground mt-1.5">{subtitle}</div>
    </div>
  );
}
