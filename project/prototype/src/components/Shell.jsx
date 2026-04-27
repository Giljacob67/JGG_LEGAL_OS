// Shell — sidebar, topbar, command palette, layout principal

const { useState, useEffect, useMemo, useRef } = React;

const ICON = {
  dashboard: <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />,
  processes: <><path d="M3 4h18M3 9h18M3 14h12M3 19h8" /></>,
  agenda: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></>,
  documents: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>,
  finance: <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/></>,
  ia: <><path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4"/><circle cx="12" cy="12" r="3"/></>,
  clients: <><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/></>,
  imoveis: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></>,
  reports: <><path d="M3 3v18h18"/><path d="M7 14l4-4 4 3 5-7"/></>,
  blueprint: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  cmd: <><path d="M18 6a3 3 0 1 0-3-3v18a3 3 0 1 0 3-3"/><path d="M6 6a3 3 0 1 1 3-3v18a3 3 0 1 1-3-3"/><path d="M6 9h12v6H6z"/></>,
  menu: <><path d="M3 6h18M3 12h18M3 18h18"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  chevronLeft: <path d="m15 18-6-6 6-6"/>,
  chevronRight: <path d="m9 18 6-6-6-6"/>,
  alert: <><path d="M12 2 1 21h22z"/><path d="M12 9v4M12 17h.01"/></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>,
};

function Icon({ name, size = 16, stroke = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0}}>
      {ICON[name]}
    </svg>
  );
}

