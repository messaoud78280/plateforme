"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { deleteBtpDicoTerm } from "@/app/dashboard/devis/dico-btp-actions";

export function BtpDicoDeleteButton({ id, redirectTo }: { id: string; redirectTo?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const res = await deleteBtpDicoTerm(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }, [id, redirectTo, router]);

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="inline-flex items-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
      >
        Supprimer
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-xs text-slate-600">Confirmer&nbsp;?</span>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? "…" : "Oui, supprimer"}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        disabled={pending}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Annuler
      </button>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </span>
  );
}
