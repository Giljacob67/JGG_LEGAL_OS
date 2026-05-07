export interface ContratoHonorariosVars {
  clienteNome: string;
  clienteCpfCnpj: string;
  clienteEndereco: string;
  escritorioNome: string;
  escritorioCnpj: string;
  escritorioEndereco: string;
  escritorioOab: string;
  tipo: "fixo_mensal" | "exito" | "hora" | "combinado";
  valorFixo?: number;
  percentual?: number;
  taxaHora?: number;
  estimativa?: number;
  objeto: string;
  prazoVigencia?: string;
  data?: string;
  cidade?: string;
  clausulaConfidencialidade?: boolean;
}

export function gerarContratoHonorarios(vars: ContratoHonorariosVars): string {
  const data = vars.data || new Date().toLocaleDateString("pt-BR");
  const cidade = vars.cidade || "[Cidade]";

  let honorariosDesc = "";
  if (vars.tipo === "fixo_mensal" && vars.valorFixo) {
    honorariosDesc = `Remuneração mensal fixa de ${formatCurrency(vars.valorFixo)}, a ser paga até o dia 10 de cada mês.`;
  } else if (vars.tipo === "exito" && vars.percentual) {
    honorariosDesc = `Honorários de êxito correspondentes a ${vars.percentual}% sobre o valor auferido em resultado da demanda, excluídas verbas de natureza alimentar.`;
  } else if (vars.tipo === "hora" && vars.taxaHora) {
    honorariosDesc = `Remuneração por hora de trabalho efetivo, à taxa de ${formatCurrency(vars.taxaHora)} por hora, apresentada em relatório mensal.`;
  } else if (vars.tipo === "combinado") {
    honorariosDesc = `Remuneração combinada conforme escopo de serviços definido em anexo.`;
  } else {
    honorariosDesc = `[Definir modalidade de honorários]`;
  }

  const clausulaConf = vars.clausulaConfidencialidade !== false
    ? `\nCLÁUSULA DA CONFIDENCIALIDADE\nAs partes se obrigam a manter sigilo absoluto sobre todas as informações, documentos e estratégias relacionadas ao objeto deste contrato, inclusive após seu término, salvo obrigação legal de divulgação ou consentimento expresso da outra parte.\n`
    : "";

  return `CONTRATO DE HONORÁRIOS ADVOCATÍCIOS

${cidade}, ${data}.

CONTRATANTE:
${vars.clienteNome}, CPF/CNPJ nº ${vars.clienteCpfCnpj}, residente/domiciliado à ${vars.clienteEndereco}.

CONTRATADA:
${vars.escritorioNome}, CNPJ nº ${vars.escritorioCnpj}, sediada à ${vars.escritorioEndereco}, inscrita na OAB sob nº ${vars.escritorioOab}.

CLÁUSULA 1 — DO OBJETO
O presente contrato tem por objeto a prestação de serviços advocatícios relativos a: ${vars.objeto}.

CLÁUSULA 2 — DOS HONORÁRIOS
${honorariosDesc}
Estima-se o valor global dos serviços em ${vars.estimativa ? formatCurrency(vars.estimativa) : "[a definir]"}.

CLÁUSULA 3 — DO PRAZO DE VIGÊNCIA
${vars.prazoVigencia || "O presente contrato vigora pelo prazo da prestação dos serviços, podendo ser rescindido por qualquer das partes mediante comunicação escrita com antecedência mínima de 30 (trinta) dias."}
${clausulaConf}
Assinaturas:

_________________________________________
${vars.clienteNome}
Contratante

_________________________________________
${vars.escritorioNome}
Contratada
`;
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
