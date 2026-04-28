-- Migration: expand schema to match current Prisma schema
-- Generated from prisma migrate diff, edited for data safety

-- ============================================
-- 1. ENUM expansions
-- ============================================
ALTER TYPE "Area" ADD VALUE IF NOT EXISTS 'trabalhista';
ALTER TYPE "Area" ADD VALUE IF NOT EXISTS 'civil';
ALTER TYPE "Area" ADD VALUE IF NOT EXISTS 'empresarial';
ALTER TYPE "Area" ADD VALUE IF NOT EXISTS 'penal';

ALTER TYPE "DocumentoTipo" ADD VALUE IF NOT EXISTS 'procuracao';
ALTER TYPE "DocumentoTipo" ADD VALUE IF NOT EXISTS 'declaracao';
ALTER TYPE "DocumentoTipo" ADD VALUE IF NOT EXISTS 'notificacao';
ALTER TYPE "DocumentoTipo" ADD VALUE IF NOT EXISTS 'termo';

ALTER TYPE "FaturaStatus" ADD VALUE IF NOT EXISTS 'cancelado';

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'financeiro';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'comercial';

-- ============================================
-- 2. New ENUMs
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocumentoStatus') THEN
        CREATE TYPE "DocumentoStatus" AS ENUM ('rascunho', 'em_revisao', 'aprovado', 'protocolado', 'arquivado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaskStatus') THEN
        CREATE TYPE "TaskStatus" AS ENUM ('aberta', 'em_andamento', 'aguardando_terceiro', 'concluida', 'cancelada');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaskPriority') THEN
        CREATE TYPE "TaskPriority" AS ENUM ('baixa', 'media', 'alta', 'urgente');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactType') THEN
        CREATE TYPE "ContactType" AS ENUM ('cliente', 'parte_contraria', 'advogado', 'testemunha', 'perito', 'juiz', 'servidor', 'fornecedor', 'parceiro', 'outro');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IntegrationType') THEN
        CREATE TYPE "IntegrationType" AS ENUM ('google_drive', 'google_calendar', 'google_gmail', 'datajud');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Permission') THEN
        CREATE TYPE "Permission" AS ENUM (
            'dashboard_view',
            'processo_view', 'processo_create', 'processo_edit', 'processo_delete',
            'cliente_view', 'cliente_create', 'cliente_edit', 'cliente_delete',
            'contato_view', 'contato_create', 'contato_edit', 'contato_delete',
            'prazo_view', 'prazo_create', 'prazo_edit', 'prazo_delete',
            'tarefa_view', 'tarefa_create', 'tarefa_edit', 'tarefa_delete',
            'documento_view', 'documento_create', 'documento_edit', 'documento_delete',
            'financeiro_view', 'financeiro_create', 'financeiro_edit', 'financeiro_delete', 'financeiro_admin',
            'crm_view', 'crm_create', 'crm_edit', 'crm_delete',
            'ia_view', 'ia_use', 'ia_admin',
            'relatorio_view', 'relatorio_create',
            'admin_users', 'admin_roles', 'admin_integrations', 'admin_settings', 'admin_audit',
            'sistema_view', 'sistema_edit'
        );
    END IF;
END $$;

-- ============================================
-- 3. Alter existing tables (add columns)
-- ============================================
ALTER TABLE "Andamento" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "userEmail" TEXT;

ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "celular" TEXT;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "cep" TEXT;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "endereco" TEXT;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "estado" TEXT;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "origem" TEXT;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "responsavelComercialId" TEXT;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "responsavelJuridicoId" TEXT;
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;

ALTER TABLE "ContratoHonorarios" ADD COLUMN IF NOT EXISTS "dataFim" TIMESTAMP(3);
ALTER TABLE "ContratoHonorarios" ADD COLUMN IF NOT EXISTS "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ContratoHonorarios" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "ContratoHonorarios" ADD COLUMN IF NOT EXISTS "numero" TEXT;
ALTER TABLE "ContratoHonorarios" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;

