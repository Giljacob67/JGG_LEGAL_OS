"use client";

import { useState } from "react";
import { Pencil, Trash2, Clock } from "lucide-react";
import { TimesheetModal } from "./timesheet-modal";

interface Registro {
  id: string;
  userId: string;
  processoId?: string | null;
  data: string;
  horas: number;
  atividade: string;
  faturado: boolean;
  user?: { id: string; nome: string } | null;
}

interface Processo { id: string; cnj: string; }

export function TimesheetWrapper({
  initialRegistros, processos,
}: {
  initialRegistros: Registro[];
  processos: Processo[];
}) {
  const [items, setItems] = useState<Registro[]>(initialRegistros);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Registro | null>(null);
  const [search, setSearch] = useState("");

  const openCreate = () => { setEditingItem(null); setModalOpen(true); };
  const openEdit = (item: Registro) => { setEditingItem(item); setModalOpen(true); };

  async function refresh() {
    try {
      const res = await fetch("/api/v1/timesheet");
      const data = await res.json();
      if (res.ok) setItems(data.data || []);
    } catch { /* ignore */ }
  }

  async function handleDelete(item: Registro) {
    if (!confirm(`Tem certeza que deseja excluir o registro de ${item.horas}h?`)) return;
    await fetch(`/api/v1/timesheet/${item.id}`, { method: "DELETE" });
    refresh();
  }

  const filtered = items.filter((r) =>
    r.atividade.toLowerCase().includes(search.toLowerCase()) ||
    (r.user?.nome || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalHoras = filtered.reduce((sum, r) => sum + (Number(r.horas) || 0), 0);
  const totalFaturado = filtered.filter((r) => r.faturado).reduce((sum, r) => sum + (Number(r.horas) || 0), 0);
  const totalNaoFaturado = totalHoras - totalFaturado;

  return (
    <>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] mb-1">Timesheet</h1>
          <p className="text-xs text-muted-foreground">Registro de horas · Produtividade · Faturamento</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          + Novo registro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Total de horas</div>
          <div className="text-xl font-semibold mt-1">{totalHoras.toFixed(2)}h</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Faturado</div>
          <div className="text-xl font-semibold mt-1 text-green-600">{totalFaturado.toFixed(2)}h</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">A faturar</div>
          <div className="text-xl font-semibold mt-1 text-amber-600">{totalNaoFaturado.toFixed(2)}h</div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-3">
          <h3 className="text-sm font-semibold">Registros</h3>
          <input
            placeholder="Buscar atividade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto text-xs px-3 py-1.5 rounded-md border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum registro encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Data</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Advogado</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Atividade</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Horas</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Faturado</th>
                  <th className="text-right px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs">{new Date(r.data).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-xs">{r.user?.nome?.split(" ")[0] || "—"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{r.atividade}</td>
                    <td className="px-4 py-3 text-xs font-medium">{Number(r.horas).toFixed(2)}h</td>
                    <td className="px-4 py-3">
                      {r.faturado ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">Sim</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">Nao</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(r)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(r)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TimesheetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        registro={editingItem}
        processos={processos}
        onSuccess={refresh}
      />
    </>
  );
}
