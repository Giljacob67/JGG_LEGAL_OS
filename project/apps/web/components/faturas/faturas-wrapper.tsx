"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { FaturaModal } from "./fatura-modal";

interface Fatura {
  id: string;
  numero?: string | null;
  clienteId: string;
  contratoId?: string | null;
  mes: string;
  ano?: number | null;
  valor: number;
  desconto?: number | null;
  status: string;
  vencimento: string;
  pagoEm?: string | null;
  formaPagamento?: string | null;
  observacoes?: string | null;
  cliente?: { id: string; nome: string } | null;
  contrato?: { id: string; numero?: string | null; tipo: string } | null;
  emitidoPor?: { id: string; nome: string } | null;
}

interface Cliente { id: string; nome: string; }
interface Contrato { id: string; numero?: string | null; tipo: string; }

const STATUS_STYLES: Record<string, string> = {
  pago: "bg-green-50 text-green-700 border-green-200",
  pendente: "bg-amber-50 text-amber-700 border-amber-200",
  atrasado: "bg-red-50 text-red-700 border-red-200",
  cancelado: "bg-gray-50 text-gray-500 border-gray-200",
};

export function FaturasWrapper({
  initialFaturas, clientes, contratos,
}: {
  initialFaturas: Fatura[];
  clientes: Cliente[];
  contratos: Contrato[];
}) {
  const [items, setItems] = useState<Fatura[]>(initialFaturas);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Fatura | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const openCreate = () => { setEditingItem(null); setModalOpen(true); };
  const openEdit = (item: Fatura) => { setEditingItem(item); setModalOpen(true); };

  async function refresh() {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/v1/invoices?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setItems(data.data || []);
    } catch { /* ignore */ }
  }

  async function handleDelete(item: Fatura) {
    if (!confirm(`Tem certeza que deseja excluir a fatura ${item.numero || "#" + item.id.slice(0, 6)}?`)) return;
    await fetch(`/api/v1/invoices/${item.id}`, { method: "DELETE" });
    refresh();
  }

  const filtered = items.filter((f) => {
    const matchesSearch =
      (f.numero || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.cliente?.nome || "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (v?: number | null) =>
    v != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) : "—";

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  const totalValor = filtered.reduce((sum, f) => sum + (f.valor || 0), 0);
  const totalPendente = filtered.filter((f) => f.status === "pendente" || f.status === "atrasado").reduce((sum, f) => sum + (f.valor || 0), 0);

  return (
    <>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] mb-1">Faturas</h1>
          <p className="text-xs text-muted-foreground">Gestao de faturas · Pagamentos · Receita</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          + Nova fatura
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Total em faturas</div>
          <div className="text-xl font-semibold mt-1">{formatCurrency(totalValor)}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">A receber</div>
          <div className="text-xl font-semibold mt-1 text-amber-600">{formatCurrency(totalPendente)}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Quantidade</div>
          <div className="text-xl font-semibold mt-1">{filtered.length}</div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-semibold">Faturas</h3>
          <input
            placeholder="Buscar fatura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto text-xs px-3 py-1.5 rounded-md border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
          />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); refresh(); }} className="text-xs px-3 py-1.5 rounded-md border border-input bg-background outline-none">
            <option value="">Todos status</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="atrasado">Atrasado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma fatura encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Numero</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Cliente</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Mes/Ano</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Valor</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Vencimento</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Pago em</th>
                  <th className="text-right px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{f.numero || "—"}</td>
                    <td className="px-4 py-3 text-xs">{f.cliente?.nome || "—"}</td>
                    <td className="px-4 py-3 text-xs">{f.mes}{f.ano ? `/${f.ano}` : ""}</td>
                    <td className="px-4 py-3 text-xs font-medium">{formatCurrency(f.valor)}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(f.vencimento)}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[f.status] || "bg-muted text-muted-foreground"}`}>{f.status.charAt(0).toUpperCase() + f.status.slice(1)}</span></td>
                    <td className="px-4 py-3 text-xs">{formatDate(f.pagoEm)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(f)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(f)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
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

      <FaturaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fatura={editingItem}
        clientes={clientes}
        contratos={contratos}
        onSuccess={refresh}
      />
    </>
  );
}
