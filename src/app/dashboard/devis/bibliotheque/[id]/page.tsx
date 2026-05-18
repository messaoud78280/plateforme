import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePriceEntry } from "@/app/dashboard/devis/actions";
import { ObservedPricesTable } from "@/components/devis/ObservedPricesTable";
import { WorkItemMergedVariantsSection } from "@/components/devis/WorkItemMergedVariantsSection";
import { fetchWorkItemWithMergedVariants } from "@/app/dashboard/devis/work-item-merge-actions";
import { PriceEntryCreateForm } from "@/components/devis/PriceEntryCreateForm";
import type { ObservedPriceRowSerialized } from "@/lib/be-work-devis-price-entry-detail";
import { parsePriceEntryImportMeta } from "@/lib/be-work-devis-price-entry-import-meta";
import {
  QUALITY_LEVEL_LABELS,
  WORK_ITEM_ITEM_TYPE_LABELS,
  WORK_ITEM_STATUS_LABELS,
} from "@/lib/be-work-devis-labels";
import { formatDateFr, formatEurFr } from "@/lib/be-work-devis-format";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { getBeWorkFamilyLabel } from "@/lib/bework-devis-family-codes";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

function Label({ children }: { children: ReactNode }) {
  return <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{children}</dt>;
}

function Value({ children }: { children: ReactNode }) {
  return <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{children}</dd>;
}

