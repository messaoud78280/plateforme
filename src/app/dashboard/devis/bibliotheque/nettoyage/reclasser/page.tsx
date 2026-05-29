import Link from "next/link";
import { DevisSubNav } from "@/components/devis/DevisSubNav";
import { ClassificationReviewPanel } from "@/components/devis/ClassificationReviewPanel";
import { fetchPendingClassificationProposals } from "@/app/dashboard/devis/library-cleanup-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function BibliothequeReclasserPage() {
  await requireBeWorkDevisSession();

  let proposals: Awaited<ReturnType<typeof fetchPendingClassificationProposals>> = [];
  try {
    proposals = await fetchPendingClassificationProposals({ limit: 80 });
  } catch {
    proposals = [];
  }

  return (
    <div className="space-y-6">
      <DevisSubNav />
      <header>
        <nav className="text-sm text-slate-500">
          <Link href="/dashboard/devis/bibliotheque" className="hover:text-[#1d4ed8] hover:underline">
            Bibliothèque
          </Link>
          <span className="mx-2">/</span>
          <Link href="/dashboard/devis/bibliotheque/nettoyage" className="hover:text-[#1d4ed8] hover:underline">
            Nettoyage
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800">Ouvrages à reclasser</span>
        </nav>
        <h1 className="font-heading mt-2 text-2xl font-bold text-slate-900">Ouvrages à reclasser</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Propositions de reclassement depuis Divers / Non classé. Confiance haute = applicable automatiquement depuis
          la page nettoyage.
        </p>
      </header>
      <ClassificationReviewPanel proposals={proposals} />
    </div>
  );
}
