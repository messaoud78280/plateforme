"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { repairWorkItemsClassificationFromImportMeta } from "@/app/dashboard/devis/repair-import-classification-actions";

export function RepairImportClassificationButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    if (
      !window.confirm(
        "Réparer la classification des ouvrages encore en DIV / Non classé / unité générique, à partir des métadonnées d’import des prix ? Les prix ne seront pas modifiés.",
      )
    ) {
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await repairWorkItemsClassificationFromImportMeta({ limit: 500 });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage(
        `${res.updated} fiche(s) corrigée(s) sur ${res.scanned} scannée(s) (${res.skipped} ignorée(s)).`,
      );
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl border border-violet-200/80 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-950 shadow-sm hover:bg-violet-100 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Réparer classification import
      </button>
      {message ? <p className="max-w-xs text-right text-xs text-emerald-800">{message}</p> : null}
      {error ? <p className="max-w-xs text-right text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
