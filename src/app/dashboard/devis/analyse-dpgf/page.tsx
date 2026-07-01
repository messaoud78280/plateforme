import Link from "next/link";
import { DpgfAnalysisFiltersPanel } from "@/components/devis/DpgfAnalysisFiltersPanel";
import { DpgfAnalysisGeneratePanel } from "@/components/devis/DpgfAnalysisGeneratePanel";
import { DpgfAnalysisJsonImportPanel } from "@/components/devis/DpgfAnalysisJsonImportPanel";
import { DpgfAnalysisListTable } from "@/components/devis/DpgfAnalysisListTable";
import { DpgfAnalysisStatsStrip } from "@/components/devis/DpgfAnalysisStatsStrip";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { getBeWorkFamilyLexiconSorted } from "@/lib/bework-devis-family-codes";
import { isDpgfAnalysisAiAvailable } from "@/lib/dpgf-analysis/generate-sheet";
import {
  buildDpgfAnalysisWhere,
  DPGF_ANALYSIS_LIST_LIMIT,
  fetchDpgfAnalysisStats,
  fetchDpgfLotOptions,
  parseDpgfAnalysisFilters,
} from "@/lib/dpgf-analysis/search";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<Record<string, string | undefined>>;

const FAMILY_LEX = getBeWorkFamilyLexiconSorted();

export default async function AnalyseDpgfPage({ searchParams }: { searchParams: SearchParams }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const filters = parseDpgfAnalysisFilters(sp);
  const where = buildDpgfAnalysisWhere(filters);

  const [rows, stats, lotOptions, familyRows, typeRows] = await Promise.all([
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
      },
    }),
    fetchDpgfAnalysisStats(where),
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
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e3a5f]/80">Compréhension & vigilance</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Analyse DPGF</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          Comprendre les désignations ligne par ligne : prestation attendue, documents à vérifier, points de vigilance et
          questions à poser. Module pédagogique —{" "}
          <strong className="font-semibold text-slate-800">sans prix ni bibliothèque tarifaire</strong>.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
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
            className="rounded-xl border border-[#1e3a5f]/30 bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#dbeafe]"
          >
            Importer en JSON
          </a>
        </div>
      </header>

      <DpgfAnalysisStatsStrip stats={stats} />

      <div className="space-y-6">
        <DpgfAnalysisGeneratePanel aiAvailable={aiAvailable} />
        <DpgfAnalysisJsonImportPanel />
      </div>

      <DpgfAnalysisFiltersPanel
        sp={sp}
        resultCount={rows.length}
        lotOptions={lotOptions}
        familyOptions={familyOptions}
        typeOptions={typeOptions}
        tradeOptions={tradeOptions}
      />

      {rows.length >= DPGF_ANALYSIS_LIST_LIMIT ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Affichage limité à {DPGF_ANALYSIS_LIST_LIMIT} fiches — affinez les filtres pour voir le détail complet.
        </p>
      ) : null}

      <DpgfAnalysisListTable rows={rows} lotLabels={lotLabels} />
    </div>
  );
}
