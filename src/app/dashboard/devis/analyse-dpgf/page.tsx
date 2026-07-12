import Link from "next/link";
import { DpgfAnalysisFiltersPanel } from "@/components/devis/DpgfAnalysisFiltersPanel";
import { DpgfAnalysisGeneratePanel } from "@/components/devis/DpgfAnalysisGeneratePanel";
import { DpgfAnalysisJsonImportPanel } from "@/components/devis/DpgfAnalysisJsonImportPanel";
import { DpgfAnalysisListTable } from "@/components/devis/DpgfAnalysisListTable";
import { DpgfAnalysisStatsStrip } from "@/components/devis/DpgfAnalysisStatsStrip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
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
      <PageHeader
        eyebrow="Compréhension & vigilance"
        title="Analyse DPGF"
        description={
          <>
            Comprendre les désignations ligne par ligne : prestation attendue, documents à vérifier, points de vigilance et
            questions à poser. Module pédagogique —{" "}
            <strong className="font-semibold text-bework-ink">sans prix ni bibliothèque tarifaire</strong>.
          </>
        }
        actions={
          <>
            <Link href="/dashboard/devis/analyse-dpgf/nouveau" className="btn-cc-primary">
              Nouvelle fiche manuelle
            </Link>
            <Link href="/dashboard/devis/dce-remplissage" className="btn-cc-secondary">
              DCE importé → générer
            </Link>
            <a href="#outils-dpgf" className="btn-cc-ghost">
              Outils IA / JSON
            </a>
          </>
        }
      />

      <DpgfAnalysisStatsStrip stats={stats} />

      <DpgfAnalysisFiltersPanel
        sp={sp}
        resultCount={rows.length}
        lotOptions={lotOptions}
        familyOptions={familyOptions}
        typeOptions={typeOptions}
        tradeOptions={tradeOptions}
      />

      {rows.length >= DPGF_ANALYSIS_LIST_LIMIT ? (
        <Alert tone="watch">
          Affichage limité à {DPGF_ANALYSIS_LIST_LIMIT} fiches — affinez les filtres pour voir le détail complet.
        </Alert>
      ) : null}

      <DpgfAnalysisListTable rows={rows} lotLabels={lotLabels} />

      <details id="outils-dpgf" className="cc-card overflow-hidden">
        <summary className="cursor-pointer px-5 py-4 font-heading text-sm font-bold text-bework-ink marker:content-none [&::-webkit-details-marker]:hidden">
          Outils — génération IA et import JSON
        </summary>
        <div className="space-y-6 border-t border-[color:var(--cc-chrome-border)] p-5">
          <DpgfAnalysisGeneratePanel aiAvailable={aiAvailable} />
          <DpgfAnalysisJsonImportPanel />
        </div>
      </details>
    </div>
  );
}
