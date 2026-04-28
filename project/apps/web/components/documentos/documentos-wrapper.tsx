"use client";

import { useState } from "react";
import { Pencil, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import { DocumentoModal } from "./documento-modal";

interface Documento {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  processoId?: string | null;
  clienteId?: string | null;
  url?: string | null;
  segredo: boolean;
  tags: string[];
  createdAt: string;
  processo?: { cliente?: { nome: string } | null } | null;
  autor?: { nome: string } | null;
}

interface Processo {
  id: string;
  cnj: string;
  cliente?: { nome: string } | null;
}

export function DocumentosWrapper({
  initialDocumentos, processos,
}: {
  initialDocumentos: Documento[];
  processos: Processo[];
}) {
  const [docs, setDocs] = useState<Documento[]>(initialDocumentos);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null);
  const [search, setSearch] = useState("");

  const openCreate = () => { setEditingDoc(null); setModalOpen(true); };
  const openEdit = (doc: Documento) => { setEditingDoc(doc); setModalOpen(true); };

  async function refresh() {
    try {
      const res = await fetch("/api/v1/documents");
      const data = await res.json();
      if (res.ok) setDocs(data.items || []);
    } catch { /* ignore */ }
  }

  async function handleDelete(doc: Documento) {
    if (!confirm(`Tem certeza que deseja excluir "${doc.nome}"?`)) return;
    await fetch(`/api/v1/documents/${doc.id}`, { method: "DELETE" });
    refresh();
  }

  const filtered = docs.filter((d) =>
    d.nome.toLowerCase().includes(search.toLowerCase()) ||
    d.tipo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] mb-1">Documentos</h1>
          <p className="text-xs text-muted-foreground">Biblioteca · Editor de pecas · Busca semantica</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors">
            + Novo documento
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-3">
          <h3 className="text-sm font-semibold">Biblioteca</h3>
          <input
            placeholder="Buscar documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto text-xs px-3 py-1.5 rounded-md border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum documento encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Documento</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Processo</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Tipo</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Autor</th>
                  <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Data</th>
                  <th className="text-right px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {doc.segredo && <AlertTriangle size={12} className="text-amber-500" />}
                        {doc.nome}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{doc.processo?.cliente?.nome?.slice(0, 28) || "—"}</td>
                    <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">{doc.tipo}</span></td>
                    <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">{doc.status}</span></td>
                    <td className="px-4 py-3 text-xs">{doc.autor?.nome?.split(" ")[0] || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.url && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button onClick={() => openEdit(doc)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(doc)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DocumentoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        documento={editingDoc}
        processos={processos}
        onSuccess={refresh}
      />
    </>
  );
}
