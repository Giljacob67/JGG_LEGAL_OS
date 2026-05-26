import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { Permission } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  Briefcase, Scale, Banknote, Clock, AlertTriangle, TrendingUp,
  Users, FileText, Calendar, ChevronRight, ShieldAlert,
} from "lucide-react";
import { formatCurrency, formatDate, formatRelativeDate } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, Permission.dashboard_view)) redirect("/dashboard");

  const hoje = new Date();
  const seteDias = new Date(hoje);
  seteDias.setDate(hoje.getDate() + 7);
  const trintaDias = new Date(hoje);
  trintaDias.setDate(hoje.getDate() + 30);
  const trintaDiasAtras = new Date(hoje);
  trintaDiasAtras.setDate(hoje.getDate() - 30);

  const [
    processosAtivos, valorLitigio, prazosCriticos, prazosSemana,
    receitasPendentes, receitasAtrasadas, tarefasAbertas,
    movimentacoesRecentes, clientesAtivos, distribuicaoArea,
    prazosVencidos, processosRiscoAlto,
  ] = await Promise.all([
    prisma.processo.count({ where: { status: "em_andamento", deletedAt: null } }),
    prisma.processo.aggregate({ where: { status: "em_andamento", deletedAt: null }, _sum: { valorCausa: true } }),
    prisma.prazo.count({ where: { status: "aberto", deletedAt: null, vence: { lte: seteDias } } }),
    prisma.prazo.findMany({
      where: { status: "aberto", deletedAt: null, vence: { lte: seteDias } },
      orderBy: { vence: "asc" }, take: 5,
      include: { processo: { select: { cnj: true, cliente: { select: { nome: true } } } }, responsavel: { select: { nome: true } } },
    }),
    prisma.fatura.aggregate({ where: { status: "pendente", deletedAt: null }, _sum: { valor: true } }),
    prisma.fatura.aggregate({ where: { status: "atrasado", deletedAt: null }, _sum: { valor: true } }),
    prisma.task.count({ where: { status: { in: ["aberta", "em_andamento"] }, deletedAt: null } }),
    prisma.andamento.findMany({
      where: { data: { gte: trintaDiasAtras }, deletedAt: null },
      orderBy: { data: "desc" }, take: 6,
      include: { processo: { select: { cnj: true, cliente: { select: { nome: true } } } } },
    }),
    prisma.cliente.count({ where: { status: "ativo", deletedAt: null } }),
    prisma.processo.groupBy({ by: ["area"], where: { deletedAt: null }, _count: { id: true } }),
    prisma.prazo.findMany({
      where: { status: "aberto", deletedAt: null, vence: { lt: hoje } },
      orderBy: { vence: "asc" }, take: 5,
      include: { processo: { select: { cnj: true, cliente: { select: { nome: true } } } }, responsavel: { select: { nome: true } } },
    }),
    prisma.processo.count({ where: { status: { not: "encerrado" }, deletedAt: null, risco: "alto" } }),
  ]);

  const totalReceitasPendentes =
    (receitasPendentes._sum.valor?.toNumber() || 0) +
    (receitasAtrasadas._sum.valor?.toNumber() || 0);

  const areaLabels: Record<string, string> = {
    bancario: "Bancário", agrario: "Agrário", tributario: "Tributário",
    trabalhista: "Trabalhista", civil: "Civil", empresarial: "Empresarial", penal: "Penal",
  };
  const areaColors: Record<string, string> = {
    bancario: "bg-blue-500", agrario: "bg-emerald-500", tributario: "bg-amber-500",
    trabalhista: "bg-rose-500", civil: "bg-violet-500", empresarial: "bg-cyan-500", penal: "bg-slate-500",
  };
  const totalProcessosPorArea = distribuicaoArea.reduce((sum, a) => sum + a._count.id, 0);

  return (
    <div className="p-6 max-w-[1480px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Bom dia, {user.nome.split(" ")[0]}.</h1>
          <p className="text-sm text-muted-foreground">
            JGG GROUP · {user.role === "socio" ? "Sócio" : user.role === "advogado" ? "Advogado" : user.role} · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {/* KPIs operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Processos Ativos" value={String(processosAtivos)} subtitle={`${clientesAtivos} clientes ativos`} color="bg-[var(--jgg-navy-700)]" icon={<Briefcase className="w-4 h-4" />} />
        <KpiCard label="Valor em Litígio" value={formatCurrency(valorLitigio._sum.valorCausa?.toNumber() || 0)} subtitle="Soma de todas as causas ativas" color="bg-[var(--jgg-navy-700)]" icon={<Scale className="w-4 h-4" />} />
        <KpiCard label="Prazos Críticos" value={String(prazosCriticos)} subtitle={`${prazosVencidos.length} vencidos`} color={prazosCriticos > 0 ? "bg-rose-500" : "bg-[var(--jgg-navy-700)]"} icon={<AlertTriangle className="w-4 h-4" />} />
        <KpiCard label="Risco Alto" value={String(processosRiscoAlto)} subtitle="Processos em risco alto" color="bg-rose-500" icon={<ShieldAlert className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="A Receber" value={formatCurrency(totalReceitasPendentes)} subtitle={`${formatCurrency(receitasAtrasadas._sum.valor?.toNumber() || 0)} atrasado`} color="bg-amber-500" icon={<Banknote className="w-4 h-4" />} />
        <KpiCard label="Tarefas Abertas" value={String(tarefasAbertas)} subtitle="Em andamento" color="bg-[var(--jgg-navy-700)]" icon={<FileText className="w-4 h-4" />} />
        <KpiCard label="Movimentações" value={String(movimentacoesRecentes.length)} subtitle="Últimos 30 dias" color="bg-[var(--jgg-navy-700)]" icon={<TrendingUp className="w-4 h-4" />} />
        <KpiCard label="Clientes" value={String(clientesAtivos)} subtitle={`${processosAtivos} processos ativos`} color="bg-[var(--jgg-navy-700)]" icon={<Users className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Prazos críticos */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Prazos Críticos (7 dias)
            </h3>
            <a href="/agenda" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              Ver agenda <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          {prazosSemana.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Nenhum prazo crítico nos próximos 7 dias.</div>
          ) : (
            <div className="space-y-2">
              {prazosSemana.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{p.titulo}</div>
                    <div className="text-xs text-muted-foreground">{p.processo?.cnj || "—"} · {p.processo?.cliente?.nome || "—"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Vence {formatRelativeDate(p.vence)} · Responsável: {p.responsavel?.nome || "—"}
                    </div>
                  </div>
                  <div className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    p.tipo === "fatal" ? "bg-rose-100 text-rose-700 border-rose-200" :
                    p.tipo === "audiencia" ? "bg-blue-100 text-blue-700 border-blue-200" :
                    "bg-amber-100 text-amber-700 border-amber-200"
                  }`}>
                    {p.tipo}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prazos vencidos */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Prazos Vencidos
            </h3>
          </div>
          {prazosVencidos.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Nenhum prazo vencido. Excelente!</div>
          ) : (
            <div className="space-y-2">
              {prazosVencidos.map((p) => (
                <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-rose-700">{p.titulo}</div>
                    <div className="text-xs text-rose-600/70">{p.processo?.cnj || "—"} · {p.processo?.cliente?.nome || "—"}</div>
                    <div className="text-xs text-rose-600/70 mt-0.5">
                      Venceu {formatRelativeDate(p.vence)} · {p.responsavel?.nome || "—"}
                    </div>
                  </div>
                </div>
              ))}
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
            <a href="/processos-v2" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              Ver processos <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          {movimentacoesRecentes.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma movimentação nos últimos 30 dias.</div>
          ) : (
            <div className="space-y-2">
              {movimentacoesRecentes.map((mov) => (
                <div key={mov.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{mov.evento}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{mov.descricao}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{mov.processo?.cliente?.nome || "—"} · {formatDate(mov.data)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribuição por área + Clientes */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clientes em atendimento
            </h3>
            <a href="/clientes" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              Ver clientes <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="text-2xl font-serif font-semibold">{clientesAtivos}</div>
              <div className="text-xs text-muted-foreground">Clientes ativos</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="text-2xl font-serif font-semibold">{processosAtivos}</div>
              <div className="text-xs text-muted-foreground">Processos ativos</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="text-2xl font-serif font-semibold">{formatCurrency(totalReceitasPendentes)}</div>
              <div className="text-xs text-muted-foreground">A receber</div>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="text-2xl font-serif font-semibold">{tarefasAbertas}</div>
              <div className="text-xs text-muted-foreground">Tarefas abertas</div>
            </div>
          </div>
          <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Distribuição por área</div>
          {distribuicaoArea.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">Nenhum processo cadastrado.</div>
          ) : (
            <div className="space-y-2">
              {distribuicaoArea.map((area) => {
                const pct = totalProcessosPorArea > 0 ? Math.round((area._count.id / totalProcessosPorArea) * 100) : 0;
                return (
                  <div key={area.area} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-muted-foreground truncate">{areaLabels[area.area] || area.area}</div>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${areaColors[area.area] || "bg-slate-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-8 text-xs text-muted-foreground text-right">{pct}%</div>
                  </div>
                );
              })}
            </div>
          )}
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
