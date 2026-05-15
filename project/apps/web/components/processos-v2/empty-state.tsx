"use client";

import { FileSearch, Plus, Upload } from "lucide-react";
import Link from "next/link";

export function EmptyStateProcessos() {
  return (
    <div className="rounded-xl border bg-card p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <FileSearch className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        Nenhum processo encontrado
      </h3>
      <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
        Sua carteira processual está vazia. Importe processos do DataJud ou cadastre manualmente.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/processos-v2/importacoes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-background text-sm font-medium hover:bg-muted transition-colors"
        >
          <Upload className="w-4 h-4" />
          Importar processos
        </Link>
        <button
          onClick={() => {
            // Dispara evento para abrir drawer de cadastro
            window.dispatchEvent(new CustomEvent("processo-v2:novo"));
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1e3a5f] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Cadastrar manualmente
        </button>
      </div>
    </div>
  );
}
