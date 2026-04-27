// Documentos — biblioteca + templates + editor de peças (Word vs Notion)

const { useState: useStateD } = React;

function DocumentsView({ editorStyle }) {
  const D = window.JGG_DATA;
  const [tab, setTab] = useStateD('biblioteca');
  const [editing, setEditing] = useStateD(null);

  if (editing) {
    return <PetitionEditor doc={editing} onClose={() => setEditing(null)} editorStyle={editorStyle} />;
  }

  return (
    <div style={{padding: 24, maxWidth: 1480, margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18}}>
        <div>
          <h1 style={{fontSize: 22, marginBottom: 4}}>Documentos</h1>
          <div style={{fontSize: 12, color: 'var(--fg-muted)'}}>
            Petições, contratos, pareceres · busca semântica via pgvector · {D.documentos.length + 247} arquivos · {D.templates.length} templates
          </div>
        </div>
        <div style={{display: 'flex', gap: 8}}>
          <button className="btn">⬆ Upload</button>
          <button onClick={() => setEditing({nome: 'Nova peça', tipo: 'Petição', versao: 1})} className="btn btn-primary">+ Nova peça</button>
        </div>
      </div>

      <div style={{display: 'flex', gap: 4, borderBottom: '1px solid var(--border-default)', marginBottom: 18}}>
        {[
          { id: 'biblioteca', l: 'Biblioteca' },
          { id: 'templates', l: 'Templates · ' + D.templates.length },
          { id: 'busca', l: '🔍 Busca semântica (pgvector)' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 14px', background: 'transparent',
            border: 'none', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t.id ? 'var(--accent)' : 'var(--fg-muted)',
            fontSize: 13, fontWeight: tab === t.id ? 600 : 500, cursor: 'pointer',
            fontFamily: 'inherit', marginBottom: -1,
          }}>{t.l}</button>
        ))}
      </div>

      {tab === 'biblioteca' && <Biblioteca onEdit={setEditing} />}
      {tab === 'templates' && <Templates onUse={setEditing} />}
      {tab === 'busca' && <BuscaSemantica />}
    </div>
  );
}

