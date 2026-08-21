/**
 * Cycle de vie SaaS d’une Organization (trial 14 j, lecture seule, etc.).
 * Source de vérité serveur — ne pas recalculer uniquement en UI.
 */

import type { OrganizationSaasStatus } from "@prisma/client";

export const SAAS_TRIAL_DAYS = 14;

export type OrgLifecycleFields = {
  saasStatus: OrganizationSaasStatus;
  trialStartedAt?: Date | null;
  trialEndsAt?: Date | null;
  kind?: string | null;
};

export type OrgWriteAccess = {
  canWrite: boolean;
  canRead: boolean;
  reason?: string;
};

/** Recalcule TRIAL → TRIAL_EXPIRED si la date est dépassée. */
export function effectiveSaasStatus(org: OrgLifecycleFields): OrganizationSaasStatus {
  if (org.saasStatus === "TRIAL" && org.trialEndsAt && org.trialEndsAt.getTime() <= Date.now()) {
    return "TRIAL_EXPIRED";
  }
  return org.saasStatus;
}

export function daysRemainingInTrial(org: OrgLifecycleFields): number | null {
  const status = effectiveSaasStatus(org);
  if (status !== "TRIAL" || !org.trialEndsAt) return null;
  const ms = org.trialEndsAt.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

/**
 * Règles d’écriture métier (Phase 1 — fondation).
 * DEMO / ACTIVE : écriture OK.
 * TRIAL : écriture OK jusqu’à expiration.
 * TRIAL_EXPIRED / SUSPENDED / CANCELED / DELETION_PENDING : lecture seule.
 * PAST_DUE : lecture seule (paiement) — à affiner avec Stripe Phase 7.
 */
export function computeOrgWriteAccess(org: OrgLifecycleFields): OrgWriteAccess {
  const status = effectiveSaasStatus(org);

  if (org.kind === "DEMO") {
    return { canWrite: true, canRead: true };
  }

  switch (status) {
    case "ACTIVE":
    case "TRIAL":
      return { canWrite: true, canRead: true };
    case "TRIAL_EXPIRED":
      return {
        canWrite: false,
        canRead: true,
        reason:
          "Votre essai BeWork est terminé. Vos données sont conservées — activez votre abonnement pour continuer.",
      };
    case "PAST_DUE":
      return {
        canWrite: false,
        canRead: true,
        reason: "Paiement en attente. Mettez à jour votre moyen de paiement pour retrouver l’écriture.",
      };
    case "SUSPENDED":
    case "CANCELED":
    case "DELETION_PENDING":
      return {
        canWrite: false,
        canRead: true,
        reason: "Cet espace BeWork est limité. Contactez le support si besoin.",
      };
    default:
      return { canWrite: false, canRead: true, reason: "Espace non disponible." };
  }
}

export function computeTrialWindow(from = new Date()): {
  trialStartedAt: Date;
  trialEndsAt: Date;
} {
  const trialStartedAt = new Date(from);
  const trialEndsAt = new Date(from);
  trialEndsAt.setDate(trialEndsAt.getDate() + SAAS_TRIAL_DAYS);
  return { trialStartedAt, trialEndsAt };
}

/** Prolongation manuelle BeWork Admin (Phase 6). */
export function extendTrialEndsAt(currentEndsAt: Date | null | undefined, days: number): Date {
  const base =
    currentEndsAt && currentEndsAt.getTime() > Date.now()
      ? new Date(currentEndsAt)
      : new Date();
  base.setDate(base.getDate() + Math.max(1, days));
  return base;
}
