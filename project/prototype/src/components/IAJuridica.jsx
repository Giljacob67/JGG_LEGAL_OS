// IA Jurídica — Assistente Mata-Mata (núcleo do diferencial estratégico)

const { useState: useStateI } = React;

function IAView() {
  const [tab, setTab] = useStateI('mata-mata');

  return (
    <div style={{padding: 0, height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column'}}>
      <div style={{padding: '20px 24px 0 24px', borderBottom: '1px solid var(--border-default)'}}>
        <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16}}>
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4}}>
              <h1 style={{fontSize: 22}}>IA Jurídica</h1>
              <span className="chip chip-gold" style={{fontSize: 10}}>BETA · USO INTERNO</span>
            </div>
            <div style={{fontSize: 12, color: 'var(--fg-muted)'}}>
              Modelos: Claude 3.5 Sonnet (estratégia) + Llama 3.1 70B (Ollama, local) · RAG sobre 12.340 trechos jurisprudenciais · LGPD-safe
            </div>
          </div>
          <div style={{display: 'flex', gap: 8}}>
            <span className="chip chip-success" style={{fontSize: 10}}>● API Anthropic OK</span>
            <span className="chip chip-success" style={{fontSize: 10}}>● Ollama local OK</span>
            <span className="chip" style={{fontSize: 10}}>📊 27% do limite mensal</span>
          </div>
        </div>

        <div style={{display: 'flex', gap: 4}}>
          {[
            { id: 'mata-mata', l: '⚖ Assistente Mata-Mata', destaque: true },
            { id: 'pecas', l: '✍ Assistente de Peças' },
            { id: 'contratos', l: '📑 Análise de Contratos' },
            { id: 'jurisprudencia', l: '🔍 RAG Jurisprudência' },
            { id: 'calculadoras', l: '🧮 Calculadoras' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 14px', background: 'transparent', border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--fg-muted)',
              fontSize: 13, fontWeight: tab === t.id ? 600 : 500, cursor: 'pointer',
              fontFamily: 'inherit', marginBottom: -1,
              position: 'relative',
            }}>
              {t.l}
              {t.destaque && <span style={{position: 'absolute', top: 6, right: -2, width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%'}} />}
            </button>
          ))}
        </div>
      </div>

      <div style={{flex: 1, overflow: 'hidden'}}>
        {tab === 'mata-mata' && <MataMataAssistant />}
        {tab === 'pecas' && <AssistantePecas />}
        {tab === 'contratos' && <AnaliseContratos />}
        {tab === 'jurisprudencia' && <RAGJurisprudencia />}
        {tab === 'calculadoras' && <Calculadoras />}
      </div>
    </div>
  );
}

