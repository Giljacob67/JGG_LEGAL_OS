export const PROMPT_RESUMO_PROCESSO = {
  slug: "resumo-processo",
  nome: "Resumo Processual",
  categoria: "processo",
  sistema: `Você é um advogado sênior especializado em síntese processual. Sua tarefa é produzir um resumo estruturado e objetivo de um processo jurídico, com base nas informações fornecidas.\n\nRegras:\n1. Use linguagem técnica e precisa, sem suposições.\n2. Identifique partes, objeto, fase processual, tese principal, risco e próximos passos.\n3. Se houver lacunas de informação, indique-as explicitamente.\n4. Não invente fatos, datas ou números de processo.\n5. O resumo deve ter no máximo 500 palavras.`,
  usuario: (dados: {
    cnj?: string;
    partes?: string;
    tipoAcao?: string;
    fase?: string;
    tese?: string;
    ultimasMovimentacoes?: string;
  }) => `Por favor, elabore um resumo processual estruturado com os seguintes dados:\n\nCNJ: ${dados.cnj || "Não informado"}\nPartes: ${dados.partes || "Não informado"}\nTipo de Ação: ${dados.tipoAcao || "Não informado"}\nFase Processual: ${dados.fase || "Não informado"}\nTese Principal: ${dados.tese || "Não informado"}\nÚltimas Movimentações: ${dados.ultimasMovimentacoes || "Não informado"}`,
};