export default async function FicheOuvragePage({ params }: Props) {
  await requireBeWorkDevisSession();
  const { id } = await params;

  const itemWithVariants = await fetchWorkItemWithMergedVariants(id);
  if (!itemWithVariants) notFound();
  const item = itemWithVariants;
  const mergedVariants = itemWithVariants.mergedVariants ?? [];

  const [agg, countPrices, entries, sources, siteResourceLinks] = await Promise.all([
    prisma.priceEntry.aggregate({
      where: { workItemId: id },
      _min: { unitPriceHT: true },
      _max: { unitPriceHT: true },
      _avg: { unitPriceHT: true },
    }),
    prisma.priceEntry.count({ where: { workItemId: id } }),
    prisma.priceEntry.findMany({
      where: { workItemId: id },
      orderBy: [{ updatedAt: "desc" }],
      include: { priceSource: true },
    }),
    prisma.priceSource.findMany({ orderBy: { name: "asc" } }),
    prisma.workItemSiteResource.findMany({
      where: { workItemId: id },
      include: { siteResource: { select: { id: true, shortName: true, status: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const minHt = agg._min.unitPriceHT != null ? Number(agg._min.unitPriceHT) : null;
  const maxHt = agg._max.unitPriceHT != null ? Number(agg._max.unitPriceHT) : null;
  const avgHt = agg._avg.unitPriceHT != null ? Number(agg._avg.unitPriceHT) : null;

  const serializedEntries: ObservedPriceRowSerialized[] = entries.map((pe) => ({
    id: pe.id,
    sourceName: pe.sourceName,
    variantDesignation: pe.variantDesignation,
    importMeta: parsePriceEntryImportMeta(pe.importMeta),
    sourceType: pe.sourceType,
    unitPriceHT: Number(pe.unitPriceHT),
    unitPriceTTC: Number(pe.unitPriceTTC),
    vatRate: Number(pe.vatRate),
    quantity: pe.quantity != null ? Number(pe.quantity) : null,
    totalHT: pe.totalHT != null ? Number(pe.totalHT) : null,
    totalTTC: pe.totalTTC != null ? Number(pe.totalTTC) : null,
    department: pe.department,
    reliabilityScore: pe.reliabilityScore,
    notes: pe.notes,
    dateObserved: pe.dateObserved?.toISOString() ?? null,
    createdAt: pe.createdAt.toISOString(),
    priceSourceName: pe.priceSource?.name ?? null,
  }));

  const workItemContext = {
    id: item.id,
    code: item.code,
    title: item.title,
    lot: item.lot,
    subLot: item.subLot,
    family: item.family,
    unit: item.unit,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/devis/bibliotheque" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
            ← Bibliothèque
          </Link>
        </div>
        <Link
          href={`/dashboard/devis/bibliotheque/${id}/modifier`}
          className="inline-flex w-fit rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152a45]"
        >
          Modifier
        </Link>
      </div>

      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#1e3a5f]/10 px-2.5 py-0.5 font-mono text-xs font-bold text-[#1e3a5f]" title="Code BeWork">
            {item.code}
          </span>
          {item.familyCode ? (
            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-mono text-xs font-bold text-sky-900" title={getBeWorkFamilyLabel(item.familyCode) ?? ""}>
              {item.familyCode}
            </span>
          ) : null}
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
            {QUALITY_LEVEL_LABELS[item.qualityLevel]}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
            {WORK_ITEM_STATUS_LABELS[item.status]}
          </span>
          <span className="rounded-full bg-[#0f172a]/8 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
            {WORK_ITEM_ITEM_TYPE_LABELS[item.itemType]}
          </span>
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{item.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Lot : <span className="font-semibold text-slate-800">{item.lot}</span>
          {item.subLot ? (
            <>
              {" "}
              · Sous-lot : <span className="font-semibold">{item.subLot}</span>
            </>
          ) : null}
          {item.family ? (
            <>
              {" "}
              · Famille : <span className="font-semibold">{item.family}</span>
            </>
          ) : null}
          {" "}
          · Unité : <span className="font-semibold">{item.unit}</span>
        </p>
        {(item.sourceCode || item.sourceLine) && (
          <dl className="mt-4 grid gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm sm:grid-cols-2">
            {item.sourceCode ? (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Ancien code source</dt>
                <dd className="mt-0.5 font-mono text-slate-900">{item.sourceCode}</dd>
              </div>
            ) : null}
            {item.sourceLine ? (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Ligne source</dt>
                <dd className="mt-0.5 font-mono text-slate-900">{item.sourceLine}</dd>
              </div>
            ) : null}
          </dl>
        )}
      </header>

      <WorkItemMergedVariantsSection
        canonicalId={item.id}
        mergeStatus={item.mergeStatus}
        variants={mergedVariants.map((v) => ({
          id: v.id,
          code: v.code,
          title: v.title,
          lot: v.lot,
          unit: v.unit,
          mergedAt: v.mergedAt?.toISOString() ?? null,
          priceEntries: v.priceEntries.map((pe) => ({
            id: pe.id,
            sourceName: pe.sourceName,
            unitPriceHT: Number(pe.unitPriceHT),
            variantDesignation: pe.variantDesignation,
          })),
        }))}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="border-b border-slate-100 pb-2 font-heading text-lg font-bold text-slate-900">Descriptif</h2>
          <dl className="mt-4 space-y-4">
            {item.familyCode ? (
              <div>
                <Label>Code famille</Label>
                <Value>
                  <span className="font-mono font-semibold">{item.familyCode}</span>
                  {getBeWorkFamilyLabel(item.familyCode) ? (
                    <span className="ml-2 text-slate-600">({getBeWorkFamilyLabel(item.familyCode)})</span>
                  ) : null}
                </Value>
              </div>
            ) : null}
            {item.shortDescription ? (
              <div>
                <Label>Désignation courte</Label>
                <Value>{item.shortDescription}</Value>
              </div>
            ) : null}
            <div>
              <Label>Désignation complète</Label>
              <Value>{item.fullDescription}</Value>
            </div>
            {item.technicalReference ? (
              <div>
                <Label>Référence technique indicative</Label>
                <Value>{item.technicalReference}</Value>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <h2 className="font-heading text-lg font-bold text-slate-900">Ressources chantier liées</h2>
            <Link
              href="/dashboard/devis/ressources-chantier/extraction"
              className="text-xs font-semibold text-[#1d4ed8] hover:underline"
            >
              Extraire / regrouper
            </Link>
          </div>
          {siteResourceLinks.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Aucune ressource chantier associée.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {siteResourceLinks.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/dashboard/devis/ressources-chantier/${l.siteResource.id}`}
                    className="font-semibold text-[#1d4ed8] hover:underline"
                  >
                    {l.siteResource.shortName}
                  </Link>
                  {l.sourceSnippet ? (
                    <span className="text-slate-500"> — {l.sourceSnippet.slice(0, 80)}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="border-b border-slate-100 pb-2 font-heading text-lg font-bold text-slate-900">
            Méthode & vigilance
          </h2>
          <dl className="mt-4 space-y-4">
            {item.includedItems ? (
              <div>
                <Label>Inclus</Label>
                <Value>{item.includedItems}</Value>
              </div>
            ) : null}
            {item.excludedItems ? (
              <div>
                <Label>Exclus</Label>
                <Value>{item.excludedItems}</Value>
              </div>
            ) : null}
            {item.vigilancePoints ? (
              <div>
                <Label>Points de vigilance</Label>
                <Value>{item.vigilancePoints}</Value>
              </div>
            ) : null}
            {item.clientQuestions ? (
              <div>
                <Label>Questions client</Label>
                <Value>{item.clientQuestions}</Value>
              </div>
            ) : null}
            {item.companyQuestions ? (
              <div>
                <Label>Questions entreprise</Label>
                <Value>{item.companyQuestions}</Value>
              </div>
            ) : null}
            {item.internalNotes ? (
              <div>
                <Label>Notes internes</Label>
                <Value>{item.internalNotes}</Value>
              </div>
            ) : null}
          </dl>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-lg font-bold text-slate-900">Prix observés (sources)</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-lg bg-emerald-50 px-3 py-1 font-semibold text-emerald-900">
              Min HT : {formatEurFr(minHt)}
            </span>
            <span className="rounded-lg bg-sky-50 px-3 py-1 font-semibold text-sky-900">
              Moy. HT : {formatEurFr(avgHt)}
            </span>
            <span className="rounded-lg bg-orange-50 px-3 py-1 font-semibold text-orange-900">
              Max HT : {formatEurFr(maxHt)}
            </span>
            <span className="rounded-lg bg-slate-100 px-3 py-1 font-semibold text-slate-800">
              {countPrices} prix
            </span>
          </div>
        </div>

        <ObservedPricesTable
          workItemId={id}
          workItem={workItemContext}
          entries={serializedEntries}
          deletePriceEntry={deletePriceEntry}
        />

        <PriceEntryCreateForm workItemId={id} sources={sources} />
      </section>
    </div>
  );
}
