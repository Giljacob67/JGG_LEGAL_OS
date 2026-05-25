"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Play, Pause, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Workflow {
  id: string;
  nome: string;
  descricao: string | null;
  trigger: string;
  condicoes: any;
  acoes: any[];
  ativo: boolean;
  totalExecucoes: number;
  ultimaExecucao: string | null;
  createdAt: string;
  criadoPor: { id: string; nome: string };
}

const TRIGGERS = [
  { value: "prazo_proximo", label: "Prazo Próximo", descricao: "Dispara quando um prazo está próximo do vencimento" },
  { value: "andamento_critico", label: "Andamento Crítico", descricao: "Dispara quando um andamento é marcado como crítico" },
  { value: "status_mudou", label: "Status Mudou", descricao: "Dispara quando o status de um processo muda" },
  { value: "processo_criado", label: "Processo Criado", descricao: "Dispara quando um novo processo é criado" },
];

const TIPOS_ACAO = [
  { value: "email", label: "Enviar Email" },
  { value: "notificacao", label: "Criar Notificação" },
  { value: "criar_tarefa", label: "Criar Tarefa" },
  { value: "atualizar_campo", label: "Atualizar Campo" },
];

export function WorkflowsManager() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    trigger: "prazo_proximo",
    condicoes: {} as any,
    acoes: [{ tipo: "email", para: "", assunto: "", mensagem: "" }] as any[],
    ativo: true,
  });

  useEffect(() => {
    loadWorkflows();
  }, []);

  async function loadWorkflows() {
    try {
      const res = await fetch("/api/v1/workflows");
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      }
    } catch (error) {
      console.error("Erro ao carregar workflows:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const url = editingWorkflow
        ? `/api/v1/workflows/${editingWorkflow.id}`
        : "/api/v1/workflows";
      const method = editingWorkflow ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await loadWorkflows();
        resetForm();
      }
    } catch (error) {
      console.error("Erro ao salvar workflow:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este workflow?")) return;

    try {
      const res = await fetch(`/api/v1/workflows/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadWorkflows();
      }
    } catch (error) {
      console.error("Erro ao excluir workflow:", error);
    }
  }

  async function toggleAtivo(workflow: Workflow) {
    try {
      const res = await fetch(`/api/v1/workflows/${workflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !workflow.ativo }),
      });

      if (res.ok) {
        await loadWorkflows();
      }
    } catch (error) {
      console.error("Erro ao atualizar workflow:", error);
    }
  }

  function handleEdit(workflow: Workflow) {
    setEditingWorkflow(workflow);
    setFormData({
      nome: workflow.nome,
      descricao: workflow.descricao || "",
      trigger: workflow.trigger,
      condicoes: workflow.condicoes || {},
      acoes: workflow.acoes,
      ativo: workflow.ativo,
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      nome: "",
      descricao: "",
      trigger: "prazo_proximo",
      condicoes: {},
      acoes: [{ tipo: "email", para: "", assunto: "", mensagem: "" }],
      ativo: true,
    });
    setEditingWorkflow(null);
    setShowForm(false);
  }

  function adicionarAcao() {
    setFormData({
      ...formData,
      acoes: [...formData.acoes, { tipo: "email", para: "", assunto: "", mensagem: "" }],
    });
  }

  function removerAcao(index: number) {
    setFormData({
      ...formData,
      acoes: formData.acoes.filter((_, i) => i !== index),
    });
  }

  function atualizarAcao(index: number, campo: string, valor: any) {
    const novasAcoes = [...formData.acoes];
    novasAcoes[index] = { ...novasAcoes[index], [campo]: valor };
    setFormData({ ...formData, acoes: novasAcoes });
  }

  const getTriggerLabel = (trigger: string) => {
    return TRIGGERS.find((t) => t.value === trigger)?.label || trigger;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando workflows...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Automações e Workflows</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Workflow
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingWorkflow ? "Editar Workflow" : "Novo Workflow"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Trigger (Evento) *</label>
                <select
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  {TRIGGERS.map((trigger) => (
                    <option key={trigger.value} value={trigger.value}>
                      {trigger.label} - {trigger.descricao}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ações *</label>
                {formData.acoes.map((acao, index) => (
                  <div key={index} className="mb-3 p-3 border rounded-md space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Ação {index + 1}</span>
                      {formData.acoes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerAcao(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <select
                      value={acao.tipo}
                      onChange={(e) => atualizarAcao(index, "tipo", e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      {TIPOS_ACAO.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>

                    {acao.tipo === "email" && (
                      <>
                        <input
                          type="email"
                          value={acao.para}
                          onChange={(e) => atualizarAcao(index, "para", e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          placeholder="Email destinatário"
                        />
                        <input
                          type="text"
                          value={acao.assunto}
                          onChange={(e) => atualizarAcao(index, "assunto", e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          placeholder="Assunto do email"
                        />
                        <textarea
                          value={acao.mensagem}
                          onChange={(e) => atualizarAcao(index, "mensagem", e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          rows={3}
                          placeholder="Mensagem do email"
                        />
                      </>
                    )}

                    {acao.tipo === "criar_tarefa" && (
                      <>
                        <input
                          type="text"
                          value={acao.titulo}
                          onChange={(e) => atualizarAcao(index, "titulo", e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          placeholder="Título da tarefa"
                        />
                        <textarea
                          value={acao.descricao}
                          onChange={(e) => atualizarAcao(index, "descricao", e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          rows={2}
                          placeholder="Descrição da tarefa"
                        />
                      </>
                    )}

                    {acao.tipo === "notificacao" && (
                      <textarea
                        value={acao.mensagem}
                        onChange={(e) => atualizarAcao(index, "mensagem", e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        rows={2}
                        placeholder="Mensagem da notificação"
                      />
                    )}
                  </div>
                ))}

                <Button type="button" variant="outline" size="sm" onClick={adicionarAcao}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Ação
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="ativo" className="text-sm font-medium">
                  Workflow ativo
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingWorkflow ? "Atualizar" : "Criar"} Workflow
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {workflows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum workflow configurado. Crie o primeiro!</p>
          </div>
        ) : (
          workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{workflow.nome}</h3>
                      <Badge variant={workflow.ativo ? "default" : "secondary"}>
                        {workflow.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline">{getTriggerLabel(workflow.trigger)}</Badge>
                    </div>
                    {workflow.descricao && (
                      <p className="text-sm text-gray-600 mb-2">{workflow.descricao}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{workflow.acoes.length} ação(ões)</span>
                      <span>{workflow.totalExecucoes} execuções</span>
                      {workflow.ultimaExecucao && (
                        <span>
                          Última: {formatDistanceToNow(new Date(workflow.ultimaExecucao), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      )}
                      <span>Criado por {workflow.criadoPor.nome}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleAtivo(workflow)}
                    >
                      {workflow.ativo ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(workflow)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(workflow.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
