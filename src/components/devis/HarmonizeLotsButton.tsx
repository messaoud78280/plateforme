"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { normalizeAllWorkItemLots } from "@/app/dashboard/devis/actions";

export function HarmonizeLotsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    if (!window.confirm("Harmoniser tous les lots vers les corps de métier BeWork ? Les libellés détaillés seront déplacés en sous-lot.")) {
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await normalizeAllWorkItemLots();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage(
        `${res.workItemsUpdated} ouvrage(s) harmonisé(s), ${res.quoteLinesUpdated} ligne(s) de devis — ${res.distinctLots} corps de métier distincts.`,
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
        className="inline-flex items-center gap-2 rounded-xl border border-[#93c5fd]/60 bg-[#eff6ff] px-4 py-2.5 text-sm font-semibold text-[#1e40af] shadow-sm hover:bg-[#dbeafe] disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Harmoniser les lots
      </button>
      {message ? <p className="max-w-xs text-right text-xs text-emerald-800">{message}</p> : null}
      {error ? <p className="max-w-xs text-right text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
