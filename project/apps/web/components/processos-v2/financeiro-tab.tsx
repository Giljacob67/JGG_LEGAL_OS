"use client";

import { useState, useEffect } from "react";
import { DollarSign, Clock, FileText, AlertTriangle, Loader2, TrendingUp } from "lucide-react";
import { SectionCard } from "./section-card";
import { formatCurrency } from "@/lib/utils/formatters";

interface Contrato {
  id: string;
  tipo: string;
  valorFixo: number | null;
  percentual: number | null;
  taxaHora: number | null;
  horasMes: number | null;
  estimativa: number | null;
  vigente: boolean;
  dataInicio: string;
  dataFim: string | null;
}

interface Fatura {
  id: string;
  numero: string | null;
  mes: string;
  valor: number;
  desconto: number | null;
  status: string;
  vencimento: string;
  pagoEm: string | null;
}

interface TimesheetEntry {
  id: string;
  data: string;
  horas: number;
  atividade: string;
  faturado: boolean;
  user: { nome: string };
}

interface Stats {
  horasTotais: number;
  horasNaoFaturadas: number;
  faturadoTotal: number;
  faturadoPendente: number;
  faturadoPago: number;
}

interface FinanceiroTabProps {
  processoId: string;
}

const TIPO_HONORARIO: Record<string, string> = {
  fixo_mensal: "Fixo Mensal",
  exito: "Êxito",
  hora: "Por Hora",
  combinado: "Combinado",
};

