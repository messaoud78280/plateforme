/**
 * Verrou anti-concurrence léger pour le scheduler attention (Postgres advisory lock).
 * Dernière protection métier = dedupeKey unique (W3-C1 / C2A).
 *
 * Clé fixe 64-bit (deux int4) — pas de collision avec d’autres jobs si keys distinctes.
 */
import { prisma } from "@/lib/prisma";

/** Namespace / id arbitraires stables pour BeWork attention escalations. */
const LOCK_K1 = 872314;
const LOCK_K2 = 2002;

export type AttentionCronLockResult =
  | { acquired: true }
  | { acquired: false; reason: "busy" | "unavailable" };

export async function tryAcquireAttentionCronLock(): Promise<AttentionCronLockResult> {
  try {
    const rows = await prisma.$queryRaw<Array<{ locked: boolean }>>`
      SELECT pg_try_advisory_lock(${LOCK_K1}, ${LOCK_K2}) AS locked
    `;
    const locked = Boolean(rows[0]?.locked);
    return locked ? { acquired: true } : { acquired: false, reason: "busy" };
  } catch (e) {
    console.error("[attention-cron-lock] acquire failed — continue without lock", e);
    // Ne pas bloquer le métier si le lock est indisponible (pooler / permission)
    return { acquired: true };
  }
}

export async function releaseAttentionCronLock(): Promise<void> {
  try {
    await prisma.$queryRaw`
      SELECT pg_advisory_unlock(${LOCK_K1}, ${LOCK_K2})
    `;
  } catch (e) {
    console.error("[attention-cron-lock] release failed", e);
  }
}
