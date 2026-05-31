"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  Calendar,
  User,
  ChevronDown,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./section-card";

interface Prazo {
  id: string;
  tipo: "fatal" | "dilacao" | "audiencia" | "reuniao" | "tarefa";
  titulo: string;
  descricao?: string | null;
  vence: string;
  prazoInterno?: string | null;
  status: "aberto" | "cumprido" | "perdido";
  responsavel: { id: string; nome: string; cor?: string | null };
  alertas: number[];
  origem: string;
  createdAt: string;
}

interface Usuario {
  id: string;
  nome: string;
}

const TIPO_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  fatal:     { label: "Fatal",     color: "bg-red-50 text-red-700 border-red-200",       icon: AlertTriangle },
  dilacao:   { label: "Dilação",   color: "bg-orange-50 text-orange-700 border-orange-200", icon: Clock },
  audiencia: { label: "Audiência", color: "bg-blue-50 text-blue-700 border-blue-200",    icon: Calendar },
  reuniao:   { label: "Reunião",   color: "bg-purple-50 text-purple-700 border-purple-200", icon: Calendar },
  tarefa:    { label: "Tarefa",    color: "bg-slate-50 text-slate-700 border-slate-200",  icon: CheckCircle2 },
};

const STATUS_CONFIG = {
  aberto:   { label: "Aberto",   color: "text-foreground" },
  cumprido: { label: "Cumprido", color: "text-emerald-600" },
  perdido:  { label: "Perdido",  color: "text-red-600" },
};

