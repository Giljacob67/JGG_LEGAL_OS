import { prisma } from "@/lib/db";
import { UploadZone } from "@/components/documentos/upload-zone";
import { EditorPeca } from "@/components/documentos/editor-peca";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  let documentos: any[] = [];
  try {
    documentos = await prisma.documento.findMany({
      include: { processo: { include: { cliente: true } }, autor: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    documentos = [];
  }

  return (
    <div className="p-6 max-w-[1480px] mx-auto">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] mb-1">Documentos</h1>
          <p className="text-xs text-muted-foreground">Biblioteca · Editor de pecas · Busca semantica</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors">
            Upload
          </button>
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-colors">
            + Nova peca
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <UploadZone />
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-3">
              <h3 className="text-sm font-semibold">Biblioteca</h3>
              <input placeholder="Buscar documento..." className="ml-auto text-xs px-3 py-1.5 rounded-md border border-input bg-background outline-none focus:ring-1 focus:ring-ring" />
            </div>
            {documentos.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum documento cadastrado. Use o upload ou crie uma nova peca.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Documento</th>
                      <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Processo</th>
                      <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Tipo</th>
                      <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Autor</th>
                      <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer">
                        <td className="px-4 py-3 font-medium text-foreground">{doc.nome}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{doc.processo?.cliente?.nome?.slice(0, 28) || "-"}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">{doc.tipo}</span>
                        </td>
                        <td className="px-4 py-3 text-xs">{doc.autor?.nome?.split(" ")[0] || "-"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div>
          <EditorPeca />
        </div>
      </div>
    </div>
  );
}