"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  tipo: string;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  whatsapp: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  area: string | null;
  status: string;
  origem: string | null;
  observacoes: string | null;
  createdAt: string;
  _count: {
    processos: number;
    faturas: number;
  };
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

const statusLabels: Record<string, { label: string; color: string }> = {
  lead: { label: "Lead", color: "bg-slate-100 text-slate-700" },
  prospect: { label: "Prospect", color: "bg-blue-100 text-blue-700" },
  ativo: { label: "Ativo", color: "bg-emerald-100 text-emerald-700" },
  inativo: { label: "Inativo", color: "bg-amber-100 text-amber-700" },
  "ex-cliente": { label: "Ex-cliente", color: "bg-rose-100 text-rose-700" },
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(meta.page));
      params.set("limit", String(meta.limit));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (areaFilter) params.set("area", areaFilter);

      const res = await fetch(`/api/v1/clients?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setClients(data.data);
        setMeta(data.meta);
      } else {
        console.error("Erro ao buscar clientes:", data.error);
      }
    } catch (err) {
      console.error("Erro de rede:", err);
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, search, statusFilter, areaFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este cliente?")) return;
    try {
      const res = await fetch(`/api/v1/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchClients();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao remover cliente");
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
    const payload = {
      nome: formData.get("nome") as string,
      cpfCnpj: formData.get("cpfCnpj") as string,
      tipo: formData.get("tipo") as string,
      email: (formData.get("email") as string) || null,
      telefone: (formData.get("telefone") as string) || null,
      celular: (formData.get("celular") as string) || null,
      endereco: (formData.get("endereco") as string) || null,
      cidade: (formData.get("cidade") as string) || null,
      estado: (formData.get("estado") as string) || null,
      cep: (formData.get("cep") as string) || null,
      origem: (formData.get("origem") as string) || null,
      area: (formData.get("area") as string) || null,
      status: formData.get("status") as string,
      observacoes: (formData.get("observacoes") as string) || null,
    };

    try {
      const url = editingClient
        ? `/api/v1/clients/${editingClient.id}`
        : "/api/v1/clients";
      const method = editingClient ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setEditingClient(null);
        fetchClients();
      } else {
        setFormError(data.error || "Erro ao salvar cliente");
      }
    } catch {
      setFormError("Erro de rede");
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (client: Cliente) => {
    setEditingClient(client);
    setShowModal(true);
    setFormError("");
  };

  const openCreate = () => {
    setEditingClient(null);
    setShowModal(true);
    setFormError("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {meta.total} clientes cadastrados · CRM jurídico
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Novo cliente
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
            className="w-full pl-9 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchClients()}
          />
        </div>
        <select
          className="px-3 py-2 rounded-md border bg-background text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="lead">Lead</option>
          <option value="prospect">Prospect</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="ex-cliente">Ex-cliente</option>
        </select>
        <select
          className="px-3 py-2 rounded-md border bg-background text-sm"
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
        >
          <option value="">Todas as áreas</option>
          {Object.entries(areaLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <Button variant="outline" onClick={fetchClients}>
          <Filter className="w-4 h-4 mr-1.5" />
          Filtrar
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contato</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Localização</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Área</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Processos</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Carregando clientes...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                          {client.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{client.nome}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {client.tipo === "PJ" ? (
                              <Building2 className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            {client.cpfCnpj}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {client.email && (
                          <div className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </div>
                        )}
                        {client.telefone && (
                          <div className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {client.telefone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {client.cidade && (
                        <div className="text-xs flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {client.cidade}{client.estado ? `, ${client.estado}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {client.area && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                          <Briefcase className="w-3 h-3" />
                          {areaLabels[client.area] || client.area}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {statusLabels[client.status] && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusLabels[client.status].color}`}>
                          {statusLabels[client.status].label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-muted-foreground">
                        {client._count.processos} processo{client._count.processos !== 1 ? "s" : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(client.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-xs text-muted-foreground">
              Página {meta.page} de {meta.totalPages} · {meta.total} total
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={meta.page <= 1}
                onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg border shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingClient ? "Editar cliente" : "Novo cliente"}
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nome / Razão Social *</label>
                  <input
                    name="nome"
                    required
                    defaultValue={editingClient?.nome || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">CPF/CNPJ *</label>
                  <input
                    name="cpfCnpj"
                    required
                    defaultValue={editingClient?.cpfCnpj || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tipo *</label>
                  <select
                    name="tipo"
                    required
                    defaultValue={editingClient?.tipo || "PF"}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="PF">Pessoa Física</option>
                    <option value="PJ">Pessoa Jurídica</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    name="status"
                    defaultValue={editingClient?.status || "ativo"}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospect</option>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="ex-cliente">Ex-cliente</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">E-mail</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingClient?.email || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Telefone</label>
                  <input
                    name="telefone"
                    defaultValue={editingClient?.telefone || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Celular</label>
                  <input
                    name="celular"
                    defaultValue={editingClient?.celular || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">WhatsApp</label>
                  <input
                    name="whatsapp"
                    defaultValue={editingClient?.whatsapp || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium">Endereço</label>
                  <input
                    name="endereco"
                    defaultValue={editingClient?.endereco || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Cidade</label>
                  <input
                    name="cidade"
                    defaultValue={editingClient?.cidade || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Estado</label>
                  <input
                    name="estado"
                    maxLength={2}
                    defaultValue={editingClient?.estado || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">CEP</label>
                  <input
                    name="cep"
                    defaultValue={editingClient?.cep || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Área Jurídica</label>
                  <select
                    name="area"
                    defaultValue={editingClient?.area || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">—</option>
                    {Object.entries(areaLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Origem</label>
                  <input
                    name="origem"
                    placeholder="Indicação, site, parceiro..."
                    defaultValue={editingClient?.origem || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium">Observações</label>
                  <textarea
                    name="observacoes"
                    rows={3}
                    defaultValue={editingClient?.observacoes || ""}
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Salvando..." : editingClient ? "Salvar alterações" : "Criar cliente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
