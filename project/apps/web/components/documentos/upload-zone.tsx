"use client";

import { Upload } from "lucide-react";

export function UploadZone() {
  return (
    <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-8 text-center hover:border-muted-foreground/40 transition-colors cursor-pointer">
      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-foreground">Arraste arquivos aqui</p>
      <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX, JPG ate 50MB</p>
      <p className="text-[10px] text-muted-foreground mt-2">Funcionalidade de upload em desenvolvimento</p>
    </div>
  );
}