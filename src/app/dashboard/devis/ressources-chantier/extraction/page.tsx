import Link from "next/link";
import { ChantierLibrarySyncCliPanel } from "@/components/devis/ChantierLibrarySyncCliPanel";
import { LibrarySyncRunner } from "@/components/devis/LibrarySyncRunner";
import { fetchChantierResourceStats, fetchLastLibrarySyncRun } from "@/app/dashboard/devis/ressources-chantier-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import type { LibrarySyncRunMeta, LibrarySyncStats } from "@/lib/chantier-resources/automated-library-sync";

/** Lots + finalisation : requêtes longues (Railway / Node). */
export const maxDuration = 300;

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
  /** Synchro navigateur : uniquement si l’utilisateur force explicitement (?force=1). */
  const shouldAutoStart = forceSync;

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
          Extraction depuis la bibliothèque d&apos;ouvrages : matériaux, fournitures, locations engins / outillage. Pour
          les grosses bibliothèques (~2000 ouvrages), préférez la commande terminal ci-dessous.
        </p>
      </header>

      <ChantierLibrarySyncCliPanel />

      <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
          Synchro dans le navigateur (peut expirer sur les gros volumes)
        </summary>
        <p className="mt-2 text-sm text-slate-600">
          Lance uniquement si vous ne pouvez pas utiliser le terminal. Ne fermez pas l&apos;onglet pendant le traitement.
        </p>
        <div className="mt-4">
          <LibrarySyncRunner
        autoStart={shouldAutoStart}
        resourceTotal={stats.total}
        lastRunAt={lastRun?.createdAt.toISOString() ?? null}
        initialStats={displayStats}
        forceSyncHref="/dashboard/devis/ressources-chantier/extraction?force=1"
          />
        </div>
      </details>
    </div>
  );
}
