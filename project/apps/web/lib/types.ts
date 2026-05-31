// Shared domain types — use instead of redeclaring in every component

export interface Prazo {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  vence: Date | string;
  prazoInterno?: Date | string | null;
  responsavelId?: string | null;
  status: string;
  processoId?: string | null;
  clienteId?: string | null;
  notificar?: boolean;
  responsavel?: { nome: string; cor?: string | null; avatar?: string | null } | null;
  processo?: { cnj: string; cliente?: { nome: string } | null } | null;
}

export interface Processo {
  id: string;
  cnj: string;
  tipo: string;
  status: string;
  risco: string;
  area: string;
  valorCausa: number | null;
  valorProvavel?: number | null;
  adverso?: string | null;
  adversoAdv?: string | null;
  tribunal?: string | null;
  vara?: string | null;
  comarca?: string | null;
  classe?: string | null;
  assunto?: string | null;
  tese?: string | null;
  estrategia?: string | null;
  proximosPassos?: string | null;
  observacoes?: string | null;
  distribuicao?: string | null;
  clienteId?: string;
  responsavelId?: string;
  tagMataMata?: boolean;
  createdAt?: string;
  proximoPrazo?: Date | null;
  cliente?: { id: string; nome: string } | null;
  responsavel?: { id: string; nome: string; avatar?: string | null; cor?: string | null } | null;
  fontes?: Array<{ fonte: string; tribunal?: string; statusSync: string; ultimaSync?: string }> | null;
  _count?: { prazos: number; documentos: number; andamentos: number };
  intimacoesPendentes?: number;
}

export interface Documento {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  processoId?: string | null;
  clienteId?: string | null;
  url?: string | null;
  segredo: boolean;
  tags: string[];
}

export interface Contrato {
  id: string;
  numero?: string | null;
  clienteId: string;
  processoId?: string | null;
  tipo: string;
  valorFixo?: number | null;
  percentual?: number | null;
  taxaHora?: number | null;
  horasMes?: number | null;
  estimativa?: number | null;
  vigente: boolean;
  dataInicio?: string | null;
  dataFim?: string | null;
  observacoes?: string | null;
}

export interface Fatura {
  id: string;
  numero?: string | null;
  clienteId: string;
  contratoId?: string | null;
  mes: string;
  ano?: number | null;
  valor: number;
  desconto?: number | null;
  status: string;
  vencimento: string;
  pagoEm?: string | null;
  formaPagamento?: string | null;
  observacoes?: string | null;
}

export interface Registro {
  id: string;
  userId: string;
  processoId?: string | null;
  data: string;
  horas: number;
  atividade: string;
  faturado: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
}

export interface UserRef {
  id: string;
  nome: string;
}
