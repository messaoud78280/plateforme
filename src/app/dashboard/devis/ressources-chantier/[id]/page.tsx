import Link from "next/link";
import { notFound } from "next/navigation";
import { AddAliasForm } from "@/components/devis/AddAliasForm";
import { DedupeAliasesButton } from "@/components/devis/DedupeAliasesButton";
import { countRedundantAliases } from "@/lib/chantier-resources/alias-dedup";
import { getFamilyLabel, getSubFamilyLabel } from "@/lib/chantier-resources/taxonomy";
import {
  SITE_RESOURCE_ALIAS_KIND_LABELS,
  SITE_RESOURCE_CONFIDENCE_LABELS,
  SITE_RESOURCE_EXTRACTED_FROM_LABELS,
  SITE_RESOURCE_LINK_ROLE_LABELS,
  SITE_RESOURCE_STATUS_LABELS,
  SITE_RESOURCE_TYPE_LABELS,
} from "@/lib/chantier-resources/labels";
import { fetchChantierResourceDetail } from "@/app/dashboard/devis/ressources-chantier-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

type Props = { params: Promise<{ id: string }> };

export default async function ChantierResourceDetailPage({ params }: Props) {
  await requireBeWorkDevisSession();
  const { id } = await params;
  const resource = await fetchChantierResourceDetail(id);
  if (!resource) notFound();

  const priceAmounts = resource.priceObservations.map((p) => Number(p.amountHT)).filter((n) => n > 0);
  const priceMin = priceAmounts.length ? Math.min(...priceAmounts) : null;
  const priceMax = priceAmounts.length ? Math.max(...priceAmounts) : null;
  const priceAvg = priceAmounts.length ? priceAmounts.reduce((a, b) => a + b, 0) / priceAmounts.length : null;
  const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
  const redundantAliasCount = countRedundantAliases(resource.aliases);
  const uniqueAliasCount = resource.aliases.length - redundantAliasCount;

  return (
    <div className="space-y-8">
      <Link href="/dashboard/devis/ressources-chantier" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
        ← Ressources chantier
      </Link>

      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#1e3a5f]/10 px-2.5 py-0.5 text-[#1e3a5f]">
            {SITE_RESOURCE_TYPE_LABELS[resource.resourceType]}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
            {getFamilyLabel(resource.resourceType, resource.family)}
          </span>
          {resource.subFamily ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
              {getSubFamilyLabel(resource.resourceType, resource.family, resource.subFamily)}
            </span>
          ) : null}
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-900">
            {SITE_RESOURCE_STATUS_LABELS[resource.status]}
          </span>
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold text-slate-900">{resource.shortName}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{resource.fullDescription}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase text-slate-500">Unité de commande</dt>
            <dd className="mt-0.5 font-medium">{resource.orderUnit}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase text-slate-500">Confiance</dt>
            <dd className="mt-0.5 font-medium">{SITE_RESOURCE_CONFIDENCE_LABELS[resource.confidenceLevel]}</dd>
          </div>
          {resource.siteUsage ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase text-slate-500">Usage chantier</dt>
              <dd className="mt-0.5 whitespace-pre-wrap">{resource.siteUsage}</dd>
            </div>
          ) : null}
          {resource.characteristicsToVerify ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase text-amber-800">À vérifier</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-amber-950">{resource.characteristicsToVerify}</dd>
            </div>
          ) : null}
        </dl>
        {resource.mergedInto ? (
          <p className="mt-4 text-sm text-slate-600">
            Fusionné vers :{" "}
            <Link href={`/dashboard/devis/ressources-chantier/${resource.mergedInto.id}`} className="font-semibold text-[#1d4ed8]">
              {resource.mergedInto.shortName}
            </Link>
          </p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">
          Alias / synonymes ({uniqueAliasCount}
          {redundantAliasCount > 0 ? (
            <span className="font-normal text-amber-800"> · {redundantAliasCount} doublon(s)</span>
          ) : null}
          )
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Un seul alias par libellé normalisé. Les doublons peuvent être retirés sans perdre la désignation.
        </p>
        <DedupeAliasesButton siteResourceId={resource.id} redundantCount={redundantAliasCount} />
        <ul className="mt-4 space-y-2">
          {resource.aliases.map((a) => (
            <li key={a.id} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm">
              <span className="font-medium text-slate-900">{a.label}</span>
              <span className="ml-2 text-xs text-slate-500">{SITE_RESOURCE_ALIAS_KIND_LABELS[a.aliasKind]}</span>
              {a.sourceSnippet ? <p className="mt-1 text-xs text-slate-500">{a.sourceSnippet}</p> : null}
            </li>
          ))}
        </ul>
        <AddAliasForm siteResourceId={resource.id} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">
          Prix observés ({resource.priceObservations.length})
        </h2>
        {resource.priceObservations.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucun prix enregistré pour cette fiche.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              {priceMin != null && priceMax != null ? (
                <>
                  Min {eur.format(priceMin)} · Max {eur.format(priceMax)}
                  {priceAvg != null ? ` · Moyenne ${eur.format(priceAvg)}` : null}
                </>
              ) : null}
            </p>
            <ul className="mt-4 divide-y divide-slate-100">
              {resource.priceObservations.map((p) => (
                <li key={p.id} className="py-3 text-sm">
                  <span className="font-semibold text-slate-900">{eur.format(Number(p.amountHT))}</span>
                  <span className="text-slate-600"> / {p.orderUnit}</span>
                  {p.sourceName ? <span className="ml-2 text-slate-500">— {p.sourceName}</span> : null}
                  {p.notes ? <p className="mt-1 text-xs text-slate-500">{p.notes}</p> : null}
                  <p className="mt-0.5 text-xs text-slate-400">
                    Importé le {new Date(p.importedAt).toLocaleDateString("fr-FR")}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {resource.mergedFrom.length > 0 ? (
        <section className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6">
          <h2 className="font-heading text-lg font-bold text-slate-900">Occurrences dédupliquées</h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {resource.mergedFrom.map((m) => (
              <li key={m.id}>
                {m.shortName}
                <span className="text-xs text-slate-400">
                  {" "}
                  — fusionné le {new Date(m.updatedAt).toLocaleDateString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {resource.variants.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-slate-900">Variantes techniques ({resource.variants.length})</h2>
          <ul className="mt-4 space-y-3">
            {resource.variants.map((v) => (
              <li key={v.id} className="rounded-lg border border-violet-100 bg-violet-50/40 p-3 text-sm">
                <p className="font-semibold text-slate-900">{v.shortName}</p>
                <p className="mt-1 text-slate-700">{v.fullDescription}</p>
                <p className="mt-1 text-xs text-slate-500">{SITE_RESOURCE_STATUS_LABELS[v.status]}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">Ouvrages liés ({resource.workItemLinks.length})</h2>
        {resource.workItemLinks.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucun ouvrage associé pour l&apos;instant.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {resource.workItemLinks.map((l) => (
              <li key={l.id} className="py-3 text-sm">
                <Link
                  href={`/dashboard/devis/bibliotheque/${l.workItem.id}`}
                  className="font-semibold text-[#1d4ed8] hover:underline"
                >
                  {l.workItem.code}
                </Link>
                <span className="text-slate-600"> — {l.workItem.title}</span>
                <p className="mt-1 text-xs text-slate-500">
                  {SITE_RESOURCE_LINK_ROLE_LABELS[l.linkRole]} · {SITE_RESOURCE_EXTRACTED_FROM_LABELS[l.extractedFrom]}
                  {l.sourceSnippet ? ` · « ${l.sourceSnippet.slice(0, 80)} »` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
