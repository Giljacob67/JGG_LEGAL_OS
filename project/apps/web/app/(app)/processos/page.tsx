"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { BuscaCNJ } from "@/components/processos/busca-cnj";
import { TabelaProcessos } from "@/components/processos/tabela-processos";
import {
  Plus,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Processo {
  id: string;
  cnj: string;
  tipo: string;
  status: string;
  risco: string;
  area: string;
  valorCausa: any;
  valorProvavel: any;
  adverso: string | null;
  adversoAdv: string | null;
  tribunal: string | null;
  vara: string | null;
  comarca: string | null;
  classe: string | null;
  assunto: string | null;
  tese: string | null;
  estrategia: string | null;
  proximosPassos: string | null;
  observacoes: string | null;
  distribuicao: string | null;
  clienteId: string;
  responsavelId: string;
  tagMataMata: boolean;
  createdAt: string;
  cliente: { id: string; nome: string } | null;
  responsavel: { id: string; nome: string; cor: string | null } | null;
  _count: { prazos: number; documentos: number; andamentos: number };
}

interface ClienteOption {
  id: string;
  nome: string;
}

interface UserOption {
  id: string;
  nome: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const areaLabels: Record<string, string> = {
  bancario: "Bancário",
  agrario: "Agrário",
  tributario: "Tributário",
  trabalhista: "Trabalhista",
  civil: "Civil",
  empresarial: "Empresarial",
  penal: "Penal",
};

export default function ProcessosPage() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [riscoFilter, setRiscoFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProcesso, setEditingProcesso] = useState<Processo | null>(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [usuarios, setUsuarios] = useState<UserOption[]>([]);

  const fetchProcessos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(meta.page));
      params.set("limit", String(meta.limit));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (areaFilter) params.set("area", areaFilter);
      if (riscoFilter) params.set("risco", riscoFilter);

      const res = await fetch(`/api/v1/processes?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProcessos(data.data);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, search, statusFilter, areaFilter, riscoFilter]);

  const fetchOptions = useCallback(async () => {
    try {
      const [cRes, uRes] = await Promise.all([
        fetch("/api/v1/clients?limit=100"),
        fetch("/api/v1/users?limit=100"),
      ]);
      const cData = await cRes.json();
      const uData = await uRes.json();
      if (cRes.ok) setClientes(cData.data || []);
      if (uRes.ok) setUsuarios(uData.data || []);
    } catch {
      // fallback silencioso
    }
  }, []);

  useEffect(() => {
    fetchProcessos();
  }, [fetchProcessos]);

  useEffect(() => {
    if (showModal) fetchOptions();
  }, [showModal, fetchOptions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este processo?")) return;
    try {
      const res = await fetch(`/api/v1/processes/${id}`, { method: "DELETE" });
      if (res.ok) fetchProcessos();
      else {
        const data = await res.json();
        alert(data.error || "Erro ao remover");
      }
    } catch {
      alert("Erro de rede");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload: any = {
      cnj: formData.get("cnj") as string,
      clienteId: formData.get("clienteId") as string,
      tipo: formData.get("tipo") as string,
      area: formData.get("area") as string,
      status: formData.get("status") as string,
      risco: formData.get("risco") as string,
      responsavelId: formData.get("responsavelId") as string,
      adverso: (formData.get("adverso") as string) || null,
      adversoAdv: (formData.get("adversoAdv") as string) || null,
      tribunal: (formData.get("tribunal") as string) || null,
      vara: (formData.get("vara") as string) || null,
      comarca: (formData.get("comarca") as string) || null,
      classe: (formData.get("classe") as string) || null,
      assunto: (formData.get("assunto") as string) || null,
      valorCausa: formData.get("valorCausa") ? parseFloat(formData.get("valorCausa") as string) : null,
      valorProvavel: formData.get("valorProvavel") ? parseFloat(formData.get("valorProvavel") as string) : null,
      tese: (formData.get("tese") as string) || null,
      estrategia: (formData.get("estrategia") as string) || null,
      proximosPassos: (formData.get("proximosPassos") as string) || null,
      observacoes: (formData.get("observacoes") as string) || null,
      tagMataMata: formData.get("tagMataMata") === "on",
    };

    const dist = formData.get("distribuicao") as string;
    if (dist) payload.distribuicao = dist;

    try {
      const url = editingProcesso
        ? `/api/v1/processes/${editingProcesso.id}`
        : "/api/v1/processes";
      const method = editingProcesso ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setEditingProcesso(null);
        fetchProcessos();
      } else {
        setFormError(data.error || "Erro ao salvar processo");
      }
    } catch {
      setFormError("Erro de rede");
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (p: Processo) => {
    setEditingProcesso(p);
    setShowModal(true);
    setFormError("");
  };

  const openCreate = () => {
    setEditingProcesso(null);
    setShowModal(true);
    setFormError("");
  };

  return (
    <div className="p-6 max-w-[1480px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] mb-1">Processos</h1>
          <p className="text-xs text-muted-foreground">
            {meta.total} processos · integração DataJud ativa
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Novo processo
        </Button>
      </div>

      {/* Busca CNJ */}
      <BuscaCNJ />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por CNJ, parte contrária ou cliente..."
            className="w-full pl-9 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchProcessos()}
          />
        </div>
        <select
          className="px-3 py-2 rounded-md border bg-background text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="em_andamento">Em andamento</option>
          <option value="suspenso">Suspenso</option>
          <option value="arquivado">Arquivado</option>
          <option value="encerrado">Encerrado</option>
        </select>
        <select
          className="px-3 py-2 rounded-md border bg-background text-sm"
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
        >
          <option value="">Todas as áreas</option>
          {Object.entries(areaLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 rounded-md border bg-background text-sm"
          value={riscoFilter}
          onChange={(e) => setRiscoFilter(e.target.value)}
        >
          <option value="">Todos os riscos</option>
          <option value="alto">Alto</option>
          <option value="medio">Médio</option>
          <option value="baixo">Baixo</option>
        </select>
        <Button variant="outline" onClick={fetchProcessos}>
          <Filter className="w-4 h-4 mr-1.5" />
          Filtrar
        </Button>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          Carregando processos...
        </div>
      ) : (
        <TabelaProcessos processos={processos} onEdit={openEdit} onDelete={handleDelete} />
      )}

      {/* Paginação */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border rounded-lg bg-card">
          <div className="text-xs text-muted-foreground">
            Página {meta.page} de {meta.totalPages} · {meta.total} total
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={meta.page <= 1} onClick={() => setMeta(m => ({ ...m, page: m.page - 1 }))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={meta.page >= meta.totalPages} onClick={() => setMeta(m => ({ ...m, page: m.page + 1 }))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg border shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingProcesso ? "Editar processo" : "Novo processo"}
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">{formError}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Número CNJ *</label>
                  <input name="cnj" required defaultValue={editingProcesso?.cnj || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Cliente *</label>
                  <select name="clienteId" required defaultValue={editingProcesso?.clienteId || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Selecione...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Responsável *</label>
                  <select name="responsavelId" required defaultValue={editingProcesso?.responsavelId || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Selecione...</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tipo *</label>
                  <input name="tipo" required defaultValue={editingProcesso?.tipo || ""} placeholder="Ex: Cível, Federal, Trabalhista" className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Área *</label>
                  <select name="area" required defaultValue={editingProcesso?.area || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Selecione...</option>
                    {Object.entries(areaLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Classe Processual</label>
                  <input name="classe" defaultValue={editingProcesso?.classe || ""} placeholder="Ex: Ação Revisional" className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Assunto</label>
                  <input name="assunto" defaultValue={editingProcesso?.assunto || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Status</label>
                  <select name="status" defaultValue={editingProcesso?.status || "em_andamento"} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="em_andamento">Em andamento</option>
                    <option value="suspenso">Suspenso</option>
                    <option value="arquivado">Arquivado</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Risco</label>
                  <select name="risco" defaultValue={editingProcesso?.risco || "medio"} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="alto">Alto</option>
                    <option value="medio">Médio</option>
                    <option value="baixo">Baixo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Valor da Causa (R$)</label>
                  <input name="valorCausa" type="number" step="0.01" defaultValue={editingProcesso?.valorCausa || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Valor Provável (R$)</label>
                  <input name="valorProvavel" type="number" step="0.01" defaultValue={editingProcesso?.valorProvavel || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tribunal</label>
                  <input name="tribunal" defaultValue={editingProcesso?.tribunal || ""} placeholder="Ex: TJPR" className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Vara/Órgão</label>
                  <input name="vara" defaultValue={editingProcesso?.vara || ""} placeholder="Ex: 1ª Vara Cível" className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Comarca</label>
                  <input name="comarca" defaultValue={editingProcesso?.comarca || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Distribuição</label>
                  <input name="distribuicao" type="date" defaultValue={editingProcesso?.distribuicao ? editingProcesso.distribuicao.split("T")[0] : ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium">Parte Contrária</label>
                  <input name="adverso" defaultValue={editingProcesso?.adverso || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium">Advogado da Parte Contrária</label>
                  <input name="adversoAdv" defaultValue={editingProcesso?.adversoAdv || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium">Tese</label>
                  <textarea name="tese" rows={3} defaultValue={editingProcesso?.tese || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium">Estratégia</label>
                  <textarea name="estrategia" rows={2} defaultValue={editingProcesso?.estrategia || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium">Próximos Passos</label>
                  <textarea name="proximosPassos" rows={2} defaultValue={editingProcesso?.proximosPassos || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium">Observações</label>
                  <textarea name="observacoes" rows={3} defaultValue={editingProcesso?.observacoes || ""} className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <input name="tagMataMata" type="checkbox" id="tagMataMata" defaultChecked={editingProcesso?.tagMataMata || false} className="w-4 h-4" />
                  <label htmlFor="tagMataMata" className="text-sm">Operação Mata-Mata</label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Salvando..." : editingProcesso ? "Salvar alterações" : "Criar processo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
