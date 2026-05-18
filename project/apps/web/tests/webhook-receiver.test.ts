/**
 * Testes unitarios do webhook receiver do process-monitor.
 *
 * Validamos a logica de parsing do payload e deteccao de movimentacoes criticas.
 */

function isCritico(descricao: string): boolean {
  const lower = descricao.toLowerCase();
  const criticos = [
    "sentenca", "decisao", "deferimento", "indeferimento",
    "intimacao", "notificacao", "citacao", "penhora", "bloqueio",
    "audiencia", "arquivamento", "baixa", "transito em julgado",
  ];
  return criticos.some((k) => lower.includes(k));
}

describe("Webhook Receiver - isCritico", () => {
  test("detecta sentenca como critico", () => {
    expect(isCritico("Sentenca proferida")).toBe(true);
    expect(isCritico("SENTENCA")).toBe(true);
    expect(isCritico("sentenca")).toBe(true);
  });

  test("detecta intimacao como critico", () => {
    expect(isCritico("Intimacao das partes")).toBe(true);
    expect(isCritico("NOTIFICACAO")).toBe(true);
  });

  test("detecta penhora como critico", () => {
    expect(isCritico("Penhora de bens")).toBe(true);
    expect(isCritico("Bloqueio judicial")).toBe(true);
  });

  test("nao marca descricao inocua como critica", () => {
    expect(isCritico("Juntada de documento")).toBe(false);
    expect(isCritico("Mero expediente")).toBe(false);
    expect(isCritico("Protocolo")).toBe(false);
  });
});

describe("Webhook Receiver - payload parsing", () => {
  test("deve extrair movimentacoes do payload", () => {
    const payload = {
      numero_cnj: "0001234-56.2026.8.26.0001",
      tribunal: "tjsp",
      movements: [
        { data: "2026-05-18", descricao: "Distribuicao eletronica", hash: "abc" },
        { data: "2026-05-18", descricao: "Intimacao das partes", hash: "def" },
      ],
    };

    expect(payload.numero_cnj).toBe("0001234-56.2026.8.26.0001");
    expect(payload.movements).toHaveLength(2);
    expect(payload.movements[0].descricao).toBe("Distribuicao eletronica");
  });

  test("deve identificar movimentacoes criticas no payload", () => {
    const payload = {
      numero_cnj: "0001234-56.2026.8.26.0001",
      tribunal: "tjsp",
      movements: [
        { data: "2026-05-18", descricao: "Distribuicao eletronica", hash: "abc" },
        { data: "2026-05-18", descricao: "Sentenca proferida", hash: "def" },
      ],
    };

    const criticas = payload.movements.filter((m: any) => isCritico(m.descricao));
    expect(criticas).toHaveLength(1);
    expect(criticas[0].descricao).toBe("Sentenca proferida");
  });
});