function diasRestantes(vence: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(vence);
  v.setHours(0, 0, 0, 0);
  return Math.ceil((v.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function PrazoCountdown({ vence, status }: { vence: string; status: string }) {
  if (status !== "aberto") return null;
  const dias = diasRestantes(vence);
  if (dias < 0) return <span className="text-xs font-semibold text-red-600">{Math.abs(dias)}d em atraso</span>;
  if (dias === 0) return <span className="text-xs font-semibold text-red-600">Vence hoje!</span>;
  if (dias <= 3) return <span className="text-xs font-semibold text-red-500">{dias}d restantes</span>;
  if (dias <= 7) return <span className="text-xs font-semibold text-orange-500">{dias}d restantes</span>;
  return <span className="text-xs text-muted-foreground">{dias}d restantes</span>;
}

interface PrazosTabProps {
  processoId: string;
}

export function PrazosTab({ processoId }: PrazosTabProps) {
  const [prazos, setPrazos] = useState<Prazo[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<"aberto" | "cumprido" | "perdido" | "todos">("aberto");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const hoje = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    tipo: "fatal" as const,
    titulo: "",
    descricao: "",
    vence: "",
    prazoInterno: "",
    responsavelId: "",
    alertas: [15, 7, 3, 1],
  });

  const fetchPrazos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ processoId });
      if (filtroStatus !== "todos") params.set("status", filtroStatus);
      const res = await fetch(`/api/v1/deadlines?${params}`);
      if (res.ok) {
        const json = await res.json();
        setPrazos(json.data || json);
      }
    } catch (err) {
      console.error("Erro ao carregar prazos:", err);
    } finally {
      setLoading(false);
    }
  }, [processoId, filtroStatus]);

  useEffect(() => {
    fetchPrazos();
  }, [fetchPrazos]);

  useEffect(() => {
    fetch("/api/v1/users?limit=100")
      .then((r) => r.json())
      .then((d) => setUsuarios(d.data || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.vence || !form.responsavelId) {
      setFormError("Título, data de vencimento e responsável são obrigatórios.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/v1/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processoId,
          tipo: form.tipo,
          titulo: form.titulo,
          descricao: form.descricao || null,
          vence: form.vence,
          prazoInterno: form.prazoInterno || null,
          responsavelId: form.responsavelId,
          alertas: form.alertas,
          origem: "manual",
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ tipo: "fatal", titulo: "", descricao: "", vence: "", prazoInterno: "", responsavelId: "", alertas: [15, 7, 3, 1] });
        fetchPrazos();
      } else {
        const err = await res.json();
        setFormError(err.error || "Erro ao criar prazo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCumprido = async (id: string) => {
    setUpdatingId(id);
    try {
      await fetch(`/api/v1/deadlines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cumprido" }),
      });
      fetchPrazos();
    } finally {
      setUpdatingId(null);
    }
  };

  const prazosExibidos =
    filtroStatus === "todos" ? prazos : prazos.filter((p) => p.status === filtroStatus);

  const contagemAbertos = prazos.filter((p) => p.status === "aberto").length;
  const contagemFataisUrgentes = prazos.filter(
    (p) => p.tipo === "fatal" && p.status === "aberto" && diasRestantes(p.vence) <= 7
  ).length;

  if (loading) {
    return (
      <SectionCard title="Prazos">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando prazos...</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerta prazos urgentes */}
      {contagemFataisUrgentes > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {contagemFataisUrgentes} prazo{contagemFataisUrgentes > 1 ? "s" : ""} fatal{contagemFataisUrgentes > 1 ? "is" : ""} venc{contagemFataisUrgentes > 1 ? "em" : "e"} em até 7 dias
          </p>
        </div>
      )}

      <SectionCard title={`Prazos (${contagemAbertos} abertos)`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {(["aberto", "cumprido", "perdido", "todos"] as const).map((s) => (
              <Button
                key={s}
                variant={filtroStatus === s ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroStatus(s)}
                className="h-7 text-xs capitalize"
              >
                {s === "todos" ? "Todos" : STATUS_CONFIG[s]?.label || s}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)} className="h-7 text-xs shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Novo prazo
          </Button>
        </div>

        {/* Formulário */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-lg border bg-muted/30 space-y-3">
            <p className="text-sm font-medium">Novo prazo</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Tipo *</label>
                <select
                  className="w-full mt-0.5 px-3 py-2 rounded-md border bg-background text-sm"
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as typeof form.tipo }))}
                >
                  {Object.entries(TIPO_CONFIG).map(([v, { label }]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Responsável *</label>
                <select
                  className="w-full mt-0.5 px-3 py-2 rounded-md border bg-background text-sm"
                  value={form.responsavelId}
                  onChange={(e) => setForm((p) => ({ ...p, responsavelId: e.target.value }))}
                  required
                >
                  <option value="">Selecionar...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Título *</label>
              <input
                type="text"
                placeholder="Ex: Apresentar contestação, Audiência de conciliação..."
                className="w-full mt-0.5 px-3 py-2 rounded-md border bg-background text-sm"
                value={form.titulo}
                onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Vencimento * <span className="normal-case text-muted-foreground/60">(prazo oficial)</span></label>
                <input
                  type="date"
                  min={hoje}
                  className="w-full mt-0.5 px-3 py-2 rounded-md border bg-background text-sm"
                  value={form.vence}
                  onChange={(e) => setForm((p) => ({ ...p, vence: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Prazo interno <span className="normal-case text-muted-foreground/60">(antecipação)</span></label>
                <input
                  type="date"
                  min={hoje}
                  className="w-full mt-0.5 px-3 py-2 rounded-md border bg-background text-sm"
                  value={form.prazoInterno}
                  onChange={(e) => setForm((p) => ({ ...p, prazoInterno: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Observações</label>
              <textarea
                rows={2}
                className="w-full mt-0.5 px-3 py-2 rounded-md border bg-background text-sm resize-none"
                value={form.descricao}
                onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
              />
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                Criar prazo
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        )}

        {/* Lista */}
        {prazosExibidos.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {filtroStatus === "aberto" ? "Nenhum prazo aberto. Adicione prazos para este processo." : "Nenhum prazo encontrado."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {prazosExibidos
              .sort((a, b) => new Date(a.vence).getTime() - new Date(b.vence).getTime())
              .map((prazo) => {
                const cfg = TIPO_CONFIG[prazo.tipo] || TIPO_CONFIG.tarefa;
                const dias = diasRestantes(prazo.vence);
                const urgente = prazo.tipo === "fatal" && prazo.status === "aberto" && dias <= 7;
                return (
                  <div
                    key={prazo.id}
                    className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${urgente ? "border-red-200 bg-red-50/50" : "bg-card"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.color}`}>
                          {prazo.tipo === "fatal" && <AlertTriangle className="w-3 h-3" />}
                          {cfg.label}
                        </span>
                        <PrazoCountdown vence={prazo.vence} status={prazo.status} />
                        {prazo.status !== "aberto" && (
                          <span className={`text-xs font-medium ${STATUS_CONFIG[prazo.status].color}`}>
                            {STATUS_CONFIG[prazo.status].label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{prazo.titulo}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(prazo.vence).toLocaleDateString("pt-BR")}
                        </span>
                        {prazo.prazoInterno && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Interno: {new Date(prazo.prazoInterno).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {prazo.responsavel?.nome}
                        </span>
                      </div>
                      {prazo.descricao && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{prazo.descricao}</p>
                      )}
                    </div>
                    {prazo.status === "aberto" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs shrink-0"
                        disabled={updatingId === prazo.id}
                        onClick={() => handleCumprido(prazo.id)}
                      >
                        {updatingId === prazo.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        )}
                        Cumprido
                      </Button>
                    )}
                    {prazo.status === "cumprido" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    {prazo.status === "perdido" && (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
