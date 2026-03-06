import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/subscription-plans";

/**
 * GET /api/subscription/history
 * Historique des souscriptions et paiements du client.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const [subscriptions, payments] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const planMap = (key: string) => getPlan(key)?.name ?? key;

  return NextResponse.json({
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      planKey: s.planKey,
      planName: planMap(s.planKey),
      status: s.status,
      startedAt: s.startedAt,
      renewsAt: s.renewsAt,
      endedAt: s.endedAt,
      createdAt: s.createdAt,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      planKey: p.planKey,
      planName: planMap(p.planKey),
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      actionsCredited: p.actionsCredited,
      createdAt: p.createdAt,
    })),
  });
}
