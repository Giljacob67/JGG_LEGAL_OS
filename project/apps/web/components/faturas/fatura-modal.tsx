"use client";

import { useState } from "react";
import { FormModal } from "@/components/ui/form-modal";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import { STATUS_FATURA } from "@/lib/constants";
import type { Fatura } from "@/lib/types";

interface Cliente { id: string; nome: string; }
interface ContratoRef { id: string; numero?: string | null; tipo: string; }

const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface FaturaBody {
  numero: string;
  clienteId: string;
  contratoId: string;
  mes: string;
  ano: number | null;
  valor: number;
  desconto: number | null;
  status: string;
  vencimento: Date | null;
  pagoEm: Date | null;
  formaPagamento: string;
  observacoes: string;
}

export function FaturaModal({
  open, onClose, fatura, clientes, contratos, onSuccess,
}: {
  open: boolean; onClose: () => void; fatura?: Fatura | null;
  clientes: Cliente[]; contratos: ContratoRef[]; onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => {
    if (fatura) {
      return {
        numero: fatura.numero || "",
        clienteId: fatura.clienteId,
        contratoId: fatura.contratoId || "",
        mes: fatura.mes,
        ano: fatura.ano != null ? String(fatura.ano) : "",
        valor: String(fatura.valor),
        desconto: fatura.desconto != null ? String(fatura.desconto) : "",
        status: fatura.status,
        vencimento: fatura.vencimento ? new Date(fatura.vencimento).toISOString().split("T")[0] : "",
        pagoEm: fatura.pagoEm ? new Date(fatura.pagoEm).toISOString().split("T")[0] : "",
        formaPagamento: fatura.formaPagamento || "",
        observacoes: fatura.observacoes || "",
      };
    }
    const now = new Date();
    return { numero: "", clienteId: "", contratoId: "", mes: MESES[now.getMonth()], ano: String(now.getFullYear()), valor: "", desconto: "", status: "pendente", vencimento: "", pagoEm: "", formaPagamento: "", observacoes: "" };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = fatura ? `/api/v1/invoices/${fatura.id}` : "/api/v1/invoices";
      const method = fatura ? "PATCH" : "POST";
      const body: FaturaBody = {
        ...form,
        valor: Number(form.valor),
        desconto: form.desconto ? Number(form.desconto) : null,
        ano: form.ano ? Number(form.ano) : null,
        vencimento: form.vencimento ? new Date(form.vencimento) : null,
        pagoEm: form.pagoEm ? new Date(form.pagoEm) : null,
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
      title={fatura ? "Editar fatura" : "Nova fatura"}
      error={error}
      loading={loading}
      submitLabel={fatura ? "Atualizar" : "Criar"}
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Numero" htmlFor="fat-numero">
          <Input id="fat-numero" type="text" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="FAT-2024-001" />
        </FormField>
        <FormField label="Status" htmlFor="fat-status">
          <Select id="fat-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {Object.entries(STATUS_FATURA).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </FormField>
      </div>
      <FormField label="Cliente *" htmlFor="fat-cliente">
        <Select id="fat-cliente" required value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
          <option value="">Selecione...</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </Select>
      </FormField>
      <FormField label="Contrato vinculado" htmlFor="fat-contrato">
        <Select id="fat-contrato" value={form.contratoId} onChange={(e) => setForm({ ...form, contratoId: e.target.value })}>
          <option value="">Nenhum</option>
          {contratos.map((c) => <option key={c.id} value={c.id}>{c.numero || "#" + c.id.slice(0, 6)} — {c.tipo}</option>)}
        </Select>
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Mes *" htmlFor="fat-mes">
          <Select id="fat-mes" required value={form.mes} onChange={(e) => setForm({ ...form, mes: e.target.value })}>
            {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </FormField>
        <FormField label="Ano" htmlFor="fat-ano">
          <Input id="fat-ano" type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} placeholder="2024" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Valor (R$) *" htmlFor="fat-valor">
          <Input id="fat-valor" type="number" step="0.01" required value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="5000.00" />
        </FormField>
        <FormField label="Desconto (R$)" htmlFor="fat-desconto">
          <Input id="fat-desconto" type="number" step="0.01" value={form.desconto} onChange={(e) => setForm({ ...form, desconto: e.target.value })} placeholder="0.00" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Vencimento *" htmlFor="fat-vencimento">
          <Input id="fat-vencimento" type="date" required value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
        </FormField>
        <FormField label="Pago em" htmlFor="fat-pagoEm">
          <Input id="fat-pagoEm" type="date" value={form.pagoEm} onChange={(e) => setForm({ ...form, pagoEm: e.target.value })} />
        </FormField>
      </div>
      <FormField label="Forma de pagamento" htmlFor="fat-pagamento">
        <Input id="fat-pagamento" type="text" value={form.formaPagamento} onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })} placeholder="PIX, Boleto, Transferencia..." />
      </FormField>
      <FormField label="Observacoes" htmlFor="fat-obs">
        <Textarea id="fat-obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
      </FormField>
    </FormModal>
  );
}
