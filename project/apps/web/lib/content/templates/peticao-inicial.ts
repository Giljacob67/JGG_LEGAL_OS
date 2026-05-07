export interface PeticaoInicialVars {
  juizo: string;
  comarca: string;
  autorNome: string;
  autorQualificacao: string;
  reuNome: string;
  reuQualificacao: string;
  valorCausa: number;
  assunto: string;
  breveRelato: string;
  fundamentosDireito: string;
  pedidos: string[];
  provas: string[];
  advogadoNome: string;
  advogadoOab: string;
  data?: string;
}

export function gerarPeticaoInicial(vars: PeticaoInicialVars): string {
  const data = vars.data || new Date().toLocaleDateString("pt-BR");
  const provasList = vars.provas.map((p, i) => `${i + 1}. ${p};`).join("\n");
  const pedidosList = vars.pedidos.map((p, i) => `${i + 1}. ${p};`).join("\n");

  return `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ${vars.juizo} DA COMARCA DE ${vars.comarca}

${vars.autorNome}, ${vars.autorQualificacao}, vêm respeitosamente à presença de Vossa Excelência, por intermédio de seu advogado infra-assinado, com fundamento nos artigos 319 e seguintes do CPC/2015, propor a presente

AÇÃO [TIPO] C/C PEDIDO DE [TUTELA]

co-autor: ${vars.reuNome}, ${vars.reuQualificacao}, pelos fatos e fundamentos a seguir:

I — DOS FATOS
${vars.breveRelato}

II — DO DIREITO
${vars.fundamentosDireito}

III — DOS PEDIDOS
Diante do exposto, requer:
${pedidosList}

IV — DA PROVA
${provasList}

V — DO VALOR DA CAUSA
Atribui-se à causa o valor de ${formatCurrency(vars.valorCausa)}.

Requer-se a produção de todas as provas em direito admitidas, incluindo a inversão do ônus da prova, se cabível.

Pede-se deferimento.

${vars.comarca}, ${data}.

${vars.advogadoNome}
OAB/${vars.advogadoOab}
Advogado(a)`;
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
