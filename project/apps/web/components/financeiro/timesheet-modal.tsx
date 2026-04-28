"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

interface Registro {
  id: string;
  atividade: string;
  horas: unknown;
  data: Date | string;
  processoId?: string | null;
  faturado: boolean;
}

interface Processo {
  id: string;
  cnj: string;
}

export function TimesheetModal({
  open, onClose, registro, processos, onSuccess,
}: {
  open: boolean; onClose: () => void; registro?: Registro | null;
  processos: Processo[]; onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    atividade: "", horas: "", data: "", processoId: "", faturado: false,
  });

  useEffect(() => {
    if (registro) {
      setForm({
        atividade: registro.atividade,
        horas: registro.horas != null ? String(Number(registro.horas)) : "",
        data: registro.data ? new Date(registro.data).toISOString().slice(0, 10) : "",
        processoId: registro.processoId || "",
        faturado: registro.faturado,
      });
    } else {
      setForm({ atividade: "", horas: "", data: new Date().toISOString().slice(0, 10), processoId: "", faturado: false });
    }
    setError("");
  }, [registro, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = registro ? `/api/v1/timesheet/${registro.id}` : "/api/v1/timesheet";
      const method = registro ? "PATCH" : "POST";
      const body: any = { ...form };
      if (body.horas) body.horas = Number(body.horas);
      if (body.data) body.data = new Date(body.data).toISOString();

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
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border bg-card shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-sm font-semibold">{registro ? "Editar registro" : "Novo registro"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2"><AlertTriangle size={14} />{error}</div>}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Atividade</label>
            <input type="text" required value={form.atividade} onChange={(e) => setForm({ ...form, atividade: e.target.value })} placeholder="Ex: Elaboracao de peticao, Audiencia..." className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Horas</label><input type="number" step="0.1" required value={form.horas} onChange={(e) => setForm({ ...form, horas: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Data</label><input type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Processo</label>
            <select value={form.processoId} onChange={(e) => setForm({ ...form, processoId: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">Nenhum</option>
              {processos.map((p) => <option key={p.id} value={p.id}>{p.cnj}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="faturado" checked={form.faturado} onChange={(e) => setForm({ ...form, faturado: e.target.checked })} className="rounded border-input" />
            <label htmlFor="faturado" className="text-xs text-muted-foreground">Ja faturado</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">{loading ? "Salvando..." : registro ? "Atualizar" : "Criar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
