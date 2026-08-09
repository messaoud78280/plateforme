/**
 * Mesures serveur DEV uniquement — PERF-V1B.
 * Jamais de log bruyant en production.
 */
export function isPerfLogEnabled() {
  return process.env.NODE_ENV === "development" || process.env.BEWORK_PERF_LOG === "1";
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
