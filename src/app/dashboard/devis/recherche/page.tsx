import Link from "next/link";
import type { BeWorkPriceDocSourceType, WorkItemQualityLevel, WorkItemStatus } from "@prisma/client";
import type { PriceEntry, PriceSource, WorkItem } from "@prisma/client";
import { TradeSubLotFilterSelect } from "@/components/devis/TradeSubLotFilterSelect";
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
  keywordSearchWhereClause,
  parseWorkItemSortKey,
  type WorkItemFilterParams,
} from "@/lib/be-work-devis-search";
import { formatDateFr, formatEurFr } from "@/lib/be-work-devis-format";
import { buildWorkItemTradeWhere, groupDistinctLotsByTrade } from "@/lib/bework-devis-lot-trades";
import { getBeWorkFamilyLexiconSorted, isKnownFamilyCode } from "@/lib/bework-devis-family-codes";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";

type Sp = Promise<{
  q?: string;
  lot?: string;
  trade?: string;
  subLot?: string;
  unit?: string;
  status?: string;
  gamme?: string;
  techRef?: string;
  priceDept?: string;
  priceSourceType?: string;
  sort?: string;
}>;

function toFilterParams(sp: Awaited<Sp>): WorkItemFilterParams {
  const trade = sp.trade?.trim().toUpperCase();
  return {
    q: sp.q,
    trade: trade && isKnownFamilyCode(trade) ? trade : undefined,
    lot: sp.lot?.trim() || undefined,
    subLot: sp.subLot,
    unit: sp.unit,
    status: sp.status,
    gamme: sp.gamme,
    techRef: sp.techRef,
    priceDept: sp.priceDept,
    priceSourceType: sp.priceSourceType,
  };
}

