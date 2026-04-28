import { PrismaClient, Role, Area, ProcessoStatus, Risco, PrazoTipo, PrazoStatus, Permission } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...\n");

  // ============================================================
  // 1. USUÁRIOS
  // ============================================================
  const admin = await prisma.user.upsert({
    where: { clerkId: "user_admin_gilberto" },
    update: {},
    create: {
      clerkId: "user_admin_gilberto",
      email: "gilberto@jggroup.com.br",
      nome: "Dr. Gilberto Jacob",
      oab: "PR 17.158",
      role: Role.socio,
      cor: "#2563eb",
      ativo: true,
    },
  });

  const helena = await prisma.user.upsert({
    where: { clerkId: "user_helena" },
    update: {},
    create: {
      clerkId: "user_helena",
      email: "helena@jggroup.com.br",
      nome: "Dra. Helena Marques",
      oab: "PR 58.901",
      role: Role.advogado,
      cor: "#db2777",
      ativo: true,
    },
  });

  const financeiro = await prisma.user.upsert({
    where: { clerkId: "user_financeiro" },
    update: {},
    create: {
      clerkId: "user_financeiro",
      email: "financeiro@jggroup.com.br",
      nome: "Carlos Mendes",
      role: Role.financeiro,
      cor: "#059669",
      ativo: true,
    },
  });

  const comercial = await prisma.user.upsert({
    where: { clerkId: "user_comercial" },
    update: {},
    create: {
      clerkId: "user_comercial",
      email: "comercial@jggroup.com.br",
      nome: "Ana Paula Souza",
      role: Role.comercial,
      cor: "#d97706",
      ativo: true,
    },
  });

  const estagiario = await prisma.user.upsert({
    where: { clerkId: "user_estagiario" },
    update: {},
    create: {
      clerkId: "user_estagiario",
      email: "estagiario@jggroup.com.br",
      nome: "Pedro Lima",
      role: Role.estagiario,
      cor: "#7c3aed",
      ativo: true,
    },
  });

  console.log("✅ Usuários criados");

  // ============================================================
  // 2. PERMISSÕES
  // ============================================================
  const assignPermissions = async (userId: string, role: Role) => {
    const defaultPerms: Record<Role, Permission[]> = {
      admin: Object.values(Permission),
      socio: [
        Permission.dashboard_view,
        Permission.processo_view, Permission.processo_create, Permission.processo_edit, Permission.processo_delete,
        Permission.cliente_view, Permission.cliente_create, Permission.cliente_edit, Permission.cliente_delete,
        Permission.contato_view, Permission.contato_create, Permission.contato_edit, Permission.contato_delete,
        Permission.prazo_view, Permission.prazo_create, Permission.prazo_edit, Permission.prazo_delete,
        Permission.tarefa_view, Permission.tarefa_create, Permission.tarefa_edit, Permission.tarefa_delete,
        Permission.documento_view, Permission.documento_create, Permission.documento_edit, Permission.documento_delete,
        Permission.financeiro_view, Permission.financeiro_create, Permission.financeiro_edit, Permission.financeiro_delete,
        Permission.crm_view, Permission.crm_create, Permission.crm_edit, Permission.crm_delete,
        Permission.ia_view, Permission.ia_use,
        Permission.relatorio_view, Permission.relatorio_create,
        Permission.admin_users, Permission.admin_roles, Permission.admin_integrations, Permission.admin_settings, Permission.admin_audit,
      ],
      advogado: [
        Permission.dashboard_view,
        Permission.processo_view, Permission.processo_create, Permission.processo_edit,
        Permission.cliente_view, Permission.cliente_create, Permission.cliente_edit,
        Permission.contato_view, Permission.contato_create, Permission.contato_edit,
        Permission.prazo_view, Permission.prazo_create, Permission.prazo_edit,
        Permission.tarefa_view, Permission.tarefa_create, Permission.tarefa_edit,
        Permission.documento_view, Permission.documento_create, Permission.documento_edit,
        Permission.financeiro_view,
        Permission.crm_view, Permission.crm_create, Permission.crm_edit,
        Permission.ia_view, Permission.ia_use,
        Permission.relatorio_view,
      ],
      estagiario: [
        Permission.dashboard_view,
        Permission.processo_view,
        Permission.cliente_view,
        Permission.contato_view,
        Permission.prazo_view,
        Permission.tarefa_view, Permission.tarefa_create, Permission.tarefa_edit,
        Permission.documento_view, Permission.documento_create,
        Permission.crm_view,
      ],
      financeiro: [
        Permission.dashboard_view,
        Permission.cliente_view,
        Permission.financeiro_view, Permission.financeiro_create, Permission.financeiro_edit, Permission.financeiro_delete, Permission.financeiro_admin,
        Permission.relatorio_view, Permission.relatorio_create,
      ],
      comercial: [
        Permission.dashboard_view,
        Permission.cliente_view, Permission.cliente_create, Permission.cliente_edit,
        Permission.crm_view, Permission.crm_create, Permission.crm_edit, Permission.crm_delete,
        Permission.relatorio_view,
      ],
    };

    const perms = defaultPerms[role] || [];
    await prisma.userPermission.deleteMany({ where: { userId } });
    await prisma.userPermission.createMany({
      data: perms.map((p) => ({ userId, permission: p })),
      skipDuplicates: true,
    });
  };

  await assignPermissions(admin.id, Role.socio);
  await assignPermissions(helena.id, Role.advogado);
  await assignPermissions(financeiro.id, Role.financeiro);
  await assignPermissions(comercial.id, Role.comercial);
  await assignPermissions(estagiario.id, Role.estagiario);

  console.log("✅ Permissões atribuídas");

  // ============================================================
  // 3. CLIENTES
  // ============================================================
  const cliente1 = await prisma.cliente.upsert({
    where: { cpfCnpj: "12.345.678/0001-90" },
    update: {},
    create: {
      nome: "Fazenda São João Agropecuária Ltda.",
      cpfCnpj: "12.345.678/0001-90",
      tipo: "PJ",
      email: "contato@saojoaoagro.com.br",
      telefone: "(46) 3224-8900",
      celular: "(46) 99988-7766",
      cidade: "Pato Branco",
      estado: "PR",
      area: Area.bancario,
      status: "ativo",
      origem: "Indicação",
      endereco: "Rodovia BR-158, Km 245, Zona Rural",
      observacoes: "Cliente estratégico na região sudoeste do Paraná. Operação Mata-Mata.",
    },
  });

  const cliente2 = await prisma.cliente.upsert({
    where: { cpfCnpj: "98.765.432/0001-10" },
    update: {},
    create: {
      nome: "Agrícola Três Marias S.A.",
      cpfCnpj: "98.765.432/0001-10",
      tipo: "PJ",
      email: "juridico@tresmarias.com.br",
      telefone: "(46) 3533-1200",
      cidade: "Francisco Beltrão",
      estado: "PR",
      area: Area.bancario,
      status: "ativo",
      origem: "Prospecção ativa",
      endereco: "Av. Brasil, 4500, Centro",
    },
  });

  const cliente3 = await prisma.cliente.upsert({
    where: { cpfCnpj: "123.456.789-00" },
    update: {},
    create: {
      nome: "João Batista Camargo",
      cpfCnpj: "123.456.789-00",
      tipo: "PF",
      email: "jbcamargo@gmail.com",
      telefone: "(46) 99912-3456",
      cidade: "Clevelândia",
      estado: "PR",
      area: Area.agrario,
      status: "ativo",
      origem: "Site",
      endereco: "Rua das Flores, 123",
      observacoes: "Pequeno produtor rural. Ação de desapropriação.",
    },
  });

  const cliente4 = await prisma.cliente.upsert({
    where: { cpfCnpj: "11.222.333/0001-44" },
    update: {},
    create: {
      nome: "Cooperativa Rural Vale do Iguaçu",
      cpfCnpj: "11.222.333/0001-44",
      tipo: "PJ",
      email: "diretoria@coopvaleiguacu.coop.br",
      telefone: "(46) 3270-5500",
      cidade: "Dois Vizinhos",
      estado: "PR",
      area: Area.tributario,
      status: "ativo",
      origem: "Parceiro",
      endereco: "Rua Cooperativa, 1000",
    },
  });

  const cliente5 = await prisma.cliente.upsert({
    where: { cpfCnpj: "987.654.321-00" },
    update: {},
    create: {
      nome: "Maria Helena da Silva",
      cpfCnpj: "987.654.321-00",
      tipo: "PF",
      email: "mhsilva@hotmail.com",
      telefone: "(41) 99876-5432",
      cidade: "Curitiba",
      estado: "PR",
      area: Area.trabalhista,
      status: "lead",
      origem: "Indicação",
    },
  });

  console.log("✅ Clientes criados");

  // ============================================================
  // 4. PROCESSOS
  // ============================================================
  const processo1 = await prisma.processo.upsert({
    where: { cnj: "0000001-12.2024.8.16.0001" },
    update: {},
    create: {
      cnj: "0000001-12.2024.8.16.0001",
      clienteId: cliente1.id,
      adverso: "Banco do Brasil S.A.",
      adversoAdv: "Dr. Ricardo Souza - OAB/PR 45.678",
      tribunal: "TJPR",
      vara: "1ª Vara Cível",
      comarca: "Pato Branco",
      area: Area.bancario,
      classe: "Embargos à Execução",
      assunto: "Contrato de Crédito Rural",
      tipo: "Cível",
      status: ProcessoStatus.em_andamento,
      risco: Risco.alto,
      valorCausa: 1600000.00,
      valorProvavel: 2400000.00,
      responsavelId: admin.id,
      tese: "Inaplicabilidade da Lei 13.709/2018 (LGPD) para fins de execução. Prescrição parcial.",
      tagMataMata: true,
      distribuicao: new Date("2024-03-15"),
      observacoes: "Operação Mata-Mata. Cliente estratégico.",
      etiquetas: ["mata-mata", "alto-risco", "bancario"],
    },
  });

  const processo2 = await prisma.processo.upsert({
    where: { cnj: "0000002-34.2023.8.16.0002" },
    update: {},
    create: {
      cnj: "0000002-34.2023.8.16.0002",
      clienteId: cliente2.id,
      adverso: "Banco Itaú S.A.",
      tribunal: "TJPR",
      vara: "2ª Vara Cível",
      comarca: "Francisco Beltrão",
      area: Area.bancario,
      classe: "Ação Revisional",
      assunto: "Contrato de Câmbio e Compra de Dólar",
      tipo: "Cível",
      status: ProcessoStatus.em_andamento,
      risco: Risco.medio,
      valorCausa: 4300000.00,
      valorProvavel: 6000000.00,
      responsavelId: admin.id,
      tese: "Câmbio fixo em contrato de barter. Revisão de contrato.",
      tagMataMata: false,
      distribuicao: new Date("2023-08-20"),
      observacoes: "Contrato de barter com câmbio fixo.",
    },
  });

  const processo3 = await prisma.processo.upsert({
    where: { cnj: "0000003-56.2024.8.16.0003" },
    update: {},
    create: {
      cnj: "0000003-56.2024.8.16.0003",
      clienteId: cliente3.id,
      adverso: "União Federal",
      tribunal: "TJPR",
      vara: "1ª Vara Federal",
      comarca: "Clevelândia",
      area: Area.agrario,
      classe: "Ação de Desapropriação",
      assunto: "Desapropriação por Utilidade Pública",
      tipo: "Federal",
      status: ProcessoStatus.em_andamento,
      risco: Risco.baixo,
      valorCausa: 850000.00,
      responsavelId: helena.id,
      distribuicao: new Date("2024-01-10"),
      observacoes: "Pequeno produtor rural. Indenização por desapropriação.",
    },
  });

  // Vincular equipe
  await prisma.processo.update({
    where: { id: processo1.id },
    data: { equipe: { connect: [{ id: helena.id }] } },
  });

  await prisma.processo.update({
    where: { id: processo2.id },
    data: { equipe: { connect: [{ id: helena.id }] } },
  });

  console.log("✅ Processos criados");

  // ============================================================
  // 5. PRAZOS
  // ============================================================
  const hoje = new Date();
  const addDays = (d: Date, days: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + days);
    return r;
  };

  await prisma.prazo.upsert({
    where: { id: "seed_prazo_1" },
    update: {},
    create: {
      id: "seed_prazo_1",
      processoId: processo1.id,
      tipo: PrazoTipo.fatal,
      titulo: "Contestação - Embargos à Execução",
      vence: addDays(hoje, 2),
      responsavelId: admin.id,
      status: PrazoStatus.aberto,
      alertas: [15, 7, 3, 1],
    },
  });

  await prisma.prazo.upsert({
    where: { id: "seed_prazo_2" },
    update: {},
    create: {
      id: "seed_prazo_2",
      processoId: processo2.id,
      tipo: PrazoTipo.audiencia,
      titulo: "Audiência de Conciliação",
      vence: addDays(hoje, 5),
      responsavelId: helena.id,
      status: PrazoStatus.aberto,
      alertas: [15, 7, 3, 1],
    },
  });

  await prisma.prazo.upsert({
    where: { id: "seed_prazo_3" },
    update: {},
    create: {
      id: "seed_prazo_3",
      processoId: processo1.id,
      tipo: PrazoTipo.dilacao,
      titulo: "Prazo para apresentação de documentos",
      vence: addDays(hoje, 12),
      responsavelId: admin.id,
      status: PrazoStatus.aberto,
      alertas: [15, 7, 3, 1],
    },
  });

  await prisma.prazo.upsert({
    where: { id: "seed_prazo_4" },
    update: {},
    create: {
      id: "seed_prazo_4",
      processoId: processo3.id,
      tipo: PrazoTipo.fatal,
      titulo: "Recurso de Apelação",
      vence: addDays(hoje, 18),
      responsavelId: helena.id,
      status: PrazoStatus.aberto,
      alertas: [15, 7, 3, 1],
    },
  });

  console.log("✅ Prazos criados");

  // ============================================================
  // 6. ANDAMENTOS
  // ============================================================
  await prisma.andamento.createMany({
    data: [
      {
        processoId: processo1.id,
        data: new Date("2024-03-20"),
        evento: "Distribuição",
        descricao: "Processo distribuído para a 1ª Vara Cível de Pato Branco.",
        fonte: "manual",
      },
      {
        processoId: processo1.id,
        data: new Date("2024-04-05"),
        evento: "Decisão",
        descricao: "Deferida a liminar para suspensão da execução provisória.",
        fonte: "manual",
        critico: true,
      },
      {
        processoId: processo2.id,
        data: new Date("2023-09-10"),
        evento: "Distribuição",
        descricao: "Processo distribuído para a 2ª Vara Cível de Francisco Beltrão.",
        fonte: "manual",
      },
    ],
    skipDuplicates: false,
  });

  console.log("✅ Andamentos criados");

  // ============================================================
  // 7. DOCUMENTOS
  // ============================================================
  await prisma.documento.createMany({
    data: [
      {
        processoId: processo1.id,
        nome: "Procuração Ad Judicia",
        tipo: "peticao",
        versao: 1,
        autorId: admin.id,
        segredo: false,
      },
      {
        processoId: processo1.id,
        nome: "Contrato de Crédito Rural - CCB",
        tipo: "contrato",
        versao: 1,
        autorId: admin.id,
        segredo: true,
      },
      {
        processoId: processo2.id,
        nome: "Contrato de Barter",
        tipo: "contrato",
        versao: 1,
        autorId: helena.id,
        segredo: false,
      },
    ],
    skipDuplicates: false,
  });

  console.log("✅ Documentos criados");

  // ============================================================
  // 8. CONTRATOS DE HONORÁRIOS
  // ============================================================
  const contrato1 = await prisma.contratoHonorarios.upsert({
    where: { id: "seed_contrato_1" },
    update: {},
    create: {
      id: "seed_contrato_1",
      numero: "CONT-2024-001",
      clienteId: cliente1.id,
      processoId: processo1.id,
      tipo: "exito",
      percentual: 15.0,
      estimativa: 360000.00,
      vigente: true,
      dataInicio: new Date("2024-03-15"),
      observacoes: "Êxito de 15% sobre o valor da causa. Sem honorários fixos.",
    },
  });

  await prisma.contratoHonorarios.upsert({
    where: { id: "seed_contrato_2" },
    update: {},
    create: {
      id: "seed_contrato_2",
      numero: "CONT-2023-045",
      clienteId: cliente2.id,
      processoId: processo2.id,
      tipo: "hora",
      taxaHora: 850.00,
      horasMes: 20,
      estimativa: 17000.00,
      vigente: true,
      dataInicio: new Date("2023-08-20"),
      observacoes: "Taxa horária de R$ 850,00. Estimativa de 20h/mês.",
    },
  });

  console.log("✅ Contratos de honorários criados");

  // ============================================================
  // 9. FATURAS
  // ============================================================
  await prisma.fatura.createMany({
    data: [
      {
        numero: "FAT-2024-001",
        clienteId: cliente1.id,
        contratoId: contrato1.id,
        emitidoPorId: financeiro.id,
        mes: "04/2024",
        ano: 2024,
        valor: 50000.00,
        status: "pago",
        vencimento: new Date("2024-04-30"),
        pagoEm: new Date("2024-04-25"),
      },
      {
        numero: "FAT-2024-002",
        clienteId: cliente1.id,
        contratoId: contrato1.id,
        emitidoPorId: financeiro.id,
        mes: "05/2024",
        ano: 2024,
        valor: 50000.00,
        status: "pendente",
        vencimento: new Date("2024-05-31"),
      },
      {
        numero: "FAT-2024-003",
        clienteId: cliente2.id,
        emitidoPorId: financeiro.id,
        mes: "04/2024",
        ano: 2024,
        valor: 17000.00,
        status: "pago",
        vencimento: new Date("2024-04-30"),
        pagoEm: new Date("2024-04-28"),
      },
    ],
    skipDuplicates: false,
  });

  console.log("✅ Faturas criadas");

  // ============================================================
  // 10. TIMESHEET
  // ============================================================
  await prisma.timesheet.createMany({
    data: [
      { userId: admin.id, processoId: processo1.id, data: new Date("2024-04-01"), horas: 3.5, atividade: "Análise de contrato e parecer", faturado: true },
      { userId: admin.id, processoId: processo1.id, data: new Date("2024-04-02"), horas: 2.0, atividade: "Reunião com cliente", faturado: true },
      { userId: helena.id, processoId: processo2.id, data: new Date("2024-04-01"), horas: 4.0, atividade: "Elaboração de petição inicial", faturado: true },
      { userId: helena.id, processoId: processo3.id, data: new Date("2024-04-03"), horas: 1.5, atividade: "Análise de documentos de desapropriação", faturado: false },
    ],
    skipDuplicates: false,
  });

  console.log("✅ Timesheets criados");

  // ============================================================
  // 11. PROMPT TEMPLATES DE IA
  // ============================================================
  await prisma.promptTemplate.createMany({
    data: [
      {
        nome: "Resumir Processo",
        slug: "resumir-processo",
        descricao: "Gera um resumo executivo do processo com base nos dados cadastrados.",
        sistema: "Você é um assistente jurídico sênior especializado em direito brasileiro. Gere um resumo claro, objetivo e profissional do processo abaixo, destacando: objetivo da ação, partes, fase atual, riscos e próximos passos recomendados.",
        usuario: "Resuma o seguinte processo:\n\nCliente: {{cliente}}\nÁrea: {{area}}\nTipo: {{tipo}}\nStatus: {{status}}\nValor da Causa: {{valorCausa}}\nRisco: {{risco}}\nTese: {{tese}}\nObservações: {{observacoes}}\n\nÚltimos andamentos:\n{{andamentos}}",
        categoria: "processo",
      },
      {
        nome: "Gerar Minuta de Petição",
        slug: "minuta-peticao",
        descricao: "Gera rascunho de petição inicial ou incidental.",
        sistema: "Você é um advogado brasileiro com 20 anos de experiência. Gere uma minuta de petição formal, bem estruturada e com fundamentação jurídica adequada. Inclua qualificação das partes, fatos, fundamentação jurídica e pedidos. Esta é uma MINUTA para revisão humana.",
        usuario: "Gere uma minuta de {{tipoPeticao}} para o seguinte caso:\n\nCliente: {{cliente}}\nParte contrária: {{adverso}}\nÁrea: {{area}}\nObjeto: {{objeto}}\nFatos relevantes: {{fatos}}",
        categoria: "documento",
      },
      {
        nome: "Análise de Risco",
        slug: "analise-risco",
        descricao: "Analisa probabilidade de êxito e riscos do caso.",
        sistema: "Você é um consultor jurídico especializado em análise de risco processual. Avalie o caso abaixo considerando: força das provas, jurisprudência recente, cenários favoráveis e desfavoráveis, e recomendações estratégicas. Seja honesto e conservador nas estimativas.",
        usuario: "Analise o risco do seguinte caso:\n\nÁrea: {{area}}\nTipo: {{tipo}}\nValor: {{valor}}\nTese: {{tese}}\nRisco atual: {{risco}}\nAndamentos:\n{{andamentos}}",
        categoria: "analise",
      },
      {
        nome: "Criar Checklist",
        slug: "checklist-providencias",
        descricao: "Gera checklist de providências a partir de movimentações.",
        sistema: "Você é um gestor de escritório jurídico organizado. Crie um checklist de providências práticas e acionáveis com base nas movimentações processuais fornecidas. Inclua prazos, responsáveis e prioridades.",
        usuario: "Crie um checklist de providências com base nas seguintes movimentações:\n\n{{movimentacoes}}",
        categoria: "tarefa",
      },
      {
        nome: "Resumir Movimentações",
        slug: "resumir-movimentacoes",
        descricao: "Resume as últimas movimentações do processo.",
        sistema: "Você é um assistente jurídico. Resuma as movimentações processuais abaixo de forma clara e objetiva, destacando o que realmente importa para a estratégia do caso.",
        usuario: "Resuma as seguintes movimentações:\n\n{{movimentacoes}}",
        categoria: "processo",
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Prompt templates criados");

  // ============================================================
  // 12. CONFIGURAÇÕES DO SISTEMA
  // ============================================================
  await prisma.systemSetting.createMany({
    data: [
      { chave: "empresa_nome", valor: "JGG Group", descricao: "Nome do escritório" },
      { chave: "empresa_cnpj", valor: "", descricao: "CNPJ do escritório" },
      { chave: "empresa_endereco", valor: "", descricao: "Endereço do escritório" },
      { chave: "empresa_telefone", valor: "", descricao: "Telefone do escritório" },
      { chave: "empresa_email", valor: "contato@jggroup.com.br", descricao: "E-mail de contato" },
      { chave: "dashboard_kpi_dias", valor: "30", descricao: "Período padrão de KPIs do dashboard (dias)" },
      { chave: "prazo_alertas_padrao", valor: "15,7,3,1", descricao: "Dias antes do vencimento para alertas de prazo" },
      { chave: "fatura_dia_vencimento", valor: "10", descricao: "Dia do mês para vencimento de faturas" },
      { chave: "ia_provider_padrao", valor: "ollama", descricao: "Provider de IA padrão" },
      { chave: "ia_modelo_padrao", valor: "kimi-k2.6:cloud", descricao: "Modelo de IA padrão" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Configurações do sistema criadas");

  console.log("\n🎉 Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
