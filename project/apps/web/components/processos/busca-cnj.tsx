"use client";

import { useState } from "react";
import { Search, Loader2, Database } from "lucide-react";

export function BuscaCNJ() {
  const [cnj, setCnj] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState("");

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!cnj.trim()) return;
    setLoading(true);
    setErro("");
    setResultado(null);

    try {
      const res = await fetch(`/api/datajud?cnj=${encodeURIComponent(cnj)}`);
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro na busca");
      } else {
        setResultado(data);
      }
    } catch {
      setErro("Falha de conexao");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <form onSubmit={handleBuscar} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={cnj}
            onChange={(e) => setCnj(e.target.value)}
            placeholder="Digite o numero CNJ para buscar no DataJud..."
            className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
          Buscar DataJud
        </button>
      </form>

      {erro && (
        <div className="mt-3 text-sm text-destructive">{erro}</div>
      )}

      {resultado && (
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono font-medium text-foreground">{resultado.numeroProcesso}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--jgg-gold-soft)] text-[var(--jgg-gold-700)]">DataJud</span>
          </div>
          <div className="text-muted-foreground">
            <p><b>Classe:</b> {resultado.classe?.nome || "-"}</p>
            <p><b>Orgao Julgador:</b> {resultado.orgaoJulgador?.nome || "-"}</p>
            <p><b>Situacao:</b> {resultado.situacao || "-"}</p>
            <p><b>Assuntos:</b> {resultado.assuntos?.map((a: any) => a.nome).join(", ") || "-"}</p>
          </div>
          <button className="mt-3 text-xs px-3 py-1.5 rounded-md bg-accent text-accent-foreground hover:opacity-90">
            Importar para o escritorio
          </button>
        </div>
      )}
    </div>
  );
}