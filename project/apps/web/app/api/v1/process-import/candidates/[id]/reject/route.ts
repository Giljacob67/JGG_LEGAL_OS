import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";
import { ImportService } from "@/lib/process-import/import-service";
import { Permission } from "@prisma/client";
import { z } from "zod";

const requestSchema = z.object({
  motivo: z.string().min(1, "Motivo é obrigatório"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    if (!hasPermission(user, Permission.processo_create)) {
      throw new AppError("Sem permissão", 403, "FORBIDDEN");
    }

    const { id } = await params;
    const body = await req.json();
    const data = requestSchema.parse(body);

    const candidate = await ImportService.rejectCandidate(id, data.motivo, user);

    return NextResponse.json(candidate, { status: 200 });
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status: statusCode });
  }
}
