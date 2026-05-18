"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { unmergeWorkItem } from "@/app/dashboard/devis/work-item-merge-actions";
import { formatEurFr } from "@/lib/be-work-devis-format";

export type MergedVariantRow = {
  id: string;
  code: string;
  title: string;
  lot: string;
  unit: string;
  mergedAt: string | null;
  priceEntries: {
    id: string;
    sourceName: string;
    unitPriceHT: number;
    variantDesignation: string | null;
  }[];
};

type Props = {
  canonicalId: string;
  mergeStatus: string;
  variants: MergedVariantRow[];
};

export function WorkItemMergedVariantsSection({ canonicalId, mergeStatus, variants }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (mergeStatus !== "canonical" || variants.length === 0) return null;

  function onUnmerge(variantId: string) {
    startTransition(async () => {
      await unmergeWorkItem(variantId);
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-5">
      <h2 className="font-heading text-lg font-bold text-violet-950">
        Variantes regroupées ({variants.length})
      </h2>
      <p className="mt-1 text-sm text-violet-900/80">
        Ces ouvrages restent en base ; ils sont masqués de la liste principale et rattachés à cette fiche.
      </p>
      <ul className="mt-4 space-y-3">
        {variants.map((v) => (
          <li key={v.id} className="rounded-lg border border-violet-100 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link
                  href={`/dashboard/devis/bibliotheque/${v.id}`}
                  className="font-semibold text-slate-900 hover:text-[#1d4ed8]"
                >
                  {v.title}
                </Link>
                <p className="mt-0.5 font-mono text-xs text-slate-500">
                  {v.code} · {v.lot} · {v.unit}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => onUnmerge(v.id)}
                className="text-xs font-semibold text-violet-800 hover:underline disabled:opacity-50"
              >
                Séparer cette variante
              </button>
            </div>
            {v.priceEntries.length > 0 ? (
              <ul className="mt-2 text-xs text-slate-600">
                {v.priceEntries.slice(0, 5).map((pe) => (
                  <li key={pe.id}>
                    {pe.sourceName} — {formatEurFr(pe.unitPriceHT)} HT
                    {pe.variantDesignation ? ` (${pe.variantDesignation})` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

