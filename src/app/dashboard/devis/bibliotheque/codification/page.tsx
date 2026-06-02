import Link from "next/link";
import { Suspense } from "react";
import { WorkItemCatalogBar } from "@/components/devis/WorkItemCatalogBar";
import { WorkItemCodificationAdmin } from "@/components/devis/WorkItemCodificationAdmin";
import { listWorkItemCatalogs, resolveActiveWorkItemCatalogId } from "@/lib/work-item-catalog";
import { listWorkItemsForCodificationAdmin } from "@/app/dashboard/devis/codification-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import {
  BEWORK_CODIFICATION_FAMILIES,
  BEWORK_LOT_LEXICON,
  BEWORK_OUVRAGE_TYPES,
} from "@/lib/bework-work-item-codification/lexicon";
import type { WorkItemCodificationStatus } from "@prisma/client";

type SearchParams = Promise<{
  lotCode?: string;
  familleCode?: string;
  sousFamilleCode?: string;
  codificationStatus?: string;
  onlyNeedsReview?: string;
  q?: string;
}>;

function parseStatus(raw?: string): WorkItemCodificationStatus | undefined {
  const v = raw?.trim();
  if (v === "pending" || v === "auto" || v === "a_verifier" || v === "valide") return v;
  return undefined;
}

async function CodificationContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters = {
    lotCode: sp.lotCode?.trim() || undefined,
    familleCode: sp.familleCode?.trim() || undefined,
    sousFamilleCode: sp.sousFamilleCode?.trim() || undefined,
    codificationStatus: parseStatus(sp.codificationStatus),
    onlyNeedsReview: sp.onlyNeedsReview === "1",
    q: sp.q?.trim() || undefined,
  };

  const data = await listWorkItemsForCodificationAdmin(filters);
  if ("error" in data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-950">
        <p className="font-semibold">Migration base de données requise</p>
        <p className="mt-2">{data.error}</p>
      </div>
    );
  }

  return (
    <WorkItemCodificationAdmin
      initialRows={data.rows}
      report={data.report}
      initialFilters={{
        lotCode: filters.lotCode,
        familleCode: filters.familleCode,
        sousFamilleCode: filters.sousFamilleCode,
        codificationStatus: filters.codificationStatus,
        onlyNeedsReview: filters.onlyNeedsReview,
        q: filters.q,
      }}
    />
  );
}

export default async function BibliothequeCodificationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireBeWorkDevisSession();
  const [catalogs, activeCatalogId] = await Promise.all([
    listWorkItemCatalogs(),
    resolveActiveWorkItemCatalogId(),
  ]);

  return (
    <div className="space-y-8 px-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Bibliothèque</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Codification BeWork des ouvrages
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Système unique <span className="font-mono font-semibold">BW-[LOT]-[FAMILLE]-[OUVRAGE]-[VARIANTE]</span>{" "}
            (ex. <span className="font-mono">BW-GO-DEM-CLO-001</span>). Les anciens codes Artiprix, VRD-E09 ou texte
            restent dans <span className="font-mono">code_source</span> / <span className="font-mono">sourceCode</span>.
            Recodification réversible — prix inchangés.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/devis/bibliotheque"
            className="inline-flex w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            ← Bibliothèque
          </Link>
          <Link
            href="/dashboard/devis/bibliotheque/recodification"
            className="inline-flex w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            Ancienne recod. Martin
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">Référentiel lots / familles / ouvrages</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-500">Lots</h3>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
              {BEWORK_LOT_LEXICON.map((l) => (
                <li key={l.code}>
                  <span className="font-mono font-bold text-[#1e3a5f]">{l.code}</span> — {l.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-500">Familles</h3>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
              {BEWORK_CODIFICATION_FAMILIES.map((f) => (
                <li key={f.code}>
                  <span className="font-mono font-bold text-[#1e3a5f]">{f.code}</span> — {f.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-500">Types d&apos;ouvrage</h3>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
              {BEWORK_OUVRAGE_TYPES.filter((o) => o.code !== "GEN").map((o) => (
                <li key={o.code}>
                  <span className="font-mono font-bold text-[#1e3a5f]">{o.code}</span> — {o.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <WorkItemCatalogBar catalogs={catalogs} activeCatalogId={activeCatalogId} />

      <Suspense
        fallback={<p className="text-sm text-slate-600">Chargement des propositions de codification…</p>}
      >
        <CodificationContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
