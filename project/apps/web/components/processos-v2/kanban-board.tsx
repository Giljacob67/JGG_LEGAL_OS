"use client";

import { useState } from "react";
import { KanbanColumn } from "./kanban-column";
import type { Processo } from "@/lib/types";

interface KanbanBoardProps {
  processos: Processo[];
  onStatusChange: (processoId: string, newStatus: string) => void;
}

const STATUS_COLUMNS = [
  { id: "em_andamento", label: "Em Andamento", color: "bg-blue-500" },
  { id: "aguardando", label: "Aguardando", color: "bg-yellow-500" },
  { id: "suspenso", label: "Suspenso", color: "bg-gray-500" },
  { id: "encerrado", label: "Encerrado", color: "bg-green-500" },
];

export function KanbanBoard({ processos, onStatusChange }: KanbanBoardProps) {
  const [draggedProcesso, setDraggedProcesso] = useState<string | null>(null);

  function handleDragStart(processoId: string) {
    setDraggedProcesso(processoId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(status: string) {
    if (draggedProcesso) {
      onStatusChange(draggedProcesso, status);
      setDraggedProcesso(null);
    }
  }

  return (
    <div className="grid grid-cols-4 gap-4 h-[calc(100vh-200px)]">
      {STATUS_COLUMNS.map((column) => {
        const columnProcessos = processos.filter((p) => p.status === column.id);

        return (
          <KanbanColumn
            key={column.id}
            status={column.id}
            label={column.label}
            color={column.color}
            processos={columnProcessos}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        );
      })}
    </div>
  );
}
