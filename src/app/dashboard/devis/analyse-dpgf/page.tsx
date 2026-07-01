import Link from "next/link";
import { Suspense } from "react";
import { DpgfAnalysisFiltersPanel } from "@/components/devis/DpgfAnalysisFiltersPanel";
import { DpgfAnalysisGeneratePanel } from "@/components/devis/DpgfAnalysisGeneratePanel";
import { DpgfAnalysisJsonImportPanel } from "@/components/devis/DpgfAnalysisJsonImportPanel";
import { DpgfAnalysisListTable } from "@/components/devis/DpgfAnalysisListTable";
import { DpgfAnalysisQualityPanel } from "@/components/devis/DpgfAnalysisQualityPanel";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { getBeWorkFamilyLexiconSorted } from "@/lib/bework-devis-family-codes";
import { isDpgfAnalysisAiAvailable } from "@/lib/dpgf-analysis/generate-sheet";
import { parseDpgfAnalysisViewMode } from "@/lib/dpgf-analysis/list-order";
import {
  buildDpgfAnalysisWhere,
  computeDpgfAnalysisQualityMetrics,
  DPGF_ANALYSIS_LIST_LIMIT,
  fetchDpgfAnalysisStats,
  fetchDpgfLotOptions,
  mapDpgfAnalysisListRows,
  parseDpgfAnalysisFilters,
} from "@/lib/dpgf-analysis/search";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<Record<string, string | undefined>>;

const FAMILY_LEX = getBeWorkFamilyLexiconSorted();

export default async function AnalyseDpgfPage({ searchParams }: { searchParams: SearchParams }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const filters = parseDpgfAnalysisFilters(sp);
  const viewMode = parseDpgfAnalysisViewMode(sp.view);
  const where = buildDpgfAnalysisWhere(filters);

  const [rawRows, stats, globalTotal, lotOptions, familyRows, typeRows] = await Promise.all([
    prisma.dpgfAnalysisSheet.findMany({
      where,
      orderBy: [{ lot: "asc" }, { familyName: "asc" }, { codeSheet: "asc" }],
      take: DPGF_ANALYSIS_LIST_LIMIT,
      select: {
        id: true,
        codeSheet: true,
        simplifiedDesignation: true,
        originalDesignation: true,
        lot: true,
        intervenantConcerne: true,
        familyName: true,
        unit: true,
        comprehensionLevel: true,
        status: true,
        updatedAt: true,
        links: true,
        dceLineIndex: true,
      },
    }),
    fetchDpgfAnalysisStats(where),
    prisma.dpgfAnalysisSheet.count(),
    fetchDpgfLotOptions(where),
    prisma.dpgfAnalysisSheet.findMany({
      where: { ...where, familyName: { not: null } },
      select: { familyName: true },
      distinct: ["familyName"],
      orderBy: { familyName: "asc" },
    }),
    prisma.dpgfAnalysisSheet.findMany({
      where: { ...where, ouvrageType: { not: null } },
      select: { ouvrageType: true },
      distinct: ["ouvrageType"],
      orderBy: { ouvrageType: "asc" },
    }),
  ]);

  const rows = mapDpgfAnalysisListRows(rawRows);
  const qualityMetrics = computeDpgfAnalysisQualityMetrics(rows);
  const aiAvailable = isDpgfAnalysisAiAvailable();
  const lotLabels = Object.fromEntries(lotOptions.map((o) => [o.lot, o.label]));

  const familyOptions = familyRows
    .filter((r): r is { familyName: string } => Boolean(r.familyName))
    .map((r) => ({ familyName: r.familyName }));

  const typeOptions = typeRows
    .filter((r): r is { ouvrageType: string } => Boolean(r.ouvrageType))
    .map((r) => ({ ouvrageType: r.ouvrageType }));

  const tradeOptions = FAMILY_LEX.map((f) => ({ code: f.code, label: f.label }));

  return (
    <div className="-mx-1 space-y-6 bg-slate-50/80 px-1 pb-8 sm:mx-0 sm:px-0">
      <header className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e3a5f]/80">Compréhension & vigilance</p>
        <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight text-slate-900">Analyse DPGF</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Comprendre les désignations ligne par ligne : prestation attendue, documents à vérifier, points de vigilance et
          questions à poser. Module pédagogique —{" "}
          <strong className="font-semibold text-slate-800">sans prix ni bibliothèque tarifaire</strong>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/devis/analyse-dpgf/nouveau"
            className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a]"
          >
            Nouvelle fiche manuelle
          </Link>
          <Link
            href="/dashboard/devis/dce-remplissage"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            DCE importé → générer depuis une ligne
          </Link>
          <a
            href="#json-import"
            className="rounded-xl border border-[#1e3a5f]/25 bg-[#eff6ff]/60 px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#dbeafe]"
          >
            Importer en JSON
          </a>
        </div>
      </header>

      <DpgfAnalysisQualityPanel metrics={qualityMetrics} globalTotal={globalTotal} />

      <div className="grid gap-4 xl:grid-cols-2">
        <DpgfAnalysisGeneratePanel aiAvailable={aiAvailable} />
        <DpgfAnalysisJsonImportPanel />
      </div>

      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-200/60" />}>
        <DpgfAnalysisFiltersPanel
          filters={filters}
          viewMode={viewMode}
          lotOptions={lotOptions}
          familyOptions={familyOptions}
          typeOptions={typeOptions}
          tradeOptions={tradeOptions}
          resultCount={rows.length}
        />
      </Suspense>

      {rows.length >= DPGF_ANALYSIS_LIST_LIMIT ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Affichage limité à {DPGF_ANALYSIS_LIST_LIMIT} fiches — affinez les filtres pour voir le détail complet.
        </p>
      ) : null}

      <DpgfAnalysisListTable rows={rows} lotLabels={lotLabels} viewMode={viewMode} />

      <p className="text-center text-[11px] text-slate-400">
        {stats.totalSheets.toLocaleString("fr-FR")} fiche{stats.totalSheets > 1 ? "s" : ""} dans le périmètre filtré ·{" "}
        {stats.validated} validée{stats.validated > 1 ? "s" : ""} · {stats.toVerify} à vérifier
      </p>
    </div>
  );
}
