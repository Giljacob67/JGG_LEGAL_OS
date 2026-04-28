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
  valor: unknown;
  desconto?: unknown;
  status: string;
  vencimento: Date | string;
  formaPagamento?: string | null;
  observacoes?: string | null;
}

interface Cliente {
  id: string;
  nome: string;
}

interface Contrato {
  id: string;
  numero?: string | null;
  clienteId: string;
  tipo: string;
}

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
    formaPagamento: "", observacoes: "",
  });

  const meses = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  useEffect(() => {
    if (fatura) {
      setForm({
        numero: fatura.numero || "",
        clienteId: fatura.clienteId,
        contratoId: fatura.contratoId || "",
        mes: fatura.mes,
        ano: fatura.ano != null ? String(fatura.ano) : "",
        valor: fatura.valor != null ? String(Number(fatura.valor)) : "",
        desconto: fatura.desconto != null ? String(Number(fatura.desconto)) : "",
        status: fatura.status,
        vencimento: fatura.vencimento ? new Date(fatura.vencimento).toISOString().slice(0, 10) : "",
        formaPagamento: fatura.formaPagamento || "",
        observacoes: fatura.observacoes || "",
      });
    } else {
      const hoje = new Date();
      setForm({ numero: "", clienteId: "", contratoId: "", mes: meses[hoje.getMonth()], ano: String(hoje.getFullYear()), valor: "", desconto: "", status: "pendente", vencimento: "", formaPagamento: "", observacoes: "" });
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
      const body: any = { ...form };
      if (body.valor) body.valor = Number(body.valor);
      if (body.desconto) body.desconto = Number(body.desconto);
      if (body.ano) body.ano = Number(body.ano);
      if (body.vencimento) body.vencimento = new Date(body.vencimento).toISOString();

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
              <label className="block text-xs font-medium text-muted-foreground mb-1">Cliente</label>
              <select required value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
                <option value="">Selecionar...</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Contrato</label>
              <select value={form.contratoId} onChange={(e) => setForm({ ...form, contratoId: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
                <option value="">Nenhum</option>
                {contratos.map((c) => <option key={c.id} value={c.id}>{c.numero || c.id.slice(-6)} — {c.tipo}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Mes</label>
              <select required value={form.mes} onChange={(e) => setForm({ ...form, mes: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
                {meses.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Ano</label>
              <input type="number" required value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Valor (R$)</label><input type="number" step="0.01" required value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Desconto (R$)</label><input type="number" step="0.01" value={form.desconto} onChange={(e) => setForm({ ...form, desconto: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Vencimento</label><input type="date" required value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Forma de pagamento</label><input type="text" value={form.formaPagamento} onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })} placeholder="Pix, Boleto, TED..." className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Observacoes</label>
            <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
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
