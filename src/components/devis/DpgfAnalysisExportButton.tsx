"use client";

import { useState, useTransition } from "react";
import { exportDpgfAnalysisSheetJson, exportDpgfAnalysisFamilyJson } from "@/app/dashboard/devis/analyse-dpgf-actions";

type Props = {
  sheetId: string;
  codeSheet: string;
  familyName?: string | null;
};

function downloadJson(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DpgfAnalysisExportButton({ sheetId, codeSheet, familyName }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const exportOne = () => {
    setError(null);
    startTransition(async () => {
      const res = await exportDpgfAnalysisSheetJson(sheetId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      downloadJson(`${codeSheet}.json`, res.json);
    });
  };

  const exportFamily = () => {
    if (!familyName?.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await exportDpgfAnalysisFamilyJson(familyName);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const slug = familyName.trim().replace(/\s+/g, "-").slice(0, 40);
      downloadJson(`fiches-dpgf-${slug}.json`, res.json);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={exportOne}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {pending ? "Export…" : "Exporter JSON"}
        </button>
        {familyName?.trim() ? (
          <button
            type="button"
            disabled={pending}
            onClick={exportFamily}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Exporter la famille
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
