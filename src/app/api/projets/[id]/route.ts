import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { ChantierStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAgencyOrManager, isBeworkStaff } from "@/lib/authz";
import { projectLifecycleWrite } from "@/lib/chantier-lifecycle";

const CHANTIER_STATUSES: ChantierStatus[] = ["ETUDE", "EN_COURS", "EN_ATTENTE", "RECEPTION", "TERMINE"];

/** PATCH /api/projets/[id] – Assigner un agent et/ou mettre à jour le cycle de vie chantier */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const isAgence = isAgencyOrManager(session.user);
  const isStaff = isBeworkStaff(session.user);

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  // Accès lecture API : staff BeWork ou client propriétaire (mutations staff plus bas).
  const canAccess = isStaff || project.clientId === session.user.id;
  if (!canAccess) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      assignedToId?: string | null;
      chantierStatus?: string;
    };

    const hasAssign = Object.prototype.hasOwnProperty.call(body, "assignedToId");
    const hasChantierStatus = Object.prototype.hasOwnProperty.call(body, "chantierStatus");

    if (!hasAssign && !hasChantierStatus) {
      return NextResponse.json(
        { error: "Indiquez assignedToId et/ou chantierStatus." },
        { status: 400 },
      );
    }

    if ((hasAssign || hasChantierStatus) && !isStaff) {
      return NextResponse.json(
        { error: "Seul BeWork peut modifier l'assignation ou le statut chantier." },
        { status: 403 },
      );
    }

    // Assigner un agent : réservé décideurs (agence / gérant)
    if (hasAssign && !isAgence) {
      return NextResponse.json(
        { error: "Seule l'agence peut assigner un agent au projet." },
        { status: 403 },
      );
    }

    const data: {
      assignedToId?: string | null;
      chantierStatus?: ChantierStatus;
      status?: ReturnType<typeof projectLifecycleWrite>["status"];
    } = {};

    if (hasAssign) {
      const value =
        body.assignedToId && typeof body.assignedToId === "string"
          ? body.assignedToId.trim()
          : null;
      if (value) {
        const agent = await prisma.user.findFirst({
          where: { id: value, role: { in: ["AGENCE", "AGENT"] } },
        });
        if (!agent) {
          return NextResponse.json(
            { error: "Cet utilisateur n'est pas un agent BeWork." },
            { status: 400 },
          );
        }
      }
      data.assignedToId = value;
    }

    if (hasChantierStatus) {
      const raw = String(body.chantierStatus ?? "").trim();
      if (!CHANTIER_STATUSES.includes(raw as ChantierStatus)) {
        return NextResponse.json({ error: "Statut chantier invalide." }, { status: 400 });
      }
      Object.assign(data, projectLifecycleWrite(raw as ChantierStatus));
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du projet" },
      { status: 500 },
    );
  }
}

/**
 * DELETE — suppression définitive uniquement (chantier déjà archivé, sans lock commercial).
 * Préférer POST /api/projets/[id]/archive { action: "archive" } pour le soft-delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    confirmation?: string;
  };

  const { hardDeleteProject } = await import("@/lib/chantier/project-archive");
  const result = await hardDeleteProject({
    projectId: id,
    user: { id: session.user.id, role: session.user.role },
    confirmation: body.confirmation ?? "SUPPRIMER",
  });

  if (!result.ok) {
    const status =
      result.code === "NOT_FOUND"
        ? 404
        : result.code === "FORBIDDEN"
          ? 403
          : result.code === "COMMERCIAL_LOCK"
            ? 409
            : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    ok: true,
    projectId: result.projectId,
    title: result.title,
  });
}
