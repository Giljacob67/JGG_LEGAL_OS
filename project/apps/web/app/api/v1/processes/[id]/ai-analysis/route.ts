import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertProcessoAccess, getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-6";

// POST /api/v1/processes/[id]/ai-analysis
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.ia_use))
      throw new AppError("Sem permissão para usar IA", 403, "FORBIDDEN");

    await assertProcessoAccess(user, id);

    if (!ANTHROPIC_API_KEY) {
      throw new AppError("ANTHROPIC_API_KEY não configurada", 500, "CONFIG_ERROR");
    }

    // Busca dados do processo + últimos 80 andamentos diretamente do banco
    const [processo, andamentos] = await Promise.all([
      prisma.processo.findUnique({
        where: { id },
        select: {
          cnj: true,
          area: true,
          tipo: true,
          status: true,
          risco: true,
          classe: true,
          assunto: true,
          tribunal: true,
          vara: true,
          valorCausa: true,
          distribuicao: true,
          tese: true,
          estrategia: true,
          adverso: true,
          cliente: { select: { nome: true } },
        },
      }),
      prisma.andamento.findMany({
        where: { processoId: id, deletedAt: null },
        orderBy: { data: "desc" },
        take: 80,
        select: { data: true, evento: true, descricao: true, tipo: true, critico: true, fonte: true },
      }),
    ]);

    if (!processo) throw new AppError("Processo não encontrado", 404, "NOT_FOUND");

    if (andamentos.length === 0) {
      throw new AppError(
        "Nenhum andamento disponível para análise. Importe andamentos do tribunal primeiro.",
        400,
        "VALIDATION_ERROR"
      );
    }

    // Contexto do processo
    const contextoProcesso = [
      `CNJ: ${processo.cnj}`,
      `Área: ${processo.area}`,
      `Tipo: ${processo.tipo}`,
      `Classe: ${processo.classe ?? "—"}`,
      `Assunto: ${processo.assunto ?? "—"}`,
      `Tribunal: ${processo.tribunal ?? "—"} / ${processo.vara ?? "—"}`,
      `Status atual: ${processo.status}`,
      `Risco atual: ${processo.risco}`,
      `Valor da causa: ${processo.valorCausa ? `R$ ${Number(processo.valorCausa).toLocaleString("pt-BR")}` : "não informado"}`,
      `Distribuição: ${processo.distribuicao ? new Date(processo.distribuicao).toLocaleDateString("pt-BR") : "—"}`,
      `Parte contrária: ${processo.adverso ?? "—"}`,
      processo.tese ? `Tese interna: ${processo.tese}` : null,
      processo.estrategia ? `Estratégia: ${processo.estrategia}` : null,
    ].filter(Boolean).join("\n");

    // Andamentos formatados
    const contextoAndamentos = andamentos
      .map((a) => {
        const data = new Date(a.data).toLocaleDateString("pt-BR");
        const critico = a.critico ? " [CRÍTICO]" : "";
        const tipo = a.tipo !== "andamento" ? ` [${a.tipo.toUpperCase()}]` : "";
        return `${data}${tipo}${critico}: ${a.evento} — ${a.descricao.slice(0, 300)}`;
      })
      .join("\n");

    const prompt = `Você é um assistente jurídico sênior especializado em direito brasileiro. Analise o processo abaixo e forneça insights estratégicos para o advogado responsável.

## Dados do Processo
${contextoProcesso}

## Andamentos Processuais (${andamentos.length} mais recentes)
${contextoAndamentos}

## Instruções
Analise criticamente os andamentos e forneça uma avaliação estratégica profissional. Responda EXCLUSIVAMENTE em JSON válido com esta estrutura exata:

{
  "resumo": "Resumo conciso do estado atual do processo em 2-3 frases com foco operacional",
  "situacao": "ativa|aguardando|risco|favoravel|encerrada",
  "riscos": ["risco 1 concreto e específico", "risco 2"],
  "oportunidades": ["oportunidade ou ponto favorável 1", "oportunidade 2"],
  "sugestoes": ["ação estratégica concreta 1", "ação 2"],
  "proximosPassos": ["próximo passo imediato 1", "próximo passo 2"],
  "prazosCriticos": ["prazo ou deadline identificado nos andamentos 1"],
  "classificacao": {
    "complexidade": "baixa|media|alta",
    "urgencia": "baixa|media|alta",
    "probabilidadeSucesso": 65
  },
  "observacaoIA": "Uma observação estratégica que só um advogado experiente perceberia neste caso"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error("[ai-analysis] Claude API error", { status: response.status, err });
      throw new AppError("Erro ao gerar análise com IA", 500, "AI_ERROR");
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) throw new AppError("Resposta inválida da IA", 500, "AI_ERROR");

    let analysis;
    try {
      // Extrair JSON da resposta (Claude pode incluir texto antes/depois)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON não encontrado");
      analysis = JSON.parse(jsonMatch[0]);
    } catch {
      logger.error("[ai-analysis] Falha ao parsear JSON", { content });
      throw new AppError("Erro ao processar análise", 500, "AI_ERROR");
    }

    // Registrar uso de IA
    await prisma.aIUsageLog.create({
      data: {
        userId: user.id,
        acao: "analise",
        modulo: "processos",
        entidade: "Processo",
        entidadeId: id,
        provider: "anthropic",
        model: CLAUDE_MODEL,
        tokensPrompt: data.usage?.input_tokens ?? 0,
        tokensTotal: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
    });

    return NextResponse.json({ ...analysis, andamentosAnalisados: andamentos.length });
  } catch (error) {
    return handleApiError(error);
  }
}
