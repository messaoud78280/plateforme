"use client";

import { useCallback, useState, useTransition } from "react";
import { exportBtpDicoJson } from "@/app/dashboard/devis/dico-btp-actions";

export function BtpDicoExportButton({ lotCode }: { lotCode?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const res = await exportBtpDicoJson(lotCode);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const blob = new Blob([res.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dico-btp${lotCode ? `-lot-${lotCode}` : ""}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }, [lotCode]);

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? "Export…" : "Exporter JSON"}
      </button>
      {error ? <span className="mt-1 text-xs text-red-700">{error}</span> : null}
    </span>
  );
}
