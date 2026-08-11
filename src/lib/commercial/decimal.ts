/** Conversion Prisma Decimal → number (jamais Number(null) silencieux). */
export function d(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return Number(value) || 0;
}
