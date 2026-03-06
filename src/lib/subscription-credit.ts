/**
 * Logique de crédit d'actions après paiement validé.
 */

import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/subscription-plans";
import { getMonthStart } from "@/lib/actions";

/**
 * Après un paiement réussi : créditer les actions, mettre à jour User et Subscription.
 * - Offre Découverte : 60 actions une fois, pas de renouvellement
 * - Standard / Business / Premium : crédit mensuel, renouvellement à J+1 mois
 */
export async function creditActionsAfterPayment(
  userId: string,
  planKey: string,
  paymentId: string,
  subscriptionId: string | null
): Promise<{ success: boolean; error?: string }> {
  const plan = getPlan(planKey);
  if (!plan) return { success: false, error: "Formule inconnue" };

  const now = new Date();
  const renewsAt = plan.billing === "monthly"
    ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 0, 0, 0, 0)
    : null;

  await prisma.$transaction(async (tx) => {
    // 1. Crédit sur le compte User (remplace le quota du mois)
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { monthlyActionsUsed: true, actionsResetAt: true },
    });
    if (!user) throw new Error("Utilisateur introuvable");

    const monthStart = getMonthStart(now);
    await tx.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: planKey,
        monthlyActionsTotal: plan.actionsIncluded,
        monthlyActionsUsed: 0,
        actionsResetAt: monthStart,
      },
    });

    // 2. Enregistrer la transaction d'actions (historique)
    await tx.actionsTransaction.create({
      data: {
        userId,
        type: "CREDIT",
        source: plan.billing === "one_shot" ? "ONE_TIME" : "SUBSCRIPTION",
        amount: plan.actionsIncluded,
        description: `Crédit ${plan.name} - ${plan.actionsLabel}`,
        referenceId: paymentId,
      },
    });

    // 3. Mettre à jour ou créer la Subscription
    if (subscriptionId) {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { status: "ACTIVE", renewsAt, updatedAt: now },
      });
    } else {
      await tx.subscription.create({
        data: {
          userId,
          planKey,
          status: "ACTIVE",
          startedAt: now,
          renewsAt,
          updatedAt: now,
        },
      });
    }
  });

  return { success: true };
}
