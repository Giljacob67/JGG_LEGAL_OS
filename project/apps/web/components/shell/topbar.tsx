"use client";

import { Search, Bell, Moon, Sun, AlertTriangle, Calendar, Zap, CheckCheck, Radio } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useSyncExternalStore } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useSseAndamentosContext } from "@/components/providers/sse-andamentos-provider";

interface PrazoAlert {
  id: string;
  titulo: string;
  vence: string;
  status: string;
  tipo: string;
  processo?: { cliente?: { nome: string } | null } | null;
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const [notifOpen, setNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState<PrazoAlert[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [movOpen, setMovOpen] = useState(false);
  const {
    connected: sseConnected,
    andamentos,
    count: movCount,
    criticoCount,
    markAsRead,
    markAllAsRead,
  } = useSseAndamentosContext();

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        setAlerts(data.prazos || []);
        setAlertCount(data.counts?.total || 0);
      } catch { /* ignore */ }
    }
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // refresh a cada 60s
    return () => clearInterval(interval);
  }, []);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date.getTime() - hoje.getTime()) / 86400000);
    if (diff < 0) return `Vencido ha ${Math.abs(diff)} dia(s)`;
    if (diff === 0) return "Vence hoje";
    if (diff === 1) return "Vence amanha";
    return `Vence em ${diff} dias`;
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-5 pl-14 lg:pl-5 gap-4 shrink-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>JGG GROUP</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-foreground font-medium">Legal OS</span>
      </div>

      <div className="flex-1" />

      <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-background text-muted-foreground text-sm min-w-[280px] justify-between hover:border-ring transition-colors">
        <span className="flex items-center gap-2">
          <Search size={14} />
          Buscar processo, cliente, jurisprudencia...
        </span>
        <span className="flex gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">⌘</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">K</kbd>
        </span>
      </button>

      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-md hover:bg-muted text-muted-foreground"
          title="Notificacoes"
        >
          <Bell size={18} />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl border bg-card shadow-xl z-50">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold">Alertas de prazos</h3>
                <Link href="/agenda" onClick={() => setNotifOpen(false)} className="text-xs text-accent hover:underline">Ver agenda</Link>
              </div>
              {alerts.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Nenhum alerta de prazo.
                </div>
              ) : (
                <div className="divide-y">
                  {alerts.map((a) => (
                    <div key={a.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-2">
                        {new Date(a.vence) < new Date(new Date().setHours(0, 0, 0, 0)) ? (
                          <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
                        ) : (
                          <Calendar size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{a.titulo}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{a.processo?.cliente?.nome || "Sem processo"}</p>
                          <p className={`text-[10px] mt-0.5 font-medium ${new Date(a.vence) < new Date(new Date().setHours(0, 0, 0, 0)) ? "text-destructive" : "text-amber-600"}`}>
                            {formatDate(a.vence)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* SSE Andamentos */}
      <div className="relative">
        <button
          onClick={() => setMovOpen(!movOpen)}
          className="relative p-2 rounded-md hover:bg-muted text-muted-foreground"
          title="Andamentos em tempo real"
        >
          <Zap size={18} className={sseConnected ? "text-emerald-500" : "text-muted-foreground"} />
          {movCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
              {movCount > 9 ? "9+" : movCount}
            </span>
          )}
          {sseConnected && movCount === 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        {movOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMovOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] overflow-y-auto rounded-xl border bg-card shadow-xl z-50">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Andamentos em tempo real</h3>
                  {sseConnected ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      <Radio size={10} className="animate-pulse" />
                      Ao vivo
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      Offline
                    </span>
                  )}
                </div>
                {movCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <CheckCheck size={12} />
                    Limpar
                  </button>
                )}
              </div>
              {andamentos.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Nenhum andamento novo.
                  {sseConnected && (
                    <p className="text-[10px] mt-1 text-emerald-600">
                      Conectado. Aguardando movimentacoes...
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {andamentos.map((a) => (
                    <div
                      key={a.id}
                      className="px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        {a.critico ? (
                          <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
                        ) : (
                          <Calendar size={14} className="text-accent shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{a.evento || a.descricao}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {a.cnj}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-muted-foreground/70">
                              {new Date(a.createdAt).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <button
                              onClick={() => markAsRead(a.id)}
                              className="text-[10px] text-accent hover:underline"
                            >
                              Marcar lido
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {criticoCount > 0 && (
                <div className="px-4 py-2 border-t bg-rose-50/50">
                  <p className="text-[10px] text-rose-700 font-medium">
                    {criticoCount} movimentacao{criticoCount > 1 ? "oes" : "ao"} critica{criticoCount > 1 ? "s" : ""} requerem atencao
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground"
          title="Alternar tema"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      )}

      <UserButton />
    </header>
  );
}
