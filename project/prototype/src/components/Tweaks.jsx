// Tweaks panel — controles de variação ao vivo

const { useState: useStateT, useEffect: useEffectT } = React;

function TweaksPanel({ tweaks, setTweaks, visible, setVisible }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, width: 320,
      background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
      borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 999,
      maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
    }}>
      <div style={{padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8}}>
        <span style={{fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600}}>Tweaks</span>
        <span className="chip chip-gold" style={{fontSize: 9}}>BETA</span>
        <span style={{flex: 1}} />
        <button onClick={() => setVisible(false)} className="btn-icon" style={{background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)'}}>✕</button>
      </div>
      <div style={{padding: 14}}>
        <TweakGroup label="Tema">
          <Toggle options={['Claro', 'Escuro']} value={tweaks.theme === 'dark' ? 'Escuro' : 'Claro'} onChange={(v) => setTweaks({...tweaks, theme: v === 'Escuro' ? 'dark' : 'light'})} />
        </TweakGroup>
        <TweakGroup label="Densidade das listas">
          <Toggle options={['Confortável', 'Compacta']} value={tweaks.density === 'compact' ? 'Compacta' : 'Confortável'} onChange={(v) => setTweaks({...tweaks, density: v === 'Compacta' ? 'compact' : 'comfortable'})} />
        </TweakGroup>
        <TweakGroup label="Layout do dashboard">
          <Toggle options={['KPIs primeiro', 'Timeline primeiro']} value={tweaks.dashLayout === 'timeline-first' ? 'Timeline primeiro' : 'KPIs primeiro'} onChange={(v) => setTweaks({...tweaks, dashLayout: v === 'Timeline primeiro' ? 'timeline-first' : 'kpi-first'})} />
        </TweakGroup>
        <TweakGroup label="Sidebar">
          <Toggle options={['Fixa', 'Colapsável']} value={tweaks.sidebarMode === 'collapsible' ? 'Colapsável' : 'Fixa'} onChange={(v) => setTweaks({...tweaks, sidebarMode: v === 'Colapsável' ? 'collapsible' : 'fixed'})} />
        </TweakGroup>
        <TweakGroup label="Visão do processo">
          <Toggle options={['Abas horizontais', 'Split-view']} value={tweaks.processView === 'split' ? 'Split-view' : 'Abas horizontais'} onChange={(v) => setTweaks({...tweaks, processView: v === 'Split-view' ? 'split' : 'tabs'})} />
        </TweakGroup>
        <TweakGroup label="Editor de peças">
          <Toggle options={['Word tradicional', 'Notion moderno']} value={tweaks.editorStyle === 'word' ? 'Word tradicional' : 'Notion moderno'} onChange={(v) => setTweaks({...tweaks, editorStyle: v === 'Word tradicional' ? 'word' : 'notion'})} />
        </TweakGroup>
      </div>
      <div style={{padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5}}>
        Configurações persistidas em localStorage · em produção, persistidas por usuário no Postgres.
      </div>
    </div>
  );
}

function TweakGroup({ label, children }) {
  return (
    <div style={{marginBottom: 14}}>
      <div style={{fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 6}}>{label}</div>
      {children}
    </div>
  );
}

function Toggle({ options, value, onChange }) {
  return (
    <div style={{display: 'flex', background: 'var(--bg-surface-2)', borderRadius: 6, padding: 2, gap: 2}}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          flex: 1, padding: '7px 10px', fontSize: 12, fontWeight: 500,
          background: value === opt ? 'var(--bg-surface)' : 'transparent',
          color: value === opt ? 'var(--accent)' : 'var(--fg-muted)',
          border: value === opt ? '1px solid var(--border-default)' : '1px solid transparent',
          borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: value === opt ? 'var(--shadow-sm)' : 'none',
        }}>{opt}</button>
      ))}
    </div>
  );
}

function TweaksToggleButton({ visible, setVisible }) {
  if (visible) return null;
  return (
    <button onClick={() => setVisible(true)} style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 998,
      padding: '10px 16px', borderRadius: 999,
      background: 'var(--accent)', color: 'white',
      border: 'none', cursor: 'pointer',
      boxShadow: 'var(--shadow-lg)',
      fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>⚙ Tweaks</button>
  );
}

Object.assign(window, { TweaksPanel, TweaksToggleButton });
