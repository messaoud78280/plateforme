import { prisma } from "@/lib/prisma";
import { syncUserCreditsExpiry } from "@/lib/actions";

export type DeductTaskCreditsResult = {
  deducted: number;
  alreadyDone: boolean;
  skippedReason?: string;
};

/**
 * Débite le compteur client pour une mission (idempotent via creditsDeductedAt).
 * À appeler à la validation / clôture définitive (statut COMPLETE).
 */
/**
 * Met à jour le nombre de crédits à débiter (avant débit effectif).
 */
export async function setTaskActionsUsed(
  taskId: string,
  actionsUsed: number
): Promise<{ ok: boolean; error?: string }> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { creditsDeductedAt: true },
  });
  if (!task) return { ok: false, error: "Mission introuvable" };
  if (task.creditsDeductedAt) {
    return { ok: false, error: "Les crédits ont déjà été décomptés." };
  }
  const amount = Math.max(0, Math.round(actionsUsed));
  await prisma.task.update({
    where: { id: taskId },
    data: { actionsUsed: amount > 0 ? amount : null },
  });
  return { ok: true };
}

export async function deductTaskCreditsIfNeeded(taskId: string): Promise<DeductTaskCreditsResult> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      clientId: true,
      actionsUsed: true,
      creditsDeductedAt: true,
    },
  });

  if (!task) {
    return { deducted: 0, alreadyDone: false, skippedReason: "Tâche introuvable" };
  }

  if (task.creditsDeductedAt) {
    return { deducted: task.actionsUsed ?? 0, alreadyDone: true };
  }

  const amount = task.actionsUsed ?? 0;
  if (amount <= 0) {
    return { deducted: 0, alreadyDone: false, skippedReason: "Aucun crédit à débiter" };
  }

  await syncUserCreditsExpiry(task.clientId);

  await prisma.$transaction(async (tx) => {
    const current = await tx.task.findUnique({
      where: { id: taskId },
      select: { creditsDeductedAt: true, actionsUsed: true, clientId: true, title: true },
    });
    if (!current || current.creditsDeductedAt) return;

    const debit = current.actionsUsed ?? 0;
    if (debit <= 0) return;

    await tx.user.update({
      where: { id: current.clientId },
      data: { monthlyActionsUsed: { increment: debit } },
    });

    await tx.actionsTransaction.create({
      data: {
        userId: current.clientId,
        type: "DEBIT",
        source: "TASK_DEDUCTION",
        amount: -debit,
        description: `Mission « ${current.title} » — ${debit} crédit${debit > 1 ? "s" : ""}`,
        referenceId: taskId,
      },
    });

    await tx.task.update({
      where: { id: taskId },
      data: { creditsDeductedAt: new Date() },
    });

    await tx.activity.create({
      data: {
        type: "TASK_CREDITS_DEDUCTED",
        title: `Crédits débités — ${current.title}`,
        detail: `${debit} crédit${debit > 1 ? "s" : ""} décomptés du compteur client`,
        clientId: current.clientId,
        metadata: { taskId, amount: debit },
      },
    });
  });

  const updated = await prisma.task.findUnique({
    where: { id: taskId },
    select: { creditsDeductedAt: true, actionsUsed: true },
  });

  if (updated?.creditsDeductedAt) {
    return { deducted: updated.actionsUsed ?? amount, alreadyDone: false };
  }

  return { deducted: 0, alreadyDone: false, skippedReason: "Débit non effectué" };
}
