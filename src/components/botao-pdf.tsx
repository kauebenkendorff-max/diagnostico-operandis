"use client";

import { Download } from "lucide-react";

export function BotaoPdf() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
    >
      <Download className="h-4 w-4" />
      Baixar PDF
    </button>
  );
}
