import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";
import { getConnector } from "@/lib/court-connectors/registry";
import { sendEmail, templateIntimacao } from "@/lib/email";
import { logger } from "@/lib/logger";

const MONITOR_SECRET = process.env.MONITOR_CRON_SECRET ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://jgg-legal-os.vercel.app";

// Quantos processos sincronizar por execução (limite de tempo Vercel: 10s hobby / 60s pro)
const BATCH_SIZE = 15;
// Processos não sincronizados há mais de N horas
const SYNC_INTERVAL_H = 6;

// POST /api/v1/processes/monitor
// Duas vias de autenticação:
// 1. Header Authorization: Bearer <MONITOR_CRON_SECRET>  (Vercel Cron)
// 2. Usuário autenticado com admin_settings                (manual)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const isCron = MONITOR_SECRET && authHeader === `Bearer ${MONITOR_SECRET}`;

    if (!isCron) {
      const user = await getAuthUser();
      if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
      if (!hasPermission(user, Permission.admin_settings))
        throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const body = await req.json().catch(() => ({}));
    const limit = Number(body.limit ?? BATCH_SIZE);
    const fonte = (body.fonte as string) ?? "datajud_public";

    const connector = getConnector(fonte);
    if (!connector) {
      return NextResponse.json({ error: `Conector '${fonte}' não disponível` }, { status: 400 });
    }

    const limiteSync = new Date();
    limiteSync.setHours(limiteSync.getHours() - SYNC_INTERVAL_H);

    // Processos ativos com CNJ que precisam de sync
    // Prioridade: processos com intimações em aberto primeiro, depois por data de sync
    const processos = await prisma.processo.findMany({
      where: {
        deletedAt: null,
        status: { in: ["em_andamento", "suspenso"] },
        cnj: { not: "" },
        OR: [
          // Não tem fonte registrada
          { fontes: { none: {} } },
          // Última sync foi há mais de SYNC_INTERVAL_H horas
          { fontes: { some: { fonte, ultimaSync: { lt: limiteSync } } } },
        ],
      },
      select: {
        id: true,
        cnj: true,
        tribunal: true,
        responsavel: { select: { id: true, nome: true, email: true } },
        cliente: { select: { nome: true } },
      },
      take: limit,
      orderBy: { ultimoAndamento: "asc" }, // processos mais parados primeiro
    });

    const resultado = {
      total: processos.length,
      sincronizados: 0,
      novosAndamentos: 0,
      intimacoes: 0,
      falhas: 0,
      detalhes: [] as Array<{ cnj: string; status: string; novos?: number }>,
    };

    for (const processo of processos) {
      try {
        const result = await connector.searchByCNJ({
          cnj: processo.cnj,
          tribunal: processo.tribunal || undefined,
        });

        if (!result.success) {
          resultado.falhas++;
          resultado.detalhes.push({ cnj: processo.cnj, status: "nao_encontrado" });
          continue;
        }

        const movimentos = result.processoNormalizado?.movimentos || [];
        if (movimentos.length === 0) {
          resultado.sincronizados++;
          resultado.detalhes.push({ cnj: processo.cnj, status: "sem_movimentos_novos", novos: 0 });
          continue;
        }

        // Deduplicação
        const existentes = await prisma.andamento.findMany({
          where: { processoId: processo.id, deletedAt: null },
          select: { data: true, evento: true },
        });
        const fingerprints = new Set(
          existentes.map((a) => `${a.data.toISOString().slice(0, 10)}|${a.evento.slice(0, 100)}`)
        );

        const inferirTipo = (evento: string): string => {
          const ev = evento.toLowerCase();
          if (ev.includes("intim") || ev.includes("citaç") || ev.includes("vista")) return "intimacao";
          if (ev.includes("sentenç") || ev.includes("acórdão") || ev.includes("decisão")) return "sentenca";
          if (ev.includes("despacho")) return "despacho";
          if (ev.includes("diário") || ev.includes("publicaç") || ev.includes("dje")) return "publicacao";
          return "andamento";
        };

        const novos = movimentos.filter((m) => {
          const date = new Date(m.data);
          if (isNaN(date.getTime())) return false;
          const fp = `${date.toISOString().slice(0, 10)}|${m.evento.slice(0, 100)}`;
          return !fingerprints.has(fp);
        });

        if (novos.length > 0) {
          const novasIntimacoes: typeof novos = [];

          await prisma.andamento.createMany({
            data: novos.map((m) => {
              const tipo = inferirTipo(m.evento);
              if (tipo === "intimacao") novasIntimacoes.push(m);
              return {
                processoId: processo.id,
                data: new Date(m.data),
                evento: m.evento.slice(0, 500),
                descricao: m.descricao.slice(0, 5000),
                fonte,
                critico: false,
                tipo,
                lido: false,
              };
            }),
          });

          resultado.novosAndamentos += novos.length;
          resultado.intimacoes += novasIntimacoes.length;

          // Email para o responsável por cada intimação nova
          if (novasIntimacoes.length > 0 && processo.responsavel?.email) {
            for (const intim of novasIntimacoes) {
              const processoUrl = `${APP_URL}/processos-v2/${processo.id}`;
              await sendEmail({
                to: processo.responsavel.email,
                subject: `⚠️ Nova intimação — ${processo.cnj}`,
                html: templateIntimacao({
                  advogadoNome: processo.responsavel.nome,
                  cnj: processo.cnj,
                  cliente: processo.cliente?.nome ?? "—",
                  evento: intim.evento,
                  descricao: intim.descricao,
                  data: new Date(intim.data).toLocaleDateString("pt-BR"),
                  processoUrl,
                }),
              }).catch((e) => logger.error("[monitor] Erro ao enviar email de intimação", e));
            }
          }
        }

        // Atualizar ProcessoFonte
        if (result.tribunalEncontrado) {
          await prisma.processoFonte.upsert({
            where: {
              processoId_fonte_tribunal: {
                processoId: processo.id,
                fonte,
                tribunal: result.tribunalEncontrado,
              },
            },
            update: { ultimaSync: new Date(), statusSync: "ok" },
            create: {
              processoId: processo.id,
              fonte,
              tribunal: result.tribunalEncontrado,
              ultimaSync: new Date(),
              statusSync: "ok",
            },
          });
        }

        resultado.sincronizados++;
        resultado.detalhes.push({ cnj: processo.cnj, status: "ok", novos: novos.length });
      } catch (err) {
        logger.error(`[monitor] Erro ao sincronizar ${processo.cnj}`, err);
        resultado.falhas++;
        resultado.detalhes.push({ cnj: processo.cnj, status: "erro" });
      }
    }

    logger.info("[monitor] Sync concluído", resultado);
    return NextResponse.json(resultado);
  } catch (error) {
    return handleApiError(error);
  }
}

// GET — retorna status do monitor (último sync, processos pendentes)
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    const limiteSync = new Date();
    limiteSync.setHours(limiteSync.getHours() - SYNC_INTERVAL_H);

    const [totalAtivos, pendentesSync, intimacoesPendentes] = await Promise.all([
      prisma.processo.count({ where: { deletedAt: null, status: { in: ["em_andamento", "suspenso"] } } }),
      prisma.processo.count({
        where: {
          deletedAt: null,
          status: { in: ["em_andamento", "suspenso"] },
          OR: [
            { fontes: { none: {} } },
            { fontes: { some: { ultimaSync: { lt: limiteSync } } } },
          ],
        },
      }),
      prisma.andamento.count({ where: { tipo: "intimacao", lido: false, deletedAt: null } }),
    ]);

    const ultimaFonte = await prisma.processoFonte.findFirst({
      orderBy: { ultimaSync: "desc" },
      select: { ultimaSync: true, fonte: true },
    });

    return NextResponse.json({
      totalAtivos,
      pendentesSync,
      intimacoesPendentes,
      ultimaSync: ultimaFonte?.ultimaSync ?? null,
      ultimaFonte: ultimaFonte?.fonte ?? null,
      intervaloHoras: SYNC_INTERVAL_H,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
