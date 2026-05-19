import { encrypt, decrypt } from "./crypto";

export type CourtAuthType = "none" | "api_key" | "bearer_token" | "basic_auth" | "cert_a1";

export interface ApiKeyCredential {
  key: string;
  headerName?: string; // default: "X-API-Key"
}

export interface BearerTokenCredential {
  token: string;
}

export interface BasicAuthCredential {
  username: string;
  password: string;
}

export interface CertA1Credential {
  certPem: string;
  keyPem: string;
  passphrase?: string;
}

export type CourtCredentialPayload =
  | ApiKeyCredential
  | BearerTokenCredential
  | BasicAuthCredential
  | CertA1Credential;

interface EncryptedWrapper {
  type: CourtAuthType;
  data: CourtCredentialPayload;
}

export function encryptCredential(
  type: CourtAuthType,
  data: Record<string, unknown>
): string {
  const wrapper: EncryptedWrapper = { type, data: data as unknown as CourtCredentialPayload };
  return encrypt(JSON.stringify(wrapper));
}

export function decryptCredential(encrypted: string): {
  type: CourtAuthType;
  data: CourtCredentialPayload;
} {
  const decrypted = decrypt(encrypted);
  return JSON.parse(decrypted) as EncryptedWrapper;
}

export function maskCredential(value: string): string {
  if (!value || value.length <= 8) return "***";
  return value.slice(0, 4) + "..." + value.slice(-4);
}
