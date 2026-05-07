import { encrypt, decrypt } from "../lib/crypto";

describe("Crypto", () => {
  test("criptografa e descriptografa texto", () => {
    const original = "token-secreto-12345";
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted.length).toBeGreaterThan(original.length);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  test("textos diferentes produzem criptogramas diferentes", () => {
    const a = encrypt("abc");
    const b = encrypt("abc");
    expect(a).not.toBe(b); // IV aleatório
  });

  test("texto longo funciona", () => {
    const long = "a".repeat(5000);
    const enc = encrypt(long);
    const dec = decrypt(enc);
    expect(dec).toBe(long);
  });
});
