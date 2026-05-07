import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleApiError(error: unknown): {
  message: string;
  statusCode: number;
  code: string;
} {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const field = firstIssue?.path?.join(".") || "input";
    console.error("[API_ERROR] Zod validation:", error.issues);
    return {
      message: `Validação falhou em '${field}': ${firstIssue?.message || "entrada inválida"}`,
      statusCode: 400,
      code: "VALIDATION_ERROR",
    };
  }

  if (error instanceof AppError) {
    if (error.isOperational) {
      return {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
      };
    }
    console.error("[API_ERROR]", error);
    return {
      message: "Erro interno do servidor",
      statusCode: error.statusCode,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    console.error("[API_ERROR]", error);
    return {
      message: "Erro interno do servidor",
      statusCode: 500,
      code: "INTERNAL_ERROR",
    };
  }

  return {
    message: "Erro interno do servidor",
    statusCode: 500,
    code: "INTERNAL_ERROR",
  };
}
