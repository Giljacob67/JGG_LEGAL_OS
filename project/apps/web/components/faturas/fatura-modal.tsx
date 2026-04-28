"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

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
}

interface Cliente { id: string; nome: string; }
interface Contrato { id: string; numero?: string | null; tipo: string; }

const STATUS_LIST = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "atrasado", label: "Atrasado" },
  { value: "cancelado", label: "Cancelado" },
];

const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function FaturaModal({
  open, onClose, fatura, clientes, contratos, onSuccess,
}: {
  open: boolean; onClose: () => void; fatura?: Fatura | null;
  clientes: Cliente[]; contratos: Contrato[]; onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    numero: "", clienteId: "", contratoId: "", mes: "", ano: "",
    valor: "", desconto: "", status: "pendente", vencimento: "",
    pagoEm: "", formaPagamento: "", observacoes: "",
  });

  useEffect(() => {
    if (fatura) {
      setForm({
        numero: fatura.numero || "",
        clienteId: fatura.clienteId,
        contratoId: fatura.contratoId || "",
        mes: fatura.mes,
        ano: fatura.ano != null ? String(fatura.ano) : "",
        valor: String(fatura.valor),
        desconto: fatura.desconto != null ? String(fatura.desconto) : "",
        status: fatura.status,
        vencimento: fatura.vencimento ? new Date(fatura.vencimento).toISOString().split("T")[0] : "",
        pagoEm: fatura.pagoEm ? new Date(fatura.pagoEm).toISOString().split("T")[0] : "",
        formaPagamento: fatura.formaPagamento || "",
        observacoes: fatura.observacoes || "",
      });
    } else {
      const now = new Date();
      setForm({ numero: "", clienteId: "", contratoId: "", mes: MESES[now.getMonth()], ano: String(now.getFullYear()), valor: "", desconto: "", status: "pendente", vencimento: "", pagoEm: "", formaPagamento: "", observacoes: "" });
    }
    setError("");
  }, [fatura, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = fatura ? `/api/v1/invoices/${fatura.id}` : "/api/v1/invoices";
      const method = fatura ? "PATCH" : "POST";
      const body: any = {
        ...form,
        valor: Number(form.valor),
        desconto: form.desconto ? Number(form.desconto) : null,
        ano: form.ano ? Number(form.ano) : null,
        vencimento: form.vencimento ? new Date(form.vencimento) : null,
        pagoEm: form.pagoEm ? new Date(form.pagoEm) : null,
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border bg-card shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-sm font-semibold">{fatura ? "Editar fatura" : "Nova fatura"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2"><AlertTriangle size={14} />{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Numero</label>
              <input type="text" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="FAT-2024-001" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
                {STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Cliente *</label>
            <select required value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">Selecione...</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Contrato vinculado</label>
            <select value={form.contratoId} onChange={(e) => setForm({ ...form, contratoId: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">Nenhum</option>
              {contratos.map((c) => <option key={c.id} value={c.id}>{c.numero || "#" + c.id.slice(0, 6)} — {c.tipo}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Mes *</label>
              <select required value={form.mes} onChange={(e) => setForm({ ...form, mes: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
                {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Ano</label>
              <input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} placeholder="2024" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" required value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="5000.00" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Desconto (R$)</label>
              <input type="number" step="0.01" value={form.desconto} onChange={(e) => setForm({ ...form, desconto: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Vencimento *</label>
              <input type="date" required value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Pago em</label>
              <input type="date" value={form.pagoEm} onChange={(e) => setForm({ ...form, pagoEm: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Forma de pagamento</label>
            <input type="text" value={form.formaPagamento} onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })} placeholder="PIX, Boleto, Transferencia..." className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Observacoes</label>
            <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">{loading ? "Salvando..." : fatura ? "Atualizar" : "Criar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
