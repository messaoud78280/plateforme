import Link from "next/link";
import type { BeWorkPriceDocSourceType, WorkItemQualityLevel, WorkItemStatus } from "@prisma/client";
import { WorkItemSearchResults } from "@/components/devis/WorkItemSearchResults";
import {
  QUALITY_LEVEL_LABELS,
  SOURCE_TYPE_LABELS,
  WORK_ITEM_STATUS_LABELS,
  WORK_ITEM_UNITS,
} from "@/lib/be-work-devis-labels";
import {
  buildWorkItemWhere,
  fetchWorkItemsWithPriceStats,
  parseWorkItemSortKey,
  type WorkItemFilterParams,
} from "@/lib/be-work-devis-search";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  q?: string;
  lot?: string;
  subLot?: string;
  unit?: string;
  status?: string;
  gamme?: string;
  techRef?: string;
  priceDept?: string;
  priceSourceType?: string;
  sort?: string;
}>;

function toFilterParams(sp: Awaited<SearchParams>): WorkItemFilterParams {
  return {
    q: sp.q,
    lot: sp.lot,
    subLot: sp.subLot,
    unit: sp.unit,
    status: sp.status,
    gamme: sp.gamme,
    techRef: sp.techRef,
    priceDept: sp.priceDept,
    priceSourceType: sp.priceSourceType,
  };
}

function filterQueryString(sp: Awaited<SearchParams>): string {
  const qs = new URLSearchParams();
  const p = toFilterParams(sp);
  if (p.q) qs.set("q", p.q);
  if (p.lot) qs.set("lot", p.lot);
  if (p.subLot) qs.set("subLot", p.subLot);
  if (p.unit) qs.set("unit", p.unit);
  if (p.status) qs.set("status", p.status);
  if (p.gamme) qs.set("gamme", p.gamme);
  if (p.techRef) qs.set("techRef", p.techRef);
  if (p.priceDept) qs.set("priceDept", p.priceDept);
  if (p.priceSourceType) qs.set("priceSourceType", p.priceSourceType);
  const sort = parseWorkItemSortKey(sp.sort);
  if (sort !== "updated_desc") qs.set("sort", sort);
  return qs.toString();
}

export default async function BibliothequePage({ searchParams }: { searchParams: SearchParams }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const sort = parseWorkItemSortKey(sp.sort);
  const where = buildWorkItemWhere(toFilterParams(sp));

  const [items, lotsRow, subLotsRow, deptRows] = await Promise.all([
    fetchWorkItemsWithPriceStats(where, sort),
    prisma.workItem.findMany({
      select: { lot: true },
      distinct: ["lot"],
      orderBy: { lot: "asc" },
    }),
    prisma.workItem.findMany({
      where: { subLot: { not: null } },
      select: { subLot: true },
      distinct: ["subLot"],
      orderBy: { subLot: "asc" },
    }),
    prisma.priceEntry.findMany({
      where: { department: { not: null } },
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    }),
  ]);

  const lots = lotsRow.map((r) => r.lot);
  const subLots = subLotsRow.map((r) => r.subLot).filter((s): s is string => s != null && s !== "");
  const departments = deptRows.map((r) => r.department).filter((d): d is string => d != null && d !== "");

  const qsStr = filterQueryString(sp);
  const sourceTypeKeys = Object.keys(SOURCE_TYPE_LABELS) as BeWorkPriceDocSourceType[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">Bibliothèque ouvrages</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Base interne BeWork de désignations, lots, unités et points de vigilance.
          </p>
        </div>
        <Link
          href="/dashboard/devis/bibliotheque/nouveau"
          className="inline-flex items-center justify-center rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]"
        >
          Ajouter un ouvrage
        </Link>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-8"
      >
        <div className="lg:col-span-2 xl:col-span-2">
          <label htmlFor="devis-q" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recherche
          </label>
          <input
            id="devis-q"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Code, lot, famille, désignation, vigilance, inclus…"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="devis-lot" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Lot
          </label>
          <select
            id="devis-lot"
            name="lot"
            defaultValue={sp.lot ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {lots.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="devis-sublot" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sous-lot
          </label>
          <select
            id="devis-sublot"
            name="subLot"
            defaultValue={sp.subLot ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {subLots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="devis-unit" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Unité
          </label>
          <select
            id="devis-unit"
            name="unit"
            defaultValue={sp.unit ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Toutes</option>
            {WORK_ITEM_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="devis-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Statut
          </label>
          <select
            id="devis-status"
            name="status"
            defaultValue={sp.status ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {(Object.keys(WORK_ITEM_STATUS_LABELS) as WorkItemStatus[]).map((s) => (
              <option key={s} value={s}>
                {WORK_ITEM_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="devis-gamme" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Gamme
          </label>
          <select
            id="devis-gamme"
            name="gamme"
            defaultValue={sp.gamme ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Toutes</option>
            {(Object.keys(QUALITY_LEVEL_LABELS) as WorkItemQualityLevel[]).map((g) => (
              <option key={g} value={g}>
                {QUALITY_LEVEL_LABELS[g]}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2 xl:col-span-2">
          <label htmlFor="devis-techref" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Réf. technique
          </label>
          <input
            id="devis-techref"
            name="techRef"
            defaultValue={sp.techRef ?? ""}
            placeholder="Contient…"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="devis-pricedept" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Dépt. (prix)
          </label>
          <select
            id="devis-pricedept"
            name="priceDept"
            defaultValue={sp.priceDept ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="devis-pricesource" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Source type (prix)
          </label>
          <select
            id="devis-pricesource"
            name="priceSourceType"
            defaultValue={sp.priceSourceType ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Toutes</option>
            {sourceTypeKeys.map((k) => (
              <option key={k} value={k}>
                {SOURCE_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
          <label htmlFor="devis-sort" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tri
          </label>
          <select
            id="devis-sort"
            name="sort"
            defaultValue={sort}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="updated_desc">Dernière mise à jour</option>
            <option value="code_asc">Code</option>
            <option value="lot_asc">Lot</option>
            <option value="title_asc">Titre</option>
            <option value="status_asc">Statut</option>
            <option value="priceCount_desc">Nombre de prix observés</option>
            <option value="avgHt_desc">Prix moyen HT (décroissant)</option>
            <option value="avgHt_asc">Prix moyen HT (croissant)</option>
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6 xl:col-span-8">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Filtrer
          </button>
          {qsStr ? (
            <Link href="/dashboard/devis/bibliotheque" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
              Réinitialiser
            </Link>
          ) : null}
        </div>
      </form>

      <WorkItemSearchResults
        items={items}
        ficheHref={(id) => `/dashboard/devis/bibliotheque/${id}`}
        showAdminActions
      />
    </div>
  );
}
