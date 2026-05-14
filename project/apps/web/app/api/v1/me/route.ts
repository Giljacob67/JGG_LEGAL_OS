import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) throw new AppError("Não autenticado", 401, "UNAUTHORIZED");
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}
