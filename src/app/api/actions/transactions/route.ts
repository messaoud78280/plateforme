import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/actions/transactions
 * Historique des mouvements d'actions (crédits, débits, ajustements).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const transactions = await prisma.actionsTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const sourceLabels: Record<string, string> = {
    SUBSCRIPTION: "Souscription",
    ONE_TIME: "Offre Découverte",
    RENEWAL: "Renouvellement",
    ADMIN: "Ajustement",
    TASK_DEDUCTION: "Tâche terminée",
  };

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      source: t.source,
      sourceLabel: sourceLabels[t.source] ?? t.source,
      amount: t.amount,
      description: t.description,
      createdAt: t.createdAt,
    })),
  });
}
