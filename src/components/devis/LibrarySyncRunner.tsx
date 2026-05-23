"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  finalizeLibrarySyncAction,
  processLibrarySyncBatchAction,
} from "@/app/dashboard/devis/ressources-chantier-actions";
import { ChantierResourceSyncStatus } from "@/components/devis/ChantierResourceSyncStatus";
import type { LibrarySyncStats } from "@/lib/chantier-resources/automated-library-sync";

type Props = {
  autoStart: boolean;
  resourceTotal: number;
  lastRunAt: string | null;
  initialStats: LibrarySyncStats | null;
  forceSyncHref: string;
};

const MAX_BATCH_LOOPS = 800;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2500;

function isTransientSyncError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("unexpected response") ||
    m.includes("failed to fetch") ||
    m.includes("network") ||
    m.includes("timeout") ||
    m.includes("load failed")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (!isTransientSyncError(msg) || attempt === RETRY_ATTEMPTS - 1) throw e;
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }
  throw lastError;
}

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
  const [phase, setPhase] = useState<"lots" | "finalisation">("lots");
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
      setPhase("lots");
      setError(null);
      setFinished(false);
      let runId: string | null = null;

      try {
        for (let i = 0; i < MAX_BATCH_LOOPS; i += 1) {
          if (cancelled) return;

          const res = await callWithRetry(() => processLibrarySyncBatchAction(runId));

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

          if (res.needsFinalize && runId) {
            setPhase("finalisation");
            const fin = await callWithRetry(() => finalizeLibrarySyncAction(runId!));
            if (!fin.ok) {
              setError(fin.error);
              break;
            }
            setStats(fin.stats);
            setFinished(true);
            router.refresh();
            break;
          }

          if (res.done) {
            setFinished(true);
            router.refresh();
            break;
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur de synchronisation.";
        setError(
          isTransientSyncError(msg)
            ? "La connexion au serveur a été interrompue (délai dépassé). Réessayez avec « Forcer la synchro » — la progression est enregistrée par lots."
            : msg,
        );
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
          <p className="font-semibold">
            {phase === "finalisation" ? "Finalisation (fusion des doublons)…" : "Synchronisation en cours…"}
          </p>
          <p className="mt-1 text-sky-900/90">
            {phase === "finalisation"
              ? "Nettoyage des alias et fiches en double — peut prendre 1 à 2 minutes."
              : progress?.total
                ? `${progress.processed} / ${progress.total} ouvrages traités`
                : `${progress?.processed ?? 0} ouvrage(s) traité(s)`}
            {phase === "lots" ? " — ne fermez pas cet onglet." : ""}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-200">
            <div
              className="h-full rounded-full bg-[#1d4ed8] transition-all duration-500"
              style={{
                width: phase === "finalisation" ? "95%" : pct != null ? `${pct}%` : "30%",
              }}
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
