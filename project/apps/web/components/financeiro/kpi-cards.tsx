"use client";

export function KpiCards({ contratos, faturas }: { contratos: any[]; faturas: any[] }) {
  const receitaMes = faturas
    .filter((f) => f.status === "pago" && f.mes === "2026-04")
    .reduce((s, f) => s + (Number(f.valor) || 0), 0);

  const pendente = faturas
    .filter((f) => f.status === "pendente")
    .reduce((s, f) => s + (Number(f.valor) || 0), 0);

  const atrasado = faturas
    .filter((f) => f.status === "atrasado")
    .reduce((s, f) => s + (Number(f.valor) || 0), 0);

  const exito = contratos
    .filter((c) => c.tipo === "exito")
    .reduce((s, c) => s + (Number(c.estimativa) || 0), 0);

  const kpi = [
    { label: "Receita Abr/2026", value: `R$ ${receitaMes.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, sub: "Realizado", accent: "var(--status-success)" },
    { label: "A receber", value: `R$ ${pendente.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, sub: `${faturas.filter((f) => f.status === "pendente").length} faturas pendentes`, accent: "var(--jgg-navy-600)" },
    { label: "Exito estimado", value: `R$ ${exito.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, sub: `${contratos.filter((c) => c.tipo === "exito").length} contratos`, accent: "var(--jgg-gold-500)" },
    { label: "Inadimplencia", value: `R$ ${atrasado.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, sub: `${faturas.filter((f) => f.status === "atrasado").length} em atraso`, accent: "var(--status-danger)" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpi.map((k, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: k.accent }} />
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{k.label}</div>
          <div className="text-[28px] font-serif font-semibold text-foreground leading-none mt-1.5">{k.value}</div>
          <div className="text-xs text-muted-foreground mt-1.5">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}