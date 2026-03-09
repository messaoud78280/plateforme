import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/missions/history — Historique des missions terminées (client) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (session.user.role !== "CLIENT") {
    return NextResponse.json(
      { error: "Réservé aux clients" },
      { status: 403 }
    );
  }

  try {
    const missions = await prisma.task.findMany({
      where: {
        clientId: session.user.id,
        status: "COMPLETE",
        completedAt: { not: null },
      },
      select: {
        id: true,
        title: true,
        description: true,
        completedAt: true,
        contactsJson: true,
        suppliersJson: true,
        documents: {
          select: { id: true, name: true, fileUrl: true, category: true },
        },
      },
      orderBy: { completedAt: "desc" },
      take: 50,
    });

    return NextResponse.json(missions);
  } catch (e) {
    console.error("Erreur historique missions:", e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    );
  }
}
