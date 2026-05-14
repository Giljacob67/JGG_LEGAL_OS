import { NextResponse } from "next/server";
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

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const field = firstIssue?.path?.join(".") || "input";
    console.error("[API_ERROR] Zod validation:", error.issues);
    return NextResponse.json(
      { message: `Validação falhou em '${field}': ${firstIssue?.message || "entrada inválida"}`, code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    if (!error.isOperational) console.error("[API_ERROR]", error);
    return NextResponse.json(
      { message: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    console.error("[API_ERROR]", error);
  }

  return NextResponse.json(
    { message: "Erro interno do servidor", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
