// Agenda & Prazos — kanban + calendário + cálculo CPC

const { useState: useStateA } = React;

function AgendaView() {
  const D = window.JGG_DATA;
  const [view, setView] = useStateA('kanban');

  return (
    <div style={{padding: 24, maxWidth: 1480, margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18}}>
        <div>
          <h1 style={{fontSize: 22, marginBottom: 4}}>Agenda & Prazos</h1>
          <div style={{fontSize: 12, color: 'var(--fg-muted)'}}>
            {D.prazos.length} prazos abertos · próximo em {Math.round((new Date(D.prazos[0].vence) - new Date(D.today))/86400000)} dias · sincronizado com Google Calendar
          </div>
        </div>
        <div style={{display: 'flex', gap: 8}}>
          <div className="surface" style={{padding: 2, display: 'flex', gap: 2}}>
            {['kanban', 'lista', 'calendário'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 500,
                background: view === v ? 'var(--accent)' : 'transparent',
                color: view === v ? 'white' : 'var(--fg-muted)',
                border: 'none', borderRadius: 4, cursor: 'pointer',
                fontFamily: 'inherit', textTransform: 'capitalize',
              }}>{v}</button>
            ))}
          </div>
          <button className="btn">⚙ Cálculo CPC</button>
          <button className="btn btn-primary">+ Novo prazo</button>
        </div>
      </div>

      {view === 'kanban' && <KanbanView />}
      {view === 'lista' && <ListaView />}
      {view === 'calendário' && <CalendarView />}
    </div>
  );
}