function Biblioteca({ onEdit }) {
  const D = window.JGG_DATA;
  return (
    <div className="surface" style={{padding: 0, overflow: 'hidden'}}>
      <div style={{padding: '12px 14px', display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)'}}>
        <input className="input" placeholder="Buscar por nome, conteúdo, tag…" style={{maxWidth: 360}} />
        <span className="chip" style={{cursor: 'pointer'}}>Petição</span>
        <span className="chip" style={{cursor: 'pointer'}}>Contrato</span>
        <span className="chip" style={{cursor: 'pointer'}}>Extrato</span>
        <span className="chip chip-gold" style={{cursor: 'pointer'}}>★ Mata-Mata</span>
      </div>
      <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
        <thead>
          <tr style={{background: 'var(--bg-surface-2)'}}>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500}}>Documento</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 200}}>Processo / Cliente</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 100}}>Tipo</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 70}}>Versão</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 100}}>Autor</th>
            <th style={{textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', fontWeight: 500, width: 100}}>Data</th>
          </tr>
        </thead>
        <tbody>
          {D.documentos.map(doc => {
            const proc = D.processos.find(p => p.id === doc.processo);
            const cli = D.clientes.find(c => c.id === proc?.cliente);
            const adv = D.advogados.find(a => a.id === doc.autor);
            return (
              <tr key={doc.id} onClick={() => onEdit(doc)} style={{borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer'}}>
                <td style={{padding: '10px 14px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <div style={{
                      width: 30, height: 36, borderRadius: 3,
                      background: doc.nome.endsWith('.pdf') ? 'var(--status-danger-bg)' : doc.nome.endsWith('.xlsx') ? 'var(--status-success-bg)' : 'var(--status-info-bg)',
                      color: doc.nome.endsWith('.pdf') ? 'var(--status-danger)' : doc.nome.endsWith('.xlsx') ? 'var(--status-success)' : 'var(--status-info)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 700,
                    }}>{doc.nome.split('.').pop().toUpperCase()}</div>
                    <div>
                      <div style={{fontWeight: 500, color: 'var(--fg-strong)'}}>{doc.nome}</div>
                      <div style={{fontSize: 11, color: 'var(--fg-muted)'}}>{doc.tamanho} {doc.tag === 'mata-mata' && <span style={{marginLeft: 6, color: 'var(--gold)'}}>★ Mata-Mata</span>}</div>
                    </div>
                  </div>
                </td>
                <td style={{padding: '10px 14px'}}>
                  <div style={{fontSize: 12.5, color: 'var(--fg-default)'}}>{cli?.nome.slice(0, 28) || '—'}</div>
                  <div style={{fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-muted)'}}>{proc?.cnj}</div>
                </td>
                <td style={{padding: '10px 14px'}}><span className="chip">{doc.tipo}</span></td>
                <td style={{padding: '10px 14px', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)'}}>v{doc.versao}</td>
                <td style={{padding: '10px 14px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                    <div style={{width: 20, height: 20, borderRadius: '50%', background: adv?.cor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600}}>{adv?.avatar}</div>
                    <span style={{fontSize: 11.5, color: 'var(--fg-muted)'}}>{adv?.nome.replace('Dr. ', '').replace('Dra. ', '').split(' ')[0]}</span>
                  </div>
                </td>
                <td style={{padding: '10px 14px', color: 'var(--fg-muted)', fontSize: 12}}>{fmtDate(doc.data)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Templates({ onUse }) {
  const D = window.JGG_DATA;
  return (
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14}}>
      {D.templates.map(t => (
        <div key={t.id} className="surface" style={{padding: 18, position: 'relative'}}>
          <div style={{position: 'absolute', top: 12, right: 12}}>
            <span className={`chip chip-${t.area === 'Bancário' ? 'accent' : t.area === 'Agrário' ? 'info' : 'gold'}`}>{t.area}</span>
          </div>
          <div style={{fontSize: 28, marginBottom: 10}}>📋</div>
          <h3 style={{fontSize: 14.5, marginBottom: 8, lineHeight: 1.3}}>{t.nome}</h3>
          <div style={{fontSize: 11.5, color: 'var(--fg-muted)', marginBottom: 14}}>
            Usado {t.usos}× · último em {fmtDate(t.ultimoUso)}
          </div>
          <div style={{display: 'flex', gap: 6}}>
            <button onClick={() => onUse({nome: 'Novo doc — ' + t.nome, tipo: 'Petição', versao: 1, fromTemplate: t.id})} className="btn btn-primary" style={{flex: 1, justifyContent: 'center', fontSize: 12}}>Usar template</button>
            <button className="btn" style={{fontSize: 12}}>👁</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BuscaSemantica() {
  const [q, setQ] = useStateD('capitalização ilegal em CCB');
  const D = window.JGG_DATA;

  // Mock: retorna documentos + jurisprudência relevante
  const results = [
    { tipo: 'Documento', titulo: 'Contestação — Embargos Execução BB.docx', score: 0.94, trecho: '...identificada na CCB nº 40/00892-X **capitalização mensal** dos juros remuneratórios em desconformidade com o art. 5º do DL 167/67, configurando abusividade ao ultrapassar uma vez e meia a média de mercado, conforme orientação do **REsp 1.061.530/RS**...' },
    { tipo: 'Jurisprudência', titulo: 'Súmula 176 STJ', score: 0.92, trecho: 'É nula a cláusula contratual que sujeita o devedor à taxa de juros divulgada pela ANBID/CETIP. Aplicável a contratos de **CCB com indexação ao CDI**...' },
    { tipo: 'Documento', titulo: 'Réplica à Contestação Itaú.docx', score: 0.89, trecho: '...a sistemática de **capitalização mensal de juros** aplicada pelo embargado nas operações sucessivas configura a vedação do art. 4º da Lei de Usura...' },
    { tipo: 'Jurisprudência', titulo: 'REsp 1.061.530/RS', score: 0.88, trecho: 'Orientação 2: A descaracterização da mora ocorre quando há cobrança de **encargos abusivos no período de normalidade** contratual...' },
    { tipo: 'Template', titulo: 'Ação Revisional — Capitalização Ilegal + CDI', score: 0.85, trecho: 'Modelo de petição inicial que combina os argumentos de **nulidade de capitalização** com a inaplicabilidade do CDI como índice...' },
  ];

  return (
    <div>
      <div className="surface" style={{padding: 18, marginBottom: 16}}>
        <div style={{display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12}}>
          <Icon name="search" size={18} />
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)}
            style={{fontSize: 15, padding: '10px 14px'}}
            placeholder="Pergunte em linguagem natural…" />
          <button className="btn btn-primary">Buscar</button>
        </div>
        <div style={{fontSize: 11.5, color: 'var(--fg-muted)', display: 'flex', gap: 12}}>
          <span>🧠 Embeddings: text-embedding-3-large</span>
          <span>📊 Índice: 1.847 documentos + 12.340 trechos de jurisprudência</span>
          <span style={{color: 'var(--status-success)'}}>● Atualizado há 12min</span>
        </div>
      </div>

      <div style={{fontSize: 12, color: 'var(--fg-muted)', marginBottom: 10, padding: '0 4px'}}>{results.length} resultados · ordenados por similaridade semântica</div>
      {results.map((r, i) => (
        <div key={i} className="surface" style={{padding: 16, marginBottom: 10, cursor: 'pointer'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8}}>
            <span className={`chip ${r.tipo === 'Jurisprudência' ? 'chip-info' : r.tipo === 'Template' ? 'chip-gold' : 'chip-accent'}`}>{r.tipo}</span>
            <span style={{fontSize: 14, fontWeight: 500, color: 'var(--fg-strong)'}}>{r.titulo}</span>
            <span style={{flex: 1}} />
            <span style={{fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)'}}>similaridade {(r.score * 100).toFixed(1)}%</span>
            <div style={{width: 60, height: 4, background: 'var(--bg-surface-2)', borderRadius: 2, overflow: 'hidden'}}>
              <div style={{width: `${r.score * 100}%`, height: '100%', background: 'var(--accent)'}} />
            </div>
          </div>
          <div style={{fontSize: 13, color: 'var(--fg-default)', lineHeight: 1.55}}
               dangerouslySetInnerHTML={{__html: r.trecho.replace(/\*\*(.*?)\*\*/g, '<mark style="background: var(--gold-soft); color: var(--fg-strong); padding: 1px 3px; border-radius: 2px;">$1</mark>')}} />
        </div>
      ))}
    </div>
  );
}

function PetitionEditor({ doc, onClose, editorStyle }) {
  if (editorStyle === 'word') return <WordStyleEditor doc={doc} onClose={onClose} />;
  return <NotionStyleEditor doc={doc} onClose={onClose} />;
}

function WordStyleEditor({ doc, onClose }) {
  return (
    <div style={{minHeight: 'calc(100vh - 56px)', background: 'var(--bg-surface-2)', display: 'flex', flexDirection: 'column'}}>
      {/* Toolbar Word-style */}
      <div style={{background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12}}>
        <button onClick={onClose} className="btn btn-ghost" style={{fontSize: 12}}>← Voltar</button>
        <div style={{height: 20, width: 1, background: 'var(--border-default)'}} />
        <div style={{fontSize: 13, fontWeight: 500, color: 'var(--fg-strong)'}}>{doc.nome}</div>
        <span className="chip">v{doc.versao}</span>
        <span style={{flex: 1}} />
        <button className="btn">💾 Salvar</button>
        <button className="btn">✍ Assinar (BRy)</button>
        <button className="btn btn-primary">📤 Protocolar</button>
      </div>
      {/* Format bar */}
      <div style={{background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', padding: '6px 18px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12}}>
        <select style={{...selectStyle()}}><option>Times New Roman</option><option>Arial</option></select>
        <select style={{...selectStyle(), width: 60}}><option>12</option><option>14</option></select>
        <div style={{height: 20, width: 1, background: 'var(--border-default)', margin: '0 6px'}} />
        <button style={btnTb()}><b>B</b></button>
        <button style={btnTb()}><i>I</i></button>
        <button style={btnTb()}><u>U</u></button>
        <div style={{height: 20, width: 1, background: 'var(--border-default)', margin: '0 6px'}} />
        <button style={btnTb()}>⫷</button>
        <button style={btnTb()}>≡</button>
        <button style={btnTb()}>⫸</button>
        <button style={btnTb()}>⩵</button>
        <div style={{flex: 1}} />
        <button className="chip chip-gold" style={{cursor: 'pointer'}}>🤖 IA · Inserir tese</button>
      </div>
      {/* Page */}
      <div style={{flex: 1, padding: 30, overflowY: 'auto'}}>
        <div style={{
          maxWidth: 794, margin: '0 auto', background: 'white',
          padding: '60px 80px', minHeight: 1100, boxShadow: 'var(--shadow-lg)',
          fontFamily: '"Times New Roman", Times, serif', fontSize: 12, lineHeight: 1.5, color: '#000',
        }}>
          <p style={{textAlign: 'center', fontWeight: 700, marginBottom: 30, textTransform: 'uppercase'}}>EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA 2ª VARA CÍVEL DA COMARCA DE MARINGÁ — ESTADO DO PARANÁ</p>
          <p style={{textAlign: 'right', marginBottom: 30, fontSize: 11}}>Processo nº 0008421-55.2024.8.16.0017</p>
          <p style={{textIndent: 40, textAlign: 'justify', marginBottom: 12}}>
            <b>FAZENDA SÃO JOÃO AGROPECUÁRIA LTDA.</b>, já qualificada nos autos do processo em epígrafe, por seus advogados que esta subscrevem, vem, respeitosamente, à presença de Vossa Excelência, em atenção ao despacho de fls. 1.247, apresentar suas <b>RAZÕES FINAIS</b>, pelos fundamentos de fato e de direito a seguir aduzidos.
          </p>
          <p style={{textAlign: 'center', fontWeight: 700, margin: '24px 0 12px', textTransform: 'uppercase'}}>I — DOS FATOS</p>
          <p style={{textIndent: 40, textAlign: 'justify', marginBottom: 12}}>
            A controvérsia destes embargos cinge-se à <b>nulidade da Cédula de Crédito Bancário nº 40/00892-X</b>, no valor histórico de R$ 4.287.900,00, emitida em 12/10/2023, por força da chamada <i>"Operação Mata-Mata"</i> — patologia contratual em que a instituição financeira concede novo crédito não para fomentar a produção rural, mas para liquidar débitos pretéritos do mesmo produtor junto à própria instituição, configurando simulação contábil e desvio de finalidade do crédito rural.
          </p>
          <p style={{textIndent: 40, textAlign: 'justify', marginBottom: 12}}>
            Conforme robustamente demonstrado pela perícia contábil judicial (laudo de fls. 892-1.140, conclusivo), do montante creditado em conta corrente, <b>R$ 3.612.450,00 (84,3%)</b> foram debitados <b>no mesmo dia</b> da liberação para liquidação da CCB anterior nº 40/00712-Y, restando ao produtor apenas R$ 675.450,00 — exíguos 15,7% do crédito formal — para fomento da safra 2023/2024.
          </p>
          <p style={{textAlign: 'center', fontWeight: 700, margin: '24px 0 12px', textTransform: 'uppercase'}}>II — DA NULIDADE POR SIMULAÇÃO E DESVIO DE FINALIDADE (CC, ARTS. 166 E 167)</p>
          <p style={{textIndent: 40, textAlign: 'justify', marginBottom: 12}}>
            O crédito rural é, por sua natureza, <b>causal</b>: vincula-se a finalidade produtiva específica (custeio, investimento, comercialização) tipificada nos arts. 2º e 3º da Lei 4.829/65 e regulamentada pelo Manual de Crédito Rural — MCR. Quando o numerário não fica efetivamente disponível ao produtor, mas é simultaneamente debitado para liquidação de operação anterior, a causa do negócio jurídico se desnatura, atraindo a incidência dos <b>arts. 166, II e VI, e 167 do Código Civil</b>...
          </p>
          <p style={{textAlign: 'center', color: 'var(--fg-muted)', fontStyle: 'italic', fontSize: 11, margin: '20px 0', padding: 14, border: '1px dashed var(--border-default)', borderRadius: 4, fontFamily: 'sans-serif'}}>
            [Continuação da peça com os 4 demais tópicos: III — Súmulas 286/298 STJ; IV — Encargos abusivos (REsp 1.061.530/RS); V — Súmula 176 STJ (CDI); VI — Pedidos]
          </p>
        </div>
      </div>
    </div>
  );
}
const selectStyle = () => ({padding: '4px 8px', border: '1px solid var(--border-default)', borderRadius: 4, fontSize: 12, background: 'var(--bg-surface)', color: 'var(--fg-default)', fontFamily: 'inherit'});
const btnTb = () => ({width: 28, height: 28, border: '1px solid transparent', background: 'transparent', borderRadius: 3, cursor: 'pointer', color: 'var(--fg-default)', fontFamily: 'inherit', fontSize: 13});

function NotionStyleEditor({ doc, onClose }) {
  return (
    <div style={{minHeight: 'calc(100vh - 56px)', background: 'var(--bg-surface)'}}>
      <div style={{padding: '14px 32px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12}}>
        <button onClick={onClose} className="btn btn-ghost" style={{fontSize: 12}}>← Voltar</button>
        <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-muted)'}}>
          <span>Documentos</span>
          <span>/</span>
          <span>Embargos Execução BB</span>
          <span>/</span>
          <span style={{color: 'var(--fg-strong)'}}>{doc.nome}</span>
        </div>
        <span className="chip chip-success" style={{fontSize: 10}}>● Salvo · há 4s</span>
        <button className="btn">Compartilhar</button>
        <button className="btn btn-primary">Publicar</button>
      </div>

      <div style={{maxWidth: 760, margin: '0 auto', padding: '40px 24px'}}>
        <div style={{fontSize: 12, color: 'var(--fg-muted)', marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap'}}>
          <span>📄 Petição</span>
          <span>·</span>
          <span>Vinculado ao processo <span style={{fontFamily: 'var(--font-mono)', color: 'var(--accent)'}}>0008421-55.2024.8.16.0017</span></span>
        </div>
        <h1 style={{fontSize: 36, marginBottom: 8, fontFamily: 'var(--font-serif)'}} contentEditable suppressContentEditableWarning>Razões Finais — Embargos à Execução · Mata-Mata</h1>
        <div style={{fontSize: 14, color: 'var(--fg-muted)', marginBottom: 32}}>
          <span>Cliente: <b style={{color: 'var(--fg-default)'}}>Fazenda São João Ltda.</b></span> · <span>Adverso: <b style={{color: 'var(--fg-default)'}}>Banco do Brasil S/A</b></span>
        </div>

        <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24}}>
          {['Mata-Mata', 'Art. 166 CC', 'Súm. 286 STJ', 'Súm. 298 STJ', 'Súm. 176 STJ', 'REsp 1.061.530/RS', 'CDI', 'Capitalização'].map(t => (
            <span key={t} className="chip chip-gold" style={{cursor: 'pointer'}}>{t}</span>
          ))}
        </div>

        <NotionBlock heading="I. Dos Fatos" />
        <NotionBlock text="A controvérsia destes embargos cinge-se à nulidade da Cédula de Crédito Bancário nº 40/00892-X, no valor histórico de R$ 4.287.900,00, emitida em 12/10/2023, por força da chamada Operação Mata-Mata." />

        {/* Callout block */}
        <div style={{padding: 16, background: 'var(--gold-soft)', borderLeft: '3px solid var(--gold)', borderRadius: 4, margin: '12px 0', display: 'flex', gap: 12}}>
          <div style={{fontSize: 18}}>💡</div>
          <div style={{flex: 1, fontSize: 14, color: 'var(--fg-default)', lineHeight: 1.55}}>
            <b>Operação Mata-Mata</b> — patologia contratual em que a instituição financeira concede novo crédito não para fomentar a produção rural, mas para liquidar débitos pretéritos do mesmo produtor, configurando <i>simulação contábil</i> e desvio de finalidade do crédito rural.
          </div>
        </div>

        <NotionBlock heading="II. Da Simulação e Desvio de Finalidade" />
        <NotionBlock text="O crédito rural é, por sua natureza, causal: vincula-se a finalidade produtiva específica (custeio, investimento, comercialização) tipificada nos arts. 2º e 3º da Lei 4.829/65 e regulamentada pelo Manual de Crédito Rural — MCR." />

        {/* Quote block */}
        <div style={{borderLeft: '3px solid var(--fg-default)', padding: '6px 16px', margin: '12px 0', fontStyle: 'italic', color: 'var(--fg-muted)', fontFamily: 'var(--font-serif)', fontSize: 14}}>
          "É nula a cláusula contratual que sujeita o devedor à taxa de juros divulgada pela ANBID/CETIP."
          <div style={{fontSize: 11, fontFamily: 'var(--font-sans)', fontStyle: 'normal', color: 'var(--fg-subtle)', marginTop: 4}}>— Súmula 176, Superior Tribunal de Justiça</div>
        </div>

        <NotionBlock text="Conforme robustamente demonstrado pela perícia contábil judicial (laudo de fls. 892-1.140, conclusivo), do montante creditado em conta corrente, R$ 3.612.450,00 (84,3%) foram debitados no mesmo dia da liberação para liquidação da CCB anterior nº 40/00712-Y..." />

        {/* Slash menu hint */}
        <div style={{padding: 10, marginTop: 14, borderRadius: 6, background: 'var(--bg-surface-2)', fontSize: 12, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 8}}>
          <span style={{color: 'var(--fg-subtle)'}}>+</span>
          <span>Pressione <span className="kbd">/</span> para inserir bloco · <span className="kbd">@</span> para citar processo · <span className="kbd">⌘ J</span> para inserir jurisprudência</span>
        </div>
      </div>
    </div>
  );
}

function NotionBlock({ heading, text }) {
  if (heading) {
    return <h2 style={{fontSize: 22, marginTop: 28, marginBottom: 10, fontFamily: 'var(--font-serif)'}} contentEditable suppressContentEditableWarning>{heading}</h2>;
  }
  return <p style={{fontSize: 15, lineHeight: 1.65, color: 'var(--fg-default)', marginBottom: 10}} contentEditable suppressContentEditableWarning>{text}</p>;
}

Object.assign(window, { DocumentsView });
