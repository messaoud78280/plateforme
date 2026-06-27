import Link from "next/link";
import { notFound } from "next/navigation";
import { DpgfAnalysisSheetEditor } from "@/components/devis/DpgfAnalysisSheetEditor";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function AnalyseDpgfModifierPage({ params }: Props) {
  await requireBeWorkDevisSession();
  const { id } = await params;
  const sheet = await prisma.dpgfAnalysisSheet.findUnique({ where: { id } });
  if (!sheet) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href={`/dashboard/devis/analyse-dpgf/${sheet.id}`} className="text-sm font-semibold text-[#1e3a5f] hover:underline">
          ← Fiche {sheet.codeSheet}
        </Link>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Modifier la fiche d&apos;analyse</h1>
        <p className="text-sm text-slate-600">Complétez, corrigez et validez la fiche pédagogique — sans dimension prix.</p>
      </header>
      <DpgfAnalysisSheetEditor mode="edit" sheet={sheet} />
    </div>
  );
}
