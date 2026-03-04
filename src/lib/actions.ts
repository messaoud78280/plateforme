/**
 * Facturation par actions : 1 action = 10 minutes.
 * Minimum 1 action par tâche. Formule : ceil(minutes / 10).
 */

export const MINUTES_PER_ACTION = 10;
export const MIN_ACTIONS_PER_TASK = 1;

export const SUBSCRIPTION_ACTIONS: Record<string, number> = {
  STANDARD: 120,       // 20h
  STANDARD_PLUS: 240,  // 40h
  PREMIUM: 360,        // 60h
  FULLTIME: 960,       // 160h
};

export function minutesToActions(minutes: number): number {
  if (minutes <= 0) return MIN_ACTIONS_PER_TASK;
  return Math.max(MIN_ACTIONS_PER_TASK, Math.ceil(minutes / MINUTES_PER_ACTION));
}

/** Premier jour du mois à 00:00 (UTC) pour le mois donné */
export function getMonthStart(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

/** True si actionsResetAt est avant le début du mois en cours (donc reset nécessaire) */
export function shouldResetActions(resetAt: Date | null): boolean {
  if (!resetAt) return true;
  const start = getMonthStart();
  return new Date(resetAt).getTime() < start.getTime();
}
