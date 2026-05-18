import Link from "next/link";
import type { SiteResourceStatus, SiteResourceType } from "@prisma/client";
import { Suspense } from "react";
import { ChantierResourcesTaxonomyNav } from "@/components/devis/ChantierResourcesTaxonomyNav";
import { CHANTIER_RESOURCE_TYPE_LABELS, getFamilyLabel, getSubFamilyLabel } from "@/lib/chantier-resources/taxonomy";
import {
  SITE_RESOURCE_CONFIDENCE_LABELS,
  SITE_RESOURCE_STATUS_LABELS,
  SITE_RESOURCE_TYPE_LABELS,
} from "@/lib/chantier-resources/labels";
import { fetchChantierResourceStats, fetchChantierResourcesList } from "@/app/dashboard/devis/ressources-chantier-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

type SearchParams = Promise<{
  type?: string;
  family?: string;
  subFamily?: string;
  q?: string;
  status?: string;
}>;

function isResourceType(v: string | undefined): v is SiteResourceType {
  return Boolean(v && v in SITE_RESOURCE_TYPE_LABELS);
}

function isResourceStatus(v: string | undefined): v is SiteResourceStatus {
  return Boolean(v && v in SITE_RESOURCE_STATUS_LABELS);
}

export default async function RessourcesChantierPage({ searchParams }: { searchParams: SearchParams }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const type = isResourceType(sp.type) ? sp.type : undefined;
  const status = isResourceStatus(sp.status) ? sp.status : undefined;

  const [rows, stats] = await Promise.all([
    fetchChantierResourcesList({
      type,
      family: sp.family,
      subFamily: sp.subFamily,
      q: sp.q,
      status,
    }),
    fetchChantierResourceStats(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 px-1 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">BeWork Devis</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Ressources chantier</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Référentiel matériaux et fournitures regroupé intelligemment : fiches principales, alias conservés, variantes
            distinguées, liens vers les ouvrages de la bibliothèque.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/devis/ressources-chantier/extraction"
            className="inline-flex rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
          >
            Extraire depuis la bibliothèque
          </Link>
          <Link
            href="/dashboard/devis/ressources-chantier/nouveau"
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Nouvelle ressource
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Fiches actives</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-amber-800">Propositions en attente</p>
          <p className="mt-1 text-2xl font-bold text-amber-950">{stats.pendingProposals}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Types</p>
          <p className="mt-1 text-sm text-slate-700">
            {stats.byType.map((b) => `${SITE_RESOURCE_TYPE_LABELS[b.resourceType]} (${b._count})`).join(" · ") || "—"}
          </p>
        </div>
      </div>

      <form className="flex flex-wrap gap-2 px-1" method="get">
        {type ? <input type="hidden" name="type" value={type} /> : null}
        {sp.family ? <input type="hidden" name="family" value={sp.family} /> : null}
        {sp.subFamily ? <input type="hidden" name="subFamily" value={sp.subFamily} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Rechercher ressource ou alias…"
          className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
          Filtrer
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
          <ChantierResourcesTaxonomyNav activeType={type} activeFamily={sp.family} activeSubFamily={sp.subFamily} />
        </Suspense>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Famille</th>
                <th className="px-4 py-3">Sous-famille</th>
                <th className="px-4 py-3">Ressource</th>
                <th className="px-4 py-3">Alias</th>
                <th className="px-4 py-3">Var.</th>
                <th className="px-4 py-3">Ouvrages</th>
                <th className="px-4 py-3">Unité</th>
                <th className="px-4 py-3">Confiance</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                    Aucune ressource. Lancez une extraction depuis la bibliothèque d&apos;ouvrages.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-slate-600">{SITE_RESOURCE_TYPE_LABELS[r.resourceType]}</td>
                    <td className="px-4 py-3">{getFamilyLabel(r.resourceType, r.family)}</td>
                    <td className="px-4 py-3">{getSubFamilyLabel(r.resourceType, r.family, r.subFamily)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link href={`/dashboard/devis/ressources-chantier/${r.id}`} className="text-[#1d4ed8] hover:underline">
                        {r.shortName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r._count.aliases}</td>
                    <td className="px-4 py-3 tabular-nums">{r._count.variants}</td>
                    <td className="px-4 py-3 tabular-nums">{r._count.workItemLinks}</td>
                    <td className="px-4 py-3">{r.orderUnit}</td>
                    <td className="px-4 py-3">{SITE_RESOURCE_CONFIDENCE_LABELS[r.confidenceLevel]}</td>
                    <td className="px-4 py-3">{SITE_RESOURCE_STATUS_LABELS[r.status]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
