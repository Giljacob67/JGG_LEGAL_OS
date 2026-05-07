export interface ContestacaoVars {
  juizo: string;
  comarca: string;
  autorNome: string;
  reuNome: string;
  reuQualificacao: string;
  processoCnj?: string;
  preliminares?: string[];
  merito?: string;
  reconvencao?: string;
  pedidos?: string[];
  advogadoNome: string;
  advogadoOab: string;
  data?: string;
}

export function gerarContestacao(vars: ContestacaoVars): string {
  const data = vars.data || new Date().toLocaleDateString("pt-BR");
  const preliminares = (vars.preliminares || []).map((p, i) => `${i + 1}. ${p};`).join("\n") || "Não há preliminares a alegar.";
  const merito = vars.merito || "[Desenvolver mérito]";
  const pedidos = (vars.pedidos || ["Que seja julgada improcedente a ação", "Condenação do autor em honorários advocatícios e custas"]).map((p, i) => `${i + 1}. ${p};`).join("\n");
  const reconvencao = vars.reconvencao ? `\nDA RECONVENÇÃO\n${vars.reconvencao}\n` : "";

  return `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ${vars.juizo} DA COMARCA DE ${vars.comarca}

Processo nº ${vars.processoCnj || "[CNJ]"}

${vars.reuNome}, ${vars.reuQualificacao}, por seu advogado infra-assinado, vem, respeitosamente, apresentar

CONTESTAÇÃO

em face de ${vars.autorNome}, pelos fatos e fundamentos a seguir:

I — DAS PRELIMINARES
${preliminares}

II — DO MÉRITO
${merito}
${reconvencao}
III — DOS PEDIDOS
${pedidos}

Requer-se a produção de todas as provas em direito admitidas.

Pede-se deferimento.

${vars.comarca}, ${data}.

${vars.advogadoNome}
OAB/${vars.advogadoOab}
Advogado(a)`;
}
