import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/subscription-plans";
import { buildCreditsGrantUpdate } from "@/lib/credits-lifecycle";

/**
 * Après un paiement réussi : créditer les actions, mettre à jour User et Subscription.
 * Validité : 30 jours à compter de la date d'achat (tous forfaits).
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
  const renewsAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new Error("Utilisateur introuvable");

    await tx.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: planKey,
        ...buildCreditsGrantUpdate(plan.actionsIncluded, now),
      },
    });

    await tx.actionsTransaction.create({
      data: {
        userId,
        type: "CREDIT",
        source: "SUBSCRIPTION",
        amount: plan.actionsIncluded,
        description: `Crédit ${plan.name} - ${plan.actionsLabel} (validité 30 jours)`,
        referenceId: paymentId,
      },
    });

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
