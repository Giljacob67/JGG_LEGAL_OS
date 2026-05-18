"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSseAndamentosGlobal, SseAndamentoGlobal } from "@/hooks/use-sse-andamentos-global";

interface SseAndamentosContextValue {
  connected: boolean;
  andamentos: SseAndamentoGlobal[];
  count: number;
  criticoCount: number;
  processoIdsComNovo: string[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const SseAndamentosContext = createContext<SseAndamentosContextValue | null>(null);

export function useSseAndamentosContext() {
  const ctx = useContext(SseAndamentosContext);
  if (!ctx) {
    throw new Error("useSseAndamentosContext deve ser usado dentro de SseAndamentosProvider");
  }
  return ctx;
}

interface SseAndamentosProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function SseAndamentosProvider({ children, enabled = true }: SseAndamentosProviderProps) {
  const {
    connected,
    andamentos,
    count,
    criticoCount,
    processoIdsComNovo,
    markAsRead,
    markAllAsRead,
  } = useSseAndamentosGlobal(enabled);

  return (
    <SseAndamentosContext.Provider
      value={{
        connected,
        andamentos,
        count,
        criticoCount,
        processoIdsComNovo,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </SseAndamentosContext.Provider>
  );
}
