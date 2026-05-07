// ============================================================
// Microcopy Operacional · Estados Vazios · LGPD · Segurança
// ============================================================

export const ESTADOS_VAZIOS: Record<string, { titulo: string; descricao: string; acao?: string }> = {
  clientes: {
    titulo: "Nenhum cliente cadastrado",
    descricao: "Comece cadastrando seu primeiro cliente. O sistema organiza processos, prazos e documentos por cliente automaticamente.",
    acao: "Cadastrar cliente",
  },
  processos: {
    titulo: "Nenhum processo ativo",
    descricao: "Cadastre um processo manualmente ou importe dados via DataJud usando o número CNJ.",
    acao: "Novo processo",
  },
  prazos: {
    titulo: "Nenhum prazo registrado",
    descricao: "Prazos são a alma do escritório. Registre um prazo fatal, de audiência ou tarefa interna.",
    acao: "Registrar prazo",
  },
  documentos: {
    titulo: "Biblioteca vazia",
    descricao: "Envie arquivos (PDF, DOCX, imagens) ou crie peças diretamente no editor.",
    acao: "Enviar documento",
  },
  faturas: {
    titulo: "Nenhuma fatura emitida",
    descricao: "Vincule faturas aos contratos de honorários para acompanhar receitas e inadimplência.",
    acao: "Emitir fatura",
  },
  contratos: {
    titulo: "Nenhum contrato de honorários",
    descricao: "Formalize a relação com o cliente. O contrato define tipo de honorário, vigência e responsabilidades.",
    acao: "Novo contrato",
  },
  timesheet: {
    titulo: "Nenhum registro de horas",
    descricao: "Registre o tempo dedicado a cada processo para controle de produtividade e faturamento por hora.",
    acao: "Registrar hora",
  },
  relatorios: {
    titulo: "Sem dados suficientes",
    descricao: "Os relatórios aparecem automaticamente à medida que o escritório cadastra processos, clientes e faturas.",
  },
  ia: {
    titulo: "Assistente jurídico pronto",
    descricao: "A IA é uma ferramenta de apoio. A revisão final e a responsabilidade profissional são do advogado.",
    acao: "Iniciar conversa",
  },
};

export const ERROS_ACIONAVEIS: Record<string, { titulo: string; descricao: string; acao: string }> = {
  DUPLICATE_CNJ: {
    titulo: "CNJ já existe",
    descricao: "Já existe um processo cadastrado com este número CNJ. Verifique se não se trata de um processo duplicado ou de um novo andamento do mesmo feito.",
    acao: "Buscar processo existente",
  },
  DUPLICATE_CPF_CNPJ: {
    titulo: "Cliente já cadastrado",
    descricao: "Este CPF/CNPJ já consta na base de clientes. Atualize os dados do cadastro existente em vez de criar um novo.",
    acao: "Ver cadastro existente",
  },
  FORBIDDEN: {
    titulo: "Sem permissão",
    descricao: "Você não tem permissão para realizar esta operação. Entre em contato com o administrador do sistema.",
    acao: "Solicitar acesso",
  },
  RATE_LIMITED: {
    titulo: "Muitas requisições",
    descricao: "O sistema limita consultas repetidas para proteger dados. Aguarde alguns segundos e tente novamente.",
    acao: "Tentar novamente",
  },
  INVALID_CNJ: {
    titulo: "CNJ inválido",
    descricao: "O número informado não passou na validação do dígito verificador. Confira os 20 dígitos e a formatação.",
    acao: "Corrigir número",
  },
};

export const LGPD_DISCLAIMERS = {
  ia_assistente: `A Inteligência Artificial deste sistema é uma ferramenta de apoio à análise jurídica. A revisão final, a responsabilidade técnica e a decisão profissional são exclusivas do advogado responsável. Não utilize respostas da IA como substituto de parecer formal ou de diligência processual.`,

  documento_confidencial: `Documento classificado como sigiloso. Acesso restrito a profissionais autorizados. Compartilhamento externo requer autorização do responsável jurídico e observância às normas do sigilo de justiça e à LGPD (Lei 13.709/2018).`,

  dados_pessoais: `Este sistema processa dados pessoais e sensíveis nos termos da LGPD. O acesso é registrado em logs de auditoria. Utilize os dados estritamente para finalidades relacionadas à prestação de serviços advocatícios.`,

  integracao_terceiros: `Integrações com serviços de terceiros (DataJud, Google Drive, etc.) transmitem dados sob políticas próprias desses provedores. Tokens de acesso são criptografados e nunca armazenados em texto plano.`,

  onboarding: `Bem-vindo ao JGG Legal OS. Este é um ambiente de gestão jurídica interna. Toda informação inserida é de propriedade do escritório e está sujeita às políticas de confidencialidade e proteção de dados da JGG GROUP.`,
};

export const NOMENCLATURA: Record<string, string> = {
  processos: "Processos",
  clientes: "Clientes",
  prazos: "Prazos",
  documentos: "Documentos",
  honorarios: "Honorários",
  faturas: "Faturas",
  timesheet: "Timesheet",
  contratos: "Contratos de Honorários",
  relatorios: "Relatórios",
  agenda: "Agenda",
  dashboard: "Dashboard",
  ia: "Assistente Jurídico",
  blueprint: "Arquitetura do Sistema",
};