function MataMataAssistant() {
  const D = window.JGG_DATA;
  const [step, setStep] = useStateI(2); // mostrar resultado
  const [processo, setProcesso] = useStateI('proc-1');

  return (
    <div style={{display: 'grid', gridTemplateColumns: '320px 1fr 360px', height: '100%'}}>
      {/* Coluna esquerda — Input */}
      <div style={{borderRight: '1px solid var(--border-default)', padding: 20, overflowY: 'auto', background: 'var(--bg-surface-2)'}}>
        <div style={{padding: 14, background: 'linear-gradient(135deg, var(--jgg-bordo-700), var(--jgg-navy-700))', borderRadius: 8, color: 'white', marginBottom: 16}}>
          <div style={{fontSize: 11, opacity: 0.8, marginBottom: 4, letterSpacing: '0.06em'}}>TESE ESTRATÉGICA</div>
          <div style={{fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-serif)', marginBottom: 6}}>Operação Mata-Mata</div>
          <div style={{fontSize: 11.5, opacity: 0.85, lineHeight: 1.5}}>
            Identificação de simulação contábil em crédito rural com fundamentação completa para nulidade do título executivo.
          </div>
        </div>

        <h3 style={{fontSize: 13, marginBottom: 10, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>1. Processo vinculado</h3>
        <select value={processo} onChange={(e) => setProcesso(e.target.value)} className="input" style={{marginBottom: 14}}>
          {D.processos.filter(p => p.tagMataMata).map(p => {
            const cli = D.clientes.find(c => c.id === p.cliente);
            return <option key={p.id} value={p.id}>{cli?.nome.slice(0, 32)} × {p.adverso.slice(0, 14)}</option>;
          })}
        </select>

        <h3 style={{fontSize: 13, marginBottom: 10, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>2. Documentos analisados</h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14}}>
          {[
            { n: 'CCB nº 40/00892-X — 2023.pdf', s: '2.4MB', ok: true },
            { n: 'CCB nº 40/00712-Y — 2021.pdf', s: '2.1MB', ok: true },
            { n: 'CCB nº 40/00451-X — 2019.pdf', s: '1.8MB', ok: true },
            { n: 'Extrato BB conta 12345-6.pdf', s: '8.1MB', ok: true },
            { n: 'Conta gráfica.xlsx', s: '92KB', ok: true },
            { n: 'Laudo pericial fls. 892-1140', s: '4.7MB', ok: true },
          ].map((d, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--bg-surface)', borderRadius: 4, fontSize: 11.5}}>
              <span style={{color: 'var(--status-success)'}}>✓</span>
              <span style={{flex: 1, color: 'var(--fg-default)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{d.n}</span>
              <span style={{color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 10}}>{d.s}</span>
            </div>
          ))}
          <button className="btn" style={{fontSize: 11.5, justifyContent: 'center', marginTop: 4}}>+ Anexar mais</button>
        </div>

        <h3 style={{fontSize: 13, marginBottom: 10, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>3. Teses a desenvolver</h3>
        {[
          { l: 'Nulidade por simulação (CC 166/167)', on: true },
          { l: 'Encadeamento — Súm. 286 STJ', on: true },
          { l: 'Direito ao alongamento — Súm. 298 STJ', on: true },
          { l: 'Capitalização ilegal + CDI (Súm. 176)', on: true },
          { l: 'Limitação da mora (DL 167/67 art. 5º)', on: true },
          { l: 'Impenhorabilidade (Lei 8.929/94 art. 18)', on: false },
        ].map((t, i) => (
          <label key={i} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12, cursor: 'pointer'}}>
            <input type="checkbox" defaultChecked={t.on} />
            <span style={{color: 'var(--fg-default)'}}>{t.l}</span>
          </label>
        ))}

        <h3 style={{fontSize: 13, marginBottom: 10, marginTop: 14, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>4. Tipo de peça</h3>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6}}>
          {['Embargos à Execução', 'Razões Finais', 'Apelação', 'Contestação', 'Réplica', 'Memoriais'].map(p => (
            <button key={p} className="chip" style={{cursor: 'pointer', padding: '7px 8px', fontSize: 11, justifyContent: 'center', background: p === 'Razões Finais' ? 'var(--accent)' : undefined, color: p === 'Razões Finais' ? 'white' : undefined, borderColor: p === 'Razões Finais' ? 'var(--accent)' : undefined}}>{p}</button>
          ))}
        </div>

        <button onClick={() => setStep(2)} className="btn btn-primary" style={{width: '100%', justifyContent: 'center', marginTop: 18, padding: '10px 14px'}}>
          ⚡ Gerar Tese Mata-Mata
        </button>
      </div>

      {/* Coluna central — Output da IA */}
      <div style={{overflowY: 'auto', padding: '24px 32px', background: 'var(--bg-surface)'}}>
        {step === 2 && <MataMataOutput />}
      </div>

      {/* Coluna direita — Citações + raciocínio */}
      <div style={{borderLeft: '1px solid var(--border-default)', padding: 18, overflowY: 'auto', background: 'var(--bg-surface-2)'}}>
        <h3 style={{fontSize: 13, marginBottom: 14, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>Citações & raciocínio</h3>
        {D.jurisprudencia.map((j, i) => (
          <div key={j.id} className="surface" style={{padding: 12, marginBottom: 10}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6}}>
              <span className="chip chip-info" style={{fontSize: 9.5}}>{j.orgao}</span>
              <span style={{fontSize: 11.5, fontWeight: 600, color: 'var(--fg-strong)'}}>{j.sumula || j.resp}</span>
              <span style={{flex: 1}} />
              <span style={{fontSize: 9.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)'}}>{(j.relevancia * 100).toFixed(0)}%</span>
            </div>
            <div style={{fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.5}}>
              {j.ementa.length > 130 ? j.ementa.slice(0, 128) + '…' : j.ementa}
            </div>
          </div>
        ))}

        <div style={{padding: 12, background: 'var(--bg-surface)', borderRadius: 6, marginTop: 10}}>
          <div style={{fontSize: 10.5, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontWeight: 600}}>Cadeia de raciocínio</div>
          <ol style={{margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--fg-default)', lineHeight: 1.5}}>
            <li>Identificou anomalia em 2 das 3 CCBs (D+0/D+1)</li>
            <li>Calculou disponibilidade real (15,7% e 26%)</li>
            <li>Cruzou com laudo pericial fls. 892-1140</li>
            <li>Aplicou Súm. 286/298 STJ + Arts. 166/167 CC</li>
            <li>Validou jurisprudência TJPR 2024-2026</li>
            <li>Estruturou peça em 6 tópicos (~14 págs.)</li>
          </ol>
        </div>

        <div style={{padding: 12, background: 'var(--gold-soft)', borderRadius: 6, marginTop: 10, fontSize: 11.5, color: 'var(--fg-default)'}}>
          ⚠ <b>Lembrete profissional:</b> a saída da IA é uma minuta. A revisão do(a) advogado(a) responsável é obrigatória antes de qualquer protocolo. Audit-log registrou esta geração: <code style={{fontSize: 10}}>gen-2026-04-27-a3f9</code>
        </div>
      </div>
    </div>
  );
}

function MataMataOutput() {
  return (
    <div>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6}}>
        <span style={{fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)'}}>RAZÕES FINAIS · v1 (auto-gerada)</span>
        <span className="chip chip-success" style={{fontSize: 10}}>● Gerado em 18,2s</span>
        <span style={{flex: 1}} />
        <button className="btn" style={{fontSize: 12}}>📋 Copiar</button>
        <button className="btn" style={{fontSize: 12}}>↻ Regenerar</button>
        <button className="btn btn-primary" style={{fontSize: 12}}>📝 Editar no Editor</button>
      </div>
      <h2 style={{fontSize: 22, marginBottom: 20, fontFamily: 'var(--font-serif)'}}>Razões Finais — Embargos à Execução · Tese Mata-Mata</h2>

      <SectionTitle>I — Síntese das Premissas</SectionTitle>
      <p style={pStyle()}>
        A controvérsia destes embargos cinge-se à <CitInline>nulidade da CCB nº 40/00892-X</CitInline>, no valor histórico de <Hi>R$ 4.287.900,00</Hi> (12/10/2023), por força da <i>"Operação Mata-Mata"</i> — patologia contratual em que a instituição financeira concede novo crédito não para fomentar a produção rural, mas para liquidar débitos pretéritos junto a si mesma, configurando <Hi>simulação contábil</Hi> e desvio de finalidade.
      </p>

      <SectionTitle>II — Da Simulação e Desvio de Finalidade <small style={smStyle}>(CC 166, II e VI; CC 167)</small></SectionTitle>
      <p style={pStyle()}>
        O crédito rural é, por sua natureza, <Hi>causal</Hi>: vincula-se a finalidade produtiva específica (custeio, investimento, comercialização) tipificada nos arts. 2º e 3º da Lei 4.829/65 e regulamentada pelo Manual de Crédito Rural (MCR). Conforme demonstrado pelo laudo pericial (fls. 892-1.140):
      </p>
      <EvidenceTable />
      <p style={pStyle()}>
        A operação revela, portanto, <Hi>negócio jurídico simulado</Hi>: as partes <i>aparentaram</i> conferir crédito de fomento (substância declarada), quando na verdade pactuaram <i>substituição de garantias e reposição de débito</i> (substância real), com a aparência destinada a servir de elemento legitimador para escapar à <Hi>vedação ao alongamento compulsório</Hi> sob a Súmula 298/STJ.
      </p>

      <SectionTitle>III — Do Encadeamento Contratual <small style={smStyle}>(Súm. 286/STJ)</small></SectionTitle>
      <Citation>
        <b>Súmula 286 STJ:</b> "A renegociação de contrato bancário ou a confissão da dívida não impede a possibilidade de discussão sobre eventuais ilegalidades dos contratos anteriores."
      </Citation>
      <p style={pStyle()}>
        O Eg. STJ pacificou que a aposição de assinatura em contrato sucessivo não tem o condão de convalidar ilegalidades pretéritas. Cumpre, pois, <Hi>desconstituir toda a cadeia desde a CCB de 2019</Hi>, expurgando-se os encargos abusivos cobrados em cada elo da operação.
      </p>

      <SectionTitle>IV — Do Direito ao Alongamento Recusado <small style={smStyle}>(Súm. 298/STJ; MCR 2.6.4)</small></SectionTitle>
      <Citation>
        <b>Súmula 298 STJ:</b> "O alongamento de dívida originária de crédito rural não constitui faculdade da instituição financeira, mas direito do devedor nos termos da Lei 9.138/95."
      </Citation>
      <p style={pStyle()}>
        Comprovada a frustração da safra 2020/2021 (oficio EMATER fls. 134) e a dificuldade de comercialização, era <Hi>direito subjetivo do produtor</Hi> a prorrogação dos encargos pendentes. A imposição de novo crédito mais oneroso (taxa nominal de 17,4% a.a. + CDI) configura <i>onerosidade excessiva</i> e violação à boa-fé objetiva (CC 422).
      </p>

      <SectionTitle>V — Dos Excessos de Encargos <small style={smStyle}>(REsp 1.061.530/RS; Súm. 176/STJ; DL 167/67 art. 5º, § único)</small></SectionTitle>
      <ul style={{...pStyle(), paddingLeft: 24, listStyle: 'disc'}}>
        <li><Hi>Capitalização mensal:</Hi> identificada pela perícia em desconformidade com o art. 5º do DL 167/67, apenas autorizada a capitalização semestral. Aplicável a <i>Súmula 93 do STJ</i> apenas para CCB pós-MP 2.170-36/2001, com requisito de pactuação expressa, ausente no caso.</li>
            <li><Hi>Indexação ao CDI:</Hi> nula nos termos da <CitInline>Súmula 176/STJ</CitInline>. Aplicar-se-á, em substituição, INPC ou IGP-M conforme expurgação.</li>
            <li><Hi>Limitação da mora:</Hi> nos termos do art. 5º, parágrafo único, do DL 167/67, a elevação dos juros em caso de mora limita-se a <Hi>1% ao ano</Hi>, sendo ilegal a cobrança de comissão de permanência (taxa de mercado).</li>
        <li><Hi>Descaracterização da mora:</Hi> nos exatos termos do REsp 1.061.530/RS (Orientação 2), a cobrança de encargos abusivos no período de normalidade contratual descaracteriza a mora do embargante.</li>
      </ul>

      <SectionTitle>VI — Dos Pedidos</SectionTitle>
      <p style={pStyle()}>Diante do exposto, requer-se:</p>
      <ol style={{...pStyle(), paddingLeft: 24, listStyle: 'lower-alpha'}}>
        <li>O acolhimento integral dos embargos, com a <Hi>extinção da execução</Hi> por nulidade do título executivo (simulação e ausência de liquidez/certeza/exigibilidade);</li>
        <li>Subsidiariamente, a <Hi>descaracterização da mora</Hi>, com expurgação de capitalização ilegal, CDI e comissão de permanência, recalculando-se o débito desde a CCB original de 2019;</li>
        <li>A <Hi>condenação do embargado</Hi> em honorários advocatícios e custas, na forma do art. 85, § 2º, CPC.</li>
      </ol>
      <p style={{...pStyle(), marginTop: 24, fontStyle: 'italic', color: 'var(--fg-muted)'}}>
        Termos em que, pede deferimento.<br/>
        Maringá, 27 de abril de 2026.<br/>
        <b>Gilberto Jacob</b> — OAB/PR 47.123
      </p>
    </div>
  );
}

const SectionTitle = ({ children }) => (
  <h3 style={{fontSize: 16, marginTop: 22, marginBottom: 10, fontFamily: 'var(--font-serif)', color: 'var(--fg-strong)', borderLeft: '3px solid var(--accent)', paddingLeft: 10}}>{children}</h3>
);
const pStyle = () => ({fontSize: 14, color: 'var(--fg-default)', lineHeight: 1.65, marginBottom: 12, textAlign: 'justify'});
const smStyle = {fontSize: 11, color: 'var(--fg-muted)', fontWeight: 400, fontFamily: 'var(--font-sans)'};
const Hi = ({ children }) => <span style={{background: 'var(--gold-soft)', color: 'var(--fg-strong)', padding: '0 3px', borderRadius: 2, fontWeight: 500}}>{children}</span>;
const CitInline = ({ children }) => <span style={{color: 'var(--accent)', fontWeight: 500, borderBottom: '1px dashed var(--accent)', cursor: 'pointer'}}>{children}</span>;
const Citation = ({ children }) => (
  <div style={{padding: '10px 14px', background: 'var(--accent-soft)', borderLeft: '3px solid var(--accent)', borderRadius: 4, fontSize: 13, color: 'var(--fg-default)', lineHeight: 1.55, margin: '12px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic'}}>{children}</div>
);

function EvidenceTable() {
  return (
    <div style={{margin: '12px 0', border: '1px solid var(--border-default)', borderRadius: 6, overflow: 'hidden'}}>
      <table style={{width: '100%', fontSize: 12, borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{background: 'var(--bg-surface-2)'}}>
            <th style={{padding: '8px 10px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>CCB</th>
            <th style={{padding: '8px 10px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>Crédito formal</th>
            <th style={{padding: '8px 10px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>Disponibilidade real</th>
            <th style={{padding: '8px 10px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>%</th>
            <th style={{padding: '8px 10px', textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase'}}>Tempo p/ débito</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={tdEv()}>40/00451-X (2019)</td><td style={tdEv()}>R$ 1.800.000</td><td style={tdEv()}>R$ 1.800.000</td><td style={tdEv()}>100%</td><td style={tdEv()}>—</td></tr>
          <tr style={{background: 'var(--status-danger-bg)'}}><td style={tdEv()}><b>40/00712-Y (2021)</b></td><td style={tdEv()}>R$ 2.650.000</td><td style={tdEv()}>R$ 701.230</td><td style={{...tdEv(), color: 'var(--status-danger)', fontWeight: 700}}>26%</td><td style={{...tdEv(), color: 'var(--status-danger)', fontWeight: 700}}>D+1 (24h)</td></tr>
          <tr style={{background: 'var(--status-danger-bg)'}}><td style={tdEv()}><b>40/00892-X (2023)</b></td><td style={tdEv()}>R$ 4.287.900</td><td style={tdEv()}>R$ 675.450</td><td style={{...tdEv(), color: 'var(--status-danger)', fontWeight: 700}}>15,7%</td><td style={{...tdEv(), color: 'var(--status-danger)', fontWeight: 700}}>D+0 (mesmo dia)</td></tr>
        </tbody>
      </table>
    </div>
  );
}
const tdEv = () => ({padding: '8px 10px', fontSize: 12, borderTop: '1px solid var(--border-subtle)', fontVariantNumeric: 'tabular-nums'});

function AssistantePecas() {
  return (
    <div style={{padding: 32, textAlign: 'center', maxWidth: 700, margin: '40px auto'}}>
      <div style={{fontSize: 38, marginBottom: 12}}>✍</div>
      <h2 style={{fontSize: 18, marginBottom: 8}}>Assistente de Peças (geral)</h2>
      <p style={{color: 'var(--fg-muted)', fontSize: 13, lineHeight: 1.6}}>
        Modelo geral para gerar peças processuais a partir de templates por área (Agrário, Bancário, Tributário). Para a tese-âncora <b>Mata-Mata</b>, use a aba especializada — possui prompt-engineering próprio, base jurisprudencial focada e validação cruzada com laudo pericial.
      </p>
    </div>
  );
}

function AnaliseContratos() {
  return (
    <div style={{padding: 24, maxWidth: 1100, margin: '0 auto'}}>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
        <div className="surface" style={{padding: 18}}>
          <h3 style={{fontSize: 14, marginBottom: 14}}>Upload de contrato</h3>
          <div style={{padding: 30, border: '2px dashed var(--border-default)', borderRadius: 8, textAlign: 'center', background: 'var(--bg-surface-2)'}}>
            <div style={{fontSize: 32, marginBottom: 10}}>📎</div>
            <div style={{fontSize: 13, fontWeight: 500, color: 'var(--fg-strong)', marginBottom: 4}}>Arraste o PDF da CCB/CPR aqui</div>
            <div style={{fontSize: 11.5, color: 'var(--fg-muted)'}}>ou clique para selecionar · até 50MB</div>
          </div>
          <div style={{marginTop: 14, fontSize: 12, color: 'var(--fg-muted)'}}>
            <div style={{marginBottom: 8, fontWeight: 600, color: 'var(--fg-default)'}}>Análise extrai automaticamente:</div>
            <ul style={{paddingLeft: 16, lineHeight: 1.7, margin: 0}}>
              <li>Partes, valor, prazo, taxa de juros</li>
              <li>Forma de capitalização (mensal/anual/semestral)</li>
              <li>Indexadores (CDI, SELIC, TR, IPCA)</li>
              <li>Cláusulas leoninas (garantias, vencimento antecipado)</li>
              <li>Encargos moratórios e comissão de permanência</li>
              <li>Compatibilidade com MCR e DL 167/67</li>
            </ul>
          </div>
        </div>

        <div className="surface" style={{padding: 18}}>
          <h3 style={{fontSize: 14, marginBottom: 14}}>Última análise · CCB 40/00892-X</h3>
          {[
            { l: 'Capitalização', v: 'Mensal', flag: 'danger', n: 'Ilegal · DL 167/67 art. 5º permite apenas semestral' },
            { l: 'Indexador', v: 'CDI', flag: 'danger', n: 'Súm. 176/STJ — cláusula nula' },
            { l: 'Taxa nominal', v: '17,4% a.a.', flag: 'warn', n: '1,52× a média de mercado · análise REsp 1.061.530' },
            { l: 'Comissão de permanência', v: 'Sim', flag: 'danger', n: 'Vedada em CCB rural · DL 167/67 art. 5º § único' },
            { l: 'Vencimento antecipado', v: 'Cláusula 8.3', flag: 'warn', n: 'Possível abusividade — CDC art. 51, IV' },
            { l: 'Garantias', v: 'Hipoteca + alienação fiduciária', flag: 'success', n: 'Regular' },
          ].map((f, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)'}}>
              <span className={`chip chip-${f.flag}`} style={{fontSize: 9, marginTop: 2}}>{f.flag === 'danger' ? '⚠' : f.flag === 'warn' ? '!' : '✓'}</span>
              <div style={{flex: 1}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 2}}>
                  <span style={{fontSize: 12.5, color: 'var(--fg-default)'}}>{f.l}</span>
                  <span style={{fontSize: 12.5, fontWeight: 500, color: 'var(--fg-strong)'}}>{f.v}</span>
                </div>
                <div style={{fontSize: 11, color: 'var(--fg-muted)'}}>{f.n}</div>
              </div>
            </div>
          ))}
          <button className="btn btn-primary" style={{width: '100%', justifyContent: 'center', marginTop: 14}}>📄 Gerar relatório PDF</button>
        </div>
      </div>
    </div>
  );
}

function RAGJurisprudencia() {
  const D = window.JGG_DATA;
  const [q, setQ] = useStateI('decisões recentes do STJ sobre Operação Mata-Mata em crédito rural');

  return (
    <div style={{padding: 24, maxWidth: 1100, margin: '0 auto'}}>
      <div className="surface" style={{padding: 18, marginBottom: 16}}>
        <textarea value={q} onChange={(e) => setQ(e.target.value)}
          style={{...{minHeight: 60, resize: 'vertical', padding: 14, fontSize: 14, lineHeight: 1.5}, ...{width: '100%', border: '1px solid var(--border-default)', borderRadius: 6, fontFamily: 'inherit', background: 'var(--bg-surface)', color: 'var(--fg-strong)', outline: 'none'}}}
          placeholder="Pergunte em linguagem natural sobre jurisprudência…" />
        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 12}}>
          <div style={{fontSize: 11, color: 'var(--fg-muted)', display: 'flex', gap: 14}}>
            <span>Tribunais: STJ · TRF4 · TJPR · TJMT · TJSC · TJRS · TJGO</span>
            <span>·</span>
            <span>Período: últimos 5 anos</span>
          </div>
          <span style={{flex: 1}} />
          <button className="btn btn-primary">Pesquisar</button>
        </div>
      </div>

      <div style={{padding: 16, background: 'var(--accent-soft)', borderRadius: 8, marginBottom: 16, borderLeft: '3px solid var(--accent)'}}>
        <div style={{fontSize: 11, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8}}>RESUMO IA · 6 fontes</div>
        <div style={{fontSize: 13.5, color: 'var(--fg-default)', lineHeight: 1.6}}>
          A jurisprudência consolidada do STJ entre 2022-2026 reconhece a <b>nulidade de operações encadeadas de crédito rural</b> em que a liberação do numerário não fica disponível ao produtor. As <b>Súmulas 286 e 298</b> são citadas conjuntamente em 78% dos acórdãos analisados. O <b>REsp 1.061.530/RS</b> (orientação 2) é o precedente mais utilizado para descaracterização da mora. O <b>TJPR</b> apresentou 14 decisões favoráveis ao produtor em 2024-2025, com base nos <b>arts. 166 e 167 do CC</b> aplicados à simulação contábil.
        </div>
      </div>

      {D.jurisprudencia.map(j => (
        <div key={j.id} className="surface" style={{padding: 16, marginBottom: 10}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8}}>
            <span className="chip chip-info">{j.orgao}</span>
            <span style={{fontSize: 14, fontWeight: 600, color: 'var(--fg-strong)'}}>{j.sumula || j.resp}</span>
            <span style={{fontSize: 11, color: 'var(--fg-muted)'}}>· {j.ano}</span>
            <span style={{flex: 1}} />
            <span style={{fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)'}}>relevância {(j.relevancia * 100).toFixed(0)}%</span>
            <button className="btn" style={{fontSize: 11, padding: '4px 8px'}}>↗ Jusbrasil</button>
          </div>
          <div style={{fontSize: 13, color: 'var(--fg-default)', lineHeight: 1.55, marginBottom: 8}}>{j.ementa}</div>
          <div style={{display: 'flex', gap: 4, flexWrap: 'wrap'}}>
            {j.tags.map(t => <span key={t} className="chip" style={{fontSize: 10}}>{t}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Calculadoras() {
  return (
    <div style={{padding: 24, maxWidth: 1100, margin: '0 auto'}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14}}>
        {[
          { ic: '🧮', t: 'Recálculo de Dívida Rural', d: 'Reconstitui evolução do débito sem capitalização ilegal · Price × SAC · expurga CDI', acao: 'Abrir' },
          { ic: '📈', t: 'Atualização Monetária', d: 'IPCA, IGP-M, INPC, SELIC, TR · indexadores oficiais BCB API', acao: 'Abrir' },
          { ic: '⚖', t: 'Honorários Advocatícios', d: 'Tabelas OAB-PR e OAB-MT 2026 · arbitramento + sucumbência', acao: 'Abrir' },
          { ic: '🎯', t: 'Simulador de Risco', d: 'Estima probabilidade de êxito com base em jurisprudência similar (RAG)', acao: 'Abrir', destaque: true },
        ].map((c, i) => (
          <div key={i} className="surface" style={{padding: 22, position: 'relative'}}>
            {c.destaque && <div style={{position: 'absolute', top: 12, right: 12}}><span className="chip chip-gold" style={{fontSize: 9}}>IA</span></div>}
            <div style={{fontSize: 28, marginBottom: 10}}>{c.ic}</div>
            <h3 style={{fontSize: 15, marginBottom: 6}}>{c.t}</h3>
            <div style={{fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5, marginBottom: 14}}>{c.d}</div>
            <button className="btn btn-primary" style={{fontSize: 12}}>{c.acao} →</button>
          </div>
        ))}
      </div>

      <div className="surface" style={{padding: 22, marginTop: 16}}>
        <h3 style={{fontSize: 15, marginBottom: 14}}>Recálculo · CCB 40/00892-X (preview)</h3>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
          <div>
            <div style={{fontSize: 12, color: 'var(--fg-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>Como cobrado pelo banco</div>
            <Row k="Valor original" v={fmtBRL(4_287_900)} />
            <Row k="Capitalização" v="Mensal (ilegal)" alert />
            <Row k="Indexador" v="CDI (Súm. 176)" alert />
            <Row k="Comissão permanência" v="Sim" alert />
            <Row k="Saldo atual (banco)" v={fmtBRL(7_415_320)} bold />
          </div>
          <div>
            <div style={{fontSize: 12, color: 'var(--gold)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>Recálculo · sem ilegalidades</div>
            <Row k="Valor original" v={fmtBRL(4_287_900)} />
            <Row k="Capitalização" v="Semestral (legal)" />
            <Row k="Indexador" v="INPC + 12% a.a." />
            <Row k="Comissão permanência" v="Não" />
            <Row k="Saldo recalculado" v={fmtBRL(5_148_220)} bold />
          </div>
        </div>
        <div style={{marginTop: 14, padding: 12, background: 'var(--gold-soft)', borderRadius: 6, fontSize: 13, color: 'var(--fg-default)'}}>
          <b>Diferença a expurgar:</b> <span style={{fontWeight: 700, color: 'var(--accent)', fontSize: 16, fontFamily: 'var(--font-serif)'}}>R$ 2.267.100,00</span> (30,6% do saldo cobrado)
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { IAView });
