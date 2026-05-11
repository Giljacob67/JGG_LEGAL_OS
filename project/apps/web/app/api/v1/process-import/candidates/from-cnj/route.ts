import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { ImportService } from "@/lib/process-import/import-service";
import { Permission } from "@prisma/client";
import { z } from "zod";

const requestSchema = z.object({
  cnj: z.string().min(20, "CNJ inválido"),
  fonte: z.string().default("datajud_public"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_create)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const data = requestSchema.parse(body);

    // Create a temporary job for single search
    const job = await ImportService.createImportJob(user, "cnj_search_single", data.fonte);

    const candidate = await ImportService.createCandidateFromCNJ(job.id, data.cnj, data.fonte);

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}
