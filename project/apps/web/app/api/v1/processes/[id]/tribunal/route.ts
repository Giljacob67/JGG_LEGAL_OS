import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertProcessoAccess, getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";
import { getConnector } from "@/lib/court-connectors/registry";

// GET /api/v1/processes/[id]/tribunal
// Consulta o tribunal (DataJud) e retorna andamentos novos (diff com o banco)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_view))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    await assertProcessoAccess(user, id);

    const processo = await prisma.processo.findUnique({
      where: { id },
      select: {
        cnj: true,
        tribunal: true,
        fontes: { select: { fonte: true, tribunal: true, ultimaSync: true, statusSync: true } },
      },
    });

    if (!processo) throw new AppError("Processo não encontrado", 404, "NOT_FOUND");

    const { searchParams } = new URL(req.url);
    const fonte = searchParams.get("fonte") || "datajud_public";

    const connector = getConnector(fonte);
    if (!connector) throw new AppError(`Conector '${fonte}' não disponível`, 400, "CONNECTOR_NOT_FOUND");

    // Consulta no tribunal
    const result = await connector.searchByCNJ({
      cnj: processo.cnj,
      tribunal: processo.tribunal || undefined,
    });

    if (!result.success) {
      return NextResponse.json({
        encontrado: false,
        erro: result.erro,
        fonte,
        cnj: processo.cnj,
      });
    }

    // Andamentos já no banco (para fazer diff)
    const andamentosExistentes = await prisma.andamento.findMany({
      where: { processoId: id, deletedAt: null },
      select: { data: true, evento: true },
    });

    const fingerprints = new Set(
      andamentosExistentes.map(
        (a) => `${a.data.toISOString().slice(0, 10)}|${a.evento.slice(0, 100)}`
      )
    );

    const movimentos = result.processoNormalizado?.movimentos || [];

    // Diff: movimentos do tribunal não presentes no banco
    const novos = movimentos
      .map((m) => {
        const date = new Date(m.data);
        const fp = `${date.toISOString().slice(0, 10)}|${m.evento.slice(0, 100)}`;
        return { ...m, isNovo: !fingerprints.has(fp) };
      })
      .filter((m) => !isNaN(new Date(m.data).getTime()));

    const andamentosNovos = novos.filter((m) => m.isNovo);
    const andamentosJaImportados = novos.length - andamentosNovos.length;

    return NextResponse.json({
      encontrado: true,
      fonte,
      cnj: processo.cnj,
      tribunalEncontrado: result.tribunalEncontrado,
      scoreConfianca: result.scoreConfianca,
      dadosProcesso: {
        classe: result.processoNormalizado?.classe,
        assunto: result.processoNormalizado?.assunto,
        orgaoJulgador: result.processoNormalizado?.orgaoJulgador,
        situacao: result.processoNormalizado?.situacao,
        distribuicao: result.processoNormalizado?.distribuicao,
        valorCausa: result.processoNormalizado?.valorCausa,
      },
      movimentos: {
        total: movimentos.length,
        novos: andamentosNovos.length,
        jaImportados: andamentosJaImportados,
        lista: novos.slice(0, 100), // exibir no máximo 100 para diff
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/v1/processes/[id]/tribunal/import
// Importa andamentos selecionados do tribunal para o processo
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_edit))
      throw new AppError("Sem permissão", 403, "FORBIDDEN");

    await assertProcessoAccess(user, id);

    const body = await req.json();
    const { movimentos, fonte = "datajud_public", tribunalEncontrado } = body as {
      movimentos: Array<{ data: string; evento: string; descricao: string; tipo?: string }>;
      fonte?: string;
      tribunalEncontrado?: string;
    };

    if (!Array.isArray(movimentos) || movimentos.length === 0) {
      throw new AppError("Nenhum andamento selecionado", 400, "VALIDATION_ERROR");
    }

    // Deduplicação antes de inserir
    const existentes = await prisma.andamento.findMany({
      where: { processoId: id, deletedAt: null },
      select: { data: true, evento: true },
    });
    const fingerprints = new Set(
      existentes.map((a) => `${a.data.toISOString().slice(0, 10)}|${a.evento.slice(0, 100)}`)
    );

    const paraInserir = movimentos.filter((m) => {
      const date = new Date(m.data);
      if (isNaN(date.getTime())) return false;
      const fp = `${date.toISOString().slice(0, 10)}|${m.evento.slice(0, 100)}`;
      return !fingerprints.has(fp);
    });

    if (paraInserir.length === 0) {
      return NextResponse.json({ importados: 0, mensagem: "Todos os andamentos já estavam importados." });
    }

    // Inferir tipo do andamento baseado no texto do evento
    const inferirTipo = (evento: string): string => {
      const ev = evento.toLowerCase();
      if (ev.includes("intim") || ev.includes("vista") || ev.includes("citação")) return "intimacao";
      if (ev.includes("sentença") || ev.includes("acórdão") || ev.includes("decisão")) return "sentenca";
      if (ev.includes("despacho")) return "despacho";
      if (ev.includes("diário") || ev.includes("publicação") || ev.includes("dje")) return "publicacao";
      return "andamento";
    };

    await prisma.andamento.createMany({
      data: paraInserir.map((m) => ({
        processoId: id,
        data: new Date(m.data),
        evento: m.evento.slice(0, 500),
        descricao: m.descricao.slice(0, 5000),
        fonte,
        critico: false,
        tipo: m.tipo || inferirTipo(m.evento),
        lido: false, // importados do tribunal ficam como não lidos até advogado ver
      })),
    });

    // Atualizar ProcessoFonte
    if (tribunalEncontrado) {
      await prisma.processoFonte.upsert({
        where: { processoId_fonte_tribunal: { processoId: id, fonte, tribunal: tribunalEncontrado } },
        update: { ultimaSync: new Date(), statusSync: "ok" },
        create: { processoId: id, fonte, tribunal: tribunalEncontrado, ultimaSync: new Date(), statusSync: "ok" },
      });
    }

    // Atualizar ultimoAndamento no processo
    const mais_recente = paraInserir.reduce((acc, m) => {
      const d = new Date(m.data);
      return d > acc ? d : acc;
    }, new Date(0));

    if (mais_recente > new Date(0)) {
      await prisma.processo.update({ where: { id }, data: { ultimoAndamento: mais_recente } });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        acao: "TRIBUNAL_IMPORT",
        entidade: "Processo",
        entidadeId: id,
        diff: { fonte, tribunalEncontrado, importados: paraInserir.length } as object,
      },
    });

    return NextResponse.json({ importados: paraInserir.length });
  } catch (error) {
    return handleApiError(error);
  }
}
