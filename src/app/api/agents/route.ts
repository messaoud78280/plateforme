import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/agents – Liste des utilisateurs AGENCE et AGENT (pour assignation des tâches) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "AGENCE" && session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Réservé à l'agence" }, { status: 403 });
  }

  try {
    const agents = await prisma.user.findMany({
      where: { role: { in: ["AGENCE", "AGENT"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(agents);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors du chargement des agents" },
      { status: 500 }
    );
  }
}
