import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncUserCreditsExpiry, formatCreditsExpiryLabel } from "@/lib/actions";
import { parseClientDeliveryJson } from "@/lib/tasks/client-delivery";
import { canViewClientCredits } from "@/lib/clients/credits-access";

/** GET — Données pour préparer la transmission au client */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const isStaff = session.user.role === "MANAGER" || session.user.role === "AGENCE";
  if (!isStaff) {
    return NextResponse.json({ error: "Réservé à l'équipe BeWork" }, { status: 403 });
  }

  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      status: true,
      clientId: true,
      projectId: true,
      actionsUsed: true,
      timeSpentMinutes: true,
      creditsDeductedAt: true,
      clientReport: true,
      clientReportSentAt: true,
      correctionNote: true,
      clientDeliveryJson: true,
      client: { select: { id: true, name: true } },
      documents: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, createdAt: true },
      },
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
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const canCredits = await canViewClientCredits(session.user.id, session.user.role, task.clientId);
  let clientCredits = null;
  if (canCredits) {
    await syncUserCreditsExpiry(task.clientId);
    const u = await prisma.user.findUnique({
      where: { id: task.clientId },
      select: { monthlyActionsTotal: true, monthlyActionsUsed: true, actionsResetAt: true },
    });
    const total = u?.monthlyActionsTotal ?? 0;
    const used = u?.monthlyActionsUsed ?? 0;
    clientCredits = {
      monthlyActionsTotal: total,
      monthlyActionsUsed: used,
      remaining: Math.max(0, total - used),
      expiryLabel: formatCreditsExpiryLabel(u?.actionsResetAt),
    };
  }

  const delivery = parseClientDeliveryJson(task.clientDeliveryJson);

  return NextResponse.json({
    status: task.status,
    actionsUsed: task.actionsUsed,
    timeSpentMinutes: task.timeSpentMinutes,
    creditsDeductedAt: task.creditsDeductedAt,
    clientReport: task.clientReport,
    clientReportSentAt: task.clientReportSentAt,
    correctionNote: task.correctionNote,
    clientDelivery: delivery,
    clientCredits,
    documents: task.documents,
    chantierFiles: task.chantierFiles.map((f) => ({
      id: f.id,
      name: f.name,
      folderLabel: `${f.folder.code} · ${f.folder.label}`,
    })),
    defaultVisibleDocumentIds: delivery?.visibleDocumentIds?.length
      ? delivery.visibleDocumentIds
      : task.documents.map((d) => d.id),
    defaultVisibleChantierFileIds: delivery?.visibleChantierFileIds?.length
      ? delivery.visibleChantierFileIds
      : task.chantierFiles.map((f) => f.id),
  });
}
