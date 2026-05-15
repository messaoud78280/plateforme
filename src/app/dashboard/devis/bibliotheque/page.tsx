import Link from "next/link";
import type { Prisma, WorkItemQualityLevel, WorkItemStatus } from "@prisma/client";
import { DeleteWorkItemButton } from "@/components/devis/DeleteWorkItemButton";
import {
  QUALITY_LEVEL_LABELS,
  WORK_ITEM_STATUS_LABELS,
  WORK_ITEM_UNITS,
  isWorkItemQualityLevel,
  isWorkItemStatus,
} from "@/lib/be-work-devis-labels";
import { formatDateFr } from "@/lib/be-work-devis-format";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  q?: string;
  lot?: string;
  unit?: string;
  status?: string;
  gamme?: string;
}>;

function buildWhere(sp: {
  q?: string;
  lot?: string;
  unit?: string;
  status?: string;
  gamme?: string;
}): Prisma.WorkItemWhereInput {
  const AND: Prisma.WorkItemWhereInput[] = [];

  const q = sp.q?.trim();
  if (q) {
    AND.push({
      OR: [
        { code: { contains: q, mode: "insensitive" } },
        { lot: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { fullDescription: { contains: q, mode: "insensitive" } },
        { technicalReference: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const lot = sp.lot?.trim();
  if (lot) AND.push({ lot });

  const unit = sp.unit?.trim();
  if (unit) AND.push({ unit });

  const status = sp.status?.trim();
  if (status && isWorkItemStatus(status)) AND.push({ status });

  const gamme = sp.gamme?.trim();
  if (gamme && isWorkItemQualityLevel(gamme)) AND.push({ qualityLevel: gamme });

  return AND.length ? { AND } : {};
}

export default async function BibliothequePage({ searchParams }: { searchParams: SearchParams }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const where = buildWhere(sp);

  const [items, lotsRow] = await Promise.all([
    prisma.workItem.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
    }),
    prisma.workItem.findMany({
      select: { lot: true },
      distinct: ["lot"],
      orderBy: { lot: "asc" },
    }),
  ]);

  const lots = lotsRow.map((r) => r.lot);

  const qs = new URLSearchParams();
  if (sp.q) qs.set("q", sp.q);
  if (sp.lot) qs.set("lot", sp.lot);
  if (sp.unit) qs.set("unit", sp.unit);
  if (sp.status) qs.set("status", sp.status);
  if (sp.gamme) qs.set("gamme", sp.gamme);
  const qsStr = qs.toString();

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
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="lg:col-span-2">
          <label htmlFor="devis-q" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recherche
          </label>
          <input
            id="devis-q"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Code, lot, titre, désignation…"
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
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
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

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[920px] w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Lot</th>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Unité</th>
              <th className="px-4 py-3">Gamme</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Dernière mise à jour</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  Aucun ouvrage pour ces critères.{" "}
                  <Link href="/dashboard/devis/bibliotheque/nouveau" className="font-semibold text-[#1d4ed8] hover:underline">
                    Ajouter un ouvrage
                  </Link>
                  {" ou "}
                  <Link href="/dashboard/devis/recherche" className="font-semibold text-[#1d4ed8] hover:underline">
                    élargir la recherche
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-[#1e3a5f]">{row.code}</td>
                  <td className="max-w-[140px] truncate px-4 py-3 text-slate-700" title={row.lot}>
                    {row.lot}
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-3 font-medium text-slate-900" title={row.title}>
                    {row.title}
                  </td>
                  <td className="px-4 py-3">{row.unit}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
                      {QUALITY_LEVEL_LABELS[row.qualityLevel]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                      {WORK_ITEM_STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateFr(row.updatedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/dashboard/devis/bibliotheque/${row.id}`}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        Voir
                      </Link>
                      <Link
                        href={`/dashboard/devis/bibliotheque/${row.id}/modifier`}
                        className="rounded-lg border border-[#1e3a5f]/30 bg-[#f0f4fa] px-2 py-1 text-xs font-semibold text-[#1e3a5f] hover:bg-[#e2eaf6]"
                      >
                        Modifier
                      </Link>
                      <DeleteWorkItemButton id={row.id} code={row.code} />
                    </div>
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
