"use client";

import { useState } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { FormField, Input, Select } from "@/components/ui/form-field";
import { TIPOS_DOCUMENTO, STATUS_DOCUMENTO } from "@/lib/constants";
import type { Documento } from "@/lib/types";

interface ProcessoRef { id: string; cnj: string; cliente?: { nome: string } | null; }

interface DocumentoBody {
  nome: string;
  tipo: string;
  status: string;
  processoId: string;
  url: string;
  segredo: boolean;
  tags: string[];
}

export function DocumentoModal({
  open, onClose, documento, processos, onSuccess,
}: {
  open: boolean; onClose: () => void; documento?: Documento | null;
  processos: ProcessoRef[]; onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => {
    if (documento) {
      return {
        nome: documento.nome,
        tipo: documento.tipo,
        status: documento.status,
        processoId: documento.processoId || "",
        url: documento.url || "",
        segredo: documento.segredo,
        tags: documento.tags?.join(", ") || "",
      };
    }
    return { nome: "", tipo: "peticao", status: "rascunho", processoId: "", url: "", segredo: false, tags: "" };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = documento ? `/api/v1/documents/${documento.id}` : "/api/v1/documents";
      const method = documento ? "PATCH" : "POST";
      const body: DocumentoBody = {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={documento ? "Editar documento" : "Novo documento"}
      error={error}
      loading={loading}
      submitLabel={documento ? "Atualizar" : "Criar"}
      onSubmit={handleSubmit}
    >
      <FormField label="Nome" htmlFor="doc-nome">
        <Input id="doc-nome" type="text" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Contestacao - Acao de indenizacao" />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Tipo" htmlFor="doc-tipo">
          <Select id="doc-tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
          </Select>
        </FormField>
        <FormField label="Status" htmlFor="doc-status">
          <Select id="doc-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUS_DOCUMENTO.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
          </Select>
        </FormField>
      </div>
      <FormField label="Processo vinculado" htmlFor="doc-processo">
        <Select id="doc-processo" value={form.processoId} onChange={(e) => setForm({ ...form, processoId: e.target.value })}>
          <option value="">Nenhum</option>
          {processos.map((p) => <option key={p.id} value={p.id}>{p.cnj} — {p.cliente?.nome?.slice(0, 30) || "—"}</option>)}
        </Select>
      </FormField>
      <FormField label="URL do arquivo (Google Drive, etc)" htmlFor="doc-url">
        <Input id="doc-url" type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://drive.google.com/..." />
      </FormField>
      <FormField label="Tags (separadas por virgula)" htmlFor="doc-tags">
        <Input id="doc-tags" type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="trabalhista, recursal, urgente" />
      </FormField>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="doc-segredo" checked={form.segredo} onChange={(e) => setForm({ ...form, segredo: e.target.checked })} className="rounded border-input" />
        <label htmlFor="doc-segredo" className="text-xs text-muted-foreground">Documento sigiloso (segredo de justica)</label>
      </div>
    </FormModal>
  );
}
