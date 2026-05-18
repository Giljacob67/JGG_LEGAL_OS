"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SseAndamento {
  id: string;
  data: string;
  evento: string;
  descricao: string;
  fonte: string;
  critico: boolean;
  createdAt: string;
}

interface UseSseAndamentosOptions {
  processoId: string | null;
  enabled?: boolean;
  onNovoAndamento?: (andamento: SseAndamento) => void;
}

export function useSseAndamentos({ processoId, enabled = true, onNovoAndamento }: UseSseAndamentosOptions) {
  const [connected, setConnected] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!processoId || !enabled) return;
    if (esRef.current) return;

    const since = new Date().toISOString();
    const es = new EventSource(`/api/v1/sse/andamentos?processoId=${processoId}&since=${encodeURIComponent(since)}`);
    esRef.current = es;

    es.addEventListener("connected", () => {
      setConnected(true);
    });

    es.addEventListener("novo_andamento", (e) => {
      try {
        const data = JSON.parse(e.data) as SseAndamento;
        setLastEventAt(new Date().toISOString());
        onNovoAndamento?.(data);
      } catch {
        // ignorar parse error
      }
    });

    es.onerror = () => {
      setConnected(false);
      // Reconectar após 3s
      setTimeout(() => {
        es.close();
        esRef.current = null;
        connect();
      }, 3000);
    };
  }, [processoId, enabled, onNovoAndamento]);

  const disconnect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connected, lastEventAt };
}
