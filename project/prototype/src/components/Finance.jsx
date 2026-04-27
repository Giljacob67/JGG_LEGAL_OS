// Financeiro — contratos de honorários, timesheet, faturas, dashboard

const { useState: useStateF } = React;

function FinanceView() {
  const D = window.JGG_DATA;
  const [tab, setTab] = useStateF('overview');

  const receitaPrevista = D.honorarios.reduce((s, h) => {
    if (h.tipo === 'fixo_mensal') return s + (h.valor || 0);
    if (h.tipo === 'hora') return s + (h.valor * (h.horasMes || 0));
    return s;
  }, 0);

  const aReceberExito = D.honorarios.filter(h => h.tipo === 'exito').reduce((s, h) => s + (h.estimativa || 0), 0);

  const receitaMes = D.faturas.filter(f => f.status === 'pago' && f.mes === '2026-04').reduce((s, f) => s + f.valor, 0);
  const pendente = D.faturas.filter(f => f.status === 'pendente').reduce((s, f) => s + f.valor, 0);
  const atrasado = D.faturas.filter(f => f.status === 'atrasado').reduce((s, f) => s + f.valor, 0);

  return (
    <div style={{padding: 24, maxWidth: 1480, margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18}}>
        <div>
          <h1 style={{fontSize: 22, marginBottom: 4}}>Financeiro</h1>
          <div style={{fontSize: 12, color: 'var(--fg-muted)'}}>
            Honorários · Timesheet · Faturamento · integrado com Asaas
          </div>
        </div>
        <div style={{display: 'flex', gap: 8}}>
          <button className="btn">📊 Exportar</button>
          <button className="btn btn-primary">+ Novo contrato</button>
        </div>
      </div>

      <div style={{display: 'flex', gap: 4, borderBottom: '1px solid var(--border-default)', marginBottom: 18}}>
        {[
          { id: 'overview', l: 'Visão geral' },
          { id: 'contratos', l: `Contratos · ${D.honorarios.length}` },
          { id: 'timesheet', l: 'Timesheet' },
          { id: 'faturas', l: `Faturas · ${D.faturas.length}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 14px', background: 'transparent', border: 'none',
            borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t.id ? 'var(--accent)' : 'var(--fg-muted)',
            fontSize: 13, fontWeight: tab === t.id ? 600 : 500, cursor: 'pointer',
            fontFamily: 'inherit', marginBottom: -1,
          }}>{t.l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16}}>
            <Kpi label="Receita Abr/2026" value={fmtBRLk(receitaMes + 230000)} sub="Realizado · 113% da meta" trend="+27%" accent="var(--status-success)" />
            <Kpi label="Receita prev. mensal" value={fmtBRLk(receitaPrevista + 26500)} sub="Recorrente fixo" accent="var(--jgg-navy-700)" />
            <Kpi label="Êxito a receber" value={fmtBRLk(aReceberExito)} sub={`${D.honorarios.filter(h => h.tipo === 'exito').length} contratos por êxito`} accent="var(--gold)" />
            <Kpi label="Inadimplência" value={fmtBRL(atrasado)} sub={`${D.faturas.filter(f => f.status === 'atrasado').length} fatura em atraso`} accent="var(--status-danger)" />
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 16}}>
            <ReceitaChart />
            <ReceitaPorArea />
          </div>

          <FaturasRecentes />
        </>
      )}
      {tab === 'contratos' && <ContratosTab />}
      {tab === 'timesheet' && <TimesheetTab />}
      {tab === 'faturas' && <FaturasFull />}
    </div>
  );
}

function ReceitaChart() {
  const meses = [
    { l: 'Nov/25', prev: 195, real: 178 },
    { l: 'Dez/25', prev: 195, real: 215 },
    { l: 'Jan/26', prev: 200, real: 156 },
    { l: 'Fev/26', prev: 200, real: 210 },
    { l: 'Mar/26', prev: 220, real: 195 },
    { l: 'Abr/26', prev: 220, real: 248 },
  ];
  const max = 280;
  return (
    <div className="surface" style={{padding: 18}}>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 18}}>
        <h3 style={{fontSize: 15}}>Receita: previsto × realizado</h3>
        <div style={{display: 'flex', gap: 12, fontSize: 11, color: 'var(--fg-muted)'}}>
          <span><span style={{display: 'inline-block', width: 10, height: 10, background: 'var(--jgg-navy-300, #b2c4d6)', borderRadius: 2, marginRight: 4}} />Previsto</span>
          <span><span style={{display: 'inline-block', width: 10, height: 10, background: 'var(--accent)', borderRadius: 2, marginRight: 4}} />Realizado</span>
        </div>
      </div>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 18, height: 200, marginBottom: 12}}>
        {meses.map(m => (
          <div key={m.l} style={{flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: '100%'}}>
            <div title={`Previsto: R$ ${m.prev}k`} style={{width: 16, height: `${(m.prev/max)*100}%`, background: 'var(--border-strong)', borderRadius: '3px 3px 0 0', position: 'relative'}}>
            </div>
            <div title={`Realizado: R$ ${m.real}k`} style={{width: 16, height: `${(m.real/max)*100}%`, background: m.real >= m.prev ? 'var(--status-success)' : 'var(--accent)', borderRadius: '3px 3px 0 0', position: 'relative'}}>
              <div style={{position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 600, color: 'var(--fg-strong)', whiteSpace: 'nowrap'}}>{m.real}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{display: 'flex', gap: 18}}>
        {meses.map(m => (
          <div key={m.l} style={{flex: 1, textAlign: 'center', fontSize: 10.5, color: 'var(--fg-muted)'}}>{m.l}</div>
        ))}
      </div>
    </div>
  );
}

function ReceitaPorArea() {
  const dados = [
    { area: 'Bancário', valor: 142, cor: 'var(--jgg-bordo-700)' },
    { area: 'Agrário', valor: 64, cor: 'var(--jgg-navy-700)' },
    { area: 'Tributário', valor: 42, cor: 'var(--jgg-gold-700)' },
  ];
  const total = dados.reduce((s, d) => s + d.valor, 0);
  return (
    <div className="surface" style={{padding: 18}}>
      <h3 style={{fontSize: 15, marginBottom: 18}}>Receita por área (Abr)</h3>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 160}}>
        <svg width={160} height={160} viewBox="0 0 160 160">
          {(() => {
            let acc = 0;
            return dados.map(d => {
              const frac = d.valor / total;
              const start = acc * 2 * Math.PI - Math.PI / 2;
              acc += frac;
              const end = acc * 2 * Math.PI - Math.PI / 2;
              const large = frac > 0.5 ? 1 : 0;
              const x1 = 80 + 64 * Math.cos(start);
              const y1 = 80 + 64 * Math.sin(start);
              const x2 = 80 + 64 * Math.cos(end);
              const y2 = 80 + 64 * Math.sin(end);
              return <path key={d.area} d={`M 80 80 L ${x1} ${y1} A 64 64 0 ${large} 1 ${x2} ${y2} Z`} fill={d.cor} stroke="white" strokeWidth={2} />;
            });
          })()}
          <circle cx={80} cy={80} r={36} fill="var(--bg-surface)" />
          <text x={80} y={75} textAnchor="middle" fontSize={11} fill="var(--fg-muted)">Total</text>
          <text x={80} y={92} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg-strong)">{fmtBRLk(total * 1000)}</text>
        </svg>
      </div>
      <div style={{marginTop: 10}}>
        {dados.map(d => (
          <div key={d.area} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12.5}}>
            <div style={{width: 10, height: 10, background: d.cor, borderRadius: 2}} />
            <span style={{flex: 1, color: 'var(--fg-default)'}}>{d.area}</span>
            <span style={{color: 'var(--fg-muted)', fontVariantNumeric: 'tabular-nums'}}>{((d.valor/total)*100).toFixed(0)}%</span>
            <span style={{minWidth: 60, textAlign: 'right', fontWeight: 500, fontVariantNumeric: 'tabular-nums'}}>R$ {d.valor}k</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaturasRecentes() {
  const D = window.JGG_DATA;
  return (
    <div className="surface" style={{padding: 0, overflow: 'hidden'}}>
      <div style={{padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between'}}>
        <h3 style={{fontSize: 15}}>Faturas recentes</h3>
        <button className="btn btn-ghost" style={{fontSize: 12}}>Ver todas →</button>
      </div>
      <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
        <thead>
          <tr style={{background: 'var(--bg-surface-2)'}}>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500}}>Cliente</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 100}}>Mês</th>
            <th style={{textAlign: 'right', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 130}}>Valor</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 120}}>Vencimento</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 100}}>Status</th>
          </tr>
        </thead>
        <tbody>
          {D.faturas.map(f => {
            const cli = D.clientes.find(c => c.id === f.cliente);
            return (
              <tr key={f.id} style={{borderBottom: '1px solid var(--border-subtle)'}}>
                <td style={{padding: '10px 14px', fontWeight: 500, color: 'var(--fg-strong)'}}>{cli?.nome}</td>
                <td style={{padding: '10px 14px', color: 'var(--fg-muted)'}}>{f.mes}</td>
                <td style={{padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500}}>{fmtBRL(f.valor)}</td>
                <td style={{padding: '10px 14px', color: 'var(--fg-muted)'}}>{fmtDate(f.vencimento)}</td>
                <td style={{padding: '10px 14px'}}>
                  <span className={`chip chip-${f.status === 'pago' ? 'success' : f.status === 'pendente' ? 'warn' : 'danger'}`}>{f.status}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ContratosTab() {
  const D = window.JGG_DATA;
  return (
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14}}>
      {D.honorarios.map(h => {
        const cli = D.clientes.find(c => c.id === h.cliente);
        const proc = D.processos.find(p => p.id === h.processo);
        return (
          <div key={h.id} className="surface" style={{padding: 16}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
              <span className={`chip ${h.tipo === 'exito' ? 'chip-gold' : h.tipo === 'fixo_mensal' ? 'chip-info' : h.tipo === 'hora' ? 'chip-accent' : 'chip-success'}`}>
                {h.tipo === 'exito' ? `Êxito ${h.percentual}%` : h.tipo === 'fixo_mensal' ? `Fixo ${fmtBRLk(h.valor)}` : h.tipo === 'hora' ? `Hora ${fmtBRL(h.valor)}/h` : 'Combinado'}
              </span>
              <span className="chip chip-success" style={{fontSize: 10}}>● Vigente</span>
            </div>
            <div style={{fontSize: 14, fontWeight: 500, color: 'var(--fg-strong)', marginBottom: 4}}>{cli?.nome}</div>
            <div style={{fontSize: 11.5, color: 'var(--fg-muted)', marginBottom: 12}}>
              {proc?.tipo} · <span style={{fontFamily: 'var(--font-mono)'}}>{proc?.cnj}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-subtle)'}}>
              <div>
                <div style={{fontSize: 10, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>{h.estimativa ? 'Estimativa' : h.proximaParcela ? 'Próxima parcela' : 'Modalidade'}</div>
                <div style={{fontSize: 16, fontWeight: 600, color: 'var(--fg-strong)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-serif)'}}>
                  {h.estimativa ? fmtBRLk(h.estimativa) : h.proximaParcela ? fmtDate(h.proximaParcela) : '—'}
                </div>
              </div>
              <button className="btn">Ver detalhes →</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimesheetTab() {
  const D = window.JGG_DATA;
  const horas = [
    { adv: 'adv-1', proc: 'proc-1', data: '2026-04-26', horas: 3.5, atividade: 'Análise pericial e elaboração de razões finais' },
    { adv: 'adv-1', proc: 'proc-10', data: '2026-04-26', horas: 4.0, atividade: 'Cautelar de sustação — petição inicial' },
    { adv: 'adv-2', proc: 'proc-7', data: '2026-04-25', horas: 2.5, atividade: 'Réplica à contestação Santander' },
    { adv: 'adv-3', proc: 'proc-5', data: '2026-04-25', horas: 5.0, atividade: 'Razões finais Itaú · revisão e protocolo' },
    { adv: 'adv-1', proc: 'proc-4', data: '2026-04-24', horas: 1.5, atividade: 'Manifestação sobre laudo ICMS-ST' },
    { adv: 'adv-4', proc: 'proc-3', data: '2026-04-24', horas: 3.0, atividade: 'Quesitos do laudo de avaliação INCRA' },
    { adv: 'adv-3', proc: 'proc-2', data: '2026-04-23', horas: 4.5, atividade: 'Recurso de apelação Bradesco' },
    { adv: 'adv-5', proc: 'proc-1', data: '2026-04-23', horas: 6.0, atividade: 'Conta gráfica — atualização e simulação' },
  ];
  const totais = {};
  horas.forEach(h => totais[h.adv] = (totais[h.adv] || 0) + h.horas);

  return (
    <div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14}}>
        {Object.entries(totais).map(([advId, total]) => {
          const adv = D.advogados.find(a => a.id === advId);
          return (
            <div key={advId} className="surface" style={{padding: 12, display: 'flex', alignItems: 'center', gap: 10}}>
              <div style={{width: 32, height: 32, borderRadius: '50%', background: adv?.cor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600}}>{adv?.avatar}</div>
              <div>
                <div style={{fontSize: 11, color: 'var(--fg-muted)'}}>{adv?.nome.split(' ').slice(-1)[0]}</div>
                <div style={{fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-serif)', color: 'var(--fg-strong)'}}>{total}h</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface" style={{padding: 0, overflow: 'hidden'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
          <thead>
            <tr style={{background: 'var(--bg-surface-2)'}}>
              <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 110}}>Data</th>
              <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 130}}>Advogado</th>
              <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500}}>Atividade</th>
              <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 200}}>Processo</th>
              <th style={{textAlign: 'right', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 80}}>Horas</th>
            </tr>
          </thead>
          <tbody>
            {horas.map((h, i) => {
              const adv = D.advogados.find(a => a.id === h.adv);
              const proc = D.processos.find(p => p.id === h.proc);
              const cli = D.clientes.find(c => c.id === proc?.cliente);
              return (
                <tr key={i} style={{borderBottom: '1px solid var(--border-subtle)'}}>
                  <td style={{padding: '10px 14px', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 11.5}}>{fmtDate(h.data)}</td>
                  <td style={{padding: '10px 14px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                      <div style={{width: 20, height: 20, borderRadius: '50%', background: adv?.cor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600}}>{adv?.avatar}</div>
                      <span style={{fontSize: 12}}>{adv?.nome.replace('Dr. ', '').replace('Dra. ', '').split(' ')[0]}</span>
                    </div>
                  </td>
                  <td style={{padding: '10px 14px', color: 'var(--fg-default)'}}>{h.atividade}</td>
                  <td style={{padding: '10px 14px'}}>
                    <div style={{fontSize: 12, color: 'var(--fg-default)'}}>{cli?.nome.slice(0, 30)}</div>
                    <div style={{fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-muted)'}}>{proc?.cnj.slice(-12)}</div>
                  </td>
                  <td style={{padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontFamily: 'var(--font-mono)'}}>{h.horas.toFixed(1)}h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FaturasFull() {
  return <FaturasRecentes />;
}

Object.assign(window, { FinanceView });
