import { prisma } from "./db";
import { encrypt, decrypt } from "./crypto";

export async function createIntegrationAccount(data: {
  userId: string;
  tipo: any;
  provider: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scope?: string | null;
  email?: string | null;
}) {
  return prisma.integrationAccount.create({
    data: {
      ...data,
      accessToken: data.accessToken ? encrypt(data.accessToken) : null,
      refreshToken: data.refreshToken ? encrypt(data.refreshToken) : null,
    },
  });
}

export async function findIntegrationAccountById(id: string) {
  const account = await prisma.integrationAccount.findUnique({ where: { id } });
  if (!account) return null;
  return {
    ...account,
    accessToken: account.accessToken ? decrypt(account.accessToken) : null,
    refreshToken: account.refreshToken ? decrypt(account.refreshToken) : null,
  };
}

export async function findIntegrationAccountsByUser(userId: string) {
  const accounts = await prisma.integrationAccount.findMany({ where: { userId, active: true } });
  return accounts.map((a) => ({
    ...a,
    accessToken: a.accessToken ? decrypt(a.accessToken) : null,
    refreshToken: a.refreshToken ? decrypt(a.refreshToken) : null,
  }));
}

export async function updateIntegrationAccountTokens(
  id: string,
  tokens: { accessToken?: string | null; refreshToken?: string | null; expiresAt?: Date | null }
) {
  return prisma.integrationAccount.update({
    where: { id },
    data: {
      accessToken: tokens.accessToken ? encrypt(tokens.accessToken) : undefined,
      refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
      expiresAt: tokens.expiresAt ?? undefined,
    },
  });
}
