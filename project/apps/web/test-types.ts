import { Prisma } from "@prisma/client";

// Test 2: Prisma payload type
type Contrato = Prisma.ContratoHonorariosGetPayload<{
  include: {
    cliente: { select: { id: true; nome: true } };
    processo: { select: { id: true; cnj: true } };
    _count: { select: { faturas: true } };
  };
}>;

const c: Contrato = {} as unknown as Contrato;
void c.cliente?.nome;
void c.processo?.cnj;
void c._count?.faturas;
