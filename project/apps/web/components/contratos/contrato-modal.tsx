"use client";

import { useState } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import { TIPOS_CONTRATO } from "@/lib/constants";
import type { Contrato } from "@/lib/types";

interface Cliente { id: string; nome: string; }
interface ProcessoRef { id: string; cnj: string; }

interface ContratoBody {
  numero: string;
  clienteId: string;
  processoId: string;
  tipo: string;
  valorFixo: number | null;
  percentual: number | null;
  taxaHora: number | null;
  horasMes: number | null;
  estimativa: number | null;
  vigente: boolean;
  dataInicio: Date | null;
  dataFim: Date | null;
  observacoes: string;
}

export function ContratoModal({
  open, onClose, contrato, clientes, processos, onSuccess,
}: {
  open: boolean; onClose: () => void; contrato?: Contrato | null;
  clientes: Cliente[]; processos: ProcessoRef[]; onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => {
    if (contrato) {
      return {
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
      };
    }
    return { numero: "", clienteId: "", processoId: "", tipo: "fixo_mensal", valorFixo: "", percentual: "", taxaHora: "", horasMes: "", estimativa: "", vigente: true, dataInicio: new Date().toISOString().split("T")[0], dataFim: "", observacoes: "" };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = contrato ? `/api/v1/contracts/${contrato.id}` : "/api/v1/contracts";
      const method = contrato ? "PATCH" : "POST";
      const body: ContratoBody = {
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
      title={contrato ? "Editar contrato" : "Novo contrato de honorarios"}
      error={error}
      loading={loading}
      submitLabel={contrato ? "Atualizar" : "Criar"}
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Numero" htmlFor="contrato-numero">
          <Input id="contrato-numero" type="text" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="CH-2024-001" />
        </FormField>
        <FormField label="Tipo *" htmlFor="contrato-tipo">
          <Select id="contrato-tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {TIPOS_CONTRATO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </FormField>
      </div>
      <FormField label="Cliente *" htmlFor="contrato-cliente">
        <Select id="contrato-cliente" required value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
          <option value="">Selecione...</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </Select>
      </FormField>
      <FormField label="Processo vinculado" htmlFor="contrato-processo">
        <Select id="contrato-processo" value={form.processoId} onChange={(e) => setForm({ ...form, processoId: e.target.value })}>
          <option value="">Nenhum</option>
          {processos.map((p) => <option key={p.id} value={p.id}>{p.cnj}</option>)}
        </Select>
      </FormField>
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Valor fixo (R$)" htmlFor="contrato-valor">
          <Input id="contrato-valor" type="number" step="0.01" value={form.valorFixo} onChange={(e) => setForm({ ...form, valorFixo: e.target.value })} placeholder="5000" />
        </FormField>
        <FormField label="Percentual (%)" htmlFor="contrato-percentual">
          <Input id="contrato-percentual" type="number" step="0.01" value={form.percentual} onChange={(e) => setForm({ ...form, percentual: e.target.value })} placeholder="10" />
        </FormField>
        <FormField label="Taxa/hora (R$)" htmlFor="contrato-taxa">
          <Input id="contrato-taxa" type="number" step="0.01" value={form.taxaHora} onChange={(e) => setForm({ ...form, taxaHora: e.target.value })} placeholder="350" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Horas/mes" htmlFor="contrato-horas">
          <Input id="contrato-horas" type="number" value={form.horasMes} onChange={(e) => setForm({ ...form, horasMes: e.target.value })} placeholder="40" />
        </FormField>
        <FormField label="Estimativa (R$)" htmlFor="contrato-estimativa">
          <Input id="contrato-estimativa" type="number" step="0.01" value={form.estimativa} onChange={(e) => setForm({ ...form, estimativa: e.target.value })} placeholder="15000" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Data inicio" htmlFor="contrato-inicio">
          <Input id="contrato-inicio" type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
        </FormField>
        <FormField label="Data fim" htmlFor="contrato-fim">
          <Input id="contrato-fim" type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
        </FormField>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="contrato-vigente" checked={form.vigente} onChange={(e) => setForm({ ...form, vigente: e.target.checked })} className="rounded border-input" />
        <label htmlFor="contrato-vigente" className="text-xs text-muted-foreground">Contrato vigente</label>
      </div>
      <FormField label="Observacoes" htmlFor="contrato-obs">
        <Textarea id="contrato-obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
      </FormField>
    </FormModal>
  );
}
