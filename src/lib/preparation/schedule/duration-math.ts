/** Arrondis demi-journée / journée — partagés compute + resolve. */

export function ceilHalfDay(days: number): number {
  return Math.ceil(days * 2 - 1e-12) / 2;
}

export function ceilDay(days: number): number {
  return Math.ceil(days - 1e-12);
}
