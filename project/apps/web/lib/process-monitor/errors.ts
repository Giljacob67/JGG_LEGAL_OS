/** Erros tipados da integração com process-monitor. */

export class ProcessMonitorError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ProcessMonitorError";
    this.code = code;
    this.details = details;
  }
}

export const ProcessMonitorErrorCodes = {
  DISABLED: "PROCESS_MONITOR_DISABLED",
  UNAVAILABLE: "PROCESS_MONITOR_UNAVAILABLE",
  TIMEOUT: "PROCESS_MONITOR_TIMEOUT",
  AUTH_ERROR: "PROCESS_MONITOR_AUTH_ERROR",
  BAD_RESPONSE: "PROCESS_MONITOR_BAD_RESPONSE",
  JOB_NOT_FOUND: "PROCESS_MONITOR_JOB_NOT_FOUND",
  VALIDATION_ERROR: "PROCESS_MONITOR_VALIDATION_ERROR",
} as const;
