import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { agendaTypeMeta } from "@/lib/agenda/types";

/** Notifie responsable + participants lors d’une création / invitation agenda. */
export async function notifyAgendaInvitees(eventId: string) {
  const event = await prisma.agendaEvent.findUnique({
    where: { id: eventId },
    include: {
      attendees: { select: { userId: true } },
      project: { select: { title: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!event || event.status === "ANNULE") return;

  const meta = agendaTypeMeta(event.type);
  const when = event.startAt.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const projectBit = event.project?.title ? ` · ${event.project.title}` : "";
  const title = `Agenda : ${event.title}`;
  const message = `${meta.label} — ${when}${projectBit}. ${event.createdBy.name ? `Par ${event.createdBy.name}.` : ""}`;
  const actionUrl = "/dashboard/agenda";

  const userIds = new Set<string>();
  if (event.responsibleId) userIds.add(event.responsibleId);
  for (const a of event.attendees) userIds.add(a.userId);
  userIds.delete(event.createdById);

  for (const userId of userIds) {
    await createNotification({
      userId,
      type: "AGENDA_INVITE",
      title,
      message,
      actionUrl,
    });
  }
}

/** Rappels agenda (à appeler par cron) — crée une notif si rappel dû et pas encore envoyé. */
export async function processAgendaReminders(now = new Date()) {
  const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const events = await prisma.agendaEvent.findMany({
    where: {
      status: { not: "ANNULE" },
      reminderMinutes: { not: null },
      startAt: { gte: now, lte: horizon },
    },
    include: {
      attendees: { select: { userId: true } },
      project: { select: { title: true } },
    },
    take: 200,
  });

  let notified = 0;
  for (const event of events) {
    const minutes = event.reminderMinutes ?? 0;
    const remindAt = new Date(event.startAt.getTime() - minutes * 60 * 1000);
    if (remindAt > now) continue;
    // fenêtre 15 min pour éviter de rater le cron
    if (now.getTime() - remindAt.getTime() > 15 * 60 * 1000) continue;

    const already = await prisma.notification.findFirst({
      where: {
        type: "AGENDA_REMINDER",
        actionUrl: `/dashboard/agenda?event=${event.id}`,
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (already) continue;

    const when = event.startAt.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
    const message = `${event.title}${event.project?.title ? ` · ${event.project.title}` : ""} — ${when}`;
    const targets = new Set<string>([event.createdById, event.ownerUserId]);
    if (event.responsibleId) targets.add(event.responsibleId);
    for (const a of event.attendees) targets.add(a.userId);

    for (const userId of targets) {
      await createNotification({
        userId,
        type: "AGENDA_REMINDER",
        title: "Rappel agenda",
        message,
        actionUrl: `/dashboard/agenda?event=${event.id}`,
      });
      notified += 1;
    }
  }
  return { notified };
}
