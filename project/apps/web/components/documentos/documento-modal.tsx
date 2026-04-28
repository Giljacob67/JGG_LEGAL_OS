"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

interface Documento {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  processoId?: string | null;
  clienteId?: string | null;
  url?: string | null;
  segredo: boolean;
  tags: string[];
}

interface Processo {
  id: string;
  cnj: string;
  cliente?: { nome: string } | null;
}

const TIPOS = [
  "peticao", "contrato", "extrato", "decisao", "certidao",
  "parecer", "planilha", "procuracao", "declaracao", "notificacao", "termo", "outro",
];

const STATUS = ["rascunho", "em_revisao", "aprovado", "protocolado", "arquivado"];

export function DocumentoModal({
  open, onClose, documento, processos, onSuccess,
}: {
  open: boolean; onClose: () => void; documento?: Documento | null;
  processos: Processo[]; onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nome: "", tipo: "peticao", status: "rascunho", processoId: "", url: "", segredo: false, tags: "",
  });

  useEffect(() => {
    if (documento) {
      setForm({
        nome: documento.nome,
        tipo: documento.tipo,
        status: documento.status,
        processoId: documento.processoId || "",
        url: documento.url || "",
        segredo: documento.segredo,
        tags: documento.tags?.join(", ") || "",
      });
    } else {
      setForm({ nome: "", tipo: "peticao", status: "rascunho", processoId: "", url: "", segredo: false, tags: "" });
    }
    setError("");
  }, [documento, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = documento ? `/api/v1/documents/${documento.id}` : "/api/v1/documents";
      const method = documento ? "PATCH" : "POST";
      const body: any = {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
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
          <h2 className="text-sm font-semibold">{documento ? "Editar documento" : "Novo documento"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2"><AlertTriangle size={14} />{error}</div>}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Nome</label>
            <input type="text" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Contestacao - Acao de indenizacao" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
                {TIPOS.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
                {STATUS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Processo vinculado</label>
            <select value={form.processoId} onChange={(e) => setForm({ ...form, processoId: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">Nenhum</option>
              {processos.map((p) => <option key={p.id} value={p.id}>{p.cnj} — {p.cliente?.nome?.slice(0, 30) || "—"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">URL do arquivo (Google Drive, etc)</label>
            <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tags (separadas por virgula)</label>
            <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="trabalhista, recursal, urgente" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="segredo" checked={form.segredo} onChange={(e) => setForm({ ...form, segredo: e.target.checked })} className="rounded border-input" />
            <label htmlFor="segredo" className="text-xs text-muted-foreground">Documento sigiloso (segredo de justica)</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">{loading ? "Salvando..." : documento ? "Atualizar" : "Criar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
