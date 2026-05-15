"use client";

import { useState } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import type { Prazo } from "@/lib/types";

interface User { id: string; nome: string; }
interface ProcessoRef { id: string; cnj: string; cliente?: { nome: string } | null; }

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
  processos: ProcessoRef[];
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => {
    if (prazo) {
      return {
        tipo: prazo.tipo,
        titulo: prazo.titulo,
        descricao: prazo.descricao || "",
        vence: prazo.vence ? new Date(prazo.vence).toISOString().slice(0, 16) : "",
        prazoInterno: prazo.prazoInterno ? new Date(prazo.prazoInterno).toISOString().slice(0, 16) : "",
        responsavelId: prazo.responsavelId || "",
        processoId: prazo.processoId || "",
        clienteId: prazo.clienteId || "",
        notificar: prazo.notificar ?? true,
      };
    }
    return {
      tipo: "fatal",
      titulo: "",
      descricao: "",
      vence: "",
      prazoInterno: "",
      responsavelId: "",
      processoId: "",
      clienteId: "",
      notificar: true,
    };
  });

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
      title={prazo ? "Editar prazo" : "Novo prazo"}
      error={error}
      loading={loading}
      submitLabel={prazo ? "Atualizar" : "Criar"}
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Tipo" htmlFor="prazo-tipo">
          <Select
            id="prazo-tipo"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="fatal">Fatal</option>
            <option value="dilacao">Dilacao</option>
            <option value="audiencia">Audiencia</option>
            <option value="reuniao">Reuniao</option>
            <option value="tarefa">Tarefa</option>
          </Select>
        </FormField>
        <FormField label="Vencimento" htmlFor="prazo-vence">
          <Input
            id="prazo-vence"
            type="datetime-local"
            required
            value={form.vence}
            onChange={(e) => setForm({ ...form, vence: e.target.value })}
          />
        </FormField>
      </div>

      <FormField label="Titulo" htmlFor="prazo-titulo">
        <Input
          id="prazo-titulo"
          type="text"
          required
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Ex: Contestacao, Audiencia de instrucao..."
        />
      </FormField>

      <FormField label="Descricao" htmlFor="prazo-descricao">
        <Textarea
          id="prazo-descricao"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          rows={2}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Prazo interno" htmlFor="prazo-interno">
          <Input
            id="prazo-interno"
            type="datetime-local"
            value={form.prazoInterno}
            onChange={(e) => setForm({ ...form, prazoInterno: e.target.value })}
          />
        </FormField>
        <FormField label="Responsavel" htmlFor="prazo-responsavel">
          <Select
            id="prazo-responsavel"
            value={form.responsavelId}
            onChange={(e) => setForm({ ...form, responsavelId: e.target.value })}
          >
            <option value="">Selecionar...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Processo vinculado" htmlFor="prazo-processo">
        <Select
          id="prazo-processo"
          value={form.processoId}
          onChange={(e) => setForm({ ...form, processoId: e.target.value })}
        >
          <option value="">Selecionar...</option>
          {processos.map((p) => (
            <option key={p.id} value={p.id}>{p.cnj} — {p.cliente?.nome?.slice(0, 30) || "—"}</option>
          ))}
        </Select>
      </FormField>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="prazo-notificar"
          checked={form.notificar}
          onChange={(e) => setForm({ ...form, notificar: e.target.checked })}
          className="rounded border-input"
        />
        <label htmlFor="prazo-notificar" className="text-xs text-muted-foreground">Enviar notificacoes de alerta</label>
      </div>
    </FormModal>
  );
}
