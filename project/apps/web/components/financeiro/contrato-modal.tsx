"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

interface Contrato {
  id: string;
  numero?: string | null;
  clienteId: string;
  processoId?: string | null;
  tipo: string;
  valorFixo?: unknown;
  percentual?: unknown;
  taxaHora?: unknown;
  horasMes?: number | null;
  estimativa?: unknown;
  vigente: boolean;
  dataInicio?: Date | string | null;
  dataFim?: Date | string | null;
  observacoes?: string | null;
}

interface Cliente {
  id: string;
  nome: string;
}

interface Processo {
  id: string;
  cnj: string;
}

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
        valorFixo: contrato.valorFixo != null ? String(Number(contrato.valorFixo)) : "",
        percentual: contrato.percentual != null ? String(Number(contrato.percentual)) : "",
        taxaHora: contrato.taxaHora != null ? String(Number(contrato.taxaHora)) : "",
        horasMes: contrato.horasMes != null ? String(contrato.horasMes) : "",
        estimativa: contrato.estimativa != null ? String(Number(contrato.estimativa)) : "",
        vigente: contrato.vigente,
        dataInicio: contrato.dataInicio ? new Date(contrato.dataInicio).toISOString().slice(0, 10) : "",
        dataFim: contrato.dataFim ? new Date(contrato.dataFim).toISOString().slice(0, 10) : "",
        observacoes: contrato.observacoes || "",
      });
    } else {
      setForm({ numero: "", clienteId: "", processoId: "", tipo: "fixo_mensal", valorFixo: "", percentual: "", taxaHora: "", horasMes: "", estimativa: "", vigente: true, dataInicio: "", dataFim: "", observacoes: "" });
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
      const body: any = { ...form };
      if (body.valorFixo) body.valorFixo = Number(body.valorFixo);
      if (body.percentual) body.percentual = Number(body.percentual);
      if (body.taxaHora) body.taxaHora = Number(body.taxaHora);
      if (body.horasMes) body.horasMes = Number(body.horasMes);
      if (body.estimativa) body.estimativa = Number(body.estimativa);
      if (body.dataInicio) body.dataInicio = new Date(body.dataInicio).toISOString();
      if (body.dataFim) body.dataFim = new Date(body.dataFim).toISOString();

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
          <h2 className="text-sm font-semibold">{contrato ? "Editar contrato" : "Novo contrato"}</h2>
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
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
                <option value="fixo_mensal">Fixo mensal</option>
                <option value="exito">Por exito</option>
                <option value="hora">Por hora</option>
                <option value="combinado">Combinado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Processo vinculado</label>
            <select value={form.processoId} onChange={(e) => setForm({ ...form, processoId: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">Nenhum</option>
              {processos.map((p) => <option key={p.id} value={p.id}>{p.cnj}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Valor fixo (R$)</label><input type="number" step="0.01" value={form.valorFixo} onChange={(e) => setForm({ ...form, valorFixo: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Percentual (%)</label><input type="number" step="0.01" value={form.percentual} onChange={(e) => setForm({ ...form, percentual: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Taxa/hora (R$)</label><input type="number" step="0.01" value={form.taxaHora} onChange={(e) => setForm({ ...form, taxaHora: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Horas/mes</label><input type="number" value={form.horasMes} onChange={(e) => setForm({ ...form, horasMes: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Estimativa (R$)</label>
            <input type="number" step="0.01" value={form.estimativa} onChange={(e) => setForm({ ...form, estimativa: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Inicio</label><input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Fim</label><input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Observacoes</label>
            <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="vigente" checked={form.vigente} onChange={(e) => setForm({ ...form, vigente: e.target.checked })} className="rounded border-input" />
            <label htmlFor="vigente" className="text-xs text-muted-foreground">Contrato vigente</label>
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
