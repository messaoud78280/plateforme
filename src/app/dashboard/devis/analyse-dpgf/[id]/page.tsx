import Link from "next/link";
import { notFound } from "next/navigation";
import { DpgfAnalysisDeleteButton } from "@/components/devis/DpgfAnalysisDeleteButton";
import { DpgfAnalysisExportButton } from "@/components/devis/DpgfAnalysisExportButton";
import { DpgfAnalysisSheetView } from "@/components/devis/DpgfAnalysisSheetView";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import {
  DPGF_ANALYSIS_LEVEL_LABELS,
  DPGF_ANALYSIS_SOURCE_LABELS,
  DPGF_ANALYSIS_STATUS_LABELS,
} from "@/lib/dpgf-analysis/labels";
import { formatLotDpgfDisplay } from "@/lib/dpgf-analysis/intervenant-concerne";
import type { DpgfAnalysisSheetLinks } from "@/lib/dpgf-analysis/types";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function AnalyseDpgfDetailPage({ params }: Props) {
  await requireBeWorkDevisSession();
  const { id } = await params;
  const sheet = await prisma.dpgfAnalysisSheet.findUnique({ where: { id } });
  if (!sheet) notFound();

  const links = (sheet.links ?? {}) as DpgfAnalysisSheetLinks;
  const lotLabel = formatLotDpgfDisplay(sheet.lot, links.lotNote);

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:p-6">
        <Link
          href="/dashboard/devis/analyse-dpgf"
          className="inline-flex items-center text-sm font-semibold text-[#1e3a5f] hover:underline"
        >
          ← Retour à la liste
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <p className="font-mono text-xs font-bold tracking-wide text-[#1e3a5f]">{sheet.codeSheet}</p>
            <h1 className="font-heading mt-2 text-2xl font-bold leading-tight text-slate-900 lg:text-3xl">
              {sheet.simplifiedDesignation || sheet.originalDesignation}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {lotLabel} · {sheet.unit} · {DPGF_ANALYSIS_STATUS_LABELS[sheet.status]} ·{" "}
              {DPGF_ANALYSIS_LEVEL_LABELS[sheet.comprehensionLevel]} · {DPGF_ANALYSIS_SOURCE_LABELS[sheet.source]}
            </p>
            {sheet.familyName ? (
              <p className="mt-2 text-sm text-slate-500">
                <span className="font-semibold text-slate-600">Famille : </span>
                {sheet.familyName}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <DpgfAnalysisExportButton
              sheetId={sheet.id}
              codeSheet={sheet.codeSheet}
              familyName={sheet.familyName}
            />
            <Link
              href={`/dashboard/devis/analyse-dpgf/${sheet.id}/modifier`}
              className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a]"
            >
              Modifier
            </Link>
            {sheet.dceFillSessionId ? (
              <Link
                href="/dashboard/devis/dce-remplissage"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Session DCE
              </Link>
            ) : null}
            <DpgfAnalysisDeleteButton id={sheet.id} codeSheet={sheet.codeSheet} />
          </div>
        </div>
      </header>

      <DpgfAnalysisSheetView sheet={sheet} />
    </div>
  );
}
