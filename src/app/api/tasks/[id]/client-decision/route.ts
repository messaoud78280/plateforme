import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyManagers } from "@/lib/notifications";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  clientDecisionRequiresNote,
  isClientDecision,
  type ClientDecision,
  CLIENT_DECISION_LABELS,
} from "@/lib/tasks/client-decision";

/**
 * PATCH /api/tasks/[id]/client-decision
 * Client : accepter / refuser / accepter avec réserves un livrable déjà transmis.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isFeatureEnabled("clientDeliverableValidation")) {
    return NextResponse.json({ error: "Fonctionnalité désactivée." }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  let body: { decision?: string; note?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const decision = body.decision;
  if (!isClientDecision(decision) || decision === "EN_ATTENTE_CLIENT") {
    return NextResponse.json(
      { error: "Décision invalide. Choisissez Accepter, Réserves ou Refuser." },
      { status: 400 }
    );
  }

  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (clientDecisionRequiresNote(decision) && note.length < 5) {
    return NextResponse.json(
      {
        error:
          decision === "REFUSE"
            ? "Indiquez le motif du refus (conséquences pour BeWork)."
            : "Précisez vos réserves (ce qui reste à corriger).",
      },
      { status: 400 }
    );
  }

  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      clientId: true,
      projectId: true,
      assignedToId: true,
      clientReportSentAt: true,
      clientDecision: true,
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }
  if (task.clientId !== session.user.id) {
    return NextResponse.json({ error: "Seul le client de la mission peut valider." }, { status: 403 });
  }
  if (!task.clientReportSentAt) {
    return NextResponse.json(
      { error: "Aucun livrable transmis — rien à valider pour l’instant." },
      { status: 400 }
    );
  }
  if (task.clientDecision && task.clientDecision !== "EN_ATTENTE_CLIENT") {
    return NextResponse.json(
      { error: "Une décision a déjà été enregistrée. Contactez BeWork pour une reprise." },
      { status: 400 }
    );
  }

  const now = new Date();
  const updated = await prisma.task.update({
    where: { id },
    data: {
      clientDecision: decision as ClientDecision,
      clientDecisionAt: now,
      clientDecisionNote: note || null,
    },
    select: {
      id: true,
      clientDecision: true,
      clientDecisionAt: true,
      clientDecisionNote: true,
    },
  });

  const label = CLIENT_DECISION_LABELS[decision];
  const clientName = session.user.name ?? "Le client";
  const actionUrl = `/dashboard/taches/${id}#compte-rendu`;

  const notifTitle =
    decision === "ACCEPTE"
      ? "Livrable accepté"
      : decision === "RESERVES"
        ? "Livrable avec réserves"
        : "Livrable refusé";

  const notifMessage = `${clientName} — « ${task.title} » : ${label}${note ? `. ${note.slice(0, 180)}` : ""}`;

  if (task.assignedToId) {
    await createNotification({
      userId: task.assignedToId,
      type: "CLIENT_DECISION",
      title: notifTitle,
      message: notifMessage,
      actionUrl,
    });
  }
  await notifyManagers({
    type: "CLIENT_DECISION",
    title: notifTitle,
    message: notifMessage,
    actionUrl,
  });

  await prisma.activity.create({
    data: {
      type: "CLIENT_DECISION_RECU",
      title: `${label} — ${task.title}`,
      detail: note || null,
      clientId: task.clientId,
      projectId: task.projectId,
      metadata: {
        taskId: id,
        decision,
        decidedBy: session.user.id,
      },
    },
  });

  if (decision === "REFUSE" || decision === "RESERVES") {
    try {
      await prisma.alert.create({
        data: {
          title: notifTitle,
          message: notifMessage,
          level: decision === "REFUSE" ? "URGENT" : "WARNING",
          clientId: task.clientId,
          actionUrl,
        },
      });
    } catch {
      /* table Alert optionnelle */
    }
  }

  return NextResponse.json(updated);
}
