import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessTaskThread } from "@/lib/messaging/access";
import { messagerieDeepLink } from "@/lib/messagerie/bework-actions";
import { badgeFromMeta } from "@/lib/messagerie/message-links";

/**
 * GET /api/tasks/[id]/conversation-context
 * Panneau dossier : à faire, événements, éléments en attente (sans alourdir le chat).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: taskId } = await params;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      clientId: true,
      assignedToId: true,
      projectId: true,
      project: { select: { id: true, title: true } },
    },
  });
  if (!task) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const can = await canAccessTaskThread(session.user, task);
  if (!can) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const messageIds = (
    await prisma.taskMessage.findMany({
      where: { taskId },
      select: { id: true },
      take: 200,
    })
  ).map((m) => m.id);

  const [openActions, agendaEvents, sheets] = await Promise.all([
    messageIds.length
      ? prisma.messageAction.findMany({
          where: {
            sourceMessageKind: "TASK",
            sourceMessageId: { in: messageIds },
            status: "OPEN",
            type: { in: ["REMINDER", "ASSIGN"] },
          },
          select: {
            id: true,
            title: true,
            type: true,
            priority: true,
            dueAt: true,
            sourceMessageId: true,
            metaJson: true,
            assignee: { select: { name: true } },
          },
          orderBy: { dueAt: "asc" },
          take: 20,
        })
      : Promise.resolve([]),
    task.projectId
      ? prisma.agendaEvent.findMany({
          where: {
            projectId: task.projectId,
            status: { not: "ANNULE" },
            startAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            startAt: true,
            sourceMessageKind: true,
            sourceMessageId: true,
          },
          orderBy: { startAt: "asc" },
          take: 12,
        })
      : Promise.resolve([]),
    task.projectId
      ? prisma.followUpSheet.findMany({
          where: {
            projectId: task.projectId,
            status: { notIn: ["TERMINE", "ARCHIVE"] },
          },
          select: {
            id: true,
            title: true,
            status: true,
            nextAction: true,
            nextActionAt: true,
            nextActionDone: true,
            orderNumber: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
  ]);

  const todo = openActions.map((a) => ({
    id: a.id,
    title: a.title,
    priority: a.priority,
    dueAt: a.dueAt?.toISOString() ?? null,
    assigneeName: a.assignee?.name ?? null,
    href: messagerieDeepLink("TASK", a.sourceMessageId, { taskId }),
    kind: a.type === "REMINDER" ? "rappel" : "assignation",
  }));

  const events = agendaEvents.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    status: e.status,
    startAt: e.startAt.toISOString(),
    href: `/dashboard/agenda?event=${e.id}`,
    messageHref:
      e.sourceMessageKind === "TASK" && e.sourceMessageId
        ? messagerieDeepLink("TASK", e.sourceMessageId, { taskId })
        : null,
  }));

  const pending = sheets
    .filter((s) => s.nextAction && !s.nextActionDone)
    .map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      nextAction: s.nextAction,
      nextActionAt: s.nextActionAt?.toISOString() ?? null,
      href: `/dashboard/fiches-suivi/${s.id}`,
    }));

  const waiting = {
    avenants: sheets.filter((s) => s.status === "AVENANT").length,
    commandes: sheets.filter((s) =>
      ["COMMANDE_PASSEE", "ATTENTE_FOURNISSEUR"].includes(s.status),
    ).length,
    aFacturer: sheets.filter((s) =>
      ["A_FACTURER", "TRAVAUX_TERMINES"].includes(s.status),
    ).length,
  };

  const linkedBadges =
    messageIds.length > 0
      ? await prisma.messageAction.findMany({
          where: {
            sourceMessageKind: "TASK",
            sourceMessageId: { in: messageIds },
            type: "LINK",
          },
          select: { sourceMessageId: true, type: true, metaJson: true, agendaEventId: true, taskId: true, followUpSheetId: true },
          take: 100,
        })
      : [];

  const badgesByMessage: Record<string, string[]> = {};
  for (const l of linkedBadges) {
    const badge = badgeFromMeta(l.metaJson, l.type);
    if (!badgesByMessage[l.sourceMessageId]) badgesByMessage[l.sourceMessageId] = [];
    if (!badgesByMessage[l.sourceMessageId]!.includes(badge)) {
      badgesByMessage[l.sourceMessageId]!.push(badge);
    }
  }

  return NextResponse.json({
    project: task.project,
    todo,
    events,
    pending,
    waiting,
    badgesByMessage,
  });
}
