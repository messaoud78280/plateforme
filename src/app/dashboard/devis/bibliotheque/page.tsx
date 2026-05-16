import Link from "next/link";
import type { BeWorkPriceDocSourceType, WorkItemItemType, WorkItemQualityLevel, WorkItemStatus } from "@prisma/client";
import { BibliothequeStatsStrip } from "@/components/devis/BibliothequeStatsStrip";
import { BibliothequeWorkItemsShell, type BibliothequeWorkItemRow } from "@/components/devis/BibliothequeWorkItemsShell";
import {
  QUALITY_LEVEL_LABELS,
  SOURCE_TYPE_LABELS,
  WORK_ITEM_ITEM_TYPE_LABELS,
  WORK_ITEM_STATUS_LABELS,
  WORK_ITEM_UNITS,
} from "@/lib/be-work-devis-labels";
import {
  buildWorkItemWhere,
  computeBibliothequeStats,
  excerptDesignation,
  fetchWorkItemsWithPriceStats,
  filterWorkItemsByAvgPriceRange,
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
  itemType?: string;
  priceMin?: string;
  priceMax?: string;
  onlyTechnical?: string;
  onlyAnnexes?: string;
  view?: string;
  groupLots?: string;
  imported?: string;
  pricesImported?: string;
  pricePaste?: string;
  pricePasteAdded?: string;
  pricePasteIgnored?: string;
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
    itemType: sp.itemType,
    onlyTechnical: sp.onlyTechnical,
    onlyAnnexes: sp.onlyAnnexes,
  };
}

function parseViewMode(sp: Awaited<SearchParams>): "table" | "cards" {
  return sp.view === "cards" ? "cards" : "table";
}

function parseGroupLots(sp: Awaited<SearchParams>): boolean {
  return sp.groupLots === "1";
}

