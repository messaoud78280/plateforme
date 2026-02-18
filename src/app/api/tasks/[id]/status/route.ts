import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** PATCH /api/tasks/[id]/status – Changer le statut d'une tâche */
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

  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }
    if (!isAgence && existing.clientId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const status = body?.status as "EN_COURS" | "COMPLETE" | "EN_ATTENTE" | undefined;
    if (!status || !["EN_COURS", "COMPLETE", "EN_ATTENTE"].includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide (EN_COURS, COMPLETE, EN_ATTENTE)" },
        { status: 400 }
      );
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === "COMPLETE" ? new Date() : null,
      },
    });
    return NextResponse.json(task);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors du changement de statut" },
      { status: 500 }
    );
  }
}
