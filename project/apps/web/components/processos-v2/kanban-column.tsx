"use client";

import Link from "next/link";
import { KanbanCard } from "./kanban-card";
import type { Processo } from "@/lib/types";

interface KanbanColumnProps {
  status: string;
  label: string;
  color: string;
  processos: Processo[];
  onDragStart: (processoId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (status: string) => void;
}

export function KanbanColumn({
  status,
  label,
  color,
  processos,
  onDragStart,
  onDragOver,
  onDrop,
}: KanbanColumnProps) {
  return (
    <div
      className="flex flex-col bg-muted/30 rounded-lg overflow-hidden"
      onDragOver={onDragOver}
      onDrop={() => onDrop(status)}
    >
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          <h3 className="font-semibold">{label}</h3>
          <span className="ml-auto text-sm text-muted-foreground">
            {processos.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {processos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum processo
          </div>
        ) : (
          processos.map((processo) => (
            <KanbanCard
              key={processo.id}
              processo={processo}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}