export default async function BibliothequePage({ searchParams }: { searchParams: SearchParams }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const sort = parseWorkItemSortKey(sp.sort);
  const where = buildWorkItemWhere(toFilterParams(sp));

  const [rawItems, lotsRow, subLotsRow, deptRows] = await Promise.all([
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

  const items = filterWorkItemsByAvgPriceRange(rawItems, sp.priceMin, sp.priceMax);
  const stats = computeBibliothequeStats(items);

  const rows: BibliothequeWorkItemRow[] = items.map((w) => ({
    id: w.id,
    code: w.code,
    lot: w.lot,
    family: w.family,
    title: w.title,
    unit: w.unit,
    status: w.status,
    itemType: w.itemType,
    updatedAt: w.updatedAt.toISOString(),
    priceCount: w.priceCount,
    avgHt: w.avgHt,
    designation: excerptDesignation(w, 400),
  }));

  const lots = lotsRow.map((r) => r.lot);
  const subLots = subLotsRow.map((r) => r.subLot).filter((s): s is string => s != null && s !== "");
  const departments = deptRows.map((r) => r.department).filter((d): d is string => d != null && d !== "");

  const sourceTypeKeys = Object.keys(SOURCE_TYPE_LABELS) as BeWorkPriceDocSourceType[];
  const itemTypeKeys = Object.keys(WORK_ITEM_ITEM_TYPE_LABELS) as WorkItemItemType[];

  const importedCount = sp.imported != null ? Number.parseInt(sp.imported, 10) : NaN;
  const pricesImportedCount = sp.pricesImported != null ? Number.parseInt(sp.pricesImported, 10) : NaN;
  const showImportBanner = Number.isFinite(importedCount) && importedCount > 0;
  const pricePasteAdded = sp.pricePasteAdded != null ? Number.parseInt(sp.pricePasteAdded, 10) : NaN;
  const pricePasteIgnored = sp.pricePasteIgnored != null ? Number.parseInt(sp.pricePasteIgnored, 10) : NaN;
  const showPricePasteBanner = sp.pricePaste === "1" && Number.isFinite(pricePasteAdded) && Number.isFinite(pricePasteIgnored);

  const view = parseViewMode(sp);
  const groupLots = parseGroupLots(sp);

  return (
    <div className="space-y-6">
      {showPricePasteBanner ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <strong>{pricePasteAdded}</strong> prix observé(s) ajouté(s), <strong>{pricePasteIgnored}</strong> ignoré(s).
        </div>
      ) : null}
      {showImportBanner ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <strong>{importedCount}</strong> ouvrage(s) importé(s),{" "}
          <strong>{Number.isFinite(pricesImportedCount) ? pricesImportedCount : 0}</strong> prix observé(s) ajouté(s).
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">Bibliothèque ouvrages</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Référentiel type BPU : filtres, tri, vue tableau ou cartes, regroupement par lot et actions de masse.
          </p>
        </div>
        <Link
          href="/dashboard/devis/bibliotheque/nouveau"
          className="inline-flex items-center justify-center rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]"
        >
          Ajouter un ouvrage
        </Link>
      </div>

      <BibliothequeStatsStrip stats={stats} />

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-8"
      >
        <input type="hidden" name="view" value={view} />
        {groupLots ? <input type="hidden" name="groupLots" value="1" /> : null}
        {sp.imported ? <input type="hidden" name="imported" value={sp.imported} /> : null}
        {sp.pricesImported ? <input type="hidden" name="pricesImported" value={sp.pricesImported} /> : null}
        {sp.pricePaste ? <input type="hidden" name="pricePaste" value={sp.pricePaste} /> : null}
        {sp.pricePasteAdded != null ? <input type="hidden" name="pricePasteAdded" value={sp.pricePasteAdded} /> : null}
        {sp.pricePasteIgnored != null ? <input type="hidden" name="pricePasteIgnored" value={sp.pricePasteIgnored} /> : null}

        <div className="lg:col-span-2 xl:col-span-2">
          <label htmlFor="devis-q" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recherche
          </label>
          <input
            id="devis-q"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Code, lot, famille, désignation, vigilance…"
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
          <label htmlFor="devis-itemtype" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Type
          </label>
          <select
            id="devis-itemtype"
            name="itemType"
            defaultValue={sp.itemType ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {itemTypeKeys.map((k) => (
              <option key={k} value={k}>
                {WORK_ITEM_ITEM_TYPE_LABELS[k]}
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
          <label htmlFor="devis-pricemin" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Prix moy. HT min.
          </label>
          <input
            id="devis-pricemin"
            name="priceMin"
            defaultValue={sp.priceMin ?? ""}
            placeholder="ex. 50"
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="devis-pricemax" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Prix moy. HT max.
          </label>
          <input
            id="devis-pricemax"
            name="priceMax"
            defaultValue={sp.priceMax ?? ""}
            placeholder="ex. 500"
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Portée type</span>
          <div className="mt-2 flex flex-col gap-2 text-sm text-slate-700">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" name="onlyTechnical" value="1" defaultChecked={sp.onlyTechnical === "1"} />
              Afficher uniquement les ouvrages techniques
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" name="onlyAnnexes" value="1" defaultChecked={sp.onlyAnnexes === "1"} />
              Afficher uniquement les prestations annexes
            </label>
            <p className="text-[11px] text-slate-500">
              Si les deux cases sont cochées, le filtre « ouvrages techniques » est appliqué en priorité.
            </p>
          </div>
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
            <option value="itemType_asc">Type</option>
            <option value="title_asc">Titre</option>
            <option value="status_asc">Statut</option>
            <option value="priceCount_desc">Nombre de prix observés</option>
            <option value="avgHt_desc">Prix moyen HT (décroissant)</option>
            <option value="avgHt_asc">Prix moyen HT (croissant)</option>
          </select>
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-6 xl:col-span-8">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Appliquer les filtres
          </button>
          <Link
            href="/dashboard/devis/bibliotheque"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Réinitialiser les filtres
          </Link>
        </div>
      </form>

      <BibliothequeWorkItemsShell rows={rows} stats={stats} view={view} groupLots={groupLots} />
    </div>
  );
}
