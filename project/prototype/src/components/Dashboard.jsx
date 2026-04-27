// Dashboard — KPIs + timeline de prazos críticos + visão geral

const fmtBRL = (n) => 'R$ ' + (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtBRLk = (n) => {
  if (n >= 1_000_000) return 'R$ ' + (n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M';
  if (n >= 1_000) return 'R$ ' + Math.round(n / 1000) + 'k';
  return 'R$ ' + n;
};
const fmtDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

function Kpi({ label, value, sub, trend, accent }) {
  return (
    <div className="surface" style={{padding: 18, position: 'relative', overflow: 'hidden'}}>
      {accent && <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent}} />}
      <div style={{fontSize: 11.5, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500}}>{label}</div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6}}>
        <div style={{fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, color: 'var(--fg-strong)', letterSpacing: '-0.02em', lineHeight: 1}}>{value}</div>
        {trend && (
          <div style={{fontSize: 12, color: trend.startsWith('+') ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 500}}>
            {trend}
          </div>
        )}
      </div>
      {sub && <div style={{fontSize: 12, color: 'var(--fg-muted)', marginTop: 6}}>{sub}</div>}
    </div>
  );
}

function MiniBars({ data, height = 38 }) {
  const max = Math.max(...data.map(d => d.v));
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', gap: 3, height}}>
      {data.map((d, i) => (
        <div key={i} title={`${d.l}: ${d.v}`} style={{
          flex: 1, height: `${(d.v / max) * 100}%`,
          background: d.accent ? 'var(--accent)' : 'var(--jgg-navy-500)',
          opacity: d.accent ? 1 : 0.7,
          borderRadius: '2px 2px 0 0', minHeight: 3,
        }} />
      ))}
    </div>
  );
}

function Dashboard({ navigate, dashLayout }) {
  const D = window.JGG_DATA;
  const today = D.today;

  const stats = {
    processos: D.processos.length,
    ativos: D.processos.filter(p => p.status === 'em_andamento').length,
    valorTotal: D.processos.reduce((s, p) => s + p.valor, 0),
    mataMata: D.processos.filter(p => p.tagMataMata).length,
  };

  const prazosOrdenados = [...D.prazos].sort((a, b) => a.vence.localeCompare(b.vence));
  const criticos = prazosOrdenados.filter(p => daysBetween(today, p.vence) <= 7);

  const porArea = ['Bancário', 'Agrário', 'Tributário'].map(a => ({
    area: a,
    count: D.processos.filter(p => p.area === a).length,
    valor: D.processos.filter(p => p.area === a).reduce((s, p) => s + p.valor, 0),
  }));

  const porAdvogado = D.advogados.filter(a => a.role !== 'admin').map(a => ({
    ...a,
    processos: D.processos.filter(p => p.responsavel === a.id || p.equipe.includes(a.id)).length,
  }));

  // Receita últimos 6 meses (mock)
  const receita = [
    { l: 'Nov', v: 142 }, { l: 'Dez', v: 178 }, { l: 'Jan', v: 156 },
    { l: 'Fev', v: 210 }, { l: 'Mar', v: 195 }, { l: 'Abr', v: 248, accent: true },
  ];

  return (
    <div style={{padding: 24, maxWidth: 1480, margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20}}>
        <div>
          <h1 style={{fontSize: 26, marginBottom: 4}}>Bom dia, Dr. Gilberto.</h1>
          <div style={{color: 'var(--fg-muted)', fontSize: 13}}>
            Segunda-feira, 27 de abril de 2026 · Você tem <b style={{color: 'var(--accent)'}}>3 prazos fatais</b> nesta semana.
          </div>
        </div>
        <div style={{display: 'flex', gap: 8}}>
          <button className="btn"><Icon name="filter" size={13}/> Filtros</button>
          <button className="btn btn-primary">+ Novo Processo</button>
        </div>
      </div>

      {dashLayout === 'kpi-first' ? (
        <>
          {/* KPIs */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16}}>
            <Kpi label="Processos Ativos" value={stats.ativos} sub={`${stats.processos} no total · ${stats.mataMata} c/ tese Mata-Mata`} trend="+12%" accent="var(--jgg-navy-700)" />
            <Kpi label="Valor em Litígio" value={fmtBRLk(stats.valorTotal)} sub="Soma de todas as causas ativas" trend="+8%" accent="var(--jgg-bordo-700)" />
            <Kpi label="Receita Abr/2026" value={fmtBRLk(248_000)} sub="Meta: R$ 220k · 113% atingido" trend="+27%" accent="var(--jgg-gold-700)" />
            <Kpi label="Prazos Críticos" value={criticos.length} sub="≤ 7 dias · 3 fatais" accent="var(--status-danger)" />
          </div>

          {/* Linha 2: Prazos críticos + Distribuição */}
          <div style={{display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 16}}>
            <PrazosCriticosPanel prazos={criticos.slice(0, 6)} navigate={navigate} />
            <DistribuicaoArea porArea={porArea} />
          </div>

          {/* Linha 3 */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14}}>
            <ReceitaPanel receita={receita} />
            <CargaAdvogados advs={porAdvogado} />
            <MataMataInsight processos={D.processos.filter(p => p.tagMataMata)} navigate={navigate} />
          </div>
        </>
      ) : (
        <>
          {/* timeline-first variant */}
          <div style={{display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 14}}>
            <TimelinePrazos prazos={prazosOrdenados.slice(0, 8)} today={today} navigate={navigate} />
            <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
              <Kpi label="Prazos Fatais 7d" value={criticos.length} sub="3 audiências · 5 petições" accent="var(--status-danger)" />
              <Kpi label="Processos Ativos" value={stats.ativos} sub={`${stats.mataMata} Mata-Mata`} accent="var(--jgg-navy-700)" />
              <Kpi label="Receita Abr" value={fmtBRLk(248_000)} sub="113% da meta" accent="var(--jgg-gold-700)" />
            </div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14}}>
            <DistribuicaoArea porArea={porArea} />
            <CargaAdvogados advs={porAdvogado} />
            <MataMataInsight processos={D.processos.filter(p => p.tagMataMata)} navigate={navigate} />
          </div>
        </>
      )}
    </div>
  );
}

