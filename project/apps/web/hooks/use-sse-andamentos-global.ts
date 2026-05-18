"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface SseAndamentoGlobal {
  id: string;
  processoId: string;
  cnj: string;
  data: string;
  evento: string;
  descricao: string;
  fonte: string;
  critico: boolean;
  createdAt: string;
}

export function useSseAndamentosGlobal(enabled = true) {
  const [connected, setConnected] = useState(false);
  const [andamentos, setAndamentos] = useState<SseAndamentoGlobal[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (esRef.current) return;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // últimas 24h
    const es = new EventSource(
      `/api/v1/sse/andamentos?since=${encodeURIComponent(since)}`
    );
    esRef.current = es;

    es.addEventListener("connected", () => {
      setConnected(true);
    });

    es.addEventListener("novo_andamento", (e) => {
      try {
        const data = JSON.parse(e.data) as SseAndamentoGlobal;
        setAndamentos((prev) => {
          // Evita duplicatas
          if (prev.some((a) => a.id === data.id)) return prev;
          return [data, ...prev];
        });
      } catch {
        // ignorar parse error
      }
    });

    es.onerror = () => {
      setConnected(false);
      setTimeout(() => {
        es.close();
        esRef.current = null;
        connect();
      }, 5000);
    };
  }, [enabled]);

  const disconnect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
      setConnected(false);
    }
  }, []);

  const clear = useCallback(() => {
    setAndamentos([]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAndamentos((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const markAllAsRead = useCallback(() => {
    setAndamentos([]);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    connected,
    andamentos,
    count: andamentos.length,
    criticoCount: andamentos.filter((a) => a.critico).length,
    processoIdsComNovo: [...new Set(andamentos.map((a) => a.processoId))],
    clear,
    markAsRead,
    markAllAsRead,
  };
}
