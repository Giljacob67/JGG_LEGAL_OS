import { AppError, handleApiError } from "../lib/utils/errors";
import { ZodError } from "zod";

describe("AppError", () => {
  test("cria erro operacional", () => {
    const err = new AppError("Não encontrado", 404, "NOT_FOUND");
    expect(err.message).toBe("Não encontrado");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.isOperational).toBe(true);
  });

  test("cria erro não-operacional", () => {
    const err = new AppError("Falha", 500, "INTERNAL_ERROR", false);
    expect(err.isOperational).toBe(false);
  });
});

describe("handleApiError", () => {
  test("erro operacional retorna mensagem real", () => {
    const err = new AppError("Validação falhou", 400, "VALIDATION");
    const result = handleApiError(err);
    expect(result.statusCode).toBe(400);
    expect(result.message).toBe("Validação falhou");
  });

  test("erro não-operacional retorna genérico", () => {
    const err = new AppError("DB crash", 500, "INTERNAL_ERROR", false);
    const result = handleApiError(err);
    expect(result.message).toBe("Erro interno do servidor");
  });

  test("erro genérico retorna 500 genérico", () => {
    const result = handleApiError(new Error("Segredo"));
    expect(result.statusCode).toBe(500);
    expect(result.message).toBe("Erro interno do servidor");
  });

  test("ZodError retorna 400 com campo", () => {
    const zodErr = new ZodError([{ code: "invalid_type", expected: "string", received: "number", path: ["nome"], message: "Esperado string" }]);
    const result = handleApiError(zodErr);
    expect(result.statusCode).toBe(400);
    expect(result.message).toContain("nome");
    expect(result.code).toBe("VALIDATION_ERROR");
  });
});
