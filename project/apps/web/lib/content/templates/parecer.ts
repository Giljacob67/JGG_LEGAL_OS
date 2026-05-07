export interface ParecerVars {
  destinatario: string;
  referencia: string;
  questaoJuridica: string;
  fatosSintese: string;
  analise: string;
  conclusao: string;
  riscos?: string[];
  recomendacoes?: string[];
  advogadoNome: string;
  advogadoOab: string;
  data?: string;
}

export function gerarParecer(vars: ParecerVars): string {
  const data = vars.data || new Date().toLocaleDateString("pt-BR");
  const riscos = (vars.riscos || []).map((r, i) => `Risco ${i + 1}: ${r}`).join("\n") || "Nenhum risco identificado de forma material.";
  const recomendacoes = (vars.recomendacoes || []).map((r, i) => `${i + 1}. ${r};`).join("\n") || "Manter acompanhamento processual regular.";

  return `PARECER JURÍDICO Nº [NÚMERO/ANO]

À: ${vars.destinatario}
Ref.: ${vars.referencia}
Data: ${data}

I — DA QUESTÃO
${vars.questaoJuridica}

II — DOS FATOS (SÍNTESE)
${vars.fatosSintese}

III — DA ANÁLISE JURÍDICA
${vars.analise}

IV — DOS RISCOS
${riscos}

V — DA CONCLUSÃO
${vars.conclusao}

VI — DAS RECOMENDAÇÕES
${recomendacoes}

Atenciosamente,

${vars.advogadoNome}
Advogado(a) — OAB/${vars.advogadoOab}
`;
}
