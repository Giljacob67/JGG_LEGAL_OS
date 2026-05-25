import { NextRequest, NextResponse } from "next/server";
import { buscarProcessoPorCNJ } from "@/lib/datajud";
import { getAuthUser, hasAnyPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";
import { getRedis } from "@/lib/redis";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX = 10;

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const redis = getRedis();
  const key = `rl:datajud:${ip}`;

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  }
  return current <= RATE_LIMIT_MAX;
}

function validarCNJ(cnj: string): boolean {
  // Remove tudo que não é dígito
  const digits = cnj.replace(/\D/g, "");
  if (digits.length !== 20) return false;

  // NNNNNNN-DD.AAAA.J.TR.OOOO
  const sequencial = digits.slice(0, 7);
  const digitoVerificador = digits.slice(7, 9);
  const ano = digits.slice(9, 13);
  const justica = digits.slice(13, 14);
  const tribunal = digits.slice(14, 16);
  const origem = digits.slice(16, 20);

  if (!sequencial || !digitoVerificador || !ano || !justica || !tribunal || !origem) {
    return false;
  }

  // Validação básica de ranges
  const j = parseInt(justica, 10);
  if (j < 1 || j > 9) return false;

  const a = parseInt(ano, 10);
  const currentYear = new Date().getFullYear();
  if (a < 1890 || a > currentYear + 1) return false;

  // Cálculo do dígito verificador (algoritmo CNJ módulo 97)
  const semDV = sequencial + ano + justica + tribunal + origem;
  const dvCalculado = calcularDV(semDV);
  return dvCalculado === digitoVerificador;
}

function calcularDV(numero: string): string {
  const pesos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  const len = numero.length;
  for (let i = 0; i < len; i++) {
    const idx = len - 1 - i;
    soma += parseInt(numero[idx], 10) * pesos[i];
  }
  const resto = soma % 11;
  if (resto === 10) return "0";
  if (resto === 11) return "1";
  return String(resto).padStart(2, "0");
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    }
    if (!hasAnyPermission(user, [Permission.processo_view, Permission.processo_create])) {
      throw new AppError("Sem permissão para consultar processos", 403, "FORBIDDEN");
    }

    const ip = getClientIP(req);
    const allowed = await checkRateLimit(ip).catch(() => true);
    if (!allowed) {
      throw new AppError("Muitas requisições. Tente novamente em breve.", 429, "RATE_LIMITED");
    }

    const cnj = req.nextUrl.searchParams.get("cnj");
    if (!cnj) {
      throw new AppError("CNJ obrigatório", 400, "MISSING_CNJ");
    }

    if (!validarCNJ(cnj)) {
      throw new AppError("Número CNJ inválido", 400, "INVALID_CNJ");
    }

    const processo = await buscarProcessoPorCNJ(cnj);
    if (!processo) {
      throw new AppError("Processo não encontrado no DataJud", 404, "NOT_FOUND");
    }

    return NextResponse.json(processo);
  } catch (error) {
    return handleApiError(error);
  }
}
