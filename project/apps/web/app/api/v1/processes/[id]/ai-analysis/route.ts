import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { Permission } from "@prisma/client";
import { logger } from "@/lib/logger";

// POST /api/v1/processes/[id]/ai-analysis - Gerar análise com IA
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.ia_use))
      throw new AppError("Sem permissão para usar IA", 403, "FORBIDDEN");

    const { andamentos } = await req.json();

    if (!andamentos || !Array.isArray(andamentos) || andamentos.length === 0) {
      throw new AppError("Andamentos são necessários para análise", 400, "VALIDATION_ERROR");
    }

    // Preparar contexto para IA
    const contexto = andamentos
      .slice(0, 50) // Limitar aos últimos 50 andamentos
      .map((a: any) => `${new Date(a.data).toLocaleDateString("pt-BR")}: ${a.evento} - ${a.descricao}`)
      .join("\n");

    // Chamar OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AppError("OPENAI_API_KEY não configurada", 500, "CONFIG_ERROR");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é um assistente jurídico especializado em análise de processos judiciais brasileiros. 
Analise os andamentos processuais fornecidos e gere insights úteis para o advogado responsável.
Responda APENAS em formato JSON válido com a seguinte estrutura:
{
  "resumo": "Resumo conciso do estado atual do processo (2-3 frases)",
  "riscos": ["Lista de riscos identificados (máximo 5)"],
  "sugestoes": ["Lista de sugestões estratégicas (máximo 5)"],
  "proximosPassos": ["Lista de próximos passos recomendados (máximo 5)"],
  "classificacao": {
    "complexidade": "baixa|media|alta",
    "urgencia": "baixa|media|alta",
    "probabilidadeSucesso": número de 0 a 100
  }
}`,
          },
          {
            role: "user",
            content: `Analise os seguintes andamentos processuais:\n\n${contexto}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error("Erro na API OpenAI", { error });
      throw new AppError("Erro ao gerar análise com IA", 500, "AI_ERROR");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new AppError("Resposta inválida da IA", 500, "AI_ERROR");
    }

    // Parse da resposta JSON
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (err) {
      logger.error("Erro ao parsear resposta da IA", { content });
      throw new AppError("Erro ao processar análise", 500, "AI_ERROR");
    }

    // Registrar uso de IA
    await prisma.aIUsageLog.create({
      data: {
        userId: user.id,
        acao: "analise",
        modulo: "processos",
        entidade: "Processo",
        entidadeId: params.id,
        provider: "openai",
        model: "gpt-4o-mini",
        tokensPrompt: data.usage?.prompt_tokens || 0,
        tokensTotal: data.usage?.total_tokens || 0,
      },
    });

    return NextResponse.json(analysis);
  } catch (error) {
    return handleApiError(error);
  }
}
