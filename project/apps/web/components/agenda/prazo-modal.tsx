"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

interface Prazo {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  vence: Date | string;
  prazoInterno?: Date | string | null;
  responsavelId?: string | null;
  status: string;
  processoId?: string | null;
  clienteId?: string | null;
  notificar?: boolean;
}

interface User {
  id: string;
  nome: string;
}

interface Processo {
  id: string;
  cnj: string;
  cliente?: { nome: string } | null;
}

export function PrazoModal({
  open,
  onClose,
  prazo,
  users,
  processos,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  prazo?: Prazo | null;
  users: User[];
  processos: Processo[];
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tipo: "fatal",
    titulo: "",
    descricao: "",
    vence: "",
    prazoInterno: "",
    responsavelId: "",
    processoId: "",
    clienteId: "",
    notificar: true,
  });

  useEffect(() => {
    if (prazo) {
      setForm({
        tipo: prazo.tipo,
        titulo: prazo.titulo,
        descricao: prazo.descricao || "",
        vence: prazo.vence ? new Date(prazo.vence).toISOString().slice(0, 16) : "",
        prazoInterno: prazo.prazoInterno ? new Date(prazo.prazoInterno).toISOString().slice(0, 16) : "",
        responsavelId: prazo.responsavelId || "",
        processoId: prazo.processoId || "",
        clienteId: prazo.clienteId || "",
        notificar: prazo.notificar ?? true,
      });
    } else {
      setForm({
        tipo: "fatal",
        titulo: "",
        descricao: "",
        vence: "",
        prazoInterno: "",
        responsavelId: "",
        processoId: "",
        clienteId: "",
        notificar: true,
      });
    }
    setError("");
  }, [prazo, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = prazo ? `/api/v1/deadlines/${prazo.id}` : "/api/v1/deadlines";
      const method = prazo ? "PATCH" : "POST";

      const body = {
        ...form,
        vence: form.vence ? new Date(form.vence).toISOString() : undefined,
        prazoInterno: form.prazoInterno ? new Date(form.prazoInterno).toISOString() : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

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
          <h2 className="text-sm font-semibold">{prazo ? "Editar prazo" : "Novo prazo"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="fatal">Fatal</option>
                <option value="dilacao">Dilacao</option>
                <option value="audiencia">Audiencia</option>
                <option value="reuniao">Reuniao</option>
                <option value="tarefa">Tarefa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Vencimento</label>
              <input
                type="datetime-local"
                required
                value={form.vence}
                onChange={(e) => setForm({ ...form, vence: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Titulo</label>
            <input
              type="text"
              required
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex: Contestacao, Audiencia de instrucao..."
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Descricao</label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Prazo interno</label>
              <input
                type="datetime-local"
                value={form.prazoInterno}
                onChange={(e) => setForm({ ...form, prazoInterno: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Responsavel</label>
              <select
                value={form.responsavelId}
                onChange={(e) => setForm({ ...form, responsavelId: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecionar...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Processo vinculado</label>
            <select
              value={form.processoId}
              onChange={(e) => setForm({ ...form, processoId: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecionar...</option>
              {processos.map((p) => (
                <option key={p.id} value={p.id}>{p.cnj} — {p.cliente?.nome?.slice(0, 30) || "—"}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notificar"
              checked={form.notificar}
              onChange={(e) => setForm({ ...form, notificar: e.target.checked })}
              className="rounded border-input"
            />
            <label htmlFor="notificar" className="text-xs text-muted-foreground">Enviar notificacoes de alerta</label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Salvando..." : prazo ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
