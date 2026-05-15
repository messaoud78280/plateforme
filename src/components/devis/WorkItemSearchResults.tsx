import Link from "next/link";
import { DeleteWorkItemButton } from "@/components/devis/DeleteWorkItemButton";
import type { WorkItemWithPriceStats } from "@/lib/be-work-devis-search";
import { excerptDesignation } from "@/lib/be-work-devis-search";
import {
  QUALITY_LEVEL_LABELS,
  WORK_ITEM_STATUS_LABELS,
} from "@/lib/be-work-devis-labels";
import { formatDateFr, formatEurFr } from "@/lib/be-work-devis-format";

type Props = {
  items: WorkItemWithPriceStats[];
  /** Liens fiche ouvrage */
  ficheHref: (id: string) => string;
  /** Afficher colonnes Modifier / Supprimer (bibliothèque) */
  showAdminActions?: boolean;
};

export function WorkItemSearchResults({ items, ficheHref, showAdminActions }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <p className="text-slate-600">
          Aucun ouvrage trouvé. Vous pouvez créer un nouvel ouvrage ou élargir votre recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="devis-results-cards-heading">
        <h2 id="devis-results-cards-heading" className="sr-only">
          Résultats en cartes
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((row) => (
            <li
              key={row.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#1e3a5f]/25"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#1e3a5f]">{row.code}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                  {WORK_ITEM_STATUS_LABELS[row.status]}
                </span>
              </div>
              <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">{row.title}</h3>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">
                {excerptDesignation(row) || "—"}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-500">Lot</dt>
                  <dd className="truncate" title={row.lot}>
                    {row.lot}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Unité</dt>
                  <dd>{row.unit}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Gamme</dt>
                  <dd>{QUALITY_LEVEL_LABELS[row.qualityLevel]}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Prix moy. HT</dt>
                  <dd className="font-mono">
                    {row.avgHt != null ? formatEurFr(row.avgHt) : "—"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="font-semibold text-slate-500">Prix observés</dt>
                  <dd>{row.priceCount}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Link
                  href={ficheHref(row.id)}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#1e3a5f] px-3 py-2 text-center text-xs font-semibold text-white hover:bg-[#152a45]"
                >
                  Voir fiche
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="devis-results-table-heading" className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 id="devis-results-table-heading" className="sr-only">
          Résultats en tableau
        </h2>
        <table className="min-w-[960px] w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Lot</th>
              <th className="px-4 py-3">Unité</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 max-w-[220px]">Désignation</th>
              <th className="px-4 py-3 text-right">Prix moy. HT</th>
              <th className="px-4 py-3 text-right">Nb prix</th>
              <th className="px-4 py-3">Mise à jour</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-[#1e3a5f]">{row.code}</td>
                <td className="max-w-[200px] truncate px-4 py-3 font-medium text-slate-900" title={row.title}>
                  {row.title}
                </td>
                <td className="max-w-[120px] truncate px-4 py-3 text-slate-700" title={row.lot}>
                  {row.lot}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{row.unit}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                    {WORK_ITEM_STATUS_LABELS[row.status]}
                  </span>
                </td>
                <td className="max-w-[220px] px-4 py-3 text-xs text-slate-600">
                  <span className="line-clamp-2" title={excerptDesignation(row, 400)}>
                    {excerptDesignation(row) || "—"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs">
                  {row.avgHt != null ? formatEurFr(row.avgHt) : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{row.priceCount}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateFr(row.updatedAt)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link
                    href={ficheHref(row.id)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-[#1e3a5f] hover:bg-slate-50"
                  >
                    Voir fiche
                  </Link>
                  {showAdminActions ? (
                    <span className="ml-2 inline-flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/dashboard/devis/bibliotheque/${row.id}/modifier`}
                        className="rounded-lg border border-[#1e3a5f]/30 bg-[#f0f4fa] px-2 py-1 text-xs font-semibold text-[#1e3a5f] hover:bg-[#e2eaf6]"
                      >
                        Modifier
                      </Link>
                      <DeleteWorkItemButton id={row.id} code={row.code} />
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
