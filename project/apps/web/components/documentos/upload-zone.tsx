"use client";

import { useCallback } from "react";
import { Upload } from "lucide-react";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

interface UploadZoneProps {
  onUploadComplete?: (files: { url: string; name: string }[]) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const { startUpload, isUploading } = useUploadThing("documentUploader", {
    onClientUploadComplete: (res) => {
      if (res) {
        onUploadComplete?.(res.map((r) => ({ url: r.url, name: r.name })));
      }
    },
    onUploadError: (error) => {
      alert(`Erro no upload: ${error.message}`);
    },
  });

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) await startUpload(files);
    },
    [startUpload]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) await startUpload(files);
    },
    [startUpload]
  );

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-8 text-center hover:border-muted-foreground/40 transition-colors cursor-pointer relative"
    >
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        className="absolute inset-0 opacity-0 cursor-pointer"
        disabled={isUploading}
      />
      {isUploading ? (
        <div className="space-y-2">
          <div className="mx-auto h-8 w-8 border-2 border-muted-foreground/30 border-t-accent rounded-full animate-spin" />
          <p className="text-sm font-medium text-foreground">Enviando...</p>
        </div>
      ) : (
        <>
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Arraste arquivos aqui ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, JPG ate 32MB</p>
        </>
      )}
    </div>
  );
}
