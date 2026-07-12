import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";
import { deductTaskCreditsIfNeeded, setTaskActionsUsed } from "@/lib/tasks/deduct-credits";
import type { ClientDeliveryPayload } from "@/lib/tasks/client-delivery";
import { isFeatureEnabled } from "@/lib/feature-flags";

/** GET /api/tasks/[id]/client-report — Compte rendu client (client ou équipe) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const isStaff = session.user.role === "MANAGER" || session.user.role === "AGENCE";

  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      clientId: true,
      status: true,
      clientReport: true,
      clientReportSentAt: true,
      actionsUsed: true,
      creditsDeductedAt: true,
      clientDeliveryJson: true,
      correctionNote: true,
      clientDecision: true,
      clientDecisionAt: true,
      clientDecisionNote: true,
      documents: { select: { id: true, name: true } },
      chantierFiles: {
        where: { fileUrl: { not: null } },
        select: {
          id: true,
          name: true,
          folder: { select: { code: true, label: true } },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
  }

  if (!isStaff && task.clientId !== session.user.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  if (!isStaff && !task.clientReportSentAt) {
    return NextResponse.json({ error: "Compte rendu non disponible" }, { status: 404 });
  }

  const delivery = task.clientDeliveryJson as ClientDeliveryPayload | null;
  const visibleDocIds = new Set(delivery?.visibleDocumentIds ?? []);
  const visibleChantierIds = new Set(delivery?.visibleChantierFileIds ?? []);

  const documents =
    isStaff && !task.clientReportSentAt
      ? task.documents
      : task.documents.filter((d) => visibleDocIds.has(d.id));

  const chantierFiles =
    isStaff && !task.clientReportSentAt
      ? task.chantierFiles.map((f) => ({
          id: f.id,
          name: f.name,
          folderLabel: `${f.folder.code} · ${f.folder.label}`,
        }))
      : task.chantierFiles
          .filter((f) => visibleChantierIds.has(f.id))
          .map((f) => ({
            id: f.id,
            name: f.name,
            folderLabel: `${f.folder.code} · ${f.folder.label}`,
          }));

  const clientCorrection =
    delivery?.showCorrectionNote && task.correctionNote ? task.correctionNote : null;

  return NextResponse.json({
    clientReport: task.clientReport,
    clientReportSentAt: task.clientReportSentAt,
    actionsUsed: task.actionsUsed,
    creditsDeductedAt: task.creditsDeductedAt,
    status: task.status,
    clientDelivery: delivery,
    documents,
    chantierFiles,
    correctionNoteForClient: clientCorrection,
    clientDecision: task.clientDecision,
    clientDecisionAt: task.clientDecisionAt,
    clientDecisionNote: task.clientDecisionNote,
  });
}

/** POST /api/tasks/[id]/client-report — Transmettre au client (gérant / agence) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "MANAGER" && session.user.role !== "AGENCE") {
    return NextResponse.json({ error: "Réservé à l'équipe BeWork" }, { status: 403 });
  }

  const { id } = await params;
  let body: {
    content?: string;
    actionsUsed?: number;
    visibleDocumentIds?: string[];
    visibleChantierFileIds?: string[];
    showCorrectionNote?: boolean;
    validateIfNeeded?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json(
      { error: "Le compte rendu ne peut pas être vide." },
      { status: 400 }
    );
  }

  const actionsUsed =
    typeof body.actionsUsed === "number" && body.actionsUsed >= 1
      ? Math.round(body.actionsUsed)
      : null;

  if (!actionsUsed) {
    return NextResponse.json(
      { error: "Indiquez le nombre de crédits à décompter (minimum 1)." },
      { status: 400 }
    );
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, email: true } },
      documents: { select: { id: true } },
      chantierFiles: { select: { id: true, projectId: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
  }

  if (task.clientReportSentAt) {
    return NextResponse.json({ error: "Compte rendu déjà transmis." }, { status: 400 });
  }

  if (task.status !== "COMPLETE" && task.status !== "A_VALIDER") {
    return NextResponse.json(
      { error: "La mission doit être à valider ou terminée pour transmettre au client." },
      { status: 400 }
    );
  }

  const docIds = new Set(task.documents.map((d) => d.id));
  const chantierIds = new Set(task.chantierFiles.map((f) => f.id));
  const visibleDocumentIds = (body.visibleDocumentIds ?? []).filter((i) => docIds.has(i));
  const visibleChantierFileIds = (body.visibleChantierFileIds ?? []).filter((i) =>
    chantierIds.has(i)
  );

  const clientDelivery: ClientDeliveryPayload = {
    visibleDocumentIds,
    visibleChantierFileIds,
    showCorrectionNote: Boolean(body.showCorrectionNote),
  };

  try {
    const setResult = await setTaskActionsUsed(id, actionsUsed);
    if (!setResult.ok && !task.creditsDeductedAt) {
      return NextResponse.json({ error: setResult.error ?? "Crédits non modifiables" }, { status: 400 });
    }

    if (body.validateIfNeeded && task.status === "A_VALIDER") {
      await prisma.task.update({
        where: { id },
        data: {
          validatedAt: new Date(),
          status: "COMPLETE",
          completedAt: new Date(),
          actionsUsed,
        },
      });
    }

    const creditResult = await deductTaskCreditsIfNeeded(id);
    const now = new Date();

    const updated = await prisma.task.update({
      where: { id },
      data: {
        clientReport: content,
        clientReportSentAt: now,
        clientReportSentById: session.user.id,
        clientDeliveryJson: clientDelivery,
        actionsUsed,
        ...(isFeatureEnabled("clientDeliverableValidation")
          ? {
              clientDecision: "EN_ATTENTE_CLIENT",
              clientDecisionAt: null,
              clientDecisionNote: null,
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        clientReport: true,
        clientReportSentAt: true,
        actionsUsed: true,
        creditsDeductedAt: true,
        clientId: true,
        clientDecision: true,
      },
    });

    const creditsLabel = `${updated.actionsUsed ?? 0} crédit${(updated.actionsUsed ?? 0) > 1 ? "s" : ""}`;
    const piecesCount = visibleDocumentIds.length + visibleChantierFileIds.length;
    const managerName = session.user.name ?? "L'équipe BeWork";
    const validationHint = isFeatureEnabled("clientDeliverableValidation")
      ? " Merci de valider, formuler des réserves ou refuser le livrable dans votre espace."
      : "";

    await createNotification({
      userId: task.clientId,
      type: "TASK_COMPLETED",
      title: "Compte rendu de mission",
      message: `${managerName} vous a transmis le compte rendu de « ${task.title} » (${creditsLabel} décomptés${piecesCount > 0 ? `, ${piecesCount} pièce${piecesCount > 1 ? "s" : ""}` : ""}).${validationHint}`,
      actionUrl: `/dashboard/taches/${id}#compte-rendu`,
    });

    await prisma.activity.create({
      data: {
        type: "TASK_REPORT_SENT",
        title: `Compte rendu envoyé — ${task.title}`,
        detail: `${creditsLabel} décomptés · Client ${task.client.name}`,
        clientId: task.clientId,
        projectId: task.projectId,
        metadata: {
          taskId: id,
          actionsUsed: updated.actionsUsed,
          sentBy: session.user.id,
          sentByName: managerName,
          visibleDocumentIds,
          visibleChantierFileIds,
        },
      },
    });

    if (task.client.email) {
      const taskUrl = absoluteUrl(`/dashboard/taches/${id}#compte-rendu`);
      const piecesHtml =
        piecesCount > 0
          ? `<p><strong>Pièces jointes :</strong> ${piecesCount} document${piecesCount > 1 ? "s" : ""} disponible${piecesCount > 1 ? "s" : ""} dans votre espace.</p>`
          : "";
      const correctionHtml =
        clientDelivery.showCorrectionNote && task.correctionNote
          ? `<p><strong>Point de vigilance :</strong></p><p style="white-space:pre-wrap">${task.correctionNote.replace(/</g, "&lt;")}</p>`
          : "";

      await sendEmail({
        to: task.client.email,
        subject: `Compte rendu — ${task.title}`,
        html: `
          <p>Bonjour ${task.client.name ?? ""},</p>
          <p>Votre mission <strong>${task.title}</strong> est terminée. Voici le compte rendu de l'équipe BeWork :</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;white-space:pre-wrap;">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          ${correctionHtml}
          ${piecesHtml}
          <p><strong>Crédits décomptés :</strong> ${creditsLabel}</p>
          ${
            isFeatureEnabled("clientDeliverableValidation")
              ? `<p><strong>À faire :</strong> ouvrez votre espace pour <em>accepter</em>, formuler des <em>réserves</em> ou <em>refuser</em> le livrable. Expliquez les conséquences si vous refusez ou émettez des réserves.</p>`
              : ""
          }
          <p><a href="${taskUrl}">Consulter sur votre espace BeWork</a></p>
        `,
      });
    }

    return NextResponse.json({
      ...updated,
      creditsDeducted: creditResult.deducted,
      creditsAlreadyDeducted: creditResult.alreadyDone,
    });
  } catch (e) {
    console.error("Task client-report:", e);
    return NextResponse.json(
      { error: "Impossible d'envoyer le compte rendu. Réessayez ou contactez le support." },
      { status: 500 }
    );
  }
}
