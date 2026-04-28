"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PrazoModal } from "./prazo-modal";
import { KanbanView } from "./kanban-view";
import { ListaView } from "./lista-view";
import { CalendarioView } from "./calendario-view";
import { AlertTriangle } from "lucide-react";

interface Prazo {
  id: string;
  tipo: string;
  titulo: string;
  vence: Date | string;
  status: string;
  descricao?: string | null;
  prazoInterno?: Date | string | null;
  responsavelId?: string | null;
  processoId?: string | null;
  clienteId?: string | null;
  notificar?: boolean;
  responsavel?: { nome: string; cor?: string | null; avatar?: string | null } | null;
  processo?: { cnj: string; cliente?: { nome: string } | null } | null;
}

interface User {
  id: string;
  nome: string;
}

interface Processo {
  id: string;
  cnj: string;
  cliente?: { nome: string } | null;
}

export function AgendaWrapper({
  initialPrazos,
  users,
  processos,
}: {
  initialPrazos: Prazo[];
  users: User[];
  processos: Processo[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrazo, setEditingPrazo] = useState<Prazo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Prazo | null>(null);
  const [prazos, setPrazos] = useState<Prazo[]>(initialPrazos);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  function openCreate() {
    setEditingPrazo(null);
    setModalOpen(true);
  }

  function openEdit(prazo: Prazo) {
    setEditingPrazo(prazo);
    setModalOpen(true);
  }

  async function handleDelete(prazo: Prazo) {
    setDeleteConfirm(prazo);
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/v1/deadlines/${deleteConfirm.id}`, { method: "DELETE" });
      if (res.ok) {
        setPrazos((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
        setDeleteConfirm(null);
        refresh();
      }
    } catch {
      // ignore
    }
  }

  return (
    <>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] mb-1">Agenda & Prazos</h1>
          <p className="text-xs text-muted-foreground">
            {prazos.length} prazos abertos · integrado com DataJud
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-colors"
        >
          + Novo prazo
        </button>
      </div>

      <div className="mb-6">
        <KanbanView prazos={prazos} onEdit={openEdit} onDelete={handleDelete} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListaView prazos={prazos} onEdit={openEdit} onDelete={handleDelete} />
        <CalendarioView prazos={prazos} onEdit={openEdit} onDelete={handleDelete} />
      </div>

      <PrazoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        prazo={editingPrazo}
        users={users}
        processos={processos}
        onSuccess={refresh}
      />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-card shadow-xl p-5">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle size={18} />
              <h3 className="text-sm font-semibold">Confirmar exclusao</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Tem certeza que deseja excluir o prazo <strong>{deleteConfirm.titulo}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
