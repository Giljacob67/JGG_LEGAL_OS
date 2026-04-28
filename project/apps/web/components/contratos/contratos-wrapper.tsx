"use client";

import { useState } from "react";
import { Pencil, Trash2, FileText } from "lucide-react";
import { ContratoModal } from "./contrato-modal";

interface Contrato {
  id: string;
  numero?: string | null;
  clienteId: string;
  processoId?: string | null;
  tipo: string;
  valorFixo?: number | null;
  percentual?: number | null;
  taxaHora?: number | null;
  horasMes?: number | null;
  estimativa?: number | null;
  vigente: boolean;
  dataInicio?: string | null;
  dataFim?: string | null;
  observacoes?: string | null;
  cliente?: { id: string; nome: string } | null;
  processo?: { id: string; cnj: string } | null;
  _count?: { faturas: number };
}

interface Cliente { id: string; nome: string; }
interface Processo { id: string; cnj: string; }

const TIPO_LABELS: Record<string, string> = {
  fixo_mensal: "Fixo Mensal",
  exito: "Exito",
  hora: "Hora",
  combinado: "Combinado",
};

export function ContratosWrapper({
  initialContratos, clientes, processos,
}: {
  initialContratos: Contrato[];
  clientes: Cliente[];
  processos: Processo[];
}) {
  const [items, setItems] = useState<Contrato[]>(initialContratos);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Contrato | null>(null);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [vigenteFilter, setVigenteFilter] = useState("");

  const openCreate = () => { setEditingItem(null); setModalOpen(true); };
  const openEdit = (item: Contrato) => { setEditingItem(item); setModalOpen(true); };

  async function refresh() {
    try {
      const params = new URLSearchParams();
      if (tipoFilter) params.set("tipo", tipoFilter);
      if (vigenteFilter) params.set("vigente", vigenteFilter);
      const res = await fetch(`/api/v1/contracts?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setItems(data.data || []);
    } catch { /* ignore */ }
  }

  async function handleDelete(item: Contrato) {
    if (!confirm(`Tem certeza que deseja excluir o contrato ${item.numero || "#" + item.id.slice(0, 6)}?`)) return;
    await fetch(`/api/v1/contracts/${item.id}`, { method: "DELETE" });
    refresh();
  }

  const filtered = items.filter((c) => {
    const matchesSearch =
      (c.numero || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.cliente?.nome || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.processo?.cnj || "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (v?: number | null) =>
    v != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) : "—";

  return (
    <>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] mb-1">Contratos de Honorarios</h1>
          <p className="text-xs text-muted-foreground">Gestao de contratos · Faturamento vinculado</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          + Novo contrato
        </button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-semibold">Contratos</h3>
          <input
            placeholder="Buscar contrato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto text-xs px-3 py-1.5 rounded-md border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
          />
          <select value={tipoFilter} onChange={(e) => { setTipoFilter(e.target.value); refresh(); }} className="text-xs px-3 py-1.5 rounded-md border border-input bg-background outline-none">
            <option value="">Todos tipos</option>
            <option value="fixo_mensal">Fixo Mensal</option>
            <option value="exito">Exito</option>
            <option value="hora">Hora</option>
            <option value="combinado">Combinado</option>
          </select>
          <select value={vigenteFilter} onChange={(e) => { setVigenteFilter(e.target.value); refresh(); }} className="text-xs px-3 py-1.5 rounded-md border border-input bg-background outline-none">
            <option value="">Todos status</option>
            <option value="true">Vigente</option>
            <option value="false">Encerrado</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum contrato encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Numero</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Cliente</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Tipo</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Valor Fixo</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">%</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Taxa/Hora</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Vigente</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Faturas</th>
                  <th className="text-right px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.numero || "—"}</td>
                    <td className="px-4 py-3 text-xs">{c.cliente?.nome || "—"}</td>
                    <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">{TIPO_LABELS[c.tipo] || c.tipo}</span></td>
                    <td className="px-4 py-3 text-xs">{formatCurrency(c.valorFixo)}</td>
                    <td className="px-4 py-3 text-xs">{c.percentual != null ? `${c.percentual}%` : "—"}</td>
                    <td className="px-4 py-3 text-xs">{formatCurrency(c.taxaHora)}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.vigente ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>{c.vigente ? "Sim" : "Nao"}</span></td>
                    <td className="px-4 py-3 text-xs">{c._count?.faturas || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(c)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
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

      <ContratoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contrato={editingItem}
        clientes={clientes}
        processos={processos}
        onSuccess={refresh}
      />
    </>
  );
}
