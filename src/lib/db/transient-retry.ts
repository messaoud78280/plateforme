/**
 * Retry lecture seule — jamais pour écritures non idempotentes
 * (création devis / facture / paiement / commande).
 */

export function isTransientDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: unknown }).code ?? "")
      : "";
  return (
    /EMAXCONNSESSION/i.test(msg) ||
    /max clients reached/i.test(msg) ||
    /Can't reach database server/i.test(msg) ||
    /Too many connections/i.test(msg) ||
    /Connection pool timeout/i.test(msg) ||
    /Timed out fetching a new connection/i.test(msg) ||
    code === "P1001" ||
    code === "P2024" ||
    /P1001|P2024/i.test(msg)
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Délai avec jitter pour éviter les reprises synchrones. */
export function retryDelayMs(attempt: number, baseMs = 280): number {
  const expo = baseMs * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 160);
  return Math.min(2_500, expo + jitter);
}

/**
 * Relance uniquement des opérations de lecture.
 * maxAttempts = 2 → 1 retry max.
 */
export async function withTransientDbRetry<T>(
  label: string,
  fn: () => Promise<T>,
  opts?: { maxAttempts?: number; context?: Record<string, unknown> },
): Promise<T> {
  const maxAttempts = Math.max(1, Math.min(opts?.maxAttempts ?? 2, 3));
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientDbError(err) || attempt >= maxAttempts) throw err;
      const wait = retryDelayMs(attempt);
      console.warn(`[db-retry] ${label} attempt=${attempt}/${maxAttempts} waitMs=${wait}`, {
        ...opts?.context,
        code:
          err && typeof err === "object" && "code" in err
            ? (err as { code?: unknown }).code
            : undefined,
      });
      await sleep(wait);
    }
  }
  throw lastErr;
}
