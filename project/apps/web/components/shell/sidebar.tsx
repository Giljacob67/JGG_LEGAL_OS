"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  CalendarDays,
  FileText,
  ScrollText,
  DollarSign,
  Wallet,
  Clock,
  Bot,
  Users,
  BarChart3,
  FileCode,
  ChevronLeft,
  ChevronRight,
  Activity,
  Menu,
  X,
  Plug,
  GitCompare,
  Upload,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "processos", label: "Processos", icon: FolderOpen, href: "/processos-v2" },
  { id: "importacoes", label: "Importar CNJ", icon: Upload, href: "/processos/importacoes" },
  { id: "agenda", label: "Agenda & Prazos", icon: CalendarDays, href: "/agenda" },
  { id: "documentos", label: "Documentos", icon: FileText, href: "/documentos" },
  { id: "contratos", label: "Contratos", icon: ScrollText, href: "/contratos" },
  { id: "faturas", label: "Faturas", icon: DollarSign, href: "/faturas" },
  { id: "timesheet", label: "Timesheet", icon: Clock, href: "/timesheet" },
  { id: "financeiro", label: "Financeiro", icon: Wallet, href: "/financeiro" },
  { id: "ia", label: "IA Juridica", icon: Bot, href: "/ia" },
  { id: "sep1", label: "", icon: null, href: "" },
  { id: "clientes", label: "Clientes", icon: Users, href: "/clientes" },
  { id: "relatorios", label: "Relatorios & BI", icon: BarChart3, href: "/relatorios" },
  { id: "comparador", label: "Comparador", icon: GitCompare, href: "/comparador" },
  { id: "monitoramento", label: "Monitor DataJud", icon: Activity, href: "/monitoramento" },
  { id: "monitor-tribunais", label: "Captura tribunais", icon: Activity, href: "/processos-v2/monitoramento" },
  { id: "integracoes", label: "Integrações", icon: Plug, href: "/integracoes" },
  { id: "sep2", label: "", icon: null, href: "" },
  { id: "blueprint", label: "Blueprint Tecnico", icon: FileCode, href: "/blueprint" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Mobile hamburger — visible only on < lg */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 lg:hidden p-2 rounded-md bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "flex flex-col bg-sidebar text-sidebar-foreground shrink-0 transition-[width,transform] duration-200 ease-in-out border-r border-sidebar-border",
          // Desktop: normal behavior
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50",
          collapsed ? "w-16" : "w-64",
          // Mobile: slide in/out
          mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        )}
      >
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center p-4" : "px-5 py-5")}>
          <div className="w-8 h-8 rounded-md flex items-center justify-center text-white font-serif font-bold text-sm"
            style={{ background: "linear-gradient(135deg, var(--jgg-bordo-700), var(--jgg-gold-700))" }}
          >
            JG
          </div>
          {!collapsed && (
            <div>
              <div className="font-serif text-[15px] font-semibold tracking-tight text-white">JGG Legal OS</div>
              <div className="text-[10.5px] text-sidebar-foreground/60 uppercase tracking-widest">Agrario · Bancario · Tributario</div>
            </div>
          )}
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {navItems.map((item, i) => {
            if (item.id.startsWith("sep") || !item.icon) {
              return <div key={i} className="h-px bg-sidebar-border my-2 mx-1" />;
            }
            const Icon = item.icon;
            const active =
              item.href === "/processos-v2"
                ? pathname.startsWith("/processos-v2") || pathname === "/processos"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md text-sm font-medium transition-colors mb-0.5 relative",
                  collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                  active
                    ? "bg-accent/20 text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[var(--jgg-gold-500)] rounded-r" />
                )}
                <Icon size={18} strokeWidth={1.6} />
                {!collapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={cn("border-t border-sidebar-border flex items-center gap-2.5", collapsed ? "p-3 justify-center" : "px-3.5 py-3")}>
          <div className="w-7 h-7 rounded-full bg-[var(--jgg-bordo-700)] text-white flex items-center justify-center text-[11px] font-semibold shrink-0">
            GJ
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">Dr. Gilberto Jacob</div>
              <div className="text-[10.5px] text-sidebar-foreground/60">Socio · OAB/PR 17.158</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-white"
            title={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </aside>
    </>
  );
}
