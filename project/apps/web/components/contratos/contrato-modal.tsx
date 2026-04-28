"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

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
}

interface Cliente { id: string; nome: string; }
interface Processo { id: string; cnj: string; }

const TIPOS = [
  { value: "fixo_mensal", label: "Fixo Mensal" },
  { value: "exito", label: "Exito" },
  { value: "hora", label: "Hora" },
  { value: "combinado", label: "Combinado" },
];

export function ContratoModal({
  open, onClose, contrato, clientes, processos, onSuccess,
}: {
  open: boolean; onClose: () => void; contrato?: Contrato | null;
  clientes: Cliente[]; processos: Processo[]; onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    numero: "", clienteId: "", processoId: "", tipo: "fixo_mensal",
    valorFixo: "", percentual: "", taxaHora: "", horasMes: "",
    estimativa: "", vigente: true, dataInicio: "", dataFim: "", observacoes: "",
  });

  useEffect(() => {
    if (contrato) {
      setForm({
        numero: contrato.numero || "",
        clienteId: contrato.clienteId,
        processoId: contrato.processoId || "",
        tipo: contrato.tipo,
        valorFixo: contrato.valorFixo != null ? String(contrato.valorFixo) : "",
        percentual: contrato.percentual != null ? String(contrato.percentual) : "",
        taxaHora: contrato.taxaHora != null ? String(contrato.taxaHora) : "",
        horasMes: contrato.horasMes != null ? String(contrato.horasMes) : "",
        estimativa: contrato.estimativa != null ? String(contrato.estimativa) : "",
        vigente: contrato.vigente,
        dataInicio: contrato.dataInicio ? new Date(contrato.dataInicio).toISOString().split("T")[0] : "",
        dataFim: contrato.dataFim ? new Date(contrato.dataFim).toISOString().split("T")[0] : "",
        observacoes: contrato.observacoes || "",
      });
    } else {
      setForm({ numero: "", clienteId: "", processoId: "", tipo: "fixo_mensal", valorFixo: "", percentual: "", taxaHora: "", horasMes: "", estimativa: "", vigente: true, dataInicio: new Date().toISOString().split("T")[0], dataFim: "", observacoes: "" });
    }
    setError("");
  }, [contrato, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = contrato ? `/api/v1/contracts/${contrato.id}` : "/api/v1/contracts";
      const method = contrato ? "PATCH" : "POST";
      const body: any = {
        ...form,
        valorFixo: form.valorFixo ? Number(form.valorFixo) : null,
        percentual: form.percentual ? Number(form.percentual) : null,
        taxaHora: form.taxaHora ? Number(form.taxaHora) : null,
        horasMes: form.horasMes ? Number(form.horasMes) : null,
        estimativa: form.estimativa ? Number(form.estimativa) : null,
        dataInicio: form.dataInicio ? new Date(form.dataInicio) : null,
        dataFim: form.dataFim ? new Date(form.dataFim) : null,
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
          <h2 className="text-sm font-semibold">{contrato ? "Editar contrato" : "Novo contrato de honorarios"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2"><AlertTriangle size={14} />{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Numero</label>
              <input type="text" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="CH-2024-001" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo *</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
            <label className="block text-xs font-medium text-muted-foreground mb-1">Processo vinculado</label>
            <select value={form.processoId} onChange={(e) => setForm({ ...form, processoId: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">Nenhum</option>
              {processos.map((p) => <option key={p.id} value={p.id}>{p.cnj}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Valor fixo (R$)</label>
              <input type="number" step="0.01" value={form.valorFixo} onChange={(e) => setForm({ ...form, valorFixo: e.target.value })} placeholder="5000" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Percentual (%)</label>
              <input type="number" step="0.01" value={form.percentual} onChange={(e) => setForm({ ...form, percentual: e.target.value })} placeholder="10" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Taxa/hora (R$)</label>
              <input type="number" step="0.01" value={form.taxaHora} onChange={(e) => setForm({ ...form, taxaHora: e.target.value })} placeholder="350" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Horas/mes</label>
              <input type="number" value={form.horasMes} onChange={(e) => setForm({ ...form, horasMes: e.target.value })} placeholder="40" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Estimativa (R$)</label>
              <input type="number" step="0.01" value={form.estimativa} onChange={(e) => setForm({ ...form, estimativa: e.target.value })} placeholder="15000" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Data inicio</label>
              <input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Data fim</label>
              <input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="vigente" checked={form.vigente} onChange={(e) => setForm({ ...form, vigente: e.target.checked })} className="rounded border-input" />
            <label htmlFor="vigente" className="text-xs text-muted-foreground">Contrato vigente</label>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Observacoes</label>
            <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">{loading ? "Salvando..." : contrato ? "Atualizar" : "Criar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
