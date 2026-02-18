import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** PATCH /api/projets/[id] – Mettre à jour un projet (agence : assigner un agent) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const canAccess = isAgence || project.clientId === session.user.id;
  if (!canAccess) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Seule l'agence peut modifier l'agent assigné
  if (!isAgence) {
    return NextResponse.json(
      { error: "Seule l'agence peut assigner un agent au projet." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { assignedToId } = body as { assignedToId?: string | null };

    if (!body.hasOwnProperty("assignedToId")) {
      return NextResponse.json(
        { error: "assignedToId requis" },
        { status: 400 }
      );
    }

    const value = assignedToId && typeof assignedToId === "string" ? assignedToId.trim() : null;
    if (value) {
      const agent = await prisma.user.findFirst({
        where: { id: value, role: "AGENCE" },
      });
      if (!agent) {
        return NextResponse.json(
          { error: "Cet utilisateur n'est pas un agent de l'agence." },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { assignedToId: value },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du projet" },
      { status: 500 }
    );
  }
}
