import { prisma } from "@/lib/db";
import { DocumentosWrapper } from "@/components/documentos/documentos-wrapper";
import { EditorPeca } from "@/components/documentos/editor-peca";
import { UploadZone } from "@/components/documentos/upload-zone";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  let documentos: any[] = [];
  let processos: any[] = [];
  try {
    documentos = await prisma.documento.findMany({
      where: { deletedAt: null },
      include: { processo: { include: { cliente: true } }, autor: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    processos = await prisma.processo.findMany({
      where: { deletedAt: null, status: { not: "encerrado" } },
      select: { id: true, cnj: true, cliente: { select: { nome: true } } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
  } catch {
    documentos = [];
    processos = [];
  }

  return (
    <div className="p-6 max-w-[1480px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <UploadZone />
          <DocumentosWrapper initialDocumentos={documentos} processos={processos} />
        </div>
        <div>
          <EditorPeca />
        </div>
      </div>
    </div>
  );
}
