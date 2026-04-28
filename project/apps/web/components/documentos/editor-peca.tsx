"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, FileText, Plus, ChevronDown, Loader2 } from "lucide-react";

interface Bloco {
  tipo: "heading" | "paragraph" | "callout" | "quote";
  content: string;
}

interface DocumentoPeca {
  id: string;
  nome: string;
  url?: string | null;
  tipo: string;
  status: string;
  segredo: boolean;
  tags: string[];
}

export function EditorPeca() {
  const [pecas, setPecas] = useState<DocumentoPeca[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("Nova peca");
  const [blocos, setBlocos] = useState<Bloco[]>([
    { tipo: "heading", content: "I — Dos Fatos" },
    { tipo: "paragraph", content: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchPecas = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/documents?tipo=peticao&limit=100");
      const data = await res.json();
      if (res.ok) setPecas(data.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPecas(); }, [fetchPecas]);

  function updateBlock(index: number, content: string) {
    const next = [...blocos];
    next[index] = { ...next[index], content };
    setBlocos(next);
  }

  function addBlock(tipo: Bloco["tipo"]) {
    setBlocos([...blocos, { tipo, content: "" }]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        nome: titulo,
        tipo: "peticao",
        status: "rascunho",
        url: JSON.stringify({ blocos }),
        segredo: false,
        tags: [],
      };
      const url = selectedId ? `/api/v1/documents/${selectedId}` : "/api/v1/documents";
      const method = selectedId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      if (!selectedId) setSelectedId(data.id);
      await fetchPecas();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleNew() {
    setSelectedId(null);
    setTitulo("Nova peca");
    setBlocos([{ tipo: "heading", content: "I — Dos Fatos" }, { tipo: "paragraph", content: "" }]);
  }

  async function handleLoad(doc: DocumentoPeca) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/documents/${doc.id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedId(data.id);
        setTitulo(data.nome);
        if (data.url && data.url.startsWith("{")) {
          try {
            const parsed = JSON.parse(data.url);
            setBlocos(parsed.blocos || [{ tipo: "paragraph", content: "" }]);
          } catch {
            setBlocos([{ tipo: "paragraph", content: data.url }]);
          }
        } else {
          setBlocos([{ tipo: "paragraph", content: "" }]);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
    setDropdownOpen(false);
  }

  return (
    <div className="rounded-xl border bg-card flex flex-col h-[calc(100vh-8rem)]">
      <div className="px-4 py-3 border-b flex items-center gap-3">
        <FileText size={16} className="text-muted-foreground" />
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="flex-1 text-sm font-medium bg-transparent outline-none"
        />
        <div className="flex items-center gap-1">
          <button onClick={handleNew} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Nova peca">
            <Plus size={16} />
          </button>
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Carregar peca">
              <ChevronDown size={16} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border bg-card shadow-lg z-50 max-h-64 overflow-y-auto">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">Pecas salvas</div>
                {pecas.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Nenhuma peca salva</div>
                ) : (
                  pecas.map((p) => (
                    <button key={p.id} onClick={() => handleLoad(p)} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors truncate">
                      {p.nome}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground disabled:opacity-50" title="Salvar">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex flex-wrap gap-2 mb-2">
            {["Mata-Mata", "Art. 166 CC", "Sum. 286 STJ", "Sum. 298 STJ", "Sum. 176 STJ", "CDI"].map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--jgg-gold-soft)] text-[var(--jgg-gold-700)] font-medium cursor-pointer">{t}</span>
            ))}
          </div>

          {blocos.map((b, i) => {
            if (b.tipo === "heading") {
              return (
                <h2 key={i} className="text-lg font-serif font-semibold text-foreground mt-4" contentEditable suppressContentEditableWarning onBlur={(e) => updateBlock(i, e.currentTarget.innerText)}>
                  {b.content}
                </h2>
              );
            }
            if (b.tipo === "callout") {
              return (
                <div key={i} className="p-3 rounded-lg bg-[var(--jgg-gold-soft)] border-l-3 border-[var(--jgg-gold-500)] text-sm text-foreground leading-relaxed">
                  <b>💡 Observacao:</b> <span contentEditable suppressContentEditableWarning onBlur={(e) => updateBlock(i, e.currentTarget.innerText)}>{b.content}</span>
                </div>
              );
            }
            if (b.tipo === "quote") {
              return (
                <div key={i} className="pl-4 border-l-2 border-foreground italic text-sm text-muted-foreground font-serif" contentEditable suppressContentEditableWarning onBlur={(e) => updateBlock(i, e.currentTarget.innerText)}>
                  {b.content}
                </div>
              );
            }
            return (
              <p key={i} className="text-sm text-foreground leading-relaxed" contentEditable suppressContentEditableWarning onBlur={(e) => updateBlock(i, e.currentTarget.innerText)}>
                {b.content}
              </p>
            );
          })}

          <div className="pt-4 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <button onClick={() => addBlock("heading")} className="px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors">+ Titulo</button>
            <button onClick={() => addBlock("paragraph")} className="px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors">+ Paragrafo</button>
            <button onClick={() => addBlock("callout")} className="px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors">+ Destaque</button>
            <button onClick={() => addBlock("quote")} className="px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors">+ Citacao</button>
          </div>
        </div>
      )}
    </div>
  );
}
