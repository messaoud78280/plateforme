/**
 * Facturation par crédits — alignée `CREDIT_MINUTES` dans `subscription-plans`
 * (`User.monthlyActionsTotal`, débit après paiement).
 * Minimum 1 crédit par tâche. Formule : ceil(minutes / MINUTES_PER_ACTION).
 *
 * Validité : voir `credits-lifecycle.ts` (`User.actionsResetAt` = date d'expiration).
 */

import type { PlanKey } from "@/lib/subscription-plans";
import { CREDIT_MINUTES, SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

export {
  areCreditsExpired,
  buildCreditsGrantUpdate,
  formatCreditsExpiryLabel,
  getCreditsExpirationDate,
  syncUserCreditsExpiry,
} from "@/lib/credits-lifecycle";
export { CREDITS_VALIDITY_DAYS, CREDITS_VALIDITY_LABEL, CREDITS_VALIDITY_NOTICE } from "@/lib/subscription-plans";

export const MINUTES_PER_ACTION = CREDIT_MINUTES;
export const MIN_ACTIONS_PER_TASK = 1;

export const SUBSCRIPTION_ACTIONS = {
  ...Object.fromEntries(
    (Object.keys(SUBSCRIPTION_PLANS) as PlanKey[]).map((key) => [key, SUBSCRIPTION_PLANS[key].actionsIncluded])
  ),
  /** Hors catalogue public — valeur métier hors table des trois offres principales */
  FULLTIME: 960,
} as Record<string, number>;

export function minutesToActions(minutes: number): number {
  if (minutes <= 0) return MIN_ACTIONS_PER_TASK;
  return Math.max(MIN_ACTIONS_PER_TASK, Math.ceil(minutes / MINUTES_PER_ACTION));
}
