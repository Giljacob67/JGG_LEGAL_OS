// Processos — lista densa + tela de processo split-view com timeline DataJud

const { useState: useStateP } = React;

function ProcessesView({ density, processView, navigate }) {
  const D = window.JGG_DATA;
  const [selected, setSelected] = useStateP(D.processos[0].id);
  const [filterArea, setFilterArea] = useStateP('todas');
  const [filterTese, setFilterTese] = useStateP(false);

  let processos = D.processos;
  if (filterArea !== 'todas') processos = processos.filter(p => p.area === filterArea);
  if (filterTese) processos = processos.filter(p => p.tagMataMata);

  if (processView === 'split') {
    const proc = D.processos.find(p => p.id === selected);
    return (
      <div style={{display: 'grid', gridTemplateColumns: '420px 1fr', height: 'calc(100vh - 56px)'}}>
        <div style={{borderRight: '1px solid var(--border-subtle)', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
          <ProcessListHeader filterArea={filterArea} setFilterArea={setFilterArea} filterTese={filterTese} setFilterTese={setFilterTese} count={processos.length} compact />
          <div style={{flex: 1, overflowY: 'auto'}}>
            {processos.map(p => (
              <ProcessRowCompact key={p.id} proc={p} active={p.id === selected} onClick={() => setSelected(p.id)} />
            ))}
          </div>
        </div>
        <div style={{overflowY: 'auto'}}>
          <ProcessDetail proc={proc} navigate={navigate} />
        </div>
      </div>
    );
  }

  return (
    <div style={{padding: 24, maxWidth: 1480, margin: '0 auto'}}>
      <ProcessListHeader filterArea={filterArea} setFilterArea={setFilterArea} filterTese={filterTese} setFilterTese={setFilterTese} count={processos.length} />
      <div className="surface" style={{padding: 0, overflow: 'hidden', marginTop: 14}}>
        <ProcessTable processos={processos} density={density} onSelect={(id) => { setSelected(id); navigate('process-detail'); }} />
      </div>
      {/* Selected expanded inline */}
      <div style={{marginTop: 18}}>
        <ProcessDetail proc={D.processos.find(p => p.id === selected)} navigate={navigate} />
      </div>
    </div>
  );
}

function ProcessListHeader({ filterArea, setFilterArea, filterTese, setFilterTese, count, compact }) {
  return (
    <div style={{padding: compact ? '14px 16px' : '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 10, borderBottom: compact ? '1px solid var(--border-subtle)' : 'none'}}>
      {!compact && <div style={{flex: 0}}>
        <h1 style={{fontSize: 22, marginBottom: 2}}>Processos</h1>
        <div style={{fontSize: 12, color: 'var(--fg-muted)'}}>{count} processos · sincronizado com DataJud há 4 minutos</div>
      </div>}
      {compact && <input className="input" placeholder="Buscar CNJ, cliente, banco…" style={{flex: 1}} />}
      {!compact && <div style={{flex: 1}} />}
      <div style={{display: 'flex', gap: 6}}>
        {['todas', 'Bancário', 'Agrário', 'Tributário'].map(a => (
          <button key={a} onClick={() => setFilterArea(a)}
            className="chip"
            style={{
              cursor: 'pointer',
              background: filterArea === a ? 'var(--accent)' : undefined,
              color: filterArea === a ? 'white' : undefined,
              borderColor: filterArea === a ? 'var(--accent)' : undefined,
              padding: '5px 11px',
            }}>{a === 'todas' ? 'Todas' : a}</button>
        ))}
      </div>
      <button onClick={() => setFilterTese(!filterTese)} className="chip" style={{
        cursor: 'pointer',
        background: filterTese ? 'var(--gold-soft)' : undefined,
        color: filterTese ? 'var(--gold)' : undefined,
        borderColor: filterTese ? 'var(--gold)' : undefined,
        padding: '5px 11px',
      }}>★ Mata-Mata</button>
      {!compact && <button className="btn btn-primary">+ Novo</button>}
    </div>
  );
}

function ProcessTable({ processos, density, onSelect }) {
  const D = window.JGG_DATA;
  const rowH = density === 'compact' ? 36 : 52;
  return (
    <div style={{overflow: 'auto'}}>
      <table style={{width: '100%', borderCollapse: 'collapse', fontSize: density === 'compact' ? 12 : 13}}>
        <thead>
          <tr style={{background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-subtle)'}}>
            <th style={th()}>CNJ</th>
            <th style={th()}>Cliente</th>
            <th style={th()}>Adverso</th>
            <th style={th()}>Tipo / Tese</th>
            <th style={{...th(), width: 70}}>Área</th>
            <th style={{...th(), width: 100}}>Tribunal</th>
            <th style={{...th(), width: 110, textAlign: 'right'}}>Valor</th>
            <th style={{...th(), width: 90}}>Risco</th>
            <th style={{...th(), width: 110}}>Próx. prazo</th>
            <th style={{...th(), width: 80}}>Resp.</th>
          </tr>
        </thead>
        <tbody>
          {processos.map(p => {
            const cli = D.clientes.find(c => c.id === p.cliente);
            const adv = D.advogados.find(a => a.id === p.responsavel);
            const dias = (new Date(p.proximoPrazo) - new Date(D.today)) / 86400000;
            return (
              <tr key={p.id} onClick={() => onSelect(p.id)} style={{
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                height: rowH,
              }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                 onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{...td(), fontFamily: 'var(--font-mono)', fontSize: density === 'compact' ? 11 : 11.5, color: 'var(--fg-muted)'}}>
                  {p.tagMataMata && <span style={{color: 'var(--gold)', marginRight: 4}}>★</span>}
                  {p.cnj}
                </td>
                <td style={{...td(), fontWeight: 500, color: 'var(--fg-strong)'}}>{cli?.nome.length > 32 ? cli.nome.slice(0, 30) + '…' : cli?.nome}</td>
                <td style={td()}>{p.adverso}</td>
                <td style={{...td(), color: 'var(--fg-muted)'}}>{p.tese}</td>
                <td style={td()}><span className={`chip ${p.area === 'Bancário' ? 'chip-accent' : p.area === 'Agrário' ? 'chip-info' : 'chip-gold'}`}>{p.area}</span></td>
                <td style={{...td(), color: 'var(--fg-muted)'}}>{p.tribunal}</td>
                <td style={{...td(), textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500}}>{fmtBRLk(p.valor)}</td>
                <td style={td()}><span className={`chip chip-${p.risco === 'alto' ? 'danger' : p.risco === 'medio' ? 'warn' : 'success'}`}>{p.risco}</span></td>
                <td style={{...td(), color: dias <= 3 ? 'var(--status-danger)' : 'var(--fg-default)', fontWeight: dias <= 3 ? 600 : 400}}>
                  {dias === 0 ? 'HOJE' : `${Math.round(dias)}d`}
                </td>
                <td style={td()}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: adv?.cor, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600,
                  }}>{adv?.avatar}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
const th = () => ({textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em'});
const td = () => ({padding: '8px 14px', verticalAlign: 'middle'});

function ProcessRowCompact({ proc, active, onClick }) {
  const D = window.JGG_DATA;
  const cli = D.clientes.find(c => c.id === proc.cliente);
  const dias = (new Date(proc.proximoPrazo) - new Date(D.today)) / 86400000;
  return (
    <div onClick={onClick} style={{
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-subtle)',
      cursor: 'pointer',
      background: active ? 'var(--accent-soft)' : 'transparent',
      borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
    }}>
      <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4}}>
        {proc.tagMataMata && <span style={{color: 'var(--gold)', fontSize: 11}}>★</span>}
        <span style={{fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-muted)'}}>{proc.cnj}</span>
        <span style={{flex: 1}} />
        <span className={`chip chip-${proc.risco === 'alto' ? 'danger' : proc.risco === 'medio' ? 'warn' : 'success'}`} style={{fontSize: 9}}>{proc.risco}</span>
      </div>
      <div style={{fontSize: 13, fontWeight: 500, color: 'var(--fg-strong)', marginBottom: 2}}>{cli?.nome}</div>
      <div style={{fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4}}>{proc.tipo}</div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11}}>
        <span style={{color: 'var(--fg-muted)'}}>{proc.adverso} · {proc.tribunal}</span>
        <span style={{color: dias <= 3 ? 'var(--status-danger)' : 'var(--fg-muted)', fontWeight: dias <= 3 ? 600 : 400}}>
          {dias === 0 ? 'HOJE' : `${Math.round(dias)}d`}
        </span>
      </div>
    </div>
  );
}

function ProcessDetail({ proc, navigate }) {
  if (!proc) return null;
  const D = window.JGG_DATA;
  const [tab, setTab] = useStateP('overview');
  const cli = D.clientes.find(c => c.id === proc.cliente);
  const adv = D.advogados.find(a => a.id === proc.responsavel);
  const andamentos = D.andamentos.filter(a => a.processo === proc.id).reverse();
  const docs = D.documentos.filter(d => d.processo === proc.id);
  const cadeia = D.cadeiaMataMata.filter(c => c.processo === proc.id);

  return (
    <div style={{padding: 24}}>
      {/* Header */}
      <div style={{marginBottom: 20}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: 'var(--fg-muted)'}}>
          <span style={{fontFamily: 'var(--font-mono)'}}>{proc.cnj}</span>
          <span>·</span>
          <span>{proc.tribunal} · {proc.vara} · {proc.comarca}</span>
          {proc.tagMataMata && (
            <>
              <span>·</span>
              <span className="chip chip-gold" style={{fontSize: 10}}>★ TESE MATA-MATA</span>
            </>
          )}
        </div>
        <h1 style={{fontSize: 24, marginBottom: 6}}>{cli?.nome} <span style={{color: 'var(--fg-muted)', fontWeight: 400}}>×</span> {proc.adverso}</h1>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: 'var(--fg-muted)'}}>
          <span>{proc.tipo}</span>
          <span>·</span>
          <span style={{color: 'var(--fg-strong)', fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{fmtBRL(proc.valor)}</span>
          <span>·</span>
          <span className={`chip chip-${proc.risco === 'alto' ? 'danger' : proc.risco === 'medio' ? 'warn' : 'success'}`}>risco {proc.risco}</span>
          <span style={{flex: 1}} />
          <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
            <div style={{width: 22, height: 22, borderRadius: '50%', background: adv?.cor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 600}}>{adv?.avatar}</div>
            <span style={{color: 'var(--fg-default)'}}>{adv?.nome}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display: 'flex', gap: 4, borderBottom: '1px solid var(--border-default)', marginBottom: 20}}>
        {[
          { id: 'overview', l: 'Visão geral' },
          { id: 'timeline', l: `Andamentos · ${andamentos.length}` },
          { id: 'docs', l: `Documentos · ${docs.length}` },
          { id: 'matamata', l: 'Cadeia Mata-Mata', badge: cadeia.length, hide: !proc.tagMataMata },
          { id: 'finance', l: 'Honorários' },
          { id: 'partes', l: 'Partes & Advogados' },
        ].filter(t => !t.hide).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 14px', background: 'transparent',
            border: 'none', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t.id ? 'var(--accent)' : 'var(--fg-muted)',
            fontSize: 13, fontWeight: tab === t.id ? 600 : 500, cursor: 'pointer',
            fontFamily: 'inherit', marginBottom: -1,
          }}>
            {t.l}
            {t.badge && <span style={{marginLeft: 6, padding: '1px 6px', background: 'var(--gold-soft)', color: 'var(--gold)', borderRadius: 999, fontSize: 10}}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab proc={proc} cli={cli} navigate={navigate} />}
      {tab === 'timeline' && <TimelineTab andamentos={andamentos} />}
      {tab === 'docs' && <DocsTab docs={docs} />}
      {tab === 'matamata' && <MataMataTab cadeia={cadeia} navigate={navigate} />}
      {tab === 'finance' && <ProcessFinanceTab proc={proc} />}
      {tab === 'partes' && <PartesTab proc={proc} cli={cli} />}
    </div>
  );
}

function OverviewTab({ proc, cli, navigate }) {
  const D = window.JGG_DATA;
  const adv = D.advogados.find(a => a.id === proc.responsavel);
  const equipe = proc.equipe.map(id => D.advogados.find(a => a.id === id));

  return (
    <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16}}>
      <div className="surface" style={{padding: 20}}>
        <h3 style={{fontSize: 15, marginBottom: 12}}>Tese e estratégia</h3>
        <p style={{fontSize: 13.5, color: 'var(--fg-default)', lineHeight: 1.6, marginBottom: 14}}>
          <b style={{color: 'var(--fg-strong)'}}>{proc.tese}.</b> {proc.tagMataMata && (
            <>
              Identificada cadeia de 3 contratos encadeados (CCB nº 40/00451-X, 40/00712-Y e 40/00892-X) entre 2019 e 2023, com liberação de crédito seguida de débito quase imediato para liquidação de operação anterior, configurando <i>simulação contábil</i> e desvio de finalidade do crédito rural.
            </>
          )}
        </p>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
          <span className="chip chip-info">Art. 166 CC</span>
          <span className="chip chip-info">Art. 167 CC</span>
          <span className="chip chip-accent">Súm. 286 STJ</span>
          <span className="chip chip-accent">Súm. 298 STJ</span>
          <span className="chip chip-accent">Súm. 176 STJ</span>
          <span className="chip chip-gold">REsp 1.061.530/RS</span>
        </div>
        <div style={{marginTop: 16, padding: 14, background: 'var(--gold-soft)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12}}>
          <Icon name="ia" size={20} />
          <div style={{flex: 1, fontSize: 12.5, color: 'var(--fg-default)'}}>
            <b style={{color: 'var(--fg-strong)'}}>Sugestão da IA Jurídica:</b> minuta de razões finais já estruturada a partir do laudo pericial e da cadeia Mata-Mata identificada.
          </div>
          <button onClick={() => navigate('ia')} className="btn btn-primary" style={{fontSize: 12}}>Abrir Assistente →</button>
        </div>
      </div>

      <div className="surface" style={{padding: 20}}>
        <h3 style={{fontSize: 15, marginBottom: 14}}>Resumo</h3>
        <Row k="Cliente" v={cli?.nome} />
        <Row k="Tipo de ação" v={proc.tipo} />
        <Row k="Distribuído em" v={fmtDate(proc.distribuicao)} />
        <Row k="Valor da causa" v={fmtBRL(proc.valor)} bold />
        <Row k="Próximo prazo" v={fmtDate(proc.proximoPrazo)} alert />
        <Row k="Status" v={proc.status === 'em_andamento' ? 'Em andamento' : proc.status} />

        <div style={{marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)'}}>
          <div style={{fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8}}>Equipe</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
            <div style={{width: 28, height: 28, borderRadius: '50%', background: adv?.cor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600}}>{adv?.avatar}</div>
            <div>
              <div style={{fontSize: 12.5, fontWeight: 500}}>{adv?.nome}</div>
              <div style={{fontSize: 11, color: 'var(--fg-muted)'}}>Responsável principal</div>
            </div>
          </div>
          {equipe.map(e => (
            <div key={e.id} style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6}}>
              <div style={{width: 22, height: 22, borderRadius: '50%', background: e.cor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 600}}>{e.avatar}</div>
              <div style={{fontSize: 12, color: 'var(--fg-default)'}}>{e.nome}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const Row = ({ k, v, bold, alert }) => (
  <div style={{display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 12.5, borderBottom: '1px solid var(--border-subtle)'}}>
    <span style={{color: 'var(--fg-muted)'}}>{k}</span>
    <span style={{
      color: alert ? 'var(--status-danger)' : 'var(--fg-strong)',
      fontWeight: bold || alert ? 600 : 400,
      textAlign: 'right',
      fontVariantNumeric: 'tabular-nums',
    }}>{v}</span>
  </div>
);

function TimelineTab({ andamentos }) {
  return (
    <div className="surface" style={{padding: 20}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18}}>
        <h3 style={{fontSize: 15}}>Andamentos processuais</h3>
        <span className="chip chip-success" style={{fontSize: 10}}>● DataJud sincronizado · 4min atrás</span>
        <span style={{flex: 1}} />
        <button className="btn" style={{fontSize: 12}}>+ Andamento manual</button>
      </div>
      <div style={{position: 'relative', paddingLeft: 24}}>
        <div style={{position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: 'var(--border-default)'}} />
        {andamentos.map((a, i) => (
          <div key={a.id} style={{position: 'relative', paddingBottom: 18}}>
            <div style={{
              position: 'absolute', left: -23, top: 4, width: 14, height: 14, borderRadius: '50%',
              background: a.critico ? 'var(--accent)' : 'var(--bg-surface)',
              border: `2px solid ${a.critico ? 'var(--accent)' : 'var(--border-strong)'}`,
            }} />
            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4}}>
              <span style={{fontSize: 12, fontWeight: 500, color: 'var(--fg-strong)'}}>{a.evento}</span>
              {a.critico && <span className="chip chip-danger" style={{fontSize: 9}}>crítico</span>}
              <span className="chip" style={{fontSize: 9}}>{a.fonte}</span>
              <span style={{flex: 1}} />
              <span style={{fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)'}}>
                {fmtDate(a.data)} · {a.hora}
              </span>
            </div>
            <div style={{fontSize: 13, color: 'var(--fg-default)', lineHeight: 1.5}}>{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocsTab({ docs }) {
  return (
    <div className="surface" style={{padding: 0, overflow: 'hidden'}}>
      <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
        <thead>
          <tr style={{background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-subtle)'}}>
            <th style={th()}>Documento</th>
            <th style={{...th(), width: 120}}>Tipo</th>
            <th style={{...th(), width: 70}}>Versão</th>
            <th style={{...th(), width: 100}}>Tamanho</th>
            <th style={{...th(), width: 110}}>Data</th>
            <th style={{...th(), width: 130}}>Tag</th>
          </tr>
        </thead>
        <tbody>
          {docs.map(d => (
            <tr key={d.id} style={{borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer'}}>
              <td style={{...td(), fontWeight: 500, color: 'var(--fg-strong)'}}>📄 {d.nome}</td>
              <td style={td()}><span className="chip">{d.tipo}</span></td>
              <td style={{...td(), fontVariantNumeric: 'tabular-nums', color: 'var(--fg-muted)'}}>v{d.versao}</td>
              <td style={{...td(), color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 11.5}}>{d.tamanho}</td>
              <td style={{...td(), color: 'var(--fg-muted)'}}>{fmtDate(d.data)}</td>
              <td style={td()}><span className={`chip ${d.tag === 'mata-mata' ? 'chip-gold' : 'chip-info'}`}>{d.tag}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MataMataTab({ cadeia, navigate }) {
  return (
    <div>
      <div style={{padding: 16, background: 'var(--gold-soft)', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 14}}>
        <div style={{fontSize: 24}}>★</div>
        <div style={{flex: 1}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'var(--fg-strong)', marginBottom: 4}}>Padrão Mata-Mata identificado</div>
          <div style={{fontSize: 12.5, color: 'var(--fg-default)', lineHeight: 1.5}}>
            Cadeia de 3 contratos encadeados (2019, 2021, 2023) com simulação contábil em 2 deles. Apenas <b>15,7% a 26%</b> do crédito ficou efetivamente disponível ao produtor — o restante foi imediatamente debitado para liquidação de operações anteriores.
          </div>
        </div>
        <button onClick={() => navigate('ia')} className="btn btn-primary" style={{alignSelf: 'center'}}>Gerar Tese →</button>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        {cadeia.map((c, i) => (
          <div key={c.id} className="surface" style={{padding: 18, borderLeft: c.anomalia ? '4px solid var(--status-danger)' : '4px solid var(--status-success)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10}}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: c.anomalia ? 'var(--status-danger)' : 'var(--status-success)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
              }}>{c.ordem}</div>
              <div style={{flex: 1}}>
                <div style={{fontSize: 14, fontWeight: 600, color: 'var(--fg-strong)'}}>{c.contrato}</div>
                <div style={{fontSize: 11.5, color: 'var(--fg-muted)'}}>{fmtDate(c.data)} · {c.taxa}</div>
              </div>
              <div style={{fontSize: 18, fontFamily: 'var(--font-serif)', fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{fmtBRL(c.valor)}</div>
              {c.anomalia && <span className="chip chip-danger">⚠ ANOMALIA</span>}
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 12.5}}>
              <div>
                <div style={{fontSize: 10.5, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3}}>Finalidade declarada</div>
                <div style={{color: 'var(--fg-default)'}}>{c.finalidadeDeclarada}</div>
              </div>
              <div>
                <div style={{fontSize: 10.5, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3}}>Destinação real</div>
                <div style={{color: c.anomalia ? 'var(--status-danger)' : 'var(--fg-default)', fontWeight: c.anomalia ? 500 : 400}}>{c.destinacaoReal}</div>
              </div>
            </div>
            {c.anomaliaDesc && (
              <div style={{marginTop: 10, padding: 10, background: 'var(--status-danger-bg)', borderRadius: 6, fontSize: 12, color: 'var(--status-danger)'}}>
                <b>Indício de simulação:</b> {c.anomaliaDesc}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessFinanceTab({ proc }) {
  const D = window.JGG_DATA;
  const hon = D.honorarios.find(h => h.processo === proc.id);
  return (
    <div className="surface" style={{padding: 20}}>
      <h3 style={{fontSize: 15, marginBottom: 14}}>Contrato de honorários</h3>
      {!hon && <div style={{color: 'var(--fg-muted)'}}>Sem contrato vinculado.</div>}
      {hon && (
        <>
          <Row k="Modalidade" v={hon.tipo === 'exito' ? `Por êxito (${hon.percentual}%)` : hon.tipo === 'fixo_mensal' ? `Fixo mensal · ${fmtBRL(hon.valor)}` : hon.tipo === 'hora' ? `Por hora · ${fmtBRL(hon.valor)}/h` : 'Combinado'} />
          {hon.estimativa && <Row k="Estimativa de honorários" v={fmtBRL(hon.estimativa)} bold />}
          <Row k="Status" v={hon.status} />
          {hon.proximaParcela && <Row k="Próxima cobrança" v={fmtDate(hon.proximaParcela)} />}
        </>
      )}
    </div>
  );
}

function PartesTab({ proc, cli }) {
  return (
    <div className="surface" style={{padding: 20}}>
      <h3 style={{fontSize: 15, marginBottom: 14}}>Partes envolvidas</h3>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
        <div style={{padding: 14, background: 'var(--bg-surface-2)', borderRadius: 8}}>
          <div style={{fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6}}>Embargante / Autor</div>
          <div style={{fontSize: 14, fontWeight: 500, color: 'var(--fg-strong)', marginBottom: 4}}>{cli?.nome}</div>
          <div style={{fontSize: 12, color: 'var(--fg-muted)'}}>{cli?.cpfCnpj} · {cli?.cidade}</div>
        </div>
        <div style={{padding: 14, background: 'var(--bg-surface-2)', borderRadius: 8}}>
          <div style={{fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6}}>Embargado / Réu</div>
          <div style={{fontSize: 14, fontWeight: 500, color: 'var(--fg-strong)', marginBottom: 4}}>{proc.adverso}</div>
          <div style={{fontSize: 12, color: 'var(--fg-muted)'}}>Instituição financeira / Adverso</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProcessesView });
