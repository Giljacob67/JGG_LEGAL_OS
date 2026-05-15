"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export function SectionCard({ title, children, className, padded = true }: SectionCardProps) {
  return (
    <div className={cn("rounded-xl border bg-card", className)}>
      {title && (
        <div className="px-5 py-3 border-b">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        </div>
      )}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </div>
  );
}
