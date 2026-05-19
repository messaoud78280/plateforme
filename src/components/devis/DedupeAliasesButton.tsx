"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { dedupeAliasesForSiteResource } from "@/app/dashboard/devis/ressources-chantier-actions";

type Props = {
  siteResourceId: string;
  redundantCount: number;
};

export function DedupeAliasesButton({ siteResourceId, redundantCount }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (redundantCount <= 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const res = await dedupeAliasesForSiteResource(siteResourceId);
            setMessage(
              res.removed > 0
                ? `${res.removed} doublon(s) supprimé(s) — ${res.remaining} alias conservé(s).`
                : "Aucun doublon à supprimer.",
            );
            router.refresh();
          });
        }}
        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
      >
        {pending ? "Nettoyage…" : `Supprimer ${redundantCount} doublon(s) d'alias`}
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
