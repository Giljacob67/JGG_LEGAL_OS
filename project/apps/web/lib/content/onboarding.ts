// ============================================================
// Fluxos de Onboarding
// ============================================================

export const ONBOARDING_FLUXO_BASICO = [
  {
    ordem: 1,
    etapa: "Criar escritório",
    descricao: "Configure o nome do escritório, logo e dados de contato. Defina o primeiro administrador.",
    obrigatorio: true,
  },
  {
    ordem: 2,
    etapa: "Convidar usuários",
    descricao: "Adicione advogados, estagiários e equipe financeira. Atribua roles e permissões.",
    obrigatorio: true,
  },
  {
    ordem: 3,
    etapa: "Cadastrar primeiro cliente",
    descricao: "Insira nome, CPF/CNPJ, contato e área de atuação. O cliente é a base de todo processo.",
    obrigatorio: true,
  },
  {
    ordem: 4,
    etapa: "Criar primeiro processo",
    descricao: "Vincule ao cliente, informe o CNJ, parte contrária e tribunal. Importe dados do DataJud se desejar.",
    obrigatorio: true,
  },
  {
    ordem: 5,
    etapa: "Registrar primeiro prazo",
    descricao: "Adicione um prazo fatal ou de audiência. O sistema enviará alertas automáticos.",
    obrigatorio: false,
  },
  {
    ordem: 6,
    etapa: "Upload de documento",
    descricao: "Envie uma procuração, contrato ou peça. O documento será versionado automaticamente.",
    obrigatorio: false,
  },
  {
    ordem: 7,
    etapa: "Configurar contrato de honorários",
    descricao: "Formalize o vínculo financeiro com o cliente para emissão de faturas futuras.",
    obrigatorio: false,
  },
];

export const ONBOARDING_FLUXO_AVANCADO = [
  {
    ordem: 1,
    etapa: "Importar carteira de clientes",
    descricao: "Utilize planilha CSV ou integração para importar clientes em lote.",
    obrigatorio: false,
  },
  {
    ordem: 2,
    etapa: "Sincronizar processos via DataJud",
    descricao: "Importe processos ativos em lote a partir de uma lista de CNJs.",
    obrigatorio: false,
  },
  {
    ordem: 3,
    etapa: "Configurar integrações",
    descricao: "Conecte Google Drive, Calendar e Gmail para centralizar documentos e compromissos.",
    obrigatorio: false,
  },
  {
    ordem: 4,
    etapa: "Definir templates de documentos",
    descricao: "Personalize procurações, contratos e peças com dados do escritório.",
    obrigatorio: false,
  },
  {
    ordem: 5,
    etapa: "Treinamento da equipe",
    descricao: "Agende sessão de treinamento sobre RBAC, prazos, financeiro e uso da IA.",
    obrigatorio: false,
  },
];
