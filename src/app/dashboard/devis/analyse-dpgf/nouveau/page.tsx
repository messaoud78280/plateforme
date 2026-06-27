import Link from "next/link";
import { DpgfAnalysisSheetEditor } from "@/components/devis/DpgfAnalysisSheetEditor";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function NouvelleFicheAnalyseDpgfPage() {
  await requireBeWorkDevisSession();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/dashboard/devis/analyse-dpgf" className="text-sm font-semibold text-[#1e3a5f] hover:underline">
          ← Analyse DPGF
        </Link>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Nouvelle fiche d&apos;analyse</h1>
        <p className="text-sm text-slate-600">
          Créez une fiche pédagogique manuellement. Pour une analyse assistée, utilisez « Analyser une ligne DPGF » sur la
          page principale.
        </p>
      </header>
      <DpgfAnalysisSheetEditor mode="create" />
    </div>
  );
}
