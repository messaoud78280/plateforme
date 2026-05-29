import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";
import { deductTaskCreditsIfNeeded } from "@/lib/tasks/deduct-credits";

/** GET /api/tasks/[id]/client-report — Compte rendu client (client ou gérante) */
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

  return NextResponse.json({
    clientReport: task.clientReport,
    clientReportSentAt: task.clientReportSentAt,
    actionsUsed: task.actionsUsed,
    creditsDeductedAt: task.creditsDeductedAt,
    status: task.status,
  });
}

/** POST /api/tasks/[id]/client-report — Envoyer le compte rendu au client (gérante) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "MANAGER" && session.user.role !== "AGENCE") {
    return NextResponse.json({ error: "Réservé à la gérante" }, { status: 403 });
  }

  const { id } = await params;
  let body: { content?: string };
  try {
    body = (await request.json()) as { content?: string };
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

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, email: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
  }

  if (task.status !== "COMPLETE") {
    return NextResponse.json(
      { error: "Le compte rendu ne peut être envoyé que pour une mission validée et terminée." },
      { status: 400 }
    );
  }

  if (!task.actionsUsed || task.actionsUsed <= 0) {
    return NextResponse.json(
      { error: "Aucun crédit n'est renseigné sur cette mission. Vérifiez le temps passé avant l'envoi." },
      { status: 400 }
    );
  }

  try {
    const creditResult = await deductTaskCreditsIfNeeded(id);
    const now = new Date();

    const updated = await prisma.task.update({
      where: { id },
      data: {
        clientReport: content,
        clientReportSentAt: now,
        clientReportSentById: session.user.id,
      },
      select: {
        id: true,
        title: true,
        clientReport: true,
        clientReportSentAt: true,
        actionsUsed: true,
        creditsDeductedAt: true,
        clientId: true,
      },
    });

    const creditsLabel = `${updated.actionsUsed ?? 0} crédit${(updated.actionsUsed ?? 0) > 1 ? "s" : ""}`;
    const managerName = session.user.name ?? "L'équipe BeWork";

    await createNotification({
      userId: task.clientId,
      type: "TASK_COMPLETED",
      title: "Compte rendu de mission",
      message: `${managerName} vous a transmis le compte rendu de « ${task.title} » (${creditsLabel} décomptés).`,
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
        },
      },
    });

    if (task.client.email) {
      const taskUrl = absoluteUrl(`/dashboard/taches/${id}#compte-rendu`);
      await sendEmail({
        to: task.client.email,
        subject: `Compte rendu — ${task.title}`,
        html: `
          <p>Bonjour ${task.client.name ?? ""},</p>
          <p>Votre mission <strong>${task.title}</strong> est terminée. Voici le compte rendu de l'équipe BeWork :</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;white-space:pre-wrap;">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          <p><strong>Crédits décomptés :</strong> ${creditsLabel}</p>
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
