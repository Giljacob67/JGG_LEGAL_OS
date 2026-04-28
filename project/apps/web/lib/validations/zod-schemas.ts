import { z } from "zod";

// ============================================================
// HELPERS
// ============================================================

const cuid = z.string().cuid();
const optionalCuid = z.string().cuid().optional().nullable();

// ============================================================
// CLIENTE
// ============================================================

export const clienteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200),
  cpfCnpj: z
    .string()
    .min(11, "CPF/CNPJ inválido")
    .max(18, "CPF/CNPJ inválido"),
  tipo: z.enum(["PF", "PJ"]),
  email: z.string().email("E-mail inválido").optional().nullable(),
  telefone: z.string().optional().nullable(),
  celular: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().max(2).optional().nullable(),
  cep: z.string().optional().nullable(),
  origem: z.string().optional().nullable(),
  area: z.enum(["bancario", "agrario", "tributario", "trabalhista", "civil", "empresarial", "penal"]).optional().nullable(),
  status: z
    .enum(["lead", "prospect", "ativo", "inativo", "ex-cliente"])
    .default("ativo"),
  observacoes: z.string().optional().nullable(),
  responsavelComercialId: optionalCuid,
  responsavelJuridicoId: optionalCuid,
});

export const clienteUpdateSchema = clienteSchema.partial();

export type ClienteInput = z.infer<typeof clienteSchema>;
export type ClienteUpdateInput = z.infer<typeof clienteUpdateSchema>;

// ============================================================
// PROCESSO
// ============================================================

export const processoSchema = z.object({
  cnj: z.string().min(20, "Número CNJ inválido").max(25),
  clienteId: cuid,
  adverso: z.string().optional().nullable(),
  adversoAdv: z.string().optional().nullable(),
  tribunal: z.string().optional().nullable(),
  vara: z.string().optional().nullable(),
  comarca: z.string().optional().nullable(),
  area: z.enum(["bancario", "agrario", "tributario", "trabalhista", "civil", "empresarial", "penal"]),
  classe: z.string().optional().nullable(),
  assunto: z.string().optional().nullable(),
  tipo: z.string().min(1, "Tipo obrigatório"),
  status: z
    .enum(["em_andamento", "suspenso", "arquivado", "encerrado"])
    .default("em_andamento"),
  risco: z.enum(["alto", "medio", "baixo"]).default("medio"),
  valorCausa: z.coerce.number().optional().nullable(),
  valorProvavel: z.coerce.number().optional().nullable(),
  estrategia: z.string().optional().nullable(),
  proximosPassos: z.string().optional().nullable(),
  responsavelId: cuid,
  tese: z.string().optional().nullable(),
  tagMataMata: z.boolean().default(false),
  distribuicao: z.coerce.date().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  observacoesConfidenciais: z.string().optional().nullable(),
  etiquetas: z.array(z.string()).default([]),
});

export const processoUpdateSchema = processoSchema.partial();

export type ProcessoInput = z.infer<typeof processoSchema>;
export type ProcessoUpdateInput = z.infer<typeof processoUpdateSchema>;

// ============================================================
// PRAZO
// ============================================================

export const prazoSchema = z.object({
  processoId: optionalCuid,
  clienteId: optionalCuid,
  tipo: z.enum(["fatal", "dilacao", "audiencia", "reuniao", "tarefa"]),
  titulo: z.string().min(1, "Título obrigatório"),
  descricao: z.string().optional().nullable(),
  vence: z.coerce.date(),
  prazoInterno: z.coerce.date().optional().nullable(),
  responsavelId: cuid,
  status: z.enum(["aberto", "cumprido", "perdido"]).default("aberto"),
  alertas: z.array(z.number()).default([15, 7, 3, 1]),
  notificar: z.boolean().default(true),
  origem: z.string().default("manual"),
});

export const prazoUpdateSchema = prazoSchema.partial();

export type PrazoInput = z.infer<typeof prazoSchema>;
export type PrazoUpdateInput = z.infer<typeof prazoUpdateSchema>;

// ============================================================
// TAREFA
// ============================================================

export const taskSchema = z.object({
  titulo: z.string().min(1, "Título obrigatório"),
  descricao: z.string().optional().nullable(),
  processoId: optionalCuid,
  clienteId: optionalCuid,
  responsavelId: optionalCuid,
  prazoFatal: z.coerce.date().optional().nullable(),
  prazoInterno: z.coerce.date().optional().nullable(),
  prioridade: z
    .enum(["baixa", "media", "alta", "urgente"])
    .default("media"),
  status: z
    .enum(["aberta", "em_andamento", "aguardando_terceiro", "concluida", "cancelada"])
    .default("aberta"),
  recorrente: z.boolean().default(false),
});

export const taskUpdateSchema = taskSchema.partial();

export type TaskInput = z.infer<typeof taskSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

// ============================================================
// DOCUMENTO
// ============================================================

export const documentoSchema = z.object({
  processoId: optionalCuid,
  clienteId: optionalCuid,
  nome: z.string().min(1, "Nome obrigatório"),
  tipo: z.enum([
    "peticao",
    "contrato",
    "extrato",
    "decisao",
    "certidao",
    "parecer",
    "planilha",
    "procuracao",
    "declaracao",
    "notificacao",
    "termo",
    "outro",
  ]),
  status: z
    .enum(["rascunho", "em_revisao", "aprovado", "protocolado", "arquivado"])
    .default("rascunho"),
  segredo: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export const documentoUpdateSchema = documentoSchema.partial();

export type DocumentoInput = z.infer<typeof documentoSchema>;
export type DocumentoUpdateInput = z.infer<typeof documentoUpdateSchema>;

// ============================================================
// QUERY PARAMS (Pagination / Filter)
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional().nullable(),
  sortBy: z.string().optional().nullable(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
