import Link from "next/link";
import { DevisSubNav } from "@/components/devis/DevisSubNav";
import { DuplicateReviewPanel } from "@/components/devis/DuplicateReviewPanel";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function BibliothequeDoublonsPage() {
  await requireBeWorkDevisSession();

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
          <span className="text-slate-800">Doublons</span>
        </nav>
        <h1 className="font-heading mt-2 text-2xl font-bold text-slate-900">Contrôle des doublons</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Groupes détectés par désignation normalisée, unité et famille. L’ouvrage maître est choisi selon le nombre de
          prix observés, puis le prix max, puis la désignation la plus propre.
        </p>
      </header>
      <DuplicateReviewPanel />
    </div>
  );
}
