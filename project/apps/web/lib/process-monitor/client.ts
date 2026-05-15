"use server";

/**
 * Client server-side para o serviço process-monitor.
 *
 * REGRAS:
 * - Sempre roda server-side ("use server")
 * - Nunca é chamado diretamente de client components
 * - Adiciona X-Internal-API-Key para autenticação interna
 * - Timeout configurável
 * - Fallback elegante quando o serviço está offline
 */

import {
  ProcessMonitorHealth,
  ProcessMonitorConnector,
  ProcessMonitorJob,
  MonitoredProcessPayload,
  SyncRequestPayload,
  MonitorMovement,
  MonitorDocument,
  ProcessMonitorApiResponse,
} from "./types";
import { ProcessMonitorError, ProcessMonitorErrorCodes } from "./errors";

const ENABLED = process.env.PROCESS_MONITOR_ENABLED === "true";
const BASE_URL = process.env.PROCESS_MONITOR_URL || "http://localhost:8001";
const API_KEY = process.env.PROCESS_MONITOR_API_KEY || "";
const TIMEOUT_MS = parseInt(process.env.PROCESS_MONITOR_TIMEOUT_MS || "10000", 10);

function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Internal-API-Key": API_KEY,
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function handleServiceDisabled<T>(): ProcessMonitorApiResponse<T> {
  return {
    ok: false,
    error: "Monitoramento processual desativado",
    code: ProcessMonitorErrorCodes.DISABLED,
  };
}

async function handleResponse<T>(
  response: Response
): Promise<ProcessMonitorApiResponse<T>> {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return {
      ok: false,
      error: `Serviço respondeu com HTTP ${response.status}`,
      code: ProcessMonitorErrorCodes.BAD_RESPONSE,
      details: { status: response.status, body: text.slice(0, 500) },
    };
  }

  const data = await response.json().catch(() => null);
  return { ok: true, data: data as T };
}

function handleError(err: unknown): ProcessMonitorApiResponse<never> {
  if (err instanceof ProcessMonitorError) {
    return { ok: false, error: err.message, code: err.code, details: err.details };
  }

  if (err instanceof Error) {
    if (err.name === "AbortError") {
      return {
        ok: false,
        error: "Timeout ao conectar com o serviço de monitoramento",
        code: ProcessMonitorErrorCodes.TIMEOUT,
      };
    }
    return {
      ok: false,
      error: err.message,
      code: ProcessMonitorErrorCodes.UNAVAILABLE,
    };
  }

  return {
    ok: false,
    error: "Erro desconhecido ao conectar com o serviço",
    code: ProcessMonitorErrorCodes.UNAVAILABLE,
  };
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

export async function getProcessMonitorHealth(): Promise<ProcessMonitorApiResponse<ProcessMonitorHealth>> {
  if (!ENABLED) return handleServiceDisabled();
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/health`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<ProcessMonitorHealth>(res);
  } catch (err) {
    return handleError(err);
  }
}

export async function listProcessMonitorConnectors(): Promise<ProcessMonitorApiResponse<ProcessMonitorConnector[]>> {
  if (!ENABLED) return handleServiceDisabled();
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/connectors`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<ProcessMonitorConnector[]>(res);
  } catch (err) {
    return handleError(err);
  }
}

export async function getConnectorHealth(
  connectorId: string
): Promise<ProcessMonitorApiResponse<{ tribunal: string; connector: string; status: string; details?: Record<string, unknown> }>> {
  if (!ENABLED) return handleServiceDisabled();
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/connectors/${encodeURIComponent(connectorId)}/health`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  } catch (err) {
    return handleError(err);
  }
}

export async function registerMonitoredProcess(
  payload: MonitoredProcessPayload
): Promise<ProcessMonitorApiResponse<{ job_id: string; status: string; message: string }>> {
  if (!ENABLED) return handleServiceDisabled();
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/monitoramento/processos`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  } catch (err) {
    return handleError(err);
  }
}

export async function requestProcessSync(
  processIdOrCnj: string,
  payload: SyncRequestPayload
): Promise<ProcessMonitorApiResponse<{ job_id: string; status: string; message: string }>> {
  if (!ENABLED) return handleServiceDisabled();
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/monitoramento/processos/${encodeURIComponent(processIdOrCnj)}/sincronizar`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }
    );
    return handleResponse(res);
  } catch (err) {
    return handleError(err);
  }
}

export async function getMonitorJob(
  jobId: string
): Promise<ProcessMonitorApiResponse<ProcessMonitorJob>> {
  if (!ENABLED) return handleServiceDisabled();
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/monitoramento/jobs/${encodeURIComponent(jobId)}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse<ProcessMonitorJob>(res);
  } catch (err) {
    return handleError(err);
  }
}

export async function listMonitorMovements(
  processIdOrCnj: string
): Promise<ProcessMonitorApiResponse<MonitorMovement[]>> {
  if (!ENABLED) return handleServiceDisabled();
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/monitoramento/processos/${encodeURIComponent(processIdOrCnj)}/andamentos`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );
    return handleResponse<MonitorMovement[]>(res);
  } catch (err) {
    return handleError(err);
  }
}

export async function listMonitorDocuments(
  processIdOrCnj: string
): Promise<ProcessMonitorApiResponse<MonitorDocument[]>> {
  if (!ENABLED) return handleServiceDisabled();
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/monitoramento/processos/${encodeURIComponent(processIdOrCnj)}/documentos`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );
    return handleResponse<MonitorDocument[]>(res);
  } catch (err) {
    return handleError(err);
  }
}