function KanbanView() {
  const D = window.JGG_DATA;
  const today = D.today;
  const cols = [
    { id: 'critico', label: 'Críticos · ≤ 3 dias', cor: 'var(--status-danger)', filter: (d) => d <= 3 },
    { id: 'semana', label: 'Esta semana · 4-7 dias', cor: 'var(--status-warn)', filter: (d) => d > 3 && d <= 7 },
    { id: 'quinzena', label: 'Próximos 14 dias', cor: 'var(--status-info)', filter: (d) => d > 7 && d <= 14 },
    { id: 'mes', label: 'Mais de 14 dias', cor: 'var(--fg-muted)', filter: (d) => d > 14 },
  ];

  return (
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start'}}>
      {cols.map(col => {
        const items = D.prazos.filter(pz => col.filter((new Date(pz.vence) - new Date(today)) / 86400000));
        return (
          <div key={col.id} style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px'}}>
              <div style={{width: 8, height: 8, background: col.cor, borderRadius: '50%'}} />
              <div style={{fontSize: 12, fontWeight: 600, color: 'var(--fg-strong)'}}>{col.label}</div>
              <span style={{flex: 1}} />
              <span className="chip" style={{fontSize: 10}}>{items.length}</span>
            </div>
            {items.map(pz => {
              const proc = D.processos.find(p => p.id === pz.processo);
              const cli = D.clientes.find(c => c.id === proc?.cliente);
              const adv = D.advogados.find(a => a.id === pz.responsavel);
              const dias = Math.round((new Date(pz.vence) - new Date(today)) / 86400000);
              return (
                <div key={pz.id} className="surface" style={{padding: 12, cursor: 'pointer'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8}}>
                    <span className={`chip chip-${pz.tipo === 'fatal' ? 'danger' : pz.tipo === 'audiencia' ? 'warn' : 'info'}`} style={{fontSize: 9}}>
                      {pz.tipo}
                    </span>
                    <span style={{flex: 1}} />
                    <span style={{
                      fontSize: 10.5, fontWeight: 600,
                      color: dias <= 1 ? 'var(--status-danger)' : 'var(--fg-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {dias === 0 ? 'HOJE' : `${dias}d`}
                    </span>
                  </div>
                  <div style={{fontSize: 13, fontWeight: 500, color: 'var(--fg-strong)', marginBottom: 4}}>{pz.titulo}</div>
                  <div style={{fontSize: 11, color: 'var(--fg-muted)', marginBottom: 8}}>{cli?.nome.slice(0, 32)}</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid var(--border-subtle)'}}>
                    <div style={{width: 18, height: 18, borderRadius: '50%', background: adv?.cor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 600}}>{adv?.avatar}</div>
                    <span style={{fontSize: 10.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)'}}>{proc?.cnj.slice(-8)}</span>
                    <span style={{flex: 1}} />
                    <span style={{fontSize: 10.5, color: 'var(--fg-muted)'}}>{fmtDate(pz.vence)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ListaView() {
  const D = window.JGG_DATA;
  return (
    <div className="surface" style={{padding: 0, overflow: 'hidden'}}>
      <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
        <thead>
          <tr style={{background: 'var(--bg-surface-2)'}}>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', textTransform: 'uppercase', width: 80}}>Vence</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>Prazo</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>Processo</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', textTransform: 'uppercase', width: 90}}>Tipo</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', textTransform: 'uppercase', width: 110}}>Resp.</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', textTransform: 'uppercase', width: 130}}>Notificação</th>
          </tr>
        </thead>
        <tbody>
          {D.prazos.map(pz => {
            const proc = D.processos.find(p => p.id === pz.processo);
            const cli = D.clientes.find(c => c.id === proc?.cliente);
            const adv = D.advogados.find(a => a.id === pz.responsavel);
            const dias = Math.round((new Date(pz.vence) - new Date(D.today)) / 86400000);
            return (
              <tr key={pz.id} style={{borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer'}}>
                <td style={{padding: '12px 14px'}}>
                  <div style={{fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: dias <= 3 ? 'var(--status-danger)' : 'var(--fg-strong)'}}>
                    {dias === 0 ? 'HOJE' : `${dias}d`}
                  </div>
                  <div style={{fontSize: 10.5, color: 'var(--fg-muted)'}}>{fmtDate(pz.vence)}</div>
                </td>
                <td style={{padding: '12px 14px'}}>
                  <div style={{fontSize: 13.5, fontWeight: 500, color: 'var(--fg-strong)'}}>{pz.titulo}</div>
                </td>
                <td style={{padding: '12px 14px'}}>
                  <div style={{fontSize: 12.5, color: 'var(--fg-default)'}}>{cli?.nome}</div>
                  <div style={{fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-muted)'}}>{proc?.cnj}</div>
                </td>
                <td style={{padding: '12px 14px'}}>
                  <span className={`chip chip-${pz.tipo === 'fatal' ? 'danger' : pz.tipo === 'audiencia' ? 'warn' : 'info'}`}>{pz.tipo}</span>
                </td>
                <td style={{padding: '12px 14px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                    <div style={{width: 22, height: 22, borderRadius: '50%', background: adv?.cor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 600}}>{adv?.avatar}</div>
                    <span style={{fontSize: 12, color: 'var(--fg-default)'}}>{adv?.nome.replace('Dr. ', '').replace('Dra. ', '').split(' ')[0]}</span>
                  </div>
                </td>
                <td style={{padding: '12px 14px'}}>
                  <div style={{display: 'flex', gap: 4}}>
                    <span className="chip" style={{fontSize: 10}} title="Telegram ativo">✈ TG</span>
                    <span className="chip" style={{fontSize: 10}}>✉ Email</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CalendarView() {
  const D = window.JGG_DATA;
  // Maio 2026 — abril 27 é segunda
  const dias = [];
  const startOffset = 1; // Apr 27 (Mon)
  // Gerar 5 semanas
  let d = new Date('2026-04-27');
  for (let i = 0; i < 35; i++) {
    const dt = new Date(d);
    dt.setDate(d.getDate() + i);
    dias.push(dt);
  }

  const prazosMap = {};
  D.prazos.forEach(pz => {
    if (!prazosMap[pz.vence]) prazosMap[pz.vence] = [];
    prazosMap[pz.vence].push(pz);
  });

  const semanasNomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="surface" style={{padding: 18}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16}}>
        <h3 style={{fontSize: 16}}>Abril – Maio 2026</h3>
        <div style={{flex: 1}} />
        <div style={{display: 'flex', gap: 12, fontSize: 11, color: 'var(--fg-muted)'}}>
          <span><span style={{display: 'inline-block', width: 8, height: 8, background: 'var(--status-danger)', borderRadius: '50%', marginRight: 4}} />fatal</span>
          <span><span style={{display: 'inline-block', width: 8, height: 8, background: 'var(--status-warn)', borderRadius: '50%', marginRight: 4}} />audiência</span>
          <span><span style={{display: 'inline-block', width: 8, height: 8, background: 'var(--status-info)', borderRadius: '50%', marginRight: 4}} />outros</span>
        </div>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border-subtle)'}}>
        {semanasNomes.map(n => (
          <div key={n} style={{padding: '8px 12px', background: 'var(--bg-surface-2)', fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em'}}>{n}</div>
        ))}
        {dias.map((dt, i) => {
          const iso = dt.toISOString().slice(0, 10);
          const prazos = prazosMap[iso] || [];
          const isToday = iso === D.today;
          const dom = dt.getDay() === 0 || dt.getDay() === 6;
          return (
            <div key={i} style={{
              minHeight: 80, background: 'var(--bg-surface)', padding: 6,
              opacity: dom ? 0.6 : 1,
              borderTop: isToday ? '2px solid var(--accent)' : 'none',
            }}>
              <div style={{
                fontSize: 11, fontWeight: isToday ? 700 : 500,
                color: isToday ? 'var(--accent)' : 'var(--fg-default)',
                marginBottom: 4,
              }}>{dt.getDate()} {dt.getDate() === 1 || i === 0 ? dt.toLocaleDateString('pt-BR', {month: 'short'}) : ''}</div>
              {prazos.slice(0, 3).map(pz => {
                const cor = pz.tipo === 'fatal' ? 'var(--status-danger)' : pz.tipo === 'audiencia' ? 'var(--status-warn)' : 'var(--status-info)';
                return (
                  <div key={pz.id} style={{
                    fontSize: 10, padding: '2px 5px', borderRadius: 3,
                    background: cor, color: 'white',
                    marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{pz.titulo.slice(0, 18)}</div>
                );
              })}
              {prazos.length > 3 && <div style={{fontSize: 10, color: 'var(--fg-muted)'}}>+{prazos.length - 3}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { AgendaView });