ALTER TABLE "Documento" ADD COLUMN IF NOT EXISTS "clienteId" TEXT;
ALTER TABLE "Documento" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Documento" ADD COLUMN IF NOT EXISTS "driveFileId" TEXT;
ALTER TABLE "Documento" ADD COLUMN IF NOT EXISTS "status" "DocumentoStatus" NOT NULL DEFAULT 'rascunho';
ALTER TABLE "Documento" ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Fatura" ADD COLUMN IF NOT EXISTS "ano" INTEGER;
ALTER TABLE "Fatura" ADD COLUMN IF NOT EXISTS "comprovanteUrl" TEXT;
ALTER TABLE "Fatura" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Fatura" ADD COLUMN IF NOT EXISTS "desconto" DECIMAL(14,2);
ALTER TABLE "Fatura" ADD COLUMN IF NOT EXISTS "formaPagamento" TEXT;
ALTER TABLE "Fatura" ADD COLUMN IF NOT EXISTS "numero" TEXT;
ALTER TABLE "Fatura" ADD COLUMN IF NOT EXISTS "observacoes" TEXT;

ALTER TABLE "JurisprudenciaTrecho" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "JurisprudenciaTrecho" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "Prazo" ADD COLUMN IF NOT EXISTS "clienteId" TEXT;
ALTER TABLE "Prazo" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Prazo" ADD COLUMN IF NOT EXISTS "descricao" TEXT;
ALTER TABLE "Prazo" ADD COLUMN IF NOT EXISTS "origem" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Prazo" ADD COLUMN IF NOT EXISTS "prazoInterno" TIMESTAMP(3);
ALTER TABLE "Prazo" ADD COLUMN IF NOT EXISTS "validadoPor" TEXT;
ALTER TABLE "Prazo" ALTER COLUMN "processoId" DROP NOT NULL;

-- Processo: add new columns first, copy data, then drop old
ALTER TABLE "Processo" ADD COLUMN IF NOT EXISTS "adversoAdv" TEXT;
ALTER TABLE "Processo" ADD COLUMN IF NOT EXISTS "assunto" TEXT;
ALTER TABLE "Processo" ADD COLUMN IF NOT EXISTS "classe" TEXT;
ALTER TABLE "Processo" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Processo" ADD COLUMN IF NOT EXISTS "estrategia" TEXT;
ALTER TABLE "Processo" ADD COLUMN IF NOT EXISTS "etiquetas" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Processo" ADD COLUMN IF NOT EXISTS "observacoesConfidenciais" TEXT;
ALTER TABLE "Processo" ADD COLUMN IF NOT EXISTS "proximosPassos" TEXT;
ALTER TABLE "Processo" ADD COLUMN IF NOT EXISTS "valorCausa" DECIMAL(14,2);
ALTER TABLE "Processo" ADD COLUMN IF NOT EXISTS "valorProvavel" DECIMAL(14,2);

-- Copy data from old column to new column
UPDATE "Processo" SET "valorCausa" = "valor" WHERE "valor" IS NOT NULL;

-- Now safe to drop old column
ALTER TABLE "Processo" DROP COLUMN IF EXISTS "valor";

