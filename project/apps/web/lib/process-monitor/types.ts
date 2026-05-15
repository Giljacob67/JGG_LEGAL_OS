/** Tipos compartilhados da integração com process-monitor. */

export interface ProcessMonitorHealth {
  ok: boolean;
  status: string;
  service: string;
  timestamp?: string;
  details?: Record<string, unknown>;
}

export interface ProcessMonitorConnector {
  id: string;
  label: string;
  tribunais: string[];
  supports: {
    cnjSearch: boolean;
    movements: boolean;
    documents: boolean;
    download: boolean;
  };
  status?: string;
}

export interface ProcessMonitorJob {
  id: string;
  status: string;
  type?: string;
  tribunal?: string;
  connector?: string;
  numero_cnj?: string;
  created_at?: string;
  started_at?: string | null;
  finished_at?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  stats?: Record<string, unknown>;
}

export interface MonitoredProcessPayload {
  numero_cnj: string;
  tribunal?: string;
  jgg_processo_id?: string;
  prioridade?: "alta" | "normal" | "baixa";
}

export interface SyncRequestPayload {
  force?: boolean;
  capturar_documentos?: boolean;
}

export interface MonitorMovement {
  external_id?: string;
  data?: string;
  descricao_original: string;
  tipo_evento?: string;
  orgao_julgador?: string;
  hash?: string;
}

export interface MonitorDocument {
  external_id?: string;
  nome: string;
  tipo?: string;
  data?: string;
  mime_type?: string;
  storage_key?: string;
  url_interna?: string;
  hash?: string;
}

export interface ProcessMonitorApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}
