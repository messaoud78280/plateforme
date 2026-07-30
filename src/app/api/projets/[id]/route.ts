import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { ChantierStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDeleteChantierProject } from "@/lib/chantier-dossier/access";
import { deleteChantierProjectStorage } from "@/lib/chantier-dossier/delete-project-storage";
import { createServiceRoleClient } from "@/lib/supabase";
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

/** DELETE — Supprimer un chantier et son classeur (confirmation côté client). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, title: true, clientId: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Chantier introuvable" }, { status: 404 });
  }

  if (!canDeleteChantierProject(session.user, project)) {
    return NextResponse.json(
      { error: "Vous n’avez pas l’autorisation de supprimer ce chantier." },
      { status: 403 },
    );
  }

  const supabase = createServiceRoleClient();
  if (supabase) {
    try {
      await deleteChantierProjectStorage(supabase, id);
    } catch (e) {
      console.error("deleteChantierProjectStorage:", e);
    }
  }

  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du chantier." },
      { status: 500 },
    );
  }
}