function filterQueryString(sp: Awaited<Sp>): string {
  const qs = new URLSearchParams();
  const p = toFilterParams(sp);
  if (p.q) qs.set("q", p.q);
  if (p.trade) qs.set("trade", p.trade);
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

function hasActiveWorkItemFilters(sp: WorkItemFilterParams): boolean {
  return Boolean(
    sp.trade?.trim() ||
      sp.lot?.trim() ||
      sp.subLot?.trim() ||
      sp.unit?.trim() ||
      (sp.status?.trim() && sp.status.trim().length > 0) ||
      (sp.gamme?.trim() && sp.gamme.trim().length > 0) ||
      sp.techRef?.trim() ||
      sp.priceDept?.trim() ||
      sp.priceSourceType?.trim(),
  );
}

export default async function RechercheDevisPage({ searchParams }: { searchParams: Sp }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const fp = toFilterParams(sp);
  const q = fp.q?.trim() ?? "";
  const sort = parseWorkItemSortKey(sp.sort);

  const fetchExtendedGlobal = q.length >= 2;
  const tradeFilter = sp.trade?.trim().toUpperCase();
  const tradeWhere =
    tradeFilter && isKnownFamilyCode(tradeFilter) ? buildWorkItemTradeWhere(tradeFilter) : undefined;

  let priceRows: (PriceEntry & { workItem: WorkItem })[] = [];
  let sources: PriceSource[] = [];

  const [workItemsWithStats, lotsRow, subLotsRow, deptRows] = await Promise.all([
    q.length >= 1 || hasActiveWorkItemFilters(fp)
      ? fetchWorkItemsWithPriceStats(buildWorkItemWhere(fp), sort)
      : Promise.resolve([]),
    prisma.workItem.findMany({
      select: { lot: true },
      distinct: ["lot"],
      orderBy: { lot: "asc" },
    }),
    prisma.workItem.findMany({
      where: {
        subLot: { not: null },
        ...(tradeWhere ? tradeWhere : {}),
      },
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

  if (fetchExtendedGlobal) {
    const workItemKeywordWhere = keywordSearchWhereClause(q);
    const [pr, so] = await Promise.all([
      prisma.priceEntry.findMany({
        where: {
          OR: [
            { sourceName: { contains: q, mode: "insensitive" as const } },
            { notes: { contains: q, mode: "insensitive" as const } },
            { workItem: workItemKeywordWhere },
          ],
        },
        include: { workItem: true },
        orderBy: { updatedAt: "desc" },
        take: 40,
      }),
      prisma.priceSource.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { clientName: { contains: q, mode: "insensitive" as const } },
            { projectName: { contains: q, mode: "insensitive" as const } },
            { notes: { contains: q, mode: "insensitive" as const } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
    ]);
    priceRows = pr;
    sources = so;
  }

  const lots = lotsRow.map((r) => r.lot);
  const lotsGroupedByTrade = groupDistinctLotsByTrade(lots);
  const lexiconGrouped = getBeWorkFamilyLexiconSorted().map((f) => ({
    tradeCode: f.code,
    tradeLabel: f.label,
    order: f.order,
    lots: lotsGroupedByTrade.find((g) => g.tradeCode === f.code)?.lots ?? [f.label],
  }));
  const subLots = subLotsRow.map((r) => r.subLot).filter((s): s is string => s != null && s !== "");
  const departments = deptRows.map((r) => r.department).filter((d): d is string => d != null && d !== "");
  const qsStr = filterQueryString(sp);
  const sourceTypeKeys = Object.keys(SOURCE_TYPE_LABELS) as BeWorkPriceDocSourceType[];

  const showWorkSection = q.length >= 1 || hasActiveWorkItemFilters(fp);
  const showHintShortQuery = q.length === 1 && !hasActiveWorkItemFilters(fp);

  return (
    <div className="space-y-8">
      <header className="px-1">
        <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">Recherche globale</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Croise ouvrages, désignations, références techniques, prix saisis et sources documentaires. Filtres avancés et tri
          identiques à la bibliothèque ; les sections prix et sources détaillées nécessitent au moins 2 caractères dans le
          champ principal.
        </p>
      </header>

      <form
        method="get"
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="devis-search-q" className="text-xs font-semibold uppercase text-slate-500">
              Terme principal
            </label>
            <input
              id="devis-search-q"
              name="q"
              defaultValue={q}
              placeholder="Ex. carrelage, BW-GO, vigilance, inclus…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#152a45]">
            Rechercher
          </button>
        </div>

        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-8">
          <div className="sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Corps de métier / sous-lot</span>
            <TradeSubLotFilterSelect
              tradeId="rs-trade"
              subLotId="rs-sublot"
              grouped={lexiconGrouped}
              tradeValue={tradeFilter && isKnownFamilyCode(tradeFilter) ? tradeFilter : ""}
              subLotValue={sp.subLot ?? ""}
              subLotsForTrade={subLots}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="rs-unit" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Unité
            </label>
            <select id="rs-unit" name="unit" defaultValue={sp.unit ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Toutes</option>
              {WORK_ITEM_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rs-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Statut
            </label>
            <select id="rs-status" name="status" defaultValue={sp.status ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Tous</option>
              {(Object.keys(WORK_ITEM_STATUS_LABELS) as WorkItemStatus[]).map((s) => (
                <option key={s} value={s}>
                  {WORK_ITEM_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rs-gamme" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Gamme
            </label>
            <select id="rs-gamme" name="gamme" defaultValue={sp.gamme ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Toutes</option>
              {(Object.keys(QUALITY_LEVEL_LABELS) as WorkItemQualityLevel[]).map((g) => (
                <option key={g} value={g}>
                  {QUALITY_LEVEL_LABELS[g]}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="rs-techref" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Réf. technique
            </label>
            <input
              id="rs-techref"
              name="techRef"
              defaultValue={sp.techRef ?? ""}
              placeholder="Contient…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="rs-pricedept" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Dépt. (prix)
            </label>
            <select id="rs-pricedept" name="priceDept" defaultValue={sp.priceDept ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Tous</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rs-pricesource" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Source type (prix)
            </label>
            <select
              id="rs-pricesource"
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
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="rs-sort" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tri
            </label>
            <select id="rs-sort" name="sort" defaultValue={sort} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
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
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Appliquer filtres
            </button>
            {qsStr ? (
              <Link href="/dashboard/devis/recherche" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
                Réinitialiser
              </Link>
            ) : null}
          </div>
        </div>
      </form>

      {showHintShortQuery ? (
        <p className="text-sm text-slate-600">
          Ajoutez un caractère ou utilisez les filtres ci-dessus pour afficher les ouvrages ; saisissez au moins 2 caractères
          pour explorer aussi les prix et sources.
        </p>
      ) : null}

      {!showWorkSection && !fetchExtendedGlobal ? (
        <p className="text-sm text-slate-500">Utilisez le champ ci-dessus ou les filtres pour explorer la bibliothèque.</p>
      ) : null}

      {showWorkSection ? (
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">Ouvrages ({workItemsWithStats.length})</h2>
          <WorkItemSearchResults items={workItemsWithStats} ficheHref={(id) => `/dashboard/devis/bibliotheque/${id}`} />
        </section>
      ) : null}

      {fetchExtendedGlobal ? (
        <>
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-slate-900">Prix observés ({priceRows.length})</h2>
            {priceRows.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun prix correspondant.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-[720px] w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Ouvrage</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">HT</th>
                      <th className="px-3 py-2">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {priceRows.map((pe) => (
                      <tr key={pe.id}>
                        <td className="px-3 py-2">
                          <Link href={`/dashboard/devis/bibliotheque/${pe.workItem.id}`} className="font-semibold text-[#1e3a5f] hover:underline">
                            {pe.workItem.code}
                          </Link>
                          <div className="text-xs text-slate-600">{pe.workItem.title}</div>
                        </td>
                        <td className="max-w-[200px] truncate px-3 py-2" title={pe.sourceName}>
                          {pe.sourceName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{formatEurFr(Number(pe.unitPriceHT))}</td>
                        <td className="px-3 py-2">{SOURCE_TYPE_LABELS[pe.sourceType]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-slate-900">Sources ({sources.length})</h2>
            {sources.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune source correspondante.</p>
            ) : (
              <ul className="grid gap-2">
                {sources.map((s) => (
                  <li key={s.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {SOURCE_TYPE_LABELS[s.sourceType]}
                      {s.clientName ? ` · ${s.clientName}` : ""}
                      {s.projectName ? ` · ${s.projectName}` : ""}
                      {s.dateDocument ? ` · doc. ${formatDateFr(s.dateDocument)}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
