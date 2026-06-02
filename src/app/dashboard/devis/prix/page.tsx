import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  SOURCE_TYPE_LABELS,
  isBeWorkPriceDocSourceType,
  isWorkItemQualityLevel,
} from "@/lib/be-work-devis-labels";
import { formatDateFr, formatEurFr } from "@/lib/be-work-devis-format";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";
import { resolveActiveWorkItemCatalogId } from "@/lib/work-item-catalog";

type Sp = Promise<{
  stype?: string;
  lot?: string;
  dept?: string;
  gamme?: string;
  fiab?: string;
  q?: string;
}>;

function buildWhere(
  catalogId: string,
  sp: {
    stype?: string;
    lot?: string;
    dept?: string;
    gamme?: string;
    fiab?: string;
    q?: string;
  },
): Prisma.PriceEntryWhereInput {
  const AND: Prisma.PriceEntryWhereInput[] = [{ workItem: { catalogId } }];

  const st = sp.stype?.trim();
  if (st && isBeWorkPriceDocSourceType(st)) AND.push({ sourceType: st });

  const dept = sp.dept?.trim();
  if (dept) AND.push({ department: dept });

  const fiab = sp.fiab?.trim();
  if (fiab) {
    const n = Number(fiab);
    if (n >= 1 && n <= 5) AND.push({ reliabilityScore: n });
  }

  const lot = sp.lot?.trim();
  if (lot) AND.push({ workItem: { lot } });

  const gamme = sp.gamme?.trim();
  if (gamme && isWorkItemQualityLevel(gamme)) AND.push({ workItem: { qualityLevel: gamme } });

  const q = sp.q?.trim();
  if (q) {
    AND.push({
      OR: [
        { sourceName: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        {
          workItem: {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { title: { contains: q, mode: "insensitive" } },
              { shortDescription: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      ],
    });
  }

  return AND.length ? { AND } : {};
}

export default async function PrixObservesPage({ searchParams }: { searchParams: Sp }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const catalogId = await resolveActiveWorkItemCatalogId();
  const where = buildWhere(catalogId, sp);

  const [rows, lotsRow] = await Promise.all([
    prisma.priceEntry.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      include: { workItem: true },
      take: 500,
    }),
    prisma.workItem.findMany({
      where: { catalogId },
      select: { lot: true },
      distinct: ["lot"],
      orderBy: { lot: "asc" },
    }),
  ]);

  const qs = new URLSearchParams();
  if (sp.q) qs.set("q", sp.q);
  if (sp.stype) qs.set("stype", sp.stype);
  if (sp.lot) qs.set("lot", sp.lot);
  if (sp.dept) qs.set("dept", sp.dept);
  if (sp.gamme) qs.set("gamme", sp.gamme);
  if (sp.fiab) qs.set("fiab", sp.fiab);

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">Prix observés</h1>
        <p className="mt-1 text-sm text-slate-600">
          Synthèse des prix unitaires saisis — provenance, fiabilité et contexte géographique.
        </p>
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-6"
      >
        <div className="lg:col-span-2">
          <label className="text-xs font-semibold uppercase text-slate-500">Recherche ouvrage</label>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Code, titre ou libellé source…"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Type source</label>
          <select name="stype" defaultValue={sp.stype ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Tous</option>
            {Object.entries(SOURCE_TYPE_LABELS).map(([k, lab]) => (
              <option key={k} value={k}>
                {lab}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Lot</label>
          <select name="lot" defaultValue={sp.lot ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Tous</option>
            {lotsRow.map((r) => (
              <option key={r.lot} value={r.lot}>
                {r.lot}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Département</label>
          <input
            name="dept"
            defaultValue={sp.dept ?? ""}
            placeholder="ex. 75"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Gamme ouvrage</label>
          <select name="gamme" defaultValue={sp.gamme ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Toutes</option>
            <option value="standard">Standard</option>
            <option value="confort">Confort</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Fiabilité</label>
          <select name="fiab" defaultValue={sp.fiab ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Toutes</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2 lg:col-span-6">
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Filtrer
          </button>
          {qs.toString() ? (
            <Link href="/dashboard/devis/prix" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
              Réinitialiser
            </Link>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1200px] w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Ouvrage</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Type source</th>
              <th className="px-4 py-3">Qté</th>
              <th className="px-4 py-3">Prix HT</th>
              <th className="px-4 py-3">Total HT</th>
              <th className="px-4 py-3">TVA</th>
              <th className="px-4 py-3">Prix TTC</th>
              <th className="px-4 py-3">Total TTC</th>
              <th className="px-4 py-3">Unité</th>
              <th className="px-4 py-3">Département</th>
              <th className="px-4 py-3">Fiabilité</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-12 text-center text-slate-500">
                  Aucun prix pour ces filtres.
                </td>
              </tr>
            ) : (
              rows.map((pe) => (
                <tr key={pe.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/devis/bibliotheque/${pe.workItem.id}`}
                      className="font-semibold text-[#1e3a5f] hover:underline"
                    >
                      {pe.workItem.code}
                    </Link>
                    <div className="max-w-[220px] truncate text-xs text-slate-600" title={pe.workItem.title}>
                      {pe.workItem.title}
                    </div>
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3" title={pe.sourceName}>
                    {pe.sourceName}
                  </td>
                  <td className="px-4 py-3">{SOURCE_TYPE_LABELS[pe.sourceType]}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    {pe.quantity != null ? String(pe.quantity) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{formatEurFr(Number(pe.unitPriceHT))}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    {pe.totalHT != null ? formatEurFr(Number(pe.totalHT)) : "—"}
                  </td>
                  <td className="px-4 py-3">{Number(pe.vatRate)} %</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{formatEurFr(Number(pe.unitPriceTTC))}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    {pe.totalTTC != null ? formatEurFr(Number(pe.totalTTC)) : "—"}
                  </td>
                  <td className="px-4 py-3">{pe.workItem.unit}</td>
                  <td className="px-4 py-3">{pe.department ?? "—"}</td>
                  <td className="px-4 py-3">{pe.reliabilityScore}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDateFr(pe.dateObserved ?? pe.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/devis/bibliotheque/${pe.workItem.id}`}
                      className="text-xs font-semibold text-[#1d4ed8] hover:underline"
                    >
                      Fiche ouvrage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
