"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Shield,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./section-card";

interface Credential {
  id: string;
  tribunal: string;
  sistema: string;
  descricao?: string | null;
  tipoAuth: string;
  ativo: boolean;
  ultimoTeste: string | null;
  statusTeste: string;
}

const TRIBUNAIS = [
  { value: "tjpr", label: "TJPR" },
  { value: "trf4", label: "TRF4" },
  { value: "tjmt", label: "TJMT" },
  { value: "trf1", label: "TRF1" },
  { value: "tjsp", label: "TJSP" },
  { value: "tjrs", label: "TJRS" },
];

const SISTEMAS: Record<string, string> = {
  tjpr: "projudi",
  trf4: "eproc",
  tjmt: "pje",
  trf1: "pje",
  tjsp: "esaj",
  tjrs: "esaj",
};

const AUTH_TYPES = [
  { value: "none", label: "Nenhuma (consulta pública)" },
  { value: "api_key", label: "API Key" },
  { value: "bearer_token", label: "Bearer Token" },
  { value: "basic_auth", label: "Usuário e Senha" },
  { value: "cert_a1", label: "Certificado A1" },
];

function statusBadge(status: string) {
  switch (status) {
    case "ok":
      return <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full"><CheckCircle2 size={10} /> OK</span>;
    case "falha":
      return <span className="inline-flex items-center gap-1 text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded-full"><XCircle size={10} /> Falha</span>;
    case "expirado":
      return <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full"><AlertCircle size={10} /> Expirado</span>;
    default:
      return <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-full"><AlertCircle size={10} /> Nunca testado</span>;
  }
}

export function CourtCredentialsPanel() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tribunal: "",
    tipoAuth: "none",
    descricao: "",
    apiKey: "",
    apiKeyHeader: "X-API-Key",
    bearerToken: "",
    username: "",
    password: "",
    certPem: "",
    keyPem: "",
  });

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/internal/process-monitor/credentials");
      const data = await res.json();
      if (data.ok) setCredentials(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleSave = async () => {
    if (!form.tribunal) return;
    setSaving(true);

    const sistema = SISTEMAS[form.tribunal] || "custom";
    let payload: Record<string, string> = {};

    switch (form.tipoAuth) {
      case "api_key":
        payload = { key: form.apiKey, headerName: form.apiKeyHeader };
        break;
      case "bearer_token":
        payload = { token: form.bearerToken };
        break;
      case "basic_auth":
        payload = { username: form.username, password: form.password };
        break;
      case "cert_a1":
        payload = { certPem: form.certPem, keyPem: form.keyPem };
        break;
    }

    try {
      const res = await fetch("/api/internal/process-monitor/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tribunal: form.tribunal,
          sistema,
          descricao: form.descricao || undefined,
          tipoAuth: form.tipoAuth,
          payload,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowForm(false);
        setForm({
          tribunal: "", tipoAuth: "none", descricao: "",
          apiKey: "", apiKeyHeader: "X-API-Key", bearerToken: "",
          username: "", password: "", certPem: "", keyPem: "",
        });
        fetchCredentials();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta credencial?")) return;
    try {
      const res = await fetch(`/api/internal/process-monitor/credentials/${id}`, { method: "DELETE" });
      if (res.ok) fetchCredentials();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#1e3a5f]" />
          Credenciais de Acesso
        </h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          {showForm ? "Cancelar" : "Adicionar"}
        </Button>
      </div>

      {showForm && (
        <SectionCard title="Nova credencial">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Tribunal</label>
                <select
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  value={form.tribunal}
                  onChange={(e) => setForm((f) => ({ ...f, tribunal: e.target.value }))}
                >
                  <option value="">Selecione...</option>
                  {TRIBUNAIS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Tipo de auth</label>
                <select
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  value={form.tipoAuth}
                  onChange={(e) => setForm((f) => ({ ...f, tipoAuth: e.target.value }))}
                >
                  {AUTH_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Descrição</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  placeholder="Ex: Certificado do escritório"
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                />
              </div>
            </div>

            {form.tipoAuth === "api_key" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  placeholder="Header (ex: X-API-Key)"
                  value={form.apiKeyHeader}
                  onChange={(e) => setForm((f) => ({ ...f, apiKeyHeader: e.target.value }))}
                />
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  placeholder="API Key"
                  value={form.apiKey}
                  onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                />
              </div>
            )}

            {form.tipoAuth === "bearer_token" && (
              <input
                type="password"
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                placeholder="Bearer token"
                value={form.bearerToken}
                onChange={(e) => setForm((f) => ({ ...f, bearerToken: e.target.value }))}
              />
            )}

            {form.tipoAuth === "basic_auth" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  placeholder="Usuário"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  placeholder="Senha"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
            )}

            {form.tipoAuth === "cert_a1" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <textarea
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm font-mono text-xs"
                  rows={4}
                  placeholder="-----BEGIN CERTIFICATE-----"
                  value={form.certPem}
                  onChange={(e) => setForm((f) => ({ ...f, certPem: e.target.value }))}
                />
                <textarea
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm font-mono text-xs"
                  rows={4}
                  placeholder="-----BEGIN PRIVATE KEY-----"
                  value={form.keyPem}
                  onChange={(e) => setForm((f) => ({ ...f, keyPem: e.target.value }))}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.tribunal}>
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                Salvar
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {loading ? (
        <div className="text-center text-muted-foreground py-6 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
          Carregando credenciais...
        </div>
      ) : credentials.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          <Key className="w-5 h-5 mx-auto mb-2 text-muted-foreground/50" />
          Nenhuma credencial configurada.
          <p className="text-[11px] mt-1">Conectores em modo público funcionam sem autenticação.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tribunal</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sistema</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((c) => (
                <tr key={c.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold uppercase">{c.tribunal}</span>
                    {c.descricao && <span className="text-[10px] text-muted-foreground block">{c.descricao}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">{c.sistema}</td>
                  <td className="px-4 py-3 text-xs capitalize">{c.tipoAuth.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">{statusBadge(c.statusTeste)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
