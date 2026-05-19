import Link from "next/link";
import { LibrarySyncRunner } from "@/components/devis/LibrarySyncRunner";
import { fetchChantierResourceStats, fetchLastLibrarySyncRun } from "@/app/dashboard/devis/ressources-chantier-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import type { LibrarySyncRunMeta, LibrarySyncStats } from "@/lib/chantier-resources/automated-library-sync";

export const maxDuration = 60;

type SearchParams = Promise<{ force?: string }>;

export default async function RessourcesChantierExtractionPage({ searchParams }: { searchParams: SearchParams }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const forceSync = sp.force === "1";

  const [stats, lastRun] = await Promise.all([fetchChantierResourceStats(), fetchLastLibrarySyncRun()]);

  const oneHourMs = 60 * 60 * 1000;
  const lastMeta = (lastRun?.meta ?? null) as LibrarySyncRunMeta | null;
  const lastAge = lastRun ? Date.now() - lastRun.createdAt.getTime() : Infinity;
  const lastDone = lastMeta?.phase === "done";
  const shouldAutoStart = forceSync || !lastRun || !lastDone || lastAge > oneHourMs;

  const displayStats: LibrarySyncStats | null =
    lastMeta?.phase === "done" ? lastMeta.stats : lastMeta?.stats ?? null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/devis/ressources-chantier" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
        ← Ressources chantier
      </Link>

      <header className="px-1">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Synchronisation bibliothèque → ressources</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Extraction automatique depuis la bibliothèque d&apos;ouvrages : matériaux, fournitures, locations engins /
          outillage, sans doublons d&apos;alias. La page s&apos;affiche tout de suite ; la synchro se fait par lots en
          arrière-plan (ne fermez pas l&apos;onglet).
        </p>
      </header>

      <LibrarySyncRunner
        autoStart={shouldAutoStart}
        resourceTotal={stats.total}
        lastRunAt={lastRun?.createdAt.toISOString() ?? null}
        initialStats={displayStats}
        forceSyncHref="/dashboard/devis/ressources-chantier/extraction?force=1"
      />
    </div>
  );
}
