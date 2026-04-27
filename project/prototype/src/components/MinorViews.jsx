// Views menores — Clientes, Imóveis, Relatórios (placeholders contextuais)

function ClientesView() {
  const D = window.JGG_DATA;
  return (
    <div style={{padding: 24, maxWidth: 1480, margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18}}>
        <div>
          <h1 style={{fontSize: 22, marginBottom: 4}}>Clientes</h1>
          <div style={{fontSize: 12, color: 'var(--fg-muted)'}}>{D.clientes.length} cadastrados · {D.clientes.filter(c => c.status === 'ativo').length} ativos</div>
        </div>
        <button className="btn btn-primary">+ Novo cliente</button>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12}}>
        {D.clientes.map(c => {
          const procs = D.processos.filter(p => p.cliente === c.id);
          const valor = procs.reduce((s, p) => s + p.valor, 0);
          return (
            <div key={c.id} className="surface" style={{padding: 16, display: 'flex', alignItems: 'flex-start', gap: 14}}>
              <div style={{
                width: 44, height: 44, borderRadius: 8,
                background: c.area === 'Bancário' ? 'var(--accent-soft)' : c.area === 'Agrário' ? 'var(--status-info-bg)' : 'var(--gold-soft)',
                color: c.area === 'Bancário' ? 'var(--accent)' : c.area === 'Agrário' ? 'var(--status-info)' : 'var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 16,
                flexShrink: 0,
              }}>{c.tipo}</div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2}}>
                  <span style={{fontSize: 14, fontWeight: 600, color: 'var(--fg-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{c.nome}</span>
                  {c.status === 'prospecto' && <span className="chip chip-warn" style={{fontSize: 9}}>prospecto</span>}
                </div>
                <div style={{fontSize: 11.5, color: 'var(--fg-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)'}}>{c.cpfCnpj} · {c.cidade}</div>
                <div style={{display: 'flex', gap: 14, fontSize: 11.5}}>
                  <span><b style={{fontFamily: 'var(--font-serif)', fontSize: 14}}>{procs.length}</b> processos</span>
                  <span style={{color: 'var(--fg-muted)'}}>{fmtBRLk(valor)} em litígio</span>
                  <span className={`chip ${c.area === 'Bancário' ? 'chip-accent' : c.area === 'Agrário' ? 'chip-info' : 'chip-gold'}`} style={{fontSize: 9}}>{c.area}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImoveisView() {
  return (
    <div style={{padding: 24, maxWidth: 1480, margin: '0 auto'}}>
      <h1 style={{fontSize: 22, marginBottom: 4}}>Imóveis Rurais</h1>
      <div style={{fontSize: 12, color: 'var(--fg-muted)', marginBottom: 18}}>Matrículas, CAR, NIRF, CCIR · vinculados a clientes e processos</div>
      <div className="surface" style={{padding: 0, overflow: 'hidden'}}>
        <div style={{padding: 12, borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8}}>
          <input className="input" placeholder="Buscar matrícula, comarca, cliente…" style={{maxWidth: 360}} />
          <button className="btn btn-primary" style={{marginLeft: 'auto'}}>+ Imóvel</button>
        </div>
        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
          <thead><tr style={{background: 'var(--bg-surface-2)'}}>
            {['Matrícula', 'Cliente', 'Município/Comarca', 'Área', 'CCIR', 'ITR', 'Processo'].map(h => (
              <th key={h} style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[
              { mat: '12.847', cli: 'Fazenda São João', mun: 'Maringá/PR · CRI 1ª', area: '847 ha', ccir: 'OK · 2026', itr: 'Atrasado', proc: '0008421-55' },
              { mat: '34.219', cli: 'Agrícola Três Marias', mun: 'Sorriso/MT', area: '2.140 ha', ccir: 'OK', itr: 'OK', proc: '1003221-44' },
              { mat: '08.452', cli: 'João Batista Camargo', mun: 'Cascavel/PR', area: '184 ha', ccir: 'Vence em 28d', itr: 'OK', proc: '0042118-90' },
              { mat: '21.097', cli: 'Agropecuária Boa Esperança', mun: 'Campo Mourão/PR', area: '532 ha', ccir: 'OK', itr: 'OK', proc: '0019845-22' },
              { mat: '67.382', cli: 'Antonio Carlos Bernardi', mun: 'Passo Fundo/RS', area: '298 ha', ccir: 'OK · 2027', itr: 'OK', proc: '0033412-19' },
            ].map((r, i) => (
              <tr key={i} style={{borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer'}}>
                <td style={{padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500}}>{r.mat}</td>
                <td style={{padding: '10px 14px'}}>{r.cli}</td>
                <td style={{padding: '10px 14px', color: 'var(--fg-muted)'}}>{r.mun}</td>
                <td style={{padding: '10px 14px', fontVariantNumeric: 'tabular-nums', fontWeight: 500}}>{r.area}</td>
                <td style={{padding: '10px 14px'}}>
                  <span className={`chip ${r.ccir.includes('Vence') ? 'chip-warn' : 'chip-success'}`}>{r.ccir}</span>
                </td>
                <td style={{padding: '10px 14px'}}>
                  <span className={`chip ${r.itr === 'Atrasado' ? 'chip-danger' : 'chip-success'}`}>{r.itr}</span>
                </td>
                <td style={{padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)'}}>{r.proc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{marginTop: 16, padding: 14, background: 'var(--gold-soft)', borderRadius: 8, fontSize: 12.5, color: 'var(--fg-default)', display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{fontSize: 18}}>📍</span>
        <span><b>Mapa</b> de geolocalização Leaflet+OpenStreetMap será integrado nesta tela. Cada imóvel terá pin clicável com ficha resumida e link para processo vinculado.</span>
      </div>
    </div>
  );
}

function RelatoriosView() {
  return (
    <div style={{padding: 24, maxWidth: 1480, margin: '0 auto'}}>
      <h1 style={{fontSize: 22, marginBottom: 4}}>Relatórios & BI</h1>
      <div style={{fontSize: 12, color: 'var(--fg-muted)', marginBottom: 18}}>Dashboards interativos · exportação PDF/Excel · agendamento por email</div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18}}>
        {[
          { ic: '📊', t: 'Produtividade por advogado', d: 'Horas, processos, prazos cumpridos × perdidos, taxa de êxito' },
          { ic: '💰', t: 'Rentabilidade por cliente', d: 'Receita gerada, horas investidas, margem por cliente' },
          { ic: '⚖', t: 'Mata-Mata · pipeline', d: 'Casos em curso, valor agregado, taxa histórica de êxito' },
          { ic: '🏛', t: 'Processos por comarca', d: 'Distribuição geográfica · oportunidades de expansão' },
          { ic: '🏦', t: 'Adversos recorrentes', d: 'Bancos × valor litigioso × taxa de acordo' },
          { ic: '📈', t: 'Faturamento × meta', d: 'Mensal, trimestral, anual · com projeção de êxito' },
        ].map((r, i) => (
          <div key={i} className="surface" style={{padding: 18, cursor: 'pointer'}}>
            <div style={{fontSize: 24, marginBottom: 10}}>{r.ic}</div>
            <div style={{fontSize: 14, fontWeight: 600, color: 'var(--fg-strong)', marginBottom: 4}}>{r.t}</div>
            <div style={{fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5, marginBottom: 12}}>{r.d}</div>
            <div style={{display: 'flex', gap: 6}}>
              <button className="btn" style={{fontSize: 11}}>PDF</button>
              <button className="btn" style={{fontSize: 11}}>Excel</button>
              <button className="btn btn-primary" style={{fontSize: 11, marginLeft: 'auto'}}>Abrir →</button>
            </div>
          </div>
        ))}
      </div>

      <div className="surface" style={{padding: 22}}>
        <h3 style={{fontSize: 15, marginBottom: 14}}>Performance da equipe (Abr/2026)</h3>
        {window.JGG_DATA.advogados.filter(a => a.role !== 'admin').map(a => {
          const procs = window.JGG_DATA.processos.filter(p => p.responsavel === a.id || p.equipe.includes(a.id));
          const valor = procs.reduce((s, p) => s + p.valor, 0);
          const exito = Math.floor(60 + Math.random() * 30);
          return (
            <div key={a.id} style={{display: 'grid', gridTemplateColumns: '180px 80px 100px 1fr 60px', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 12.5}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <div style={{width: 30, height: 30, borderRadius: '50%', background: a.cor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600}}>{a.avatar}</div>
                <div>
                  <div style={{fontWeight: 500, color: 'var(--fg-strong)'}}>{a.nome.replace('Dr. ', '').replace('Dra. ', '')}</div>
                  <div style={{fontSize: 10.5, color: 'var(--fg-muted)'}}>{a.role}</div>
                </div>
              </div>
              <div style={{textAlign: 'center'}}><b style={{fontFamily: 'var(--font-serif)', fontSize: 18}}>{procs.length}</b> proc</div>
              <div style={{textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)'}}>{fmtBRLk(valor)}</div>
              <div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 3, color: 'var(--fg-muted)'}}>
                  <span>Taxa de êxito histórica</span>
                  <span style={{fontWeight: 600, color: 'var(--fg-strong)'}}>{exito}%</span>
                </div>
                <div style={{height: 5, background: 'var(--bg-surface-2)', borderRadius: 3, overflow: 'hidden'}}>
                  <div style={{width: `${exito}%`, height: '100%', background: exito >= 75 ? 'var(--status-success)' : exito >= 60 ? 'var(--gold)' : 'var(--accent)'}} />
                </div>
              </div>
              <div style={{textAlign: 'right'}}>
                <span className={`chip chip-${exito >= 75 ? 'success' : exito >= 60 ? 'gold' : 'warn'}`} style={{fontSize: 10}}>{a.carga}h</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { ClientesView, ImoveisView, RelatoriosView });
