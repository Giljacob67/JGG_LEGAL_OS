import { Prisma } from "@prisma/client";

type Contrato = Prisma.ContratoHonorariosGetPayload<Prisma.ContratoHonorariosFindManyArgs>;

const c: Contrato = {} as unknown as Contrato;
void c.clienteId; // Does this compile?
