import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/projets – Liste des projets accessibles par l'utilisateur */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";

  try {
    const projects = await prisma.project.findMany({
      where: isAgence
        ? {}
        : { clientId: session.user.id },
      select: {
        id: true,
        title: true,
        clientId: true,
        client: { select: { id: true, name: true } },
        assignedToId: true,
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Erreur liste projets:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets." },
      { status: 500 }
    );
  }
}