ALTER TABLE "Timesheet" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Timesheet" ADD COLUMN IF NOT EXISTS "faturaId" TEXT;
ALTER TABLE "Timesheet" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cargo" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- ============================================
-- 4. Create new tables
-- ============================================
CREATE TABLE IF NOT EXISTS "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "Permission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Contact" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "empresa" TEXT,
    "cargo" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "tipo" "ContactType" NOT NULL DEFAULT 'outro',
    "observacoes" TEXT,
    "clienteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "processoId" TEXT,
    "clienteId" TEXT,
    "responsavelId" TEXT,
    "prazoFatal" TIMESTAMP(3),
    "prazoInterno" TIMESTAMP(3),
    "prioridade" "TaskPriority" NOT NULL DEFAULT 'media',
    "status" "TaskStatus" NOT NULL DEFAULT 'aberta',
    "checklist" JSONB,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "url" TEXT,
    "driveFileId" TEXT,
    "hash" TEXT,
    "tamanho" INTEGER,
    "autorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "categoria" TEXT,
    "centroCusto" TEXT,
    "processoId" TEXT,
    "clienteId" TEXT,
    "vencimento" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "formaPagamento" TEXT,
    "comprovanteUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'previsto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL,
    "titulo" TEXT,
    "conteudo" TEXT NOT NULL,
    "processoId" TEXT,
    "clienteId" TEXT,
    "taskId" TEXT,
    "autorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'interna',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT DEFAULT '#3b82f6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TagRelation" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    CONSTRAINT "TagRelation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "IntegrationAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "IntegrationType" NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IntegrationAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PromptTemplate" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "sistema" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'geral',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AIConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titulo" TEXT,
    "contexto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AIMessage" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokensPrompt" INTEGER,
    "tokensCompletion" INTEGER,
    "provider" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AIUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "entidade" TEXT,
    "entidadeId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensPrompt" INTEGER,
    "tokensTotal" INTEGER,
    "custoEstimado" DECIMAL(10,6),
    "status" TEXT NOT NULL DEFAULT 'sucesso',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- 5. Indexes and constraints
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS "UserPermission_userId_permission_key" ON "UserPermission"("userId", "permission");
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_nome_key" ON "Tag"("nome");
CREATE INDEX IF NOT EXISTS "TagRelation_entidade_entidadeId_idx" ON "TagRelation"("entidade", "entidadeId");
CREATE UNIQUE INDEX IF NOT EXISTS "TagRelation_tagId_entidade_entidadeId_key" ON "TagRelation"("tagId", "entidade", "entidadeId");
CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_chave_key" ON "SystemSetting"("chave");
CREATE UNIQUE INDEX IF NOT EXISTS "PromptTemplate_nome_key" ON "PromptTemplate"("nome");
CREATE UNIQUE INDEX IF NOT EXISTS "PromptTemplate_slug_key" ON "PromptTemplate"("slug");
CREATE INDEX IF NOT EXISTS "AuditLog_entidade_entidadeId_idx" ON "AuditLog"("entidade", "entidadeId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ContratoHonorarios_numero_key" ON "ContratoHonorarios"("numero");
CREATE UNIQUE INDEX IF NOT EXISTS "Fatura_numero_key" ON "Fatura"("numero");

-- ============================================
-- 6. Foreign keys
-- ============================================
ALTER TABLE "UserPermission" DROP CONSTRAINT IF EXISTS "UserPermission_userId_fkey";
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Contact" DROP CONSTRAINT IF EXISTS "Contact_clienteId_fkey";
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_processoId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentVersion" DROP CONSTRAINT IF EXISTS "DocumentVersion_documentoId_fkey";
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note" DROP CONSTRAINT IF EXISTS "Note_processoId_fkey";
ALTER TABLE "Note" ADD CONSTRAINT "Note_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note" DROP CONSTRAINT IF EXISTS "Note_clienteId_fkey";
ALTER TABLE "Note" ADD CONSTRAINT "Note_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note" DROP CONSTRAINT IF EXISTS "Note_taskId_fkey";
ALTER TABLE "Note" ADD CONSTRAINT "Note_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TagRelation" DROP CONSTRAINT IF EXISTS "TagRelation_tagId_fkey";
ALTER TABLE "TagRelation" ADD CONSTRAINT "TagRelation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IntegrationAccount" DROP CONSTRAINT IF EXISTS "IntegrationAccount_userId_fkey";
ALTER TABLE "IntegrationAccount" ADD CONSTRAINT "IntegrationAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIMessage" DROP CONSTRAINT IF EXISTS "AIMessage_conversaId_fkey";
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
