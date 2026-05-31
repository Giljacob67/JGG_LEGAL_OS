-- AlterTable: adicionar campos tipo e lido ao Andamento
ALTER TABLE "Andamento" ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'andamento';
ALTER TABLE "Andamento" ADD COLUMN "lido" BOOLEAN NOT NULL DEFAULT true;

-- Index para dashboard de intimações pendentes
CREATE INDEX "Andamento_processoId_tipo_lido_idx" ON "Andamento"("processoId", "tipo", "lido");
