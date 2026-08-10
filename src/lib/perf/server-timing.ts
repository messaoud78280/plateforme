/**
 * PERF-V2A.1 — mesures serveur.
 * Activé si NODE_ENV=development OU BEWORK_PERF_LOG=1 OU PERF_DEBUG=true.
 * Jamais de données métier/sensibles dans les logs.
 */
import { AsyncLocalStorage } from "node:async_hooks";

export function isPerfLogEnabled() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.BEWORK_PERF_LOG === "1" ||
    process.env.PERF_DEBUG === "true" ||
    process.env.PERF_DEBUG === "1"
  );
}

type PerfStore = {
  queryCount: number;
  queries: { model: string; action: string; ms: number }[];
};

const perfAls = new AsyncLocalStorage<PerfStore>();

export function getPerfStore(): PerfStore | undefined {
  return perfAls.getStore();
}

/** Enveloppe une requête HTTP / un profil script avec compteur de queries. */
export function runWithPerfContext<T>(fn: () => Promise<T>): Promise<T> {
  const existing = perfAls.getStore();
  if (existing) return fn();
  const store: PerfStore = { queryCount: 0, queries: [] };
  return perfAls.run(store, fn);
}

export function recordPerfQuery(opts: {
  model: string;
  action: string;
  ms: number;
}) {
  const store = perfAls.getStore();
  if (!store) return;
  store.queryCount += 1;
  if (opts.ms >= 0) {
    store.queries.push({
      model: opts.model,
      action: opts.action,
      ms: opts.ms,
    });
  }
}

export async function withPerfLog<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isPerfLogEnabled()) return fn();
  const t0 = Date.now();
  try {
    return await fn();
  } finally {
    console.info(`[perf] ${label} ${Date.now() - t0}ms`);
  }
}

/** Alias explicite PERF-V2A.1 */
export const withPerfSpan = withPerfLog;

/**
 * Parallélise avec un span individuel par branche (durée wall de chaque promesse).
 * Utile pour voir quelle branche d’un Promise.all domine.
 */
export function timedBranch<T>(label: string, promise: Promise<T>): Promise<T> {
  if (!isPerfLogEnabled()) return promise;
  const t0 = Date.now();
  return promise.finally(() => {
    console.info(`[perf] ${label} ${Date.now() - t0}ms`);
  });
}

export function summarizePerfQueries(top = 5): {
  count: number;
  top: { model: string; action: string; ms: number }[];
} {
  const store = perfAls.getStore();
  if (!store) return { count: 0, top: [] };
  const sorted = [...store.queries].sort((a, b) => b.ms - a.ms).slice(0, top);
  return { count: store.queryCount, top: sorted };
}
