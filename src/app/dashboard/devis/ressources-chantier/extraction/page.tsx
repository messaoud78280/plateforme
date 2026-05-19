import Link from "next/link";
import { ChantierResourceSyncStatus } from "@/components/devis/ChantierResourceSyncStatus";
import {
  fetchChantierResourceStats,
  fetchLastLibrarySyncRun,
  syncLibraryToChantierResources,
} from "@/app/dashboard/devis/ressources-chantier-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import type { LibrarySyncStats } from "@/lib/chantier-resources/automated-library-sync";

export const maxDuration = 300;

type SearchParams = Promise<{ force?: string }>;

type SyncMeta = {
  mode?: string;
  stats?: LibrarySyncStats;
};

export default async function RessourcesChantierExtractionPage({ searchParams }: { searchParams: SearchParams }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const forceSync = sp.force === "1";

  const [stats, lastRunBefore] = await Promise.all([fetchChantierResourceStats(), fetchLastLibrarySyncRun()]);

  const oneHourMs = 60 * 60 * 1000;
  const lastMeta = (lastRunBefore?.meta ?? null) as SyncMeta | null;
  const lastAge = lastRunBefore ? Date.now() - lastRunBefore.createdAt.getTime() : Infinity;
  const shouldSync = forceSync || !lastRunBefore || lastAge > oneHourMs;

  let syncResult: Awaited<ReturnType<typeof syncLibraryToChantierResources>> | null = null;
  let syncError: string | null = null;

  if (shouldSync) {
    try {
      syncResult = await syncLibraryToChantierResources();
    } catch (e) {
      syncError = e instanceof Error ? e.message : "Erreur lors de la synchronisation automatique.";
    }
  }

  const lastRun = syncResult
    ? await fetchLastLibrarySyncRun()
    : lastRunBefore;
  const meta = (lastRun?.meta ?? null) as SyncMeta | null;
  const displayStats = syncResult?.stats ?? meta?.stats ?? null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/devis/ressources-chantier" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
        ← Ressources chantier
      </Link>

      <header className="px-1">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Synchronisation bibliothèque → ressources</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Extraction automatique depuis la bibliothèque d&apos;ouvrages : matériaux, fournitures, locations engins /
          outillage, sans doublons d&apos;alias. Aucune validation manuelle — la synchro se lance à l&apos;ouverture de
          cette page (au plus une fois par heure).
        </p>
      </header>

      {syncError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{syncError}</div>
      ) : null}

      <ChantierResourceSyncStatus
        resourceTotal={stats.total}
        ranNow={Boolean(syncResult)}
        skippedBecauseRecent={!shouldSync && !syncError}
        lastRunAt={lastRun?.createdAt.toISOString() ?? null}
        stats={displayStats}
        forceSyncHref="/dashboard/devis/ressources-chantier/extraction?force=1"
      />
    </div>
  );
}
