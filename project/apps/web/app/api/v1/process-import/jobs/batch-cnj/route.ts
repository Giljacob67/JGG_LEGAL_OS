import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { ImportService } from "@/lib/process-import/import-service";
import { batchCNJImportSchema } from "@/lib/validations/zod-schemas";
import { Permission } from "@prisma/client";
import { normalizeCNJ, isValidCNJBasic } from "@/lib/process-import/cnj-utils";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_create)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const data = batchCNJImportSchema.parse(body);

    // Normalize, validate and deduplicate CNJs
    const cnjSet = new Set<string>();
    const invalidCnjs: string[] = [];

    for (const raw of data.cnjs) {
      const normalized = normalizeCNJ(raw);
      if (isValidCNJBasic(normalized)) {
        cnjSet.add(normalized);
      } else if (raw.trim().length > 0) {
        invalidCnjs.push(raw.trim());
      }
    }

    const cnjsLimpas = Array.from(cnjSet);

    if (cnjsLimpas.length === 0) {
      throw new AppError(
        invalidCnjs.length > 0
          ? `Nenhum CNJ válido encontrado. ${invalidCnjs.length} entrada(s) inválida(s).`
          : "Nenhum CNJ válido encontrado na entrada.",
        400,
        "BAD_REQUEST",
      );
    }

    if (cnjsLimpas.length > 100) {
      throw new AppError(
        `Limite de 100 CNJs excedido (${cnjsLimpas.length} encontrados). Divida o lote em partes menores.`,
        400,
        "BAD_REQUEST",
      );
    }

    // Create the Job
    const job = await ImportService.createImportJob(user, "lote_cnj", data.fonte, cnjsLimpas.length);

    // Process synchronously (acceptable for small batches in serverless)
    // For production with large batches, migrate to worker/queue (Phase 3)
    const updatedJob = await ImportService.processBatchCNJJob(
      job.id,
      cnjsLimpas,
      data.fonte,
      data.tribunal || undefined,
    );

    return NextResponse.json(
      {
        success: true,
        jobId: job.id,
        message: "Lote processado",
        stats: {
          total: updatedJob.total,
          processados: updatedJob.processados,
          encontrados: updatedJob.encontrados,
          duplicados: updatedJob.duplicados,
          conflitos: updatedJob.conflitos,
          falhas: updatedJob.falhas,
          status: updatedJob.status,
        },
        invalidCnjs: invalidCnjs.length > 0 ? invalidCnjs : undefined,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
