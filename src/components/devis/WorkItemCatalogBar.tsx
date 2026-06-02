"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setActiveWorkItemCatalog } from "@/app/dashboard/devis/catalog-actions";
import type { WorkItemCatalogSummary } from "@/lib/work-item-catalog";

type Props = {
  catalogs: WorkItemCatalogSummary[];
  activeCatalogId: string;
};

export function WorkItemCatalogBar({ catalogs, activeCatalogId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = catalogs.find((c) => c.id === activeCatalogId);

  function onChange(catalogId: string) {
    startTransition(async () => {
      const res = await setActiveWorkItemCatalog(catalogId);
      if (res.ok) router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-[#1e3a5f]/20 bg-gradient-to-br from-[#1e3a5f]/5 to-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e3a5f]/80">
            Bibliothèque active
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {active?.description ?? "Sélectionnez le référentiel pour import, codification et devis."}
          </p>
          {active?.slug === "historique" ? (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Référentiel historique : consultation et anciens devis. Pour repartir proprement, basculez sur{" "}
              <strong>Artiprix BeWork 2026</strong>.
            </p>
          ) : null}
        </div>
        <label className="block min-w-[280px] text-sm">
          <span className="font-semibold text-slate-800">Catalogue</span>
          <select
            value={activeCatalogId}
            disabled={pending}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm"
          >
            {catalogs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.workItemCount != null ? ` (${c.workItemCount})` : ""}
                {c.isDefault ? " — défaut" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
