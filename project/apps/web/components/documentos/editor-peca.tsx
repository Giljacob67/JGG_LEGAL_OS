"use client";

import { useState } from "react";
import { Save, FileText, Tag } from "lucide-react";

export function EditorPeca() {
  const [titulo, setTitulo] = useState("Razoes Finais — Embargos a Execucao");
  const [blocos, setBlocos] = useState([
    { tipo: "heading", content: "I — Dos Fatos" },
    { tipo: "paragraph", content: "A controversia destes embargos cinge-se a nulidade da CCB nº 40/00892-X, no valor historico de R$ 4.287.900,00, emitida em 12/10/2023, por forca da Operacao Mata-Mata." },
    { tipo: "callout", content: "Operacao Mata-Mata — patologia contratual em que a instituicao financeira concede novo credito nao para fomentar a producao rural, mas para liquidar debitos pretéritos." },
    { tipo: "heading", content: "II — Da Simulacao e Desvio de Finalidade" },
    { tipo: "paragraph", content: "O credito rural e, por sua natureza, causal: vincula-se a finalidade produtiva especifica (custeio, investimento, comercializacao)." },
    { tipo: "quote", content: "E nula a clausula contratual que sujeita o devedor a taxa de juros divulgada pela ANBID/CETIP. — Súmula 176, STJ" },
  ]);

  function updateBlock(index: number, content: string) {
    const next = [...blocos];
    next[index] = { ...next[index], content };
    setBlocos(next);
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
        <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Salvar">
          <Save size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex flex-wrap gap-2 mb-2">
          {["Mata-Mata", "Art. 166 CC", "Súm. 286 STJ", "Súm. 298 STJ", "Súm. 176 STJ", "CDI"].map((t) => (
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
                <b>💡 Operacao Mata-Mata:</b> {b.content}
              </div>
            );
          }
          if (b.tipo === "quote") {
            return (
              <div key={i} className="pl-4 border-l-2 border-foreground italic text-sm text-muted-foreground font-serif">
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

        <div className="pt-4 text-xs text-muted-foreground flex items-center gap-2">
          <span className="text-muted-foreground/50">+</span>
          <span>Pressione <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono border">/</kbd> para inserir bloco · <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono border">@</kbd> para citar processo</span>
        </div>
      </div>
    </div>
  );
}