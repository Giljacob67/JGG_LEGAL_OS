import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const MIN_KEY_LENGTH = 32; // mínimo recomendado

function validateEncryptionEnv(): void {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY;
  const salt = process.env.CRYPTO_SALT;

  if (!key || key.length < MIN_KEY_LENGTH) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY deve ter pelo menos 32 caracteres. Gere uma com: openssl rand -base64 32"
    );
  }

  if (!salt || salt.length < 16) {
    throw new Error(
      "CRYPTO_SALT deve ter pelo menos 16 caracteres. Gere uma com: openssl rand -base64 16"
    );
  }

  // Aviso em produção sobre rotação
  if (process.env.NODE_ENV === "production") {
    // Em produção real, recomenda-se rotacionar esta chave periodicamente
    // e ter um processo documentado de re-criptografia de tokens existentes.
  }
}

// Valida na inicialização do módulo
validateEncryptionEnv();

function getKey(): Buffer {
  const password = process.env.INTEGRATION_ENCRYPTION_KEY!;
  const salt = process.env.CRYPTO_SALT!;

  // IMPORTANTE: Nunca use salt fixo em produção.
  // O salt deve ser único por ambiente e armazenado com segurança.
  return scryptSync(password, salt, KEY_LENGTH);
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const result = Buffer.concat([iv, authTag, encrypted]);
  return result.toString("base64");
}

export function decrypt(encryptedBase64: string): string {
  const key = getKey();
  const data = Buffer.from(encryptedBase64, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Utilitário para gerar chaves seguras (use apenas em setup/local).
 * Exemplo: node -e "console.log(require('./lib/crypto').generateSecureKey(32))"
 */
export function generateSecureKey(length = 32): string {
  return randomBytes(length).toString("base64");
}
