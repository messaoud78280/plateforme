/**
 * Validité des crédits : 30 jours à compter de l'achat ou du crédit (tous forfaits).
 * `User.actionsResetAt` = date d'expiration (fin de validité), pas reset calendaire.
 */

import { prisma } from "@/lib/prisma";
import { CREDITS_VALIDITY_DAYS } from "@/lib/subscription-plans";

export function getCreditsExpirationDate(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + CREDITS_VALIDITY_DAYS);
  return d;
}

export function areCreditsExpired(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) return false;
  return Date.now() >= new Date(expiresAt).getTime();
}

export function buildCreditsGrantUpdate(actionsIncluded: number, from: Date = new Date()) {
  return {
    monthlyActionsTotal: actionsIncluded,
    monthlyActionsUsed: 0,
    actionsResetAt: getCreditsExpirationDate(from),
  };
}

/** Périmètre crédits expirés : solde remis à zéro (crédits non utilisés perdus). */
export async function syncUserCreditsExpiry(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      actionsResetAt: true,
      monthlyActionsTotal: true,
      monthlyActionsUsed: true,
    },
  });
  if (!user || !areCreditsExpired(user.actionsResetAt)) return false;
  if ((user.monthlyActionsTotal ?? 0) === 0 && (user.monthlyActionsUsed ?? 0) === 0) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      monthlyActionsTotal: 0,
      monthlyActionsUsed: 0,
      actionsResetAt: null,
    },
  });
  return true;
}

export function formatCreditsExpiryLabel(expiresAt: Date | string | null | undefined): string | null {
  if (!expiresAt) return null;
  return new Date(expiresAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