function PrazosCriticosPanel({ prazos, navigate }) {
  const D = window.JGG_DATA;
  const today = D.today;
  return (
    <div className="surface" style={{padding: 0, overflow: 'hidden'}}>
      <div style={{padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h3 style={{fontSize: 15, marginBottom: 2}}>Prazos críticos da semana</h3>
          <div style={{fontSize: 11.5, color: 'var(--fg-muted)'}}>Notificações ativas no Telegram + e-mail</div>
        </div>
        <button onClick={() => navigate('agenda')} className="btn btn-ghost" style={{fontSize: 12}}>Ver agenda completa →</button>
      </div>
      <div>
        {prazos.map((pz, i) => {
          const dias = (new Date(pz.vence) - new Date(today)) / 86400000;
          const proc = D.processos.find(p => p.id === pz.processo);
          const cli = D.clientes.find(c => c.id === proc?.cliente);
          const adv = D.advogados.find(a => a.id === pz.responsavel);
          const cor = dias <= 1 ? 'var(--status-danger)' : dias <= 3 ? 'var(--status-warn)' : 'var(--status-info)';
          return (
            <div key={pz.id} style={{
              padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14,
              borderBottom: i < prazos.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              cursor: 'pointer',
            }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-2)'}
               onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <div style={{
                width: 48, height: 48, borderRadius: 8,
                background: dias <= 1 ? 'var(--status-danger-bg)' : 'var(--bg-surface-2)',
                color: cor,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-serif)',
              }}>
                <div style={{fontSize: 18, fontWeight: 700, lineHeight: 1}}>{dias === 0 ? 'HOJE' : Math.round(dias)}</div>
                {dias !== 0 && <div style={{fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2}}>{Math.abs(dias) === 1 ? 'dia' : 'dias'}</div>}
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3}}>
                  <span className={`chip chip-${pz.tipo === 'fatal' ? 'danger' : pz.tipo === 'audiencia' ? 'warn' : 'info'}`}>
                    {pz.tipo}
                  </span>
                  <span style={{fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)'}}>{proc?.cnj}</span>
                </div>
                <div style={{fontSize: 13.5, fontWeight: 500, color: 'var(--fg-strong)'}}>{pz.titulo}</div>
                <div style={{fontSize: 12, color: 'var(--fg-muted)', marginTop: 2}}>
                  {cli?.nome} · {proc?.adverso}
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: adv?.cor, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 600,
                }}>{adv?.avatar}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelinePrazos({ prazos, today, navigate }) {
  const D = window.JGG_DATA;
  const range = 30;
  return (
    <div className="surface" style={{padding: 18}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18}}>
        <div>
          <h3 style={{fontSize: 16, marginBottom: 4}}>Próximos 30 dias</h3>
          <div style={{fontSize: 12, color: 'var(--fg-muted)'}}>Linha do tempo de prazos por dia · clique para abrir o processo</div>
        </div>
        <div style={{display: 'flex', gap: 12, fontSize: 11, color: 'var(--fg-muted)'}}>
          <span><span style={{display: 'inline-block', width: 8, height: 8, background: 'var(--status-danger)', borderRadius: '50%', marginRight: 4}} />fatal</span>
          <span><span style={{display: 'inline-block', width: 8, height: 8, background: 'var(--status-warn)', borderRadius: '50%', marginRight: 4}} />audiência</span>
          <span><span style={{display: 'inline-block', width: 8, height: 8, background: 'var(--status-info)', borderRadius: '50%', marginRight: 4}} />outros</span>
        </div>
      </div>
      <div style={{position: 'relative', height: 180, paddingTop: 8}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 90, height: 1, background: 'var(--border-default)'}} />
        {prazos.map((pz, i) => {
          const dias = (new Date(pz.vence) - new Date(today)) / 86400000;
          if (dias > range) return null;
          const left = (dias / range) * 100;
          const proc = D.processos.find(p => p.id === pz.processo);
          const cor = pz.tipo === 'fatal' ? 'var(--status-danger)' : pz.tipo === 'audiencia' ? 'var(--status-warn)' : 'var(--status-info)';
          const above = i % 2 === 0;
          return (
            <div key={pz.id} style={{position: 'absolute', left: `${left}%`, top: above ? 12 : 100, transform: 'translateX(-50%)', cursor: 'pointer'}}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%', background: cor,
                border: '2px solid var(--bg-surface)', position: 'absolute',
                top: above ? 'auto' : -22, bottom: above ? -22 : 'auto',
                left: '50%', transform: 'translateX(-50%)',
              }} />
              <div style={{
                padding: '5px 8px', background: cor, color: 'white',
                borderRadius: 4, fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap',
                maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {fmtDate(pz.vence)} · {pz.titulo.slice(0, 22)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)'}}>
        <span>HOJE</span><span>+7d</span><span>+14d</span><span>+21d</span><span>+30d</span>
      </div>
    </div>
  );
}

function DistribuicaoArea({ porArea }) {
  const total = porArea.reduce((s, a) => s + a.count, 0);
  const cores = { 'Bancário': 'var(--jgg-bordo-700)', 'Agrário': 'var(--jgg-navy-700)', 'Tributário': 'var(--jgg-gold-700)' };
  return (
    <div className="surface" style={{padding: 18}}>
      <h3 style={{fontSize: 15, marginBottom: 14}}>Distribuição por área</h3>
      <div style={{display: 'flex', gap: 2, height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 16}}>
        {porArea.map(a => (
          <div key={a.area} style={{flex: a.count, background: cores[a.area]}} />
        ))}
      </div>
      {porArea.map(a => (
        <div key={a.area} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)'}}>
          <div style={{width: 8, height: 8, background: cores[a.area], borderRadius: 2}} />
          <div style={{flex: 1, fontSize: 13, color: 'var(--fg-strong)'}}>{a.area}</div>
          <div style={{fontSize: 12, color: 'var(--fg-muted)', fontVariantNumeric: 'tabular-nums'}}>{a.count} processos</div>
          <div style={{fontSize: 12, fontWeight: 500, color: 'var(--fg-strong)', minWidth: 70, textAlign: 'right', fontVariantNumeric: 'tabular-nums'}}>{fmtBRLk(a.valor)}</div>
        </div>
      ))}
    </div>
  );
}

function ReceitaPanel({ receita }) {
  return (
    <div className="surface" style={{padding: 18}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
        <div>
          <h3 style={{fontSize: 15, marginBottom: 4}}>Receita 6m</h3>
          <div style={{fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--fg-strong)'}}>R$ 1,13M</div>
          <div style={{fontSize: 11.5, color: 'var(--status-success)', fontWeight: 500}}>+27% vs. semestre anterior</div>
        </div>
      </div>
      <div style={{marginTop: 14}}>
        <MiniBars data={receita} height={62} />
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--fg-subtle)'}}>
          {receita.map(r => <span key={r.l}>{r.l}</span>)}
        </div>
      </div>
    </div>
  );
}

function CargaAdvogados({ advs }) {
  const max = Math.max(...advs.map(a => a.processos));
  return (
    <div className="surface" style={{padding: 18}}>
      <h3 style={{fontSize: 15, marginBottom: 14}}>Carga por advogado</h3>
      {advs.map(a => (
        <div key={a.id} style={{marginBottom: 11}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4}}>
            <div style={{width: 22, height: 22, borderRadius: '50%', background: a.cor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600}}>{a.avatar}</div>
            <div style={{flex: 1, fontSize: 12.5, color: 'var(--fg-strong)'}}>{a.nome.replace('Dr. ', '').replace('Dra. ', '')}</div>
            <div style={{fontSize: 11, color: 'var(--fg-muted)', fontVariantNumeric: 'tabular-nums'}}>{a.processos}</div>
          </div>
          <div style={{height: 4, background: 'var(--bg-surface-2)', borderRadius: 2, overflow: 'hidden'}}>
            <div style={{width: `${(a.processos / max) * 100}%`, height: '100%', background: a.cor, borderRadius: 2}} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MataMataInsight({ processos, navigate }) {
  const valorTotal = processos.reduce((s, p) => s + p.valor, 0);
  return (
    <div className="surface" style={{padding: 18, position: 'relative', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 0, right: 0, padding: '6px 10px', background: 'var(--gold-soft)', color: 'var(--gold)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', borderBottomLeftRadius: 8}}>TESE ESTRATÉGICA</div>
      <h3 style={{fontSize: 15, marginBottom: 4, marginTop: 14}}>Operação Mata-Mata</h3>
      <div style={{fontSize: 11.5, color: 'var(--fg-muted)', marginBottom: 14, lineHeight: 1.4}}>
        Processos com tese de nulidade por simulação contábil em crédito rural.
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border-subtle)'}}>
        <span style={{fontSize: 12, color: 'var(--fg-muted)'}}>Casos ativos</span>
        <span style={{fontSize: 13, fontWeight: 600, color: 'var(--fg-strong)'}}>{processos.length}</span>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border-subtle)'}}>
        <span style={{fontSize: 12, color: 'var(--fg-muted)'}}>Valor agregado</span>
        <span style={{fontSize: 13, fontWeight: 600, color: 'var(--fg-strong)'}}>{fmtBRLk(valorTotal)}</span>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border-subtle)'}}>
        <span style={{fontSize: 12, color: 'var(--fg-muted)'}}>Taxa de êxito hist.</span>
        <span style={{fontSize: 13, fontWeight: 600, color: 'var(--status-success)'}}>78%</span>
      </div>
      <button onClick={() => navigate('ia')} className="btn btn-primary" style={{width: '100%', marginTop: 10, justifyContent: 'center'}}>
        Abrir Assistente Mata-Mata →
      </button>
    </div>
  );
}

Object.assign(window, { Dashboard, fmtBRL, fmtBRLk, fmtDate, daysBetween });
