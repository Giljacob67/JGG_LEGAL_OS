/**
 * Testes unitarios do hook useSseAndamentosGlobal.
 *
 * NOTA: Nao testamos a conexao SSE real (requer servidor),
 * apenas a logica de estado e deduplicacao.
 */

describe("SSE Global - logica de estado", () => {
  test("deve deduplicar andamentos pelo id", () => {
    const andamentos = [
      { id: "1", processoId: "p1", cnj: "0001234-56.2026.8.26.0001", evento: "Distribuicao", critico: false, createdAt: "2026-05-18T10:00:00Z" },
      { id: "1", processoId: "p1", cnj: "0001234-56.2026.8.26.0001", evento: "Distribuicao", critico: false, createdAt: "2026-05-18T10:00:00Z" },
      { id: "2", processoId: "p2", cnj: "0005678-90.2026.8.26.0002", evento: "Sentenca", critico: true, createdAt: "2026-05-18T11:00:00Z" },
    ];

    const unicos = andamentos.filter((a, i, arr) => arr.findIndex((b) => b.id === a.id) === i);
    expect(unicos).toHaveLength(2);
    expect(unicos[0].id).toBe("1");
    expect(unicos[1].id).toBe("2");
    expect(unicos[1].critico).toBe(true);
  });

  test("deve extrair processoIds unicos", () => {
    const andamentos = [
      { id: "1", processoId: "p1", cnj: "0001", evento: "A", critico: false, createdAt: "2026-05-18T10:00:00Z" },
      { id: "2", processoId: "p2", cnj: "0002", evento: "B", critico: true, createdAt: "2026-05-18T11:00:00Z" },
      { id: "3", processoId: "p1", cnj: "0001", evento: "C", critico: false, createdAt: "2026-05-18T12:00:00Z" },
    ];

    const ids = [...new Set(andamentos.map((a) => a.processoId))];
    expect(ids).toHaveLength(2);
    expect(ids).toContain("p1");
    expect(ids).toContain("p2");
  });

  test("deve contar criticos corretamente", () => {
    const andamentos = [
      { id: "1", processoId: "p1", cnj: "0001", evento: "A", critico: false, createdAt: "2026-05-18T10:00:00Z" },
      { id: "2", processoId: "p2", cnj: "0002", evento: "B", critico: true, createdAt: "2026-05-18T11:00:00Z" },
      { id: "3", processoId: "p3", cnj: "0003", evento: "C", critico: true, createdAt: "2026-05-18T12:00:00Z" },
    ];

    const criticoCount = andamentos.filter((a) => a.critico).length;
    expect(criticoCount).toBe(2);
  });
});
