import { clienteSchema, processoSchema, documentoSchema, paginationSchemaProcesso } from "../lib/validations/zod-schemas";

describe("Schemas Zod", () => {
  test("clienteSchema válido", () => {
    const data = {
      nome: "João Silva",
      cpfCnpj: "12345678901",
      tipo: "PF",
      email: "joao@test.com",
      status: "ativo",
    };
    const parsed = clienteSchema.parse(data);
    expect(parsed.nome).toBe("João Silva");
  });

  test("clienteSchema rejeita CPF curto", () => {
    expect(() => clienteSchema.parse({ nome: "João", cpfCnpj: "123", tipo: "PF" })).toThrow();
  });

  test("processoSchema rejeita CNJ curto", () => {
    expect(() => processoSchema.parse({
      cnj: "123",
      clienteId: "cljk123456789012345678901",
      tipo: "Ação",
      area: "civil",
      responsavelId: "cljk123456789012345678901",
    })).toThrow();
  });

  test("documentoSchema aceita campos novos", () => {
    const data = {
      nome: "Procuração",
      tipo: "procuracao",
      mimeType: "application/pdf",
      conteudo: null,
      url: "https://example.com/doc.pdf",
    };
    const parsed = documentoSchema.parse(data);
    expect(parsed.mimeType).toBe("application/pdf");
  });

  test("paginationSchemaProcesso aceita sortBy permitido", () => {
    const parsed = paginationSchemaProcesso.parse({ page: "1", limit: "20", sortBy: "cnj", sortOrder: "asc" });
    expect(parsed.sortBy).toBe("cnj");
  });

  test("paginationSchemaProcesso rejeita sortBy não permitido", () => {
    expect(() => paginationSchemaProcesso.parse({ page: "1", limit: "20", sortBy: "password", sortOrder: "asc" })).toThrow();
  });
});
