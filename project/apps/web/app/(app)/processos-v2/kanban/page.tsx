"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, ArrowLeft, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KanbanBoard } from "@/components/processos-v2/kanban-board";
import type { Processo } from "@/lib/types";

export default function ProcessosKanbanPage() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProcessos();
  }, []);

  async function fetchProcessos() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "500");
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/processes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProcessos(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar processos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(processoId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/v1/processes/${processoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Atualizar estado local
        setProcessos((prev) =>
          prev.map((p) =>
            p.id === processoId ? { ...p, status: newStatus } : p
          )
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/processos-v2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Kanban de Processos</h1>
            <p className="text-sm text-muted-foreground">
              Arraste os cards para alterar o status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProcessos()}
              className="pl-9 w-64"
            />
          </div>
          <Link href="/processos-v2">
            <Button variant="outline" size="sm">
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </Link>
          <Link href="/processos-v2">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Processo
            </Button>
          </Link>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando processos...</p>
          </div>
        </div>
      ) : (
        <KanbanBoard
          processos={processos}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
