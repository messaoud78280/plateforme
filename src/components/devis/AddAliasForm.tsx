"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addAliasToSiteResource } from "@/app/dashboard/devis/ressources-chantier-actions";

export function AddAliasForm({ siteResourceId }: { siteResourceId: string }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          setHint(null);
          const res = await addAliasToSiteResource(siteResourceId, label);
          if (res.ok && "duplicate" in res && res.duplicate) {
            setHint(res.message ?? "Cet alias existe déjà sur cette fiche.");
            return;
          }
          setLabel("");
          router.refresh();
        });
      }}
    >
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Ajouter un alias…"
        className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending || !label.trim()}
        className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Ajouter
      </button>
      {hint ? <p className="w-full text-sm text-amber-800">{hint}</p> : null}
    </form>
  );
}
