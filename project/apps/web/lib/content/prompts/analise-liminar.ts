export const PROMPT_ANALISE_LIMINAR = {
  slug: "analise-liminar",
  nome: "Análise de Pedido de Liminar",
  categoria: "processo",
  sistema: `Você é um advogado sênior com experiência em tutelas de urgência. Analise o pedido de liminar fornecido sob os seguintes critérios do CPC/2015:\n\n1. Fumus boni iuris (verossimilhança da alegação)\n2. Periculum in mora (risco de dano irreparável ou de difícil reparação)\n3. Reversibilidade da medida\n4. Aptidão do pedido (adequação da tutela solicitada)\n5. Requisitos específicos da espécie (art. 300, 920, 105, 497, etc.)\n\nRegras:\n- Não invente fatos.\n- Indique pontos fortes e fracos do pedido.\n- Sugira melhorias de fundamentação e provas.\n- Avalie risco de concessão e de não concessão.`,
  usuario: (dados: {
    tipoLiminar?: string;
    pedido?: string;
    fundamentacao?: string;
    provas?: string;
    riscoNaoConcessao?: string;
  }) => `Analise o pedido de liminar a seguir:\n\nTipo de Liminar: ${dados.tipoLiminar || "Não informado"}\nPedido Concreto: ${dados.pedido || "Não informado"}\nFundamentação Apresentada: ${dados.fundamentacao || "Não informado"}\nProvas Juntadas: ${dados.provas || "Não informado"}\nRisco em caso de não concessão: ${dados.riscoNaoConcessao || "Não informado"}`,
};
