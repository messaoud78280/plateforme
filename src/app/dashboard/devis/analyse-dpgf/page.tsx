import Link from "next/link";
import { DpgfAnalysisGeneratePanel } from "@/components/devis/DpgfAnalysisGeneratePanel";
import { DpgfAnalysisJsonImportPanel } from "@/components/devis/DpgfAnalysisJsonImportPanel";
import { DpgfAnalysisListTable } from "@/components/devis/DpgfAnalysisListTable";
import { DpgfAnalysisStatsStrip } from "@/components/devis/DpgfAnalysisStatsStrip";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { WORK_ITEM_STATUS_LABELS, WORK_ITEM_UNITS } from "@/lib/be-work-devis-labels";
import { getBeWorkFamilyLexiconSorted } from "@/lib/bework-devis-family-codes";
import {
  DPGF_ANALYSIS_LEVEL_LABELS,
  DPGF_ANALYSIS_SOURCE_LABELS,
} from "@/lib/dpgf-analysis/labels";
import { isDpgfAnalysisAiAvailable } from "@/lib/dpgf-analysis/generate-sheet";
import {
  buildDpgfAnalysisWhere,
  DPGF_ANALYSIS_LIST_LIMIT,
  fetchDpgfAnalysisStats,
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

  const [rows, stats, lotsRow, familyRows, typeRows] = await Promise.all([
    prisma.dpgfAnalysisSheet.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: DPGF_ANALYSIS_LIST_LIMIT,
      select: {
        id: true,
        codeSheet: true,
        simplifiedDesignation: true,
        originalDesignation: true,
        lot: true,
        tradeCode: true,
        familyName: true,
        unit: true,
        comprehensionLevel: true,
        status: true,
        updatedAt: true,
      },
    }),
    fetchDpgfAnalysisStats(where),
    prisma.dpgfAnalysisSheet.findMany({ where, select: { lot: true }, distinct: ["lot"], orderBy: { lot: "asc" } }),
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

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-slate-900">Filtres</h2>
        <form method="get" className="mt-3 grid gap-3 lg:grid-cols-4">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Mot-clé (désignation, code…)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm lg:col-span-2"
          />
          <select name="lot" defaultValue={sp.lot ?? ""} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">Tous les lots</option>
            {lotsRow.map((r) => (
              <option key={r.lot} value={r.lot}>
                {r.lot}
              </option>
            ))}
          </select>
          <select name="trade" defaultValue={sp.trade ?? ""} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">Tous corps de métier</option>
            {FAMILY_LEX.map((f) => (
              <option key={f.code} value={f.code}>
                {f.label}
              </option>
            ))}
          </select>
          <select name="family" defaultValue={sp.family ?? ""} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">Toutes familles</option>
            {familyRows.map((r) =>
              r.familyName ? (
                <option key={r.familyName} value={r.familyName}>
                  {r.familyName}
                </option>
              ) : null,
            )}
          </select>
          <select name="ouvrageType" defaultValue={sp.ouvrageType ?? ""} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">Tous types d&apos;ouvrage</option>
            {typeRows.map((r) =>
              r.ouvrageType ? (
                <option key={r.ouvrageType} value={r.ouvrageType}>
                  {r.ouvrageType}
                </option>
              ) : null,
            )}
          </select>
          <select name="unit" defaultValue={sp.unit ?? ""} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">Toutes unités</option>
            {WORK_ITEM_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <select name="level" defaultValue={sp.level ?? ""} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">Tous niveaux</option>
            {Object.entries(DPGF_ANALYSIS_LEVEL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={sp.status ?? ""} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">Tous statuts</option>
            {Object.entries(WORK_ITEM_STATUS_LABELS)
              .filter(([k]) => k !== "archive")
              .map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
          </select>
          <select name="source" defaultValue={sp.source ?? ""} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">Toutes sources</option>
            {Object.entries(DPGF_ANALYSIS_SOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="hasMode" value="1" defaultChecked={sp.hasMode === "1"} />
            Mode opératoire renseigné
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="hasVigilance" value="1" defaultChecked={sp.hasVigilance === "1"} />
            Points de vigilance
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="hasQuestions" value="1" defaultChecked={sp.hasQuestions === "1"} />
            Questions à poser
          </label>
          <div className="flex flex-wrap gap-2 lg:col-span-4">
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Filtrer
            </button>
            <Link href="/dashboard/devis/analyse-dpgf" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Réinitialiser
            </Link>
          </div>
        </form>
      </section>

      <DpgfAnalysisListTable rows={rows} />
    </div>
  );
}