const STATUS_FATURA: Record<string, { label: string; color: string }> = {
  pago:      { label: "Pago",      color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  pendente:  { label: "Pendente",  color: "text-amber-600 bg-amber-50 border-amber-200" },
  atrasado:  { label: "Atrasado",  color: "text-red-600 bg-red-50 border-red-200" },
  cancelado: { label: "Cancelado", color: "text-slate-500 bg-slate-50 border-slate-200" },
};

export function FinanceiroTab({ processoId }: FinanceiroTabProps) {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [timesheet, setTimesheet] = useState<TimesheetEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [contratosRes, faturasRes, timesheetRes] = await Promise.all([
          fetch(`/api/v1/contracts?processoId=${processoId}&limit=10`),
          fetch(`/api/v1/invoices?processoId=${processoId}&limit=20`),
          fetch(`/api/v1/timesheet?processoId=${processoId}&limit=50`),
        ]);

        if (contratosRes.ok) {
          const d = await contratosRes.json();
          setContratos(d.data || d || []);
        }
        if (faturasRes.ok) {
          const d = await faturasRes.json();
          const lista: Fatura[] = d.data || d || [];
          setFaturas(lista);

          // Calcular stats de faturamento
          const faturadoTotal = lista.reduce((s: number, f: Fatura) => s + Number(f.valor), 0);
          const faturadoPago = lista.filter((f: Fatura) => f.status === "pago").reduce((s: number, f: Fatura) => s + Number(f.valor), 0);
          const faturadoPendente = lista.filter((f: Fatura) => ["pendente", "atrasado"].includes(f.status)).reduce((s: number, f: Fatura) => s + Number(f.valor), 0);
          setStats((prev) => ({ ...prev ?? { horasTotais: 0, horasNaoFaturadas: 0 }, faturadoTotal, faturadoPago, faturadoPendente }));
        }
        if (timesheetRes.ok) {
          const d = await timesheetRes.json();
          const lista: TimesheetEntry[] = d.data || d || [];
          setTimesheet(lista);

          const horasTotais = lista.reduce((s: number, t: TimesheetEntry) => s + Number(t.horas), 0);
          const horasNaoFaturadas = lista.filter((t: TimesheetEntry) => !t.faturado).reduce((s: number, t: TimesheetEntry) => s + Number(t.horas), 0);
          setStats((prev) => ({
            faturadoTotal: prev?.faturadoTotal ?? 0,
            faturadoPago: prev?.faturadoPago ?? 0,
            faturadoPendente: prev?.faturadoPendente ?? 0,
            horasTotais,
            horasNaoFaturadas,
          }));
        }
      } catch (err) {
        console.error("Erro ao carregar financeiro:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [processoId]);

  if (loading) {
    return (
      <SectionCard title="Financeiro">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando financeiro...</span>
        </div>
      </SectionCard>
    );
  }

  const contratoAtivo = contratos.find((c) => c.vigente);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Faturado total</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(stats.faturadoTotal)}</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Recebido</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.faturadoPago)}</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">A receber</p>
            <p className={`text-lg font-bold ${stats.faturadoPendente > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
              {formatCurrency(stats.faturadoPendente)}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Horas apontadas</p>
            <p className="text-lg font-bold text-foreground">{stats.horasTotais.toFixed(1)}h</p>
            {stats.horasNaoFaturadas > 0 && (
              <p className="text-[10px] text-amber-600">{stats.horasNaoFaturadas.toFixed(1)}h não faturadas</p>
            )}
          </div>
        </div>
      )}

      {/* Contrato de honorários */}
      <SectionCard title="Contrato de honorários">
        {contratoAtivo ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{TIPO_HONORARIO[contratoAtivo.tipo] || contratoAtivo.tipo}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Vigente</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {contratoAtivo.valorFixo != null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Valor fixo/mês</p>
                  <p className="font-medium">{formatCurrency(contratoAtivo.valorFixo)}</p>
                </div>
              )}
              {contratoAtivo.percentual != null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Percentual êxito</p>
                  <p className="font-medium">{contratoAtivo.percentual}%</p>
                </div>
              )}
              {contratoAtivo.taxaHora != null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Taxa/hora</p>
                  <p className="font-medium">{formatCurrency(contratoAtivo.taxaHora)}</p>
                </div>
              )}
              {contratoAtivo.estimativa != null && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Estimativa total</p>
                  <p className="font-medium">{formatCurrency(contratoAtivo.estimativa)}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Início</p>
                <p className="font-medium">{new Date(contratoAtivo.dataInicio).toLocaleDateString("pt-BR")}</p>
              </div>
              {contratoAtivo.dataFim && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Término</p>
                  <p className="font-medium">{new Date(contratoAtivo.dataFim).toLocaleDateString("pt-BR")}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Nenhum contrato de honorários vigente vinculado a este processo.</p>
        )}
      </SectionCard>

      {/* Faturas */}
      <SectionCard title={`Faturas (${faturas.length})`}>
        {faturas.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhuma fatura vinculada.</p>
        ) : (
          <div className="space-y-2">
            {faturas.map((f) => {
              const statusCfg = STATUS_FATURA[f.status] ?? STATUS_FATURA.pendente;
              const atrasada = f.status === "atrasado";
              return (
                <div key={f.id} className={`flex items-center justify-between p-3 rounded-lg border ${atrasada ? "border-red-200 bg-red-50/30" : "bg-card"}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">{f.mes}</span>
                      {f.numero && <span className="text-xs text-muted-foreground">#{f.numero}</span>}
                      {atrasada && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Venc. {new Date(f.vencimento).toLocaleDateString("pt-BR")}
                      {f.pagoEm && ` · Pago em ${new Date(f.pagoEm).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold">{formatCurrency(f.valor)}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Timesheet */}
      <SectionCard title={`Timesheet — ${stats?.horasTotais.toFixed(1) ?? 0}h apontadas`}>
        {timesheet.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhuma hora apontada neste processo.</p>
        ) : (
          <div className="space-y-1.5">
            {timesheet.slice(0, 20).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-b-0 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(t.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                  <span className="truncate text-foreground">{t.atividade}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{t.user?.nome}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="font-medium">{Number(t.horas).toFixed(1)}h</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.faturado ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"}`}>
                    {t.faturado ? "faturado" : "pendente"}
                  </span>
                </div>
              </div>
            ))}
            {timesheet.length > 20 && (
              <p className="text-xs text-muted-foreground text-center pt-1">+{timesheet.length - 20} registros</p>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
