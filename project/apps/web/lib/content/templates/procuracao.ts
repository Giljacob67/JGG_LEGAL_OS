export interface ProcuracaoVars {
  outorganteNome: string;
  outorganteNacionalidade: string;
  outorganteEstadoCivil: string;
  outorganteProfissao: string;
  outorganteCpf: string;
  outorganteRg: string;
  outorganteEndereco: string;
  outorganteCidade: string;
  outorganteEstado: string;
  advogadoNome: string;
  advogadoOab: string;
  advogadoCpf: string;
  poderes?: string;
  data?: string;
  cidade?: string;
}

export function gerarProcuracao(vars: ProcuracaoVars): string {
  const data = vars.data || new Date().toLocaleDateString("pt-BR");
  const cidade = vars.cidade || vars.outorganteCidade || "[Cidade]";
  const poderes = vars.poderes || `poderes para o foro em geral, com as cláusulas ad judicia et extra, ad litem et post litem, em causa própria ou alheia, inclusive para substabelecer, no todo ou em parte, com ou sem reserva de iguais poderes, perante quaisquer juízos, varas, tribunais, autoridades administrativas e entidades públicas ou privadas, inclusive perante o Juizado Especial Cível e Criminal e o Juizado Especial Federal.`;

  return `PROCURAÇÃO

${cidade}, ${data}.

${vars.outorganteNome}, ${vars.outorganteNacionalidade}, ${vars.outorganteEstadoCivil}, ${vars.outorganteProfissao}, portador(a) do CPF nº ${vars.outorganteCpf} e RG nº ${vars.outorganteRg}, residente e domiciliado(a) à ${vars.outorganteEndereco}, na cidade de ${vars.outorganteCidade}, ${vars.outorganteEstado},

nomeia e constitui como seu(s) procurador(es) o(s) advogado(s) abaixo qualificado(s):

${vars.advogadoNome}, inscrito na OAB/${vars.advogadoOab} sob o CPF nº ${vars.advogadoCpf};

a quem confere ${poderes}

Assinatura do Outorgante:
_________________________________________
${vars.outorganteNome}

Assinatura do Advogado:
_________________________________________
${vars.advogadoNome}
OAB/${vars.advogadoOab}
`;
}
