import Link from "next/link";
import { notFound } from "next/navigation";
import { DpgfAnalysisSheetView } from "@/components/devis/DpgfAnalysisSheetView";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { DPGF_ANALYSIS_STATUS_LABELS } from "@/lib/dpgf-analysis/labels";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function AnalyseDpgfDetailPage({ params }: Props) {
  await requireBeWorkDevisSession();
  const { id } = await params;
  const sheet = await prisma.dpgfAnalysisSheet.findUnique({ where: { id } });
  if (!sheet) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link href="/dashboard/devis/analyse-dpgf" className="text-sm font-semibold text-[#1e3a5f] hover:underline">
          ← Analyse DPGF
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-semibold text-[#1e3a5f]">{sheet.codeSheet}</p>
            <h1 className="font-heading mt-1 text-2xl font-bold text-slate-900">
              {sheet.simplifiedDesignation || sheet.originalDesignation.slice(0, 120)}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Lot {sheet.lot} · {sheet.unit} · {DPGF_ANALYSIS_STATUS_LABELS[sheet.status]}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
                Session DCE liée
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <DpgfAnalysisSheetView sheet={sheet} />
    </div>
  );
}
