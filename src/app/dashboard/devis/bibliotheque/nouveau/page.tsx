import Link from "next/link";
import { WorkItemEditorForm } from "@/components/devis/WorkItemEditorForm";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function NouveauOuvragePage() {
  await requireBeWorkDevisSession();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 px-1">
        <Link
          href="/dashboard/devis/bibliotheque"
          className="text-sm font-semibold text-[#1d4ed8] hover:underline"
        >
          ← Bibliothèque
        </Link>
      </div>
      <header className="px-1">
        <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">Nouvel ouvrage</h1>
        <p className="mt-1 text-sm text-slate-600">Créer une fiche ouvrage dans la bibliothèque interne.</p>
      </header>
      <WorkItemEditorForm mode="create" enableStructuredPaste />
    </div>
  );
}
