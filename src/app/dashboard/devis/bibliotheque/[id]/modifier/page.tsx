import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkItemEditorForm } from "@/components/devis/WorkItemEditorForm";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export default async function ModifierOuvragePage({ params }: Props) {
  await requireBeWorkDevisSession();
  const { id } = await params;

  const item = await prisma.workItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 px-1">
        <Link href={`/dashboard/devis/bibliotheque/${id}`} className="text-sm font-semibold text-[#1d4ed8] hover:underline">
          ← Fiche ouvrage
        </Link>
        <Link href="/dashboard/devis/bibliotheque" className="text-sm font-semibold text-slate-600 hover:underline">
          Bibliothèque
        </Link>
      </div>
      <header className="px-1">
        <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">Modifier — {item.code}</h1>
        <p className="mt-1 text-sm text-slate-600">Mettre à jour la fiche ouvrage.</p>
      </header>
      <WorkItemEditorForm mode="edit" item={item} />
    </div>
  );
}
