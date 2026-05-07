// ============================================================
// Taxonomia Jurídica JGG Legal OS
// ============================================================

export const AREAS = [
  { key: "bancario", label: "Bancário", desc: "Revisão de contratos bancários, cobrança abusiva, CDC, juros compostos, spread bancário" },
  { key: "agrario", label: "Agrário", desc: "Regularização fundiária, usucapião, Território Quilombola, reforma agrária, litígios possessórios" },
  { key: "tributario", label: "Tributário", desc: "Planejamento tributário, recuperação de créditos, defesa fiscal, consultoria em ICMS, IPI, ISS" },
  { key: "trabalhista", label: "Trabalhista", desc: "Reclamações trabalhistas, rescisão indireta, assédio moral, compliance trabalhista" },
  { key: "civil", label: "Civil", desc: "Contratos, responsabilidade civil, indenizações, direito das famílias, sucessões" },
  { key: "empresarial", label: "Empresarial", desc: "Societário, M&A, recuperação judicial, compliance, contratos corporativos" },
  { key: "penal", label: "Penal", desc: "Defesa criminal, compliance penal, habeas corpus, delações, colaboração premiada" },
] as const;

export const TIPOS_ACAO: Record<string, string[]> = {
  bancario: [
    "Ação Revisional de Contrato Bancário",
    "Ação Declaratória de Inexistência de Débito",
    "Ação de Cobrança Indevida",
    "Ação de Indenização por Dano Moral/Material",
    "Ação de Repetição de Indébito (Art. 42 CDC)",
    "Execução de Título Extrajudicial",
    "Incidente de Resolução de Demandas Repetitivas (IRDR)",
  ],
  agrario: [
    "Ação de Usucapião",
    "Ação de Imissão na Posse",
    "Ação de Reintegração de Posse",
    "Ação de Anulação de Título de Domínio",
    "Ação de Concessão/Regularização Fundiária",
    "Ação de Divisão e Demarcação",
    "Ação de Indenização por Desapropriação",
  ],
  tributario: [
    "Ação Anulatória de Débito Fiscal",
    "Mandado de Segurança Tributário",
    "Ação Declaratória de Inexistência de Relação Tributária",
    "Repetição de Indébito Tributário",
    "Ação de Compensação de Créditos",
    "Embargos à Execução Fiscal",
    "Ação Civil Pública por Práticas Tributárias Ilegais",
  ],
  trabalhista: [
    "Reclamação Trabalhista",
    "Ação de Cobrança de Verbas Rescisórias",
    "Ação de Indenização por Assédio Moral/Sexual",
    "Ação de Anulação de Justa Causa",
    "Ação de Reintegração / Estabilidade",
    "Ação de Responsabilidade do Tomador de Serviços",
    "Execução de Sentença Trabalhista",
  ],
  civil: [
    "Ação de Indenização por Dano Moral/Material",
    "Ação de Obrigação de Fazer / Não Fazer",
    "Ação de Rescisão Contratual",
    "Ação de Restituição de Bens / Reintegração",
    "Ação de Divórcio / Separação / União Estável",
    "Ação de Alimentos",
    "Ação de Inventário / Arrolamento",
  ],
  empresarial: [
    "Ação de Dissolução Parcial de Sociedade",
    "Ação de Resolução / Rescisão Contratual",
    "Ação de Anulação de Ato Societário",
    "Ação de Indenização por Quebra de Contrato",
    "Recuperação Judicial / Extrajudicial",
    "Ação de Obrigação de Transferir quotas/ações",
    "Ação de Prestação de Contas",
  ],
  penal: [
    "Habeas Corpus",
    "Recurso em Sentido Estrito",
    "Agravo em Execução",
    "Ação Penal Originária",
    "Pedido de Liberdade Provisória",
    "Pedido de Relaxamento de Prisão",
    "Pedido de Extinção de Punibilidade",
  ],
};

export const FASES_PROCESSUAIS = [
  { key: "distribuicao", label: "Distribuição" },
  { key: "audiencia_conciliacao", label: "Audiência de Conciliação" },
  { key: "provas", label: "Fase de Provas" },
  { key: "memoriais", label: "Memoriais / Alegações Finais" },
  { key: "sentenca", label: "Sentença" },
  { key: "recurso", label: "Fase Recursal" },
  { key: "transito_julgado", label: "Trânsito em Julgado" },
  { key: "execucao", label: "Execução / Cumprimento de Sentença" },
  { key: "cumprimento_provimento", label: "Cumprimento de Provimento" },
] as const;

export const RISCOS_LABELS: Record<string, { label: string; desc: string }> = {
  alto: { label: "Alto", desc: "Alta probabilidade de derrota, prejuízo significativo ou dano irreversível ao cliente" },
  medio: { label: "Médio", desc: "Incertezas materiais de fato ou de direito; estratégia definida, mas contingências relevantes" },
  baixo: { label: "Baixo", desc: "Situação dominada, jurisprudência consolidada, risco residual gerenciável" },
};

export const STATUS_FINANCEIROS = [
  { key: "previsto", label: "Previsto", color: "bg-slate-100 text-slate-700" },
  { key: "pendente", label: "Pendente", color: "bg-amber-100 text-amber-700" },
  { key: "pago", label: "Pago", color: "bg-emerald-100 text-emerald-700" },
  { key: "atrasado", label: "Atrasado", color: "bg-rose-100 text-rose-700" },
  { key: "cancelado", label: "Cancelado", color: "bg-slate-100 text-slate-500" },
] as const;

export const TIPOS_PRAZO = [
  { key: "fatal", label: "Prazo Fatal", desc: "Decadência ou prescrição. Perda irreversível do direito.", color: "bg-rose-500" },
  { key: "dilacao", label: "Prazo de Dilação", desc: "Prazo processual para prática de ato (contestação, recurso, etc.)", color: "bg-amber-500" },
  { key: "audiencia", label: "Audiência", desc: "Audiência designada pelo juízo. Comparecimento obrigatório.", color: "bg-blue-500" },
  { key: "reuniao", label: "Reunião", desc: "Reunião interna ou externa com cliente, perito, colega.", color: "bg-violet-500" },
  { key: "tarefa", label: "Tarefa", desc: "Tarefa interna sem data fatal, mas com compromisso de entrega.", color: "bg-slate-400" },
] as const;
