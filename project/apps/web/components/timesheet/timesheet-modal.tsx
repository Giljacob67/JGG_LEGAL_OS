"use client";

import { useState } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { FormField, Input, Select } from "@/components/ui/form-field";
import type { Registro } from "@/lib/types";

interface ProcessoRef { id: string; cnj: string; }

export function TimesheetModal({
  open, onClose, registro, processos, onSuccess,
}: {
  open: boolean; onClose: () => void; registro?: Registro | null;
  processos: ProcessoRef[]; onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => {
    if (registro) {
      return {
        data: registro.data ? new Date(registro.data).toISOString().split("T")[0] : "",
        horas: String(registro.horas),
        atividade: registro.atividade,
        processoId: registro.processoId || "",
        faturado: registro.faturado,
      };
    }
    return { data: new Date().toISOString().split("T")[0], horas: "", atividade: "", processoId: "", faturado: false };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = registro ? `/api/v1/timesheet/${registro.id}` : "/api/v1/timesheet";
      const method = registro ? "PATCH" : "POST";
      const body = {
        atividade: form.atividade,
        horas: Number(form.horas),
        data: form.data ? new Date(form.data).toISOString() : undefined,
        processoId: form.processoId || undefined,
        faturado: form.faturado,
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
      title={registro ? "Editar registro" : "Novo registro de horas"}
      error={error}
      loading={loading}
      submitLabel={registro ? "Atualizar" : "Criar"}
      onSubmit={handleSubmit}
    >
      <FormField label="Data *" htmlFor="ts-data">
        <Input id="ts-data" type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Horas *" htmlFor="ts-horas">
          <Input id="ts-horas" type="number" step="0.25" required value={form.horas} onChange={(e) => setForm({ ...form, horas: e.target.value })} placeholder="2.5" />
        </FormField>
        <FormField label="Processo" htmlFor="ts-processo">
          <Select id="ts-processo" value={form.processoId} onChange={(e) => setForm({ ...form, processoId: e.target.value })}>
            <option value="">Nenhum</option>
            {processos.map((p) => <option key={p.id} value={p.id}>{p.cnj}</option>)}
          </Select>
        </FormField>
      </div>
      <FormField label="Atividade *" htmlFor="ts-atividade">
        <Input id="ts-atividade" type="text" required value={form.atividade} onChange={(e) => setForm({ ...form, atividade: e.target.value })} placeholder="Analise de documentos, reuniao com cliente..." />
      </FormField>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="ts-faturado" checked={form.faturado} onChange={(e) => setForm({ ...form, faturado: e.target.checked })} className="rounded border-input" />
        <label htmlFor="ts-faturado" className="text-xs text-muted-foreground">Ja faturado</label>
      </div>
    </FormModal>
  );
}
