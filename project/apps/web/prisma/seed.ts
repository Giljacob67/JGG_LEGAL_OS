import { PrismaClient, Area, ProcessoStatus, Risco, PrazoTipo, PrazoStatus, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Criar usuario socio
  const socio = await prisma.user.upsert({
    where: { email: "gilberto@jggroup.adv.br" },
    update: {},
    create: {
      clerkId: "user_gilberto",
      email: "gilberto@jggroup.adv.br",
      nome: "Dr. Gilberto Jacob",
      oab: "PR 17.158",
      role: Role.socio,
      cor: "#7E2D40",
      avatar: "GJ",
    },
  });

  const adv2 = await prisma.user.upsert({
    where: { email: "helena@jggroup.adv.br" },
    update: {},
    create: {
      clerkId: "user_helena",
      email: "helena@jggroup.adv.br",
      nome: "Dra. Helena Marques",
      oab: "PR 58.901",
      role: Role.advogado,
      cor: "#1F3A5F",
      avatar: "HM",
    },
  });

  // Clientes
  const clientesData = [
    { nome: "Fazenda Sao Joao Agropecuaria Ltda.", cpfCnpj: "12.345.678/0001-90", tipo: "PJ", cidade: "Maringa/PR", area: Area.bancario },
    { nome: "Agricola Tres Marias S/A", cpfCnpj: "23.456.789/0001-12", tipo: "PJ", cidade: "Sorriso/MT", area: Area.bancario },
    { nome: "Joao Batista Camargo", cpfCnpj: "345.678.901-22", tipo: "PF", cidade: "Cascavel/PR", area: Area.agrario },
    { nome: "Cooperativa Rural Vale do Iguacu", cpfCnpj: "34.567.890/0001-55", tipo: "PJ", cidade: "Uniao da Vitoria/PR", area: Area.tributario },
  ];

  const clientes = [];
  for (const c of clientesData) {
    const cli = await prisma.cliente.upsert({
      where: { cpfCnpj: c.cpfCnpj },
      update: {},
      create: c,
    });
    clientes.push(cli);
  }

  // Processos
  const hoje = new Date();
  const processosData = [
    {
      cnj: "0008421-55.2024.8.16.0017",
      clienteId: clientes[0].id,
      adverso: "Banco do Brasil S/A",
      tribunal: "TJPR",
      vara: "2a Vara Civel",
      comarca: "Maringa/PR",
      area: Area.bancario,
      tipo: "Embargos a Execucao — CCB Rural",
      status: ProcessoStatus.em_andamento,
      risco: Risco.alto,
      valor: 4287900.0,
      responsavelId: socio.id,
      tese: "Operacao Mata-Mata — Nulidade por simulacao",
      tagMataMata: true,
      distribuicao: new Date("2024-02-08"),
      proximoPrazo: new Date(hoje.getTime() + 3 * 86400000),
    },
    {
      cnj: "1003221-44.2024.8.11.0040",
      clienteId: clientes[1].id,
      adverso: "Banco Bradesco S/A",
      tribunal: "TJMT",
      vara: "3a Vara Civel",
      comarca: "Sorriso/MT",
      area: Area.bancario,
      tipo: "Acao Revisional de Cedula de Credito Rural",
      status: ProcessoStatus.em_andamento,
      risco: Risco.medio,
      valor: 2840000.0,
      responsavelId: adv2.id,
      tese: "Capitalizacao ilegal + CDI (Sum. 176 STJ)",
      tagMataMata: false,
      distribuicao: new Date("2024-05-30"),
      proximoPrazo: new Date(hoje.getTime() + 7 * 86400000),
    },
    {
      cnj: "0042118-90.2023.8.16.0035",
      clienteId: clientes[2].id,
      adverso: "Estado do Parana",
      tribunal: "TJPR",
      vara: "Vara da Fazenda Publica",
      comarca: "Cascavel/PR",
      area: Area.agrario,
      tipo: "Acao de Desapropriacao — Reforma Agraria",
      status: ProcessoStatus.em_andamento,
      risco: Risco.medio,
      valor: 1650000.0,
      responsavelId: socio.id,
      tese: "Justa indenizacao + juros compensatorios",
      tagMataMata: false,
      distribuicao: new Date("2023-11-04"),
      proximoPrazo: new Date(hoje.getTime() + 15 * 86400000),
    },
  ];

  const processos = [];
  for (const p of processosData) {
    const proc = await prisma.processo.upsert({
      where: { cnj: p.cnj },
      update: {},
      create: { ...p, equipe: { connect: [{ id: adv2.id }] } },
    });
    processos.push(proc);
  }

  // Prazos
  const prazosData = [
    { processoId: processos[0].id, tipo: PrazoTipo.fatal, titulo: "Embargos a Execucao", vence: new Date(hoje.getTime() + 3 * 86400000), responsavelId: socio.id },
    { processoId: processos[1].id, tipo: PrazoTipo.fatal, titulo: "Replica a contestacao", vence: new Date(hoje.getTime() + 1 * 86400000), responsavelId: adv2.id },
    { processoId: processos[2].id, tipo: PrazoTipo.audiencia, titulo: "Audiencia de Instrucao", vence: new Date(hoje.getTime() + 7 * 86400000), responsavelId: socio.id },
    { processoId: processos[0].id, tipo: PrazoTipo.dilacao, titulo: "Quesitos do laudo pericial", vence: new Date(hoje.getTime() + 15 * 86400000), responsavelId: adv2.id },
  ];

  for (const pz of prazosData) {
    await prisma.prazo.create({ data: pz });
  }

  console.log("Seed concluido com sucesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });