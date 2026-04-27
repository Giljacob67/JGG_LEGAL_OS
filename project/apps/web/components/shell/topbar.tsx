"use client";

import { Search, Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
          Buscar processo, cliente, jurisprudenciaâ€¦
        </span>
        <span className="flex gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">âŒ˜</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border">K</kbd>
        </span>
      </button>

      <button className="relative p-2 rounded-md hover:bg-muted text-muted-foreground" title="Notificacoes">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
      </button>

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
