"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  RefreshCw,
  Loader2,
  Clock,
  FileText,
  AlertTriangle,
  DollarSign,
  User,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SectionCard } from "@/components/processos-v2/section-card";
import { RiscoBadge, StatusProcessoBadge, SyncBadge } from "@/components/processos-v2/status-badges";
import { ProcessoMonitorPanel } from "@/components/processos-v2/processo-monitor-panel";
import { ProcessoEditModal } from "@/components/processos-v2/processo-edit-modal";
import { AndamentosTimeline } from "@/components/processos-v2/andamentos-timeline";
import { EquipeManager } from "@/components/processos-v2/equipe-manager";
import { DocumentUpload } from "@/components/processos-v2/document-upload";
import { ProcessoHistorico } from "@/components/processos-v2/processo-historico";
import { ProcessoDashboard } from "@/components/processos-v2/processo-dashboard";
import { ProcessoNotas } from "@/components/processos-v2/processo-notas";
import { formatCurrency } from "@/lib/utils/formatters";
import type { Processo } from "@/lib/types";
import { useSseAndamentosContext } from "@/components/providers/sse-andamentos-provider";

export default function ProcessoDetalheV2Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { andamentos, markAsRead } = useSseAndamentosContext();

  // Marcar andamentos como lidos quando visualiza o processo
  useEffect(() => {
    if (!id) return;
    const novos = andamentos.filter((a) => a.processoId === id);
    novos.forEach((a) => markAsRead(a.id));
  }, [id, andamentos, markAsRead]);

  useEffect(() => {
    async function fetchProcesso() {
      try {
        const res = await fetch(`/api/v1/processes/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProcesso(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProcesso();
  }, [id]);

  const handleSync = async () => {
    if (!processo) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/v1/monitoring/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnj: processo.cnj, prioridade: "alta" }),
      });
      if (res.ok) {
        const refreshed = await fetch(`/api/v1/processes/${id}`);
        if (refreshed.ok) setProcesso(await refreshed.json());
      }
    } catch {
      console.error("Erro ao sincronizar");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          Carregando processo...
        </div>
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="rounded-xl border bg-card p-10 text-center">
          <p className="text-muted-foreground">Processo não encontrado.</p>
          <Link href="/processos-v2" className="text-[#1e3a5f] hover:underline text-sm mt-2 inline-block">
            Voltar para processos
          </Link>
        </div>
      </div>
    );
  }

  const fonte = processo.fontes?.[0];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/processos-v2"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </Link>
          <h1 className="text-xl font-semibold text-foreground font-mono">{processo.cnj}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusProcessoBadge status={processo.status} />
            <RiscoBadge risco={processo.risco} />
            <SyncBadge statusSync={fonte?.statusSync} ultimaSync={fonte?.ultimaSync} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            Sincronizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
            <Pencil className="w-4 h-4 mr-1.5" />
            Editar
          </Button>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SectionCard className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#1e3a5f]/5 text-[#1e3a5f] flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{processo.cliente?.nome || "—"}</div>
            <div className="text-[11px] text-muted-foreground">Cliente</div>
          </div>
        </SectionCard>
        <SectionCard className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{processo.adverso || "—"}</div>
            <div className="text-[11px] text-muted-foreground">Parte contrária</div>
          </div>
        </SectionCard>
        <SectionCard className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-medium">
              {processo.valorCausa != null ? formatCurrency(processo.valorCausa) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground">Valor da causa</div>
          </div>
        </SectionCard>
        <SectionCard className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-slate-50 text-slate-600 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{processo.responsavel?.nome || "—"}</div>
            <div className="text-[11px] text-muted-foreground">Responsável</div>
          </div>
        </SectionCard>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="andamentos">Andamentos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="analise-ia">Análise IA</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Visão geral */}
              <SectionCard title="Visão geral">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">Tribunal</dt>
                    <dd className="text-foreground mt-0.5">{processo.tribunal || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">Vara/Órgão</dt>
                    <dd className="text-foreground mt-0.5">{processo.vara || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">Comarca</dt>
                    <dd className="text-foreground mt-0.5">{processo.comarca || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">Classe</dt>
                    <dd className="text-foreground mt-0.5">{processo.classe || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">Assunto</dt>
                    <dd className="text-foreground mt-0.5">{processo.assunto || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">Distribuição</dt>
                    <dd className="text-foreground mt-0.5">
                      {processo.distribuicao
                        ? new Date(processo.distribuicao).toLocaleDateString("pt-BR")
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </SectionCard>

              {/* Estratégia */}
              <SectionCard title="Estratégia interna">
                <div className="space-y-4">
                  {processo.tese && (
                    <div>
                      <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Tese</h4>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{processo.tese}</p>
                    </div>
                  )}
                  {processo.estrategia && (
                    <div>
                      <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Estratégia</h4>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{processo.estrategia}</p>
                    </div>
                  )}
                  {processo.proximosPassos && (
                    <div>
                      <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Próximos passos</h4>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{processo.proximosPassos}</p>
                    </div>
                  )}
                  {processo.observacoes && (
                    <div>
                      <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Observações</h4>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{processo.observacoes}</p>
                    </div>
                  )}
                  {!processo.tese && !processo.estrategia && !processo.proximosPassos && !processo.observacoes && (
                    <p className="text-sm text-muted-foreground italic">Nenhuma informação estratégica registrada.</p>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Coluna lateral */}
            <div className="space-y-6">
              {/* Fonte & Sync */}
              <SectionCard title="Fonte & Sync">
                <div className="space-y-3">
                  {processo.fontes && processo.fontes.length > 0 ? (
                    processo.fontes.map((f) => (
                      <div key={f.fonte} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{f.fonte}</span>
                        <SyncBadge statusSync={f.statusSync} ultimaSync={f.ultimaSync} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem fonte externa configurada.</p>
                  )}
                </div>
              </SectionCard>

              {/* Contagens */}
              <SectionCard title="Resumo">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Andamentos
                    </span>
                    <span className="font-medium">{processo._count?.andamentos || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      Documentos
                    </span>
                    <span className="font-medium">{processo._count?.documentos || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Prazos
                    </span>
                    <span className="font-medium">{processo._count?.prazos || 0}</span>
                  </div>
                </div>
              </SectionCard>

              {/* Monitoramento externo */}
              <ProcessoMonitorPanel
                processoId={processo.id}
                cnj={processo.cnj}
                tribunal={processo.tribunal}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="andamentos">
          <AndamentosTimeline processoId={processo.id} />
        </TabsContent>

        <TabsContent value="documentos">
          <DocumentUpload processoId={processo.id} />
        </TabsContent>

        <TabsContent value="equipe">
          <EquipeManager processoId={processo.id} />
        </TabsContent>

        <TabsContent value="dashboard">
          <ProcessoDashboard processoId={processo.id} />
        </TabsContent>

        <TabsContent value="historico">
          <ProcessoHistorico processoId={processo.id} />
        </TabsContent>

        <TabsContent value="notas">
          <ProcessoNotas processoId={processo.id} currentUserId={processo.responsavel?.id || ""} />
        </TabsContent>
      </Tabs>

      {/* Modal de Edição */}
      {showEditModal && (
        <ProcessoEditModal
          processo={processo}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            // Recarregar dados do processo
            fetch(`/api/v1/processes/${id}`)
              .then((res) => res.json())
              .then((data) => setProcesso(data));
          }}
        />
      )}
    </div>
  );
}
