// Shared constants — single source of truth for labels, colors, enums

export const AREA_LABELS: Record<string, string> = {
  bancario: "Bancário",
  agrario: "Agrário",
  tributario: "Tributário",
  trabalhista: "Trabalhista",
  civil: "Civil",
  empresarial: "Empresarial",
  penal: "Penal",
};

export const AREA_TAILWIND: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  bancario:   { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-transparent", dot: "bg-blue-500" },
  agrario:    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-transparent", dot: "bg-emerald-500" },
  tributario: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-transparent", dot: "bg-amber-500" },
  trabalhista:{ bg: "bg-rose-50",    text: "text-rose-700",    border: "border-transparent", dot: "bg-rose-500" },
  civil:      { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-transparent", dot: "bg-violet-500" },
  empresarial:{ bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-transparent", dot: "bg-cyan-500" },
  penal:      { bg: "bg-slate-50",   text: "text-slate-700",   border: "border-transparent", dot: "bg-slate-500" },
};

export const RISCO_LABELS: Record<string, string> = {
  alto: "Alto",
  medio: "Médio",
  baixo: "Baixo",
};

export const RISCO_TAILWIND: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  alto:  { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-transparent", dot: "bg-rose-500" },
  medio: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-transparent", dot: "bg-amber-500" },
  baixo: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-transparent", dot: "bg-emerald-500" },
};

export const STATUS_PROCESSO: Record<string, string> = {
  em_andamento: "Em andamento",
  suspenso: "Suspenso",
  arquivado: "Arquivado",
  encerrado: "Encerrado",
};

export const STATUS_FATURA: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export const STATUS_TAILWIND: Record<string, { bg: string; text: string; border: string }> = {
  em_andamento: { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200" },
  suspenso:     { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200" },
  arquivado:    { bg: "bg-slate-100",  text: "text-slate-700",  border: "border-slate-200" },
  encerrado:    { bg: "bg-emerald-100",text: "text-emerald-700",border: "border-emerald-200" },
  pendente:     { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200" },
  pago:         { bg: "bg-emerald-100",text: "text-emerald-700",border: "border-emerald-200" },
  atrasado:     { bg: "bg-rose-100",   text: "text-rose-700",   border: "border-rose-200" },
  cancelado:    { bg: "bg-slate-100",  text: "text-slate-700",  border: "border-slate-200" },
};

export const TIPOS_CONTRATO = [
  { value: "fixo_mensal", label: "Fixo Mensal" },
  { value: "exito", label: "Êxito" },
  { value: "hora", label: "Hora" },
  { value: "combinado", label: "Combinado" },
];

export const TIPOS_DOCUMENTO = [
  "peticao", "contrato", "extrato", "decisao", "certidao",
  "parecer", "planilha", "procuracao", "declaracao", "notificacao", "termo", "outro",
];

export const STATUS_DOCUMENTO = ["rascunho", "em_revisao", "aprovado", "protocolado", "arquivado"];
