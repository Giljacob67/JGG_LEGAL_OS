"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Processo } from "@/lib/types";

interface ProcessoEditModalProps {
  processo: Processo;
  onClose: () => void;
  onSaved: () => void;
}

const AREA_OPTIONS = [
  { value: "bancario", label: "Bancário" },
  { value: "agrario", label: "Agrário" },
  { value: "tributario", label: "Tributário" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "civil", label: "Civil" },
  { value: "empresarial", label: "Empresarial" },
  { value: "penal", label: "Penal" },
];

const STATUS_OPTIONS = [
  { value: "em_andamento", label: "Em andamento" },
  { value: "suspenso", label: "Suspenso" },
  { value: "arquivado", label: "Arquivado" },
  { value: "encerrado", label: "Encerrado" },
];

const RISCO_OPTIONS = [
  { value: "alto", label: "Alto" },
  { value: "medio", label: "Médio" },
  { value: "baixo", label: "Baixo" },
];

type TabId = "basicos" | "detalhes" | "estrategia" | "avancado";

export function ProcessoEditModal({ processo, onClose, onSaved }: ProcessoEditModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("basicos");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    cnj: processo.cnj || "",
    clienteId: processo.clienteId || "",
    responsavelId: processo.responsavelId || "",
    tipo: processo.tipo || "",
    area: processo.area || "civil",
    status: processo.status || "em_andamento",
    risco: processo.risco || "medio",
    tribunal: processo.tribunal || "",
    vara: processo.vara || "",
    comarca: processo.comarca || "",
    classe: processo.classe || "",
    assunto: processo.assunto || "",
    valorCausa: processo.valorCausa?.toString() || "",
    valorProvavel: processo.valorProvavel?.toString() || "",
    distribuicao: processo.distribuicao ? processo.distribuicao.split("T")[0] : "",
    adverso: processo.adverso || "",
    adversoAdv: processo.adversoAdv || "",
    tese: processo.tese || "",
    estrategia: processo.estrategia || "",
    proximosPassos: processo.proximosPassos || "",
    observacoes: processo.observacoes || "",
    tagMataMata: processo.tagMataMata || false,
  });

  const tabs: { id: TabId; label: string }[] = [
    { id: "basicos", label: "Dados Básicos" },
    { id: "detalhes", label: "Detalhes Processuais" },
    { id: "estrategia", label: "Estratégia" },
    { id: "avancado", label: "Avançado" },
  ];

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        valorCausa: formData.valorCausa ? parseFloat(formData.valorCausa) : null,
        valorProvavel: formData.valorProvavel ? parseFloat(formData.valorProvavel) : null,
        distribuicao: formData.distribuicao || null,
      };

      const res = await fetch(`/api/v1/processes/${processo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao salvar");
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg border shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Editar Processo</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-muted/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-foreground bg-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">
                {error}
              </div>
            )}

            {/* Tab: Dados Básicos */}
            {activeTab === "basicos" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Número CNJ *</label>
                  <input
                    type="text"
                    value={formData.cnj}
                    onChange={(e) => handleChange("cnj", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Cliente *</label>
                  <input
                    type="text"
                    value={formData.clienteId}
                    onChange={(e) => handleChange("clienteId", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                    placeholder="ID do cliente"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Responsável *</label>
                  <input
                    type="text"
                    value={formData.responsavelId}
                    onChange={(e) => handleChange("responsavelId", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                    placeholder="ID do responsável"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tipo *</label>
                  <input
                    type="text"
                    value={formData.tipo}
                    onChange={(e) => handleChange("tipo", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                    placeholder="Ex: Cível, Federal"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Área *</label>
                  <select
                    value={formData.area}
                    onChange={(e) => handleChange("area", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                    required
                  >
                    {AREA_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Risco</label>
                  <select
                    value={formData.risco}
                    onChange={(e) => handleChange("risco", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  >
                    {RISCO_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Tab: Detalhes Processuais */}
            {activeTab === "detalhes" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tribunal</label>
                  <input
                    type="text"
                    value={formData.tribunal}
                    onChange={(e) => handleChange("tribunal", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                    placeholder="Ex: TJPR"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vara/Órgão</label>
                  <input
                    type="text"
                    value={formData.vara}
                    onChange={(e) => handleChange("vara", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                    placeholder="Ex: 1ª Vara Cível"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Comarca</label>
                  <input
                    type="text"
                    value={formData.comarca}
                    onChange={(e) => handleChange("comarca", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Classe Processual</label>
                  <input
                    type="text"
                    value={formData.classe}
                    onChange={(e) => handleChange("classe", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                    placeholder="Ex: Ação Revisional"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Assunto</label>
                  <input
                    type="text"
                    value={formData.assunto}
                    onChange={(e) => handleChange("assunto", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Valor da Causa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valorCausa}
                    onChange={(e) => handleChange("valorCausa", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Valor Provável (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valorProvavel}
                    onChange={(e) => handleChange("valorProvavel", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Distribuição</label>
                  <input
                    type="date"
                    value={formData.distribuicao}
                    onChange={(e) => handleChange("distribuicao", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium">Parte Contrária</label>
                  <input
                    type="text"
                    value={formData.adverso}
                    onChange={(e) => handleChange("adverso", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium">Advogado da Parte Contrária</label>
                  <input
                    type="text"
                    value={formData.adversoAdv}
                    onChange={(e) => handleChange("adversoAdv", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  />
                </div>
              </div>
            )}

            {/* Tab: Estratégia */}
            {activeTab === "estrategia" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tese</label>
                  <textarea
                    value={formData.tese}
                    onChange={(e) => handleChange("tese", e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                    placeholder="Descreva a tese jurídica..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Estratégia</label>
                  <textarea
                    value={formData.estrategia}
                    onChange={(e) => handleChange("estrategia", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                    placeholder="Estratégia processual..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Próximos Passos</label>
                  <textarea
                    value={formData.proximosPassos}
                    onChange={(e) => handleChange("proximosPassos", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                    placeholder="Ações planejadas..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => handleChange("observacoes", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                  />
                </div>
              </div>
            )}

            {/* Tab: Avançado */}
            {activeTab === "avancado" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tagMataMata"
                    checked={formData.tagMataMata}
                    onChange={(e) => handleChange("tagMataMata", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="tagMataMata" className="text-sm">
                    Operação Mata-Mata
                  </label>
                </div>
                <div className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">Informações adicionais</p>
                  <p>• Equipes e colaboradores serão gerenciados em breve</p>
                  <p>• Etiquetas personalizadas em desenvolvimento</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
