import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/subscription-plans";

/**
 * GET /api/subscription/me
 * Retourne la formule active, la date de renouvellement et le statut pour le dashboard.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionPlan: true,
      monthlyActionsTotal: true,
      monthlyActionsUsed: true,
      actionsResetAt: true,
      contractStatus: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const plan = user.subscriptionPlan ? getPlan(user.subscriptionPlan) : null;
  const renewsAt = await prisma.subscription
    .findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
      orderBy: { renewsAt: "desc" },
      select: { renewsAt: true },
    })
    .then((s) => s?.renewsAt ?? null);

  return NextResponse.json({
    subscriptionPlan: user.subscriptionPlan,
    planName: plan?.name ?? null,
    monthlyActionsTotal: user.monthlyActionsTotal,
    monthlyActionsUsed: user.monthlyActionsUsed,
    actionsRemaining: Math.max(0, user.monthlyActionsTotal - user.monthlyActionsUsed),
    actionsResetAt: user.actionsResetAt,
    renewsAt,
    contractStatus: user.contractStatus,
  });
}
