"use client";

import { Search, Bell, Moon, Sun, AlertTriangle, Calendar } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

interface PrazoAlert {
  id: string;
  titulo: string;
  vence: string;
  status: string;
  tipo: string;
  processo?: { cliente?: { nome: string } | null } | null;
}

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState<PrazoAlert[]>([]);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // refresh a cada 60s
    return () => clearInterval(interval);
  }, []);

  async function fetchAlerts() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setAlerts(data.prazos || []);
      setAlertCount(data.counts?.total || 0);
    } catch { /* ignore */ }
  }

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
    <header className="h-14 bg-card border-b border-border flex items-center px-5 gap-4 shrink-0">
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