function Sidebar({ current, setCurrent, collapsed, setCollapsed, sidebarMode }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'processes', label: 'Processos', icon: 'processes', count: 247 },
    { id: 'agenda', label: 'Agenda & Prazos', icon: 'agenda', badge: 3 },
    { id: 'documents', label: 'Documentos', icon: 'documents' },
    { id: 'finance', label: 'Financeiro', icon: 'finance' },
    { id: 'ia', label: 'IA Jurídica', icon: 'ia', badge: 'NEW' },
    { id: 'sep' },
    { id: 'clients', label: 'Clientes', icon: 'clients', count: 184 },
    { id: 'imoveis', label: 'Imóveis Rurais', icon: 'imoveis' },
    { id: 'reports', label: 'Relatórios & BI', icon: 'reports' },
    { id: 'sep' },
    { id: 'blueprint', label: 'Blueprint Técnico', icon: 'blueprint' },
  ];

  const isCollapsed = collapsed && sidebarMode !== 'fixed';
  if (sidebarMode === 'palette-only') return null;

  return (
    <aside style={{
      width: isCollapsed ? 64 : 248,
      background: 'var(--bg-sidebar)',
      color: 'var(--fg-on-dark)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 200ms ease',
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{padding: isCollapsed ? '20px 12px' : '20px 18px', display: 'flex', alignItems: 'center', gap: 12, justifyContent: isCollapsed ? 'center' : 'flex-start'}}>
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: 'linear-gradient(135deg, var(--jgg-bordo-700), var(--jgg-gold-700))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 14,
          color: 'white', letterSpacing: '-0.02em',
        }}>JG</div>
        {!isCollapsed && (
          <div>
            <div style={{fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em'}}>JGG Legal OS</div>
            <div style={{fontSize: 10.5, color: 'var(--fg-on-dark-muted)', textTransform: 'uppercase', letterSpacing: '0.08em'}}>Agro · Bancário · Tributário</div>
          </div>
        )}
      </div>

      <nav style={{padding: '8px 8px', flex: 1, overflowY: 'auto'}}>
        {items.map((it, i) => {
          if (it.id === 'sep') return <div key={i} style={{height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 4px'}} />;
          const active = current === it.id;
          return (
            <button key={it.id} onClick={() => setCurrent(it.id)}
              title={isCollapsed ? it.label : ''}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 11, padding: isCollapsed ? '9px' : '8px 11px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                borderRadius: 6, cursor: 'pointer',
                background: active ? 'rgba(178, 65, 92, 0.18)' : 'transparent',
                color: active ? '#fff' : 'var(--fg-on-dark-muted)',
                border: 'none', fontFamily: 'inherit',
                fontSize: 13, fontWeight: active ? 500 : 400,
                textAlign: 'left', marginBottom: 2,
                transition: 'all 100ms',
                position: 'relative',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              {active && <div style={{position: 'absolute', left: -8, top: 6, bottom: 6, width: 3, background: 'var(--jgg-gold-500)', borderRadius: 2}} />}
              <Icon name={it.icon} size={16} />
              {!isCollapsed && <span style={{flex: 1}}>{it.label}</span>}
              {!isCollapsed && it.count && <span style={{fontSize: 11, color: 'var(--fg-on-dark-muted)', fontVariantNumeric: 'tabular-nums'}}>{it.count}</span>}
              {!isCollapsed && it.badge && (
                <span style={{
                  fontSize: 9.5, fontWeight: 600, padding: '2px 6px', borderRadius: 999,
                  background: it.badge === 'NEW' ? 'var(--jgg-gold-500)' : 'var(--jgg-bordo-500)',
                  color: it.badge === 'NEW' ? '#1a1a1a' : '#fff',
                  letterSpacing: '0.04em',
                }}>{it.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{padding: isCollapsed ? '12px' : '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10}}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'var(--jgg-bordo-700)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: 'white', flexShrink: 0,
        }}>GJ</div>
        {!isCollapsed && (
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{fontSize: 12.5, fontWeight: 500, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>Dr. Gilberto Jacob</div>
            <div style={{fontSize: 10.5, color: 'var(--fg-on-dark-muted)'}}>Sócio · OAB/PR 47.123</div>
          </div>
        )}
        {sidebarMode === 'collapsible' && !isCollapsed && (
          <button onClick={() => setCollapsed(true)} className="btn-icon"
            style={{background: 'transparent', border: 'none', color: 'var(--fg-on-dark-muted)', cursor: 'pointer', padding: 4}}>
            <Icon name="chevronLeft" size={14} />
          </button>
        )}
        {sidebarMode === 'collapsible' && isCollapsed && (
          <button onClick={() => setCollapsed(false)}
            style={{position: 'absolute', bottom: 14, left: 38, background: 'var(--jgg-navy-700)', border: 'none', color: '#fff', cursor: 'pointer', padding: 6, borderRadius: 4}}>
            <Icon name="chevronRight" size={12} />
          </button>
        )}
      </div>
    </aside>
  );
}

function Topbar({ openCmd, theme, setTheme, sidebarMode, setSidebarCollapsed, sidebarCollapsed, current }) {
  const titles = {
    dashboard: 'Dashboard',
    processes: 'Processos',
    agenda: 'Agenda & Prazos',
    documents: 'Documentos',
    finance: 'Financeiro',
    ia: 'IA Jurídica',
    clients: 'Clientes',
    imoveis: 'Imóveis Rurais',
    reports: 'Relatórios & BI',
    blueprint: 'Blueprint Técnico',
  };

  return (
    <header style={{
      height: 56, background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      flexShrink: 0,
    }}>
      {sidebarMode === 'collapsible' && (
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="btn btn-ghost btn-icon">
          <Icon name="menu" size={16} />
        </button>
      )}
      <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg-muted)'}}>
        <span>JGG Legal OS</span>
        <span style={{color: 'var(--fg-subtle)'}}>/</span>
        <span style={{color: 'var(--fg-strong)', fontWeight: 500}}>{titles[current] || current}</span>
      </div>

      <div style={{flex: 1}} />

      <button onClick={openCmd} className="btn" style={{minWidth: 280, justifyContent: 'space-between', color: 'var(--fg-muted)', fontWeight: 400}}>
        <span style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <Icon name="search" size={14} />
          Buscar processo, cliente, jurisprudência…
        </span>
        <span style={{display: 'flex', gap: 3}}>
          <span className="kbd">⌘</span><span className="kbd">K</span>
        </span>
      </button>

      <button className="btn btn-ghost btn-icon" title="Notificações" style={{position: 'relative'}}>
        <Icon name="bell" size={16} />
        <span style={{
          position: 'absolute', top: 4, right: 4,
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--status-danger)',
        }} />
      </button>

      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="btn btn-ghost btn-icon" title="Alternar tema">
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
      </button>
    </header>
  );
}

function CommandPalette({ open, setOpen, setCurrent }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQ('');
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemo(() => {
    const D = window.JGG_DATA;
    const items = [
      ...['dashboard', 'processes', 'agenda', 'documents', 'finance', 'ia', 'clients', 'imoveis', 'reports', 'blueprint'].map(id => ({type: 'Navegação', id, label: id.charAt(0).toUpperCase() + id.slice(1)})),
      ...D.processos.map(p => ({type: 'Processo', id: 'processes', cnj: p.cnj, label: p.tipo, sub: D.clientes.find(c => c.id === p.cliente)?.nome || ''})),
      ...D.clientes.map(c => ({type: 'Cliente', id: 'clients', label: c.nome, sub: c.cidade})),
      ...D.jurisprudencia.map(j => ({type: 'Jurisprudência', id: 'ia', label: (j.sumula || j.resp), sub: j.ementa.slice(0, 80) + '…'})),
    ];
    if (!q.trim()) return items.slice(0, 8);
    const ql = q.toLowerCase();
    return items.filter(i => (i.label + ' ' + (i.sub || '') + ' ' + (i.cnj || '')).toLowerCase().includes(ql)).slice(0, 12);
  }, [q]);

  if (!open) return null;

  return (
    <div onClick={() => setOpen(false)} style={{
      position: 'fixed', inset: 0, background: 'rgba(13, 29, 52, 0.45)',
      backdropFilter: 'blur(4px)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', paddingTop: 96,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="surface slide-in" style={{width: 640, maxHeight: 480, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)'}}>
          <Icon name="search" size={16} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar processos, clientes, jurisprudência, comandos…"
            style={{flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 15, color: 'var(--fg-strong)', fontFamily: 'inherit'}} />
          <span className="kbd">esc</span>
        </div>
        <div style={{flex: 1, overflowY: 'auto', padding: 8}}>
          {results.length === 0 && <div style={{padding: '40px 20px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13}}>Sem resultados para "{q}"</div>}
          {results.map((r, i) => (
            <button key={i} onClick={() => { setCurrent(r.id); setOpen(false); }}
              style={{
                width: '100%', textAlign: 'left',
                padding: '8px 12px', borderRadius: 6,
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2,
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <span className="chip" style={{minWidth: 90, justifyContent: 'center', fontSize: 10}}>{r.type}</span>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 13, color: 'var(--fg-strong)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{r.label}</div>
                {(r.sub || r.cnj) && <div style={{fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 1, fontFamily: r.cnj ? 'var(--font-mono)' : 'inherit'}}>{r.cnj || r.sub}</div>}
              </div>
              <Icon name="chevronRight" size={12} />
            </button>
          ))}
        </div>
        <div style={{padding: '8px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--fg-muted)', display: 'flex', gap: 16}}>
          <span><span className="kbd">↑</span> <span className="kbd">↓</span> navegar</span>
          <span><span className="kbd">↵</span> abrir</span>
          <span style={{marginLeft: 'auto'}}>{results.length} resultados</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, CommandPalette, Icon });
