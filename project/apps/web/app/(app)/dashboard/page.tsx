export default function DashboardPage() {
  return (
    <div className="p-6 max-w-[1480px] mx-auto">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl mb-1">Bom dia, Dr. Gilberto.</h1>
          <p className="text-sm text-muted-foreground">
            JGG GROUP · especializado em direito Agrário, Bancário e Tributário
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors">
            Filtros
          </button>
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-colors">
            + Novo Processo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="rounded-xl border bg-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--jgg-navy-700)]" />
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Processos Ativos</div>
          <div className="text-[32px] font-serif font-semibold text-foreground leading-none mt-1.5">8</div>
          <div className="text-xs text-muted-foreground mt-1.5">10 no total · 4 c/ tese Mata-Mata</div>
        </div>
        <div className="rounded-xl border bg-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--jgg-bordo-700)]" />
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Valor em Litigio</div>
          <div className="text-[32px] font-serif font-semibold text-foreground leading-none mt-1.5">R$ 27,4M</div>
          <div className="text-xs text-muted-foreground mt-1.5">Soma de todas as causas ativas</div>
        </div>
        <div className="rounded-xl border bg-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--jgg-gold-700)]" />
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Receita Abr/2026</div>
          <div className="text-[32px] font-serif font-semibold text-foreground leading-none mt-1.5">R$ 248k</div>
          <div className="text-xs text-muted-foreground mt-1.5">Meta: R$ 220k · 113% atingido</div>
        </div>
        <div className="rounded-xl border bg-card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-destructive" />
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Prazos Criticos</div>
          <div className="text-[32px] font-serif font-semibold text-foreground leading-none mt-1.5">3</div>
          <div className="text-xs text-muted-foreground mt-1.5">≤ 7 dias · 3 fatais</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <h3 className="text-[15px] mb-3">Prazos criticos da semana</h3>
          <div className="text-sm text-muted-foreground">Em breve: integracao com agenda e notificacoes.</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-[15px] mb-3">Distribuicao por area</h3>
          <div className="text-sm text-muted-foreground">Bancario · Agrario · Tributario</div>
        </div>
      </div>
    </div>
  );
}