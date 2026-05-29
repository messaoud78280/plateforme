import Link from "next/link";
import { DevisSubNav } from "@/components/devis/DevisSubNav";
import { LibraryCleanupHubPanel } from "@/components/devis/LibraryCleanupHubPanel";
import { listLibraryCleanupJobs } from "@/app/dashboard/devis/library-cleanup-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function BibliothequeNettoyagePage() {
  await requireBeWorkDevisSession();

  let recentJobs: Awaited<ReturnType<typeof listLibraryCleanupJobs>> = [];
  try {
    recentJobs = await listLibraryCleanupJobs(15);
  } catch {
    recentJobs = [];
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
          <span className="text-slate-800">Nettoyage</span>
        </nav>
        <h1 className="font-heading mt-2 text-2xl font-bold text-slate-900">Nettoyage bibliothèque ouvrages</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Reclassement, détection doublons et fusion sécurisée par lots. Aucune suppression brutale — prix observés et
          historique conservés.
        </p>
      </header>
      <LibraryCleanupHubPanel recentJobs={recentJobs} />
    </div>
  );
}
