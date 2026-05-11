import { prisma } from "@/lib/db";
import { getAuthUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DocumentosWrapper } from "@/components/documentos/documentos-wrapper";
import { EditorPeca } from "@/components/documentos/editor-peca";
import { Permission } from "@prisma/client";

export const dynamic = "force-dynamic";

interface Documento {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  processoId?: string | null;
  clienteId?: string | null;
  url?: string | null;
  segredo: boolean;
  tags: string[];
  createdAt: string;
  processo?: { cliente?: { nome: string } | null } | null;
  autor?: { nome: string } | null;
}

interface Processo {
  id: string;
  cnj: string;
  cliente?: { nome: string } | null;
}

export default async function DocumentosPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, Permission.documento_view)) redirect("/dashboard");

  let documentos: Documento[] = [];
  let processos: Processo[] = [];
  try {
    documentos = await prisma.documento.findMany({
      where: { deletedAt: null },
      include: { processo: { include: { cliente: true } }, autor: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }) as unknown as Documento[];
    processos = await prisma.processo.findMany({
      where: { deletedAt: null, status: { not: "encerrado" } },
      select: { id: true, cnj: true, cliente: { select: { nome: true } } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }) as unknown as Processo[];
  } catch {
    documentos = [];
    processos = [];
  }

  return (
    <div className="p-6 max-w-[1480px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <DocumentosWrapper initialDocumentos={documentos} processos={processos} />
        </div>
        <div>
          <EditorPeca />
        </div>
      </div>
    </div>
  );
}
