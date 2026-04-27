-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'socio', 'advogado', 'estagiario');

-- CreateEnum
CREATE TYPE "Area" AS ENUM ('bancario', 'agrario', 'tributario');

-- CreateEnum
CREATE TYPE "ProcessoStatus" AS ENUM ('em_andamento', 'suspenso', 'arquivado', 'encerrado');

-- CreateEnum
CREATE TYPE "Risco" AS ENUM ('alto', 'medio', 'baixo');

-- CreateEnum
CREATE TYPE "PrazoTipo" AS ENUM ('fatal', 'dilacao', 'audiencia', 'reuniao', 'tarefa');

-- CreateEnum
CREATE TYPE "PrazoStatus" AS ENUM ('aberto', 'cumprido', 'perdido');

-- CreateEnum
CREATE TYPE "DocumentoTipo" AS ENUM ('peticao', 'contrato', 'extrato', 'decisao', 'certidao', 'parecer', 'planilha', 'outro');

-- CreateEnum
CREATE TYPE "HonorarioTipo" AS ENUM ('fixo_mensal', 'exito', 'hora', 'combinado');

-- CreateEnum
CREATE TYPE "FaturaStatus" AS ENUM ('pago', 'pendente', 'atrasado');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "oab" TEXT,
    "role" "Role" NOT NULL DEFAULT 'advogado',
    "cor" TEXT,
    "avatar" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cidade" TEXT,
    "area" "Area",
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Processo" (
    "id" TEXT NOT NULL,
    "cnj" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "adverso" TEXT,
    "tribunal" TEXT,
    "vara" TEXT,
    "comarca" TEXT,
    "area" "Area" NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" "ProcessoStatus" NOT NULL DEFAULT 'em_andamento',
    "risco" "Risco" NOT NULL DEFAULT 'medio',
    "valor" DECIMAL(14,2),
    "responsavelId" TEXT NOT NULL,
    "tese" TEXT,
    "tagMataMata" BOOLEAN NOT NULL DEFAULT false,
    "distribuicao" TIMESTAMP(3),
    "ultimoAndamento" TIMESTAMP(3),
    "proximoPrazo" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Andamento" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "evento" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fonte" TEXT NOT NULL DEFAULT 'manual',
    "critico" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Andamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prazo" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "tipo" "PrazoTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "vence" TIMESTAMP(3) NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "status" "PrazoStatus" NOT NULL DEFAULT 'aberto',
    "alertas" INTEGER[] DEFAULT ARRAY[15, 7, 3, 1]::INTEGER[],
    "notificar" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prazo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "processoId" TEXT,
    "nome" TEXT NOT NULL,
    "tipo" "DocumentoTipo" NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "tamanho" INTEGER,
    "url" TEXT,
    "hash" TEXT,
    "segredo" BOOLEAN NOT NULL DEFAULT false,
    "autorId" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JurisprudenciaTrecho" (
    "id" TEXT NOT NULL,
    "orgao" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "ementa" TEXT NOT NULL,
    "trecho" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "url" TEXT,
    "tags" TEXT[],
    "relevancia" DOUBLE PRECISION,

    CONSTRAINT "JurisprudenciaTrecho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoHonorarios" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "processoId" TEXT,
    "tipo" "HonorarioTipo" NOT NULL,
    "valorFixo" DECIMAL(14,2),
    "percentual" DECIMAL(5,2),
    "taxaHora" DECIMAL(8,2),
    "horasMes" INTEGER,
    "estimativa" DECIMAL(14,2),
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratoHonorarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fatura" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "contratoId" TEXT,
    "emitidoPorId" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "status" "FaturaStatus" NOT NULL DEFAULT 'pendente',
    "vencimento" TIMESTAMP(3) NOT NULL,
    "pagoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timesheet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "processoId" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "horas" DECIMAL(4,2) NOT NULL,
    "atividade" TEXT NOT NULL,
    "faturado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "diff" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Equipe" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cpfCnpj_key" ON "Cliente"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Processo_cnj_key" ON "Processo"("cnj");

-- CreateIndex
CREATE UNIQUE INDEX "_Equipe_AB_unique" ON "_Equipe"("A", "B");

-- CreateIndex
CREATE INDEX "_Equipe_B_index" ON "_Equipe"("B");

-- AddForeignKey
ALTER TABLE "Processo" ADD CONSTRAINT "Processo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Processo" ADD CONSTRAINT "Processo_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Andamento" ADD CONSTRAINT "Andamento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prazo" ADD CONSTRAINT "Prazo_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prazo" ADD CONSTRAINT "Prazo_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoHonorarios" ADD CONSTRAINT "ContratoHonorarios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoHonorarios" ADD CONSTRAINT "ContratoHonorarios_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "ContratoHonorarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_emitidoPorId_fkey" FOREIGN KEY ("emitidoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Equipe" ADD CONSTRAINT "_Equipe_A_fkey" FOREIGN KEY ("A") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Equipe" ADD CONSTRAINT "_Equipe_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
