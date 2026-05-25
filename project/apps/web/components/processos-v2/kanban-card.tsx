"use client";

import Link from "next/link";
import { Calendar, User, Scale, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RiscoBadge } from "./status-badges";
import { formatCurrency } from "@/lib/utils/formatters";
import type { Processo } from "@/lib/types";

interface KanbanCardProps {
  processo: Processo;
  onDragStart: (processoId: string) => void;
}

export function KanbanCard({ processo, onDragStart }: KanbanCardProps) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.effectAllowed = "move";
    onDragStart(processo.id);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-background rounded-lg border p-3 cursor-move hover:shadow-md transition-shadow"
    >
      <Link href={`/processos-v2/${processo.id}`} className="block">
        {/* CNJ */}
        <div className="font-mono text-sm font-semibold mb-2 text-primary">
          {processo.cnj}
        </div>

        {/* Cliente */}
        <div className="text-sm font-medium mb-2">
          {processo.cliente?.nome || "Sem cliente"}
        </div>

        {/* Área */}
        <div className="mb-2">
          <Badge variant="outline" className="text-xs">
            {processo.area}
          </Badge>
        </div>

        {/* Info grid */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          {processo.valorCausa && (
            <div className="flex items-center gap-1.5">
              <Scale className="h-3 w-3" />
              <span>{formatCurrency(processo.valorCausa)}</span>
            </div>
          )}

          {processo.responsavel && (
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>{processo.responsavel.nome}</span>
            </div>
          )}

          {processo.distribuicao && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(processo.distribuicao).toLocaleDateString("pt-BR")}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <RiscoBadge risco={processo.risco} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {processo._count?.andamentos && (
              <span>{processo._count.andamentos} mov.</span>
            )}
            {processo._count?.prazos && processo._count.prazos > 0 && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                <span>{processo._count.prazos}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
