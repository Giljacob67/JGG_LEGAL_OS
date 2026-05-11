"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle, XCircle, AlertCircle, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ImportacoesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/process-import/candidates").then(r => r.json()),
      fetch("/api/v1/process-import/jobs").then(r => r.json())
    ]).then(([cData, jData]) => {
      setCandidates(Array.isArray(cData) ? cData : []);
      setJobs(Array.isArray(jData) ? jData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalJobs = jobs.length;
  const novos = candidates.filter(c => c.status === "novo").length;
  const duplicados = candidates.filter(c => c.status === "duplicado").length;
  const conflitos = candidates.filter(c => ["erro", "conflito"].includes(c.status)).length;

  return (
    <div className="p-6 max-w-[1480px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-[22px] mb-1">Importações e Conectores</h1>
            <p className="text-xs text-muted-foreground">
              Gerencie a fila de importação de processos (DataJud e outros)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground mb-1">Total de Jobs</div>
          <div className="text-2xl font-semibold">{loading ? "..." : totalJobs}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground mb-1">Candidatos Novos</div>
          <div className="text-2xl font-semibold text-emerald-600">{loading ? "..." : novos}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground mb-1">Duplicados</div>
          <div className="text-2xl font-semibold text-amber-600">{loading ? "..." : duplicados}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm text-muted-foreground mb-1">Erros/Conflitos</div>
          <div className="text-2xl font-semibold text-destructive">{loading ? "..." : conflitos}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/50 font-medium text-sm flex items-center justify-between">
            Últimos Candidatos
            <span className="text-xs font-normal text-muted-foreground">{candidates.length} encontrados</span>
          </div>
          <div className="p-0 overflow-x-auto">
            {candidates.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Nenhum candidato recente.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground uppercase">CNJ</th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground uppercase">Fonte</th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground uppercase">Status</th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{c.cnj}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="px-2 py-0.5 rounded bg-[var(--jgg-gold-soft)] text-[var(--jgg-gold-700)]">
                          {c.fonte} {c.tribunal && `- ${c.tribunal}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.status === "novo" && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold">Novo</span>}
                        {c.status === "duplicado" && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold">Duplicado</span>}
                        {c.status === "aprovado" && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">Aprovado</span>}
                        {c.status === "erro" && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold">Erro</span>}
                        {c.status === "rejeitado" && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">Rejeitado</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link href="/processos" className="text-xs text-primary hover:underline">Revisar</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/50 font-medium text-sm flex items-center justify-between">
            Últimos Jobs
            <span className="text-xs font-normal text-muted-foreground">{jobs.length} encontrados</span>
          </div>
          <div className="p-0 overflow-x-auto">
            {jobs.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Nenhum job recente.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground uppercase">Tipo</th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground uppercase">Fonte</th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground uppercase">Total</th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs font-medium">{j.tipo}</td>
                      <td className="px-4 py-3 text-xs">{j.fonte || "—"}</td>
                      <td className="px-4 py-3 text-xs">{j.processados} / {j.total}</td>
                      <td className="px-4 py-3">
                        {j.status === "pendente" && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12}/> Pendente</span>}
                        {j.status === "em_progresso" && <span className="text-xs text-blue-600 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Executando</span>}
                        {j.status === "concluido" && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle size={12}/> Concluído</span>}
                        {j.status === "falha" && <span className="text-xs text-destructive flex items-center gap-1"><XCircle size={12}/> Falha</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
