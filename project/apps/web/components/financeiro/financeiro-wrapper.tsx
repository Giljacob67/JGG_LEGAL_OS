"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ContratoModal } from "./contrato-modal";
import { FaturaModal } from "./fatura-modal";
import { TimesheetModal } from "./timesheet-modal";
import { ContratosList } from "./contratos-list";
import { FaturasList } from "./faturas-list";
import { TimesheetList } from "./timesheet-list";
import { KpiCards } from "./kpi-cards";
import { AlertTriangle } from "lucide-react";

export function FinanceiroWrapper({
  contratos: initialContratos,
  faturas: initialFaturas,
  timesheet: initialTimesheet,
  clientes,
  processos,
}: {
  contratos: any[];
  faturas: any[];
  timesheet: any[];
  clientes: { id: string; nome: string }[];
  processos: { id: string; cnj: string }[];
}) {
  const router = useRouter();
  const [contratos, setContratos] = useState(initialContratos);
  const [faturas, setFaturas] = useState(initialFaturas);
  const [timesheet, setTimesheet] = useState(initialTimesheet);

  const [modal, setModal] = useState<"contrato" | "fatura" | "timesheet" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; item: any } | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  function openCreate(type: "contrato" | "fatura" | "timesheet") {
    setEditing(null);
    setModal(type);
  }

  function openEdit(type: "contrato" | "fatura" | "timesheet", item: any) {
    setEditing(item);
    setModal(type);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { type, item } = deleteTarget;
    const endpoints: Record<string, string> = { contrato: "contracts", fatura: "invoices", timesheet: "timesheet" };
    try {
      const res = await fetch(`/api/v1/${endpoints[type]}/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        if (type === "contrato") setContratos((prev) => prev.filter((c) => c.id !== item.id));
        if (type === "fatura") setFaturas((prev) => prev.filter((f) => f.id !== item.id));
        if (type === "timesheet") setTimesheet((prev) => prev.filter((t) => t.id !== item.id));
        setDeleteTarget(null);
        refresh();
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Controle de honorarios, faturas e timesheet</p>
      </div>

      <KpiCards contratos={contratos} faturas={faturas} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Contratos</h2>
            <button onClick={() => openCreate("contrato")} className="text-xs px-2.5 py-1 rounded-md bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity">+ Novo</button>
          </div>
          <ContratosList contratos={contratos} onEdit={(c) => openEdit("contrato", c)} onDelete={(c) => setDeleteTarget({ type: "contrato", item: c })} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Faturas</h2>
            <button onClick={() => openCreate("fatura")} className="text-xs px-2.5 py-1 rounded-md bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity">+ Nova</button>
          </div>
          <FaturasList faturas={faturas} onEdit={(f) => openEdit("fatura", f)} onDelete={(f) => setDeleteTarget({ type: "fatura", item: f })} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Timesheet</h2>
          <button onClick={() => openCreate("timesheet")} className="text-xs px-2.5 py-1 rounded-md bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity">+ Novo</button>
        </div>
        <TimesheetList registros={timesheet} onEdit={(t) => openEdit("timesheet", t)} onDelete={(t) => setDeleteTarget({ type: "timesheet", item: t })} />
      </div>

      {modal === "contrato" && (
        <ContratoModal
          open={true} onClose={() => setModal(null)} contrato={editing}
          clientes={clientes} processos={processos} onSuccess={refresh}
        />
      )}
      {modal === "fatura" && (
        <FaturaModal
          open={true} onClose={() => setModal(null)} fatura={editing}
          clientes={clientes} contratos={contratos.map((c) => ({ id: c.id, numero: c.numero, clienteId: c.clienteId, tipo: c.tipo }))}
          onSuccess={refresh}
        />
      )}
      {modal === "timesheet" && (
        <TimesheetModal
          open={true} onClose={() => setModal(null)} registro={editing}
          processos={processos} onSuccess={refresh}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-card shadow-xl p-5">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle size={18} />
              <h3 className="text-sm font-semibold">Confirmar exclusao</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Tem certeza que deseja excluir este {deleteTarget.type === "contrato" ? "contrato" : deleteTarget.type === "fatura" ? "fatura" : "registro"}?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
