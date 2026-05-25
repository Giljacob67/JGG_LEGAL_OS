"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, Trash2, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UploadZone } from "@/components/documentos/upload-zone";
import { formatBytes, formatDate } from "@/lib/utils";

interface Documento {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  url: string | null;
  mimeType: string | null;
  tamanho: number | null;
  segredo: boolean;
  autor: {
    id: string;
    nome: string;
    email: string;
  };
  createdAt: string;
}

interface DocumentUploadProps {
  processoId: string;
}

const TIPOS_DOCUMENTO = [
  { value: "peticao", label: "Petição" },
  { value: "contrato", label: "Contrato" },
  { value: "procuracao", label: "Procuração" },
  { value: "decisao", label: "Decisão" },
  { value: "sentenca", label: "Sentença" },
  { value: "acordao", label: "Acórdão" },
  { value: "certidao", label: "Certidão" },
  { value: "ata", label: "Ata" },
  { value: "laudo", label: "Laudo" },
  { value: "outros", label: "Outros" },
];

export function DocumentUpload({ processoId }: DocumentUploadProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [novoDocumento, setNovoDocumento] = useState({
    tipo: "outros",
    segredo: false,
  });

  useEffect(() => {
    loadDocumentos();
  }, [processoId]);

  async function loadDocumentos() {
    try {
      const res = await fetch(`/api/v1/processes/${processoId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocumentos(data);
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadComplete(files: { url: string; name: string }[]) {
    setUploading(true);
    try {
      for (const file of files) {
        await fetch(`/api/v1/processes/${processoId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: file.name,
            tipo: novoDocumento.tipo,
            url: file.url,
            segredo: novoDocumento.segredo,
          }),
        });
      }
      await loadDocumentos();
      setShowUpload(false);
      setNovoDocumento({ tipo: "outros", segredo: false });
    } catch (error) {
      console.error("Erro ao salvar documentos:", error);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    try {
      const res = await fetch(`/api/v1/documents/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocumentos((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botão de upload */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documentos ({documentos.length})</h3>
        <Button onClick={() => setShowUpload(!showUpload)} size="sm">
          <Upload className="h-4 w-4 mr-2" />
          {showUpload ? "Cancelar" : "Novo Upload"}
        </Button>
      </div>

      {/* Zona de upload */}
      {showUpload && (
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo do Documento</label>
              <Select
                value={novoDocumento.tipo}
                onValueChange={(value: string) =>
                  setNovoDocumento((prev) => ({ ...prev, tipo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novoDocumento.segredo}
                  onChange={(e) =>
                    setNovoDocumento((prev) => ({
                      ...prev,
                      segredo: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">Documento confidencial</span>
              </label>
            </div>
          </div>
          <UploadZone onUploadComplete={handleUploadComplete} />
          {uploading && (
            <p className="text-sm text-blue-600 text-center">
              Salvando documentos...
            </p>
          )}
        </div>
      )}

      {/* Lista de documentos */}
      {documentos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum documento vinculado a este processo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{doc.nome}</p>
                  {doc.segredo && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                      Confidencial
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{TIPOS_DOCUMENTO.find((t) => t.value === doc.tipo)?.label}</span>
                  {doc.tamanho && <span>• {formatBytes(doc.tamanho)}</span>}
                  <span>• {formatDate(doc.createdAt)}</span>
                  <span>• {doc.autor.nome}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {doc.url && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(doc.url!, "_blank")}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = doc.url!;
                        a.download = doc.nome;
                        a.click();
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(doc.id)}
                  title="Excluir"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
