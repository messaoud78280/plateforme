"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { processLibrarySyncBatchAction } from "@/app/dashboard/devis/ressources-chantier-actions";
import { ChantierResourceSyncStatus } from "@/components/devis/ChantierResourceSyncStatus";
import type { LibrarySyncStats } from "@/lib/chantier-resources/automated-library-sync";

type Props = {
  autoStart: boolean;
  resourceTotal: number;
  lastRunAt: string | null;
  initialStats: LibrarySyncStats | null;
  forceSyncHref: string;
};

export function LibrarySyncRunner({
  autoStart,
  resourceTotal,
  lastRunAt,
  initialStats,
  forceSyncHref,
}: Props) {
  const router = useRouter();
  const started = useRef(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LibrarySyncStats | null>(initialStats);
  const [progress, setProgress] = useState<{ processed: number; total: number | null } | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    let cancelled = false;

    async function run() {
      setSyncing(true);
      setError(null);
      setFinished(false);
      let runId: string | null = null;

      try {
        for (let i = 0; i < 500; i += 1) {
          if (cancelled) return;
          const res = await processLibrarySyncBatchAction(runId);
          if (!res.ok) {
            setError(res.error);
            break;
          }
          runId = res.runId;
          setStats(res.stats);
          setProgress({
            processed: res.stats.workItemsProcessed,
            total: res.totalWorkItems,
          });
          if (res.done) {
            setFinished(true);
            router.refresh();
            break;
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de synchronisation.");
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [autoStart, router]);

  const pct =
    progress?.total && progress.total > 0
      ? Math.min(100, Math.round((progress.processed / progress.total) * 100))
      : null;

  return (
    <div className="space-y-4">
      {syncing ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950">
          <p className="font-semibold">Synchronisation en cours…</p>
          <p className="mt-1 text-sky-900/90">
            {progress?.total
              ? `${progress.processed} / ${progress.total} ouvrages traités`
              : `${progress?.processed ?? 0} ouvrage(s) traité(s)`}
            — ne fermez pas cet onglet.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-200">
            <div
              className="h-full rounded-full bg-[#1d4ed8] transition-all duration-500"
              style={{ width: pct != null ? `${pct}%` : "30%" }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <ChantierResourceSyncStatus
        resourceTotal={resourceTotal}
        ranNow={finished}
        skippedBecauseRecent={!autoStart && !finished}
        lastRunAt={lastRunAt}
        stats={stats}
        forceSyncHref={forceSyncHref}
      />
    </div>
  );
}
