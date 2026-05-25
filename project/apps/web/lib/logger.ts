/**
 * Logger estruturado para o JGG Legal OS.
 *
 * Em ambiente servidor produz JSON em stdout (facilita parsing por
 * ferramentas como Datadog, CloudWatch, Loki).
 * Em client-side (browser) faz proxy direto para console nativo.
 */

const isServer = typeof window === "undefined";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogData = Record<string, unknown> | unknown[];

function formatMessage(level: LogLevel, msg: string, data?: LogData): string {
  if (!isServer) return msg;
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message: msg,
  };
  if (data !== undefined) {
    if (Array.isArray(data)) {
      entry.data = data.length === 1 ? data[0] : data;
    } else {
      Object.assign(entry, data);
    }
  }
  return JSON.stringify(entry);
}

export const logger = {
  debug(msg: string, ...args: unknown[]) {
    if (process.env.NODE_ENV === "production") return;
    if (args.length > 0) {
      // eslint-disable-next-line no-console
      console.debug(formatMessage("debug", msg, args));
    } else {
      // eslint-disable-next-line no-console
      console.debug(formatMessage("debug", msg));
    }
  },

  info(msg: string, ...args: unknown[]) {
    if (args.length > 0) {
      // eslint-disable-next-line no-console
      console.info(formatMessage("info", msg, args));
    } else {
      // eslint-disable-next-line no-console
      console.info(formatMessage("info", msg));
    }
  },

  warn(msg: string, ...args: unknown[]) {
    if (args.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(formatMessage("warn", msg, args));
    } else {
      // eslint-disable-next-line no-console
      console.warn(formatMessage("warn", msg));
    }
  },

  error(msg: string, ...args: unknown[]) {
    if (args.length > 0) {
      // eslint-disable-next-line no-console
      console.error(formatMessage("error", msg, args));
    } else {
      // eslint-disable-next-line no-console
      console.error(formatMessage("error", msg));
    }
  },
};
