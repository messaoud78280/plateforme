import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncUserCreditsExpiry } from "@/lib/actions";
import { formatCreditsExpiryLabel } from "@/lib/actions";
import { canViewClientCredits } from "@/lib/clients/credits-access";

/** GET — Solde crédits d'un client (gérant, agence, agent assigné) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { clientId } = await params;
  const allowed = await canViewClientCredits(session.user.id, session.user.role, clientId);
  if (!allowed) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: clientId, role: "CLIENT" },
    select: {
      id: true,
      name: true,
      monthlyActionsTotal: true,
      monthlyActionsUsed: true,
      actionsResetAt: true,
      subscriptionPlan: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  await syncUserCreditsExpiry(clientId);

  const refreshed = await prisma.user.findUnique({
    where: { id: clientId },
    select: {
      monthlyActionsTotal: true,
      monthlyActionsUsed: true,
      actionsResetAt: true,
    },
  });

  const total = refreshed?.monthlyActionsTotal ?? user.monthlyActionsTotal ?? 0;
  const used = refreshed?.monthlyActionsUsed ?? user.monthlyActionsUsed ?? 0;
  const remaining = Math.max(0, total - used);

  return NextResponse.json({
    clientId,
    clientName: user.name,
    monthlyActionsTotal: total,
    monthlyActionsUsed: used,
    remaining,
    expiryLabel: formatCreditsExpiryLabel(refreshed?.actionsResetAt ?? user.actionsResetAt),
    subscriptionPlan: user.subscriptionPlan,
  });
}
