import Link from "next/link";
import type { PriceEntry, PriceSource, WorkItem } from "@prisma/client";
import {
  QUALITY_LEVEL_LABELS,
  SOURCE_TYPE_LABELS,
  WORK_ITEM_STATUS_LABELS,
} from "@/lib/be-work-devis-labels";
import { formatDateFr, formatEurFr } from "@/lib/be-work-devis-format";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";

type Sp = Promise<{ q?: string }>;

export default async function RechercheDevisPage({ searchParams }: { searchParams: Sp }) {
  await requireBeWorkDevisSession();
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? "";

  let workItems: WorkItem[] = [];
  let priceRows: (PriceEntry & { workItem: WorkItem })[] = [];
  let sources: PriceSource[] = [];

  if (q.length >= 2) {
    const workWhere = {
      OR: [
        { code: { contains: q, mode: "insensitive" as const } },
        { lot: { contains: q, mode: "insensitive" as const } },
        { title: { contains: q, mode: "insensitive" as const } },
        { shortDescription: { contains: q, mode: "insensitive" as const } },
        { fullDescription: { contains: q, mode: "insensitive" as const } },
        { technicalReference: { contains: q, mode: "insensitive" as const } },
      ],
    };

    const [wi, pr, so] = await Promise.all([
      prisma.workItem.findMany({
        where: workWhere,
        orderBy: { updatedAt: "desc" },
        take: 40,
      }),
      prisma.priceEntry.findMany({
        where: {
          OR: [
            { sourceName: { contains: q, mode: "insensitive" as const } },
            { notes: { contains: q, mode: "insensitive" as const } },
            {
              workItem: {
                OR: [
                  { code: { contains: q, mode: "insensitive" as const } },
                  { title: { contains: q, mode: "insensitive" as const } },
                ],
              },
            },
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
    workItems = wi;
    priceRows = pr;
    sources = so;
  }

  return (
    <div className="space-y-8">
      <header className="px-1">
        <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">Recherche globale</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Croise ouvrages, désignations, références techniques, prix saisis et sources documentaires (minimum 2 caractères).
        </p>
      </header>

      <form method="get" className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="devis-search-q" className="text-xs font-semibold uppercase text-slate-500">
            Terme
          </label>
          <input
            id="devis-search-q"
            name="q"
            defaultValue={q}
            placeholder="Ex. carrelage, BW-GO, département 69…"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#152a45]">
          Rechercher
        </button>
      </form>

      {q.length > 0 && q.length < 2 ? (
        <p className="text-sm text-amber-800">Saisissez au moins 2 caractères pour lancer la recherche.</p>
      ) : null}

      {q.length >= 2 ? (
        <>
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-slate-900">Ouvrages ({workItems.length})</h2>
            {workItems.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun ouvrage correspondant.</p>
            ) : (
              <ul className="grid gap-2">
                {workItems.map((w) => (
                  <li key={w.id}>
                    <Link
                      href={`/dashboard/devis/bibliotheque/${w.id}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-[#1e3a5f]/30"
                    >
                      <span className="font-mono text-xs font-bold text-[#1e3a5f]">{w.code}</span>
                      <span className="flex-1 text-sm font-semibold text-slate-900">{w.title}</span>
                      <span className="text-xs text-slate-500">
                        {WORK_ITEM_STATUS_LABELS[w.status]} · {QUALITY_LEVEL_LABELS[w.qualityLevel]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

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
                  <li
                    key={s.id}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
                  >
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
      ) : (
        <p className="text-sm text-slate-500">Utilisez le champ ci-dessus pour explorer la bibliothèque.</p>
      )}
    </div>
  );
}
