// Teste de validação CNJ extraído da lógica do route handler
function validarCNJ(cnj: string): boolean {
  const digits = cnj.replace(/\D/g, "");
  if (digits.length !== 20) return false;

  const sequencial = digits.slice(0, 7);
  const digitoVerificador = digits.slice(7, 9);
  const ano = digits.slice(9, 13);
  const justica = digits.slice(13, 14);
  const tribunal = digits.slice(14, 16);
  const origem = digits.slice(16, 20);

  if (!sequencial || !digitoVerificador || !ano || !justica || !tribunal || !origem) return false;

  const j = parseInt(justica, 10);
  if (j < 1 || j > 9) return false;

  const a = parseInt(ano, 10);
  const currentYear = new Date().getFullYear();
  if (a < 1890 || a > currentYear + 1) return false;

  const pesos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  const semDV = sequencial + ano + justica + tribunal + origem;
  for (let i = 0; i < semDV.length; i++) {
    const idx = semDV.length - 1 - i;
    soma += parseInt(semDV[idx], 10) * pesos[i];
  }
  const resto = soma % 11;
  const dvCalculado = resto === 10 ? "0" : resto === 11 ? "1" : String(resto).padStart(2, "0");
  return dvCalculado === digitoVerificador;
}

describe("validarCNJ", () => {
  test("CNJ válido", () => {
    // Exemplo fictício formatado com dígito verificador válido
    expect(validarCNJ("0000001-07.2023.8.26.0100")).toBe(true);
  });

  test("CNJ inválido (muito curto)", () => {
    expect(validarCNJ("12345")).toBe(false);
  });

  test("CNJ inválido (sem dígitos)", () => {
    expect(validarCNJ("abcd-ef.ghij.k.lm.nopq")).toBe(false);
  });

  test("CNJ inválido (ano futuro demais)", () => {
    const futuro = (new Date().getFullYear() + 5).toString();
    const cnj = "0000001-02." + futuro + ".8.26.0100";
    expect(validarCNJ(cnj)).toBe(false);
  });

  test("CNJ válido sem formatação", () => {
    expect(validarCNJ("00000010720238260100")).toBe(true);
  });
});
