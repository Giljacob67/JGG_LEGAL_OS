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
  test("erro operacional retorna mensagem real", async () => {
    const err = new AppError("Validação falhou", 400, "VALIDATION");
    const result = handleApiError(err);
    expect(result.status).toBe(400);
    const body = await result.json();
    expect(body.message).toBe("Validação falhou");
  });

  test("erro não-operacional retorna genérico", async () => {
    const err = new AppError("DB crash", 500, "INTERNAL_ERROR", false);
    const result = handleApiError(err);
    const body = await result.json();
    expect(body.message).toBe("Erro interno do servidor");
  });

  test("erro genérico retorna 500 genérico", async () => {
    const result = handleApiError(new Error("Segredo"));
    expect(result.status).toBe(500);
    const body = await result.json();
    expect(body.message).toBe("Erro interno do servidor");
  });

  test("ZodError retorna 400 com campo", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zodErr = new ZodError([{ code: "invalid_type", expected: "string", path: ["nome"], message: "Esperado string" } as any]);
    const result = handleApiError(zodErr);
    expect(result.status).toBe(400);
    const body = await result.json();
    expect(body.message).toContain("nome");
    expect(body.code).toBe("VALIDATION_ERROR");
  });
});
