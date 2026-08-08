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

/** Événements passés encore PLANIFIE → alerte (ne pas laisser un RDV sans clôture). */
export async function processAgendaUnclosed(now = new Date()) {
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const events = await prisma.agendaEvent.findMany({
    where: {
      status: "PLANIFIE",
      endAt: { lt: now, gte: since },
    },
    include: {
      project: { select: { title: true } },
      followUpSheet: { select: { id: true, title: true } },
    },
    take: 150,
    orderBy: { endAt: "asc" },
  });

  let notified = 0;
  const stale = new Date(now.getTime() - 20 * 60 * 60 * 1000);

  for (const event of events) {
    const actionUrl = `/dashboard/agenda?event=${event.id}`;
    const already = await prisma.notification.findFirst({
      where: {
        type: "AGENDA_UNCLOSED",
        actionUrl,
        createdAt: { gte: stale },
      },
      select: { id: true },
    });
    if (already) continue;

    const when = event.endAt.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
    const ficheBit = event.followUpSheet
      ? ` Mettre à jour la fiche « ${event.followUpSheet.title} ».`
      : "";
    const message = `« ${event.title} » terminé le ${when} mais encore « Planifié ».${
      event.project?.title ? ` · ${event.project.title}.` : ""
    }${ficheBit}`;

    const targets = new Set<string>([event.createdById, event.ownerUserId]);
    if (event.responsibleId) targets.add(event.responsibleId);

    for (const userId of targets) {
      await createNotification({
        userId,
        type: "AGENDA_UNCLOSED",
        title: "Événement à clôturer",
        message,
        actionUrl: event.followUpSheet
          ? `/dashboard/fiches-suivi/${event.followUpSheet.id}`
          : actionUrl,
      });
      notified += 1;
    }
  }

  return { notified };
}

/**
 * Livraisons passées non marquées reçues (TERMINE).
 * ORANGE ~1h30 après l’heure prévue, ROUGE ~4h — avec lien message d’origine si présent.
 */
export async function processDeliveryAlerts(now = new Date()) {
  const since = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const events = await prisma.agendaEvent.findMany({
    where: {
      type: "LIVRAISON",
      status: { in: ["PLANIFIE", "CONFIRME"] },
      startAt: { lt: now, gte: since },
    },
    include: {
      project: { select: { title: true } },
      followUpSheet: { select: { id: true, title: true } },
    },
    take: 120,
    orderBy: { startAt: "asc" },
  });

  let notified = 0;
  const stale = new Date(now.getTime() - 18 * 60 * 60 * 1000);

  for (const event of events) {
    const hoursLate = (now.getTime() - event.startAt.getTime()) / (1000 * 60 * 60);
    if (hoursLate < 1.5) continue;

    const level = hoursLate >= 4 ? "ROUGE" : "ORANGE";
    const notifType = level === "ROUGE" ? "DELIVERY_MISSING" : "DELIVERY_CHECK";
    const actionUrl = `/dashboard/agenda?event=${event.id}`;

    const already = await prisma.notification.findFirst({
      where: { type: notifType, actionUrl, createdAt: { gte: stale } },
      select: { id: true },
    });
    if (already) continue;

    let messageHref: string | null = null;
    if (event.sourceMessageKind === "TASK" && event.sourceMessageId) {
      const tm = await prisma.taskMessage.findUnique({
        where: { id: event.sourceMessageId },
        select: { taskId: true },
      });
      if (tm) {
        messageHref = `/dashboard/messagerie?task=${tm.taskId}&messageId=${event.sourceMessageId}`;
      }
    }

    const site = event.project?.title ? ` · ${event.project.title}` : "";
    const title =
      level === "ROUGE"
        ? "Livraison non confirmée"
        : "Livraison à vérifier";
    const message = `« ${event.title} » prévue ${event.startAt.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    })}${site}. Toujours pas marquée reçue (${Math.round(hoursLate)} h).${
      messageHref ? " Voir le message fournisseur." : ""
    }`;

    const targets = new Set<string>([event.createdById, event.ownerUserId]);
    if (event.responsibleId) targets.add(event.responsibleId);

    for (const userId of targets) {
      await createNotification({
        userId,
        type: notifType,
        title,
        message,
        actionUrl: messageHref || (event.followUpSheet
          ? `/dashboard/fiches-suivi/${event.followUpSheet.id}`
          : actionUrl),
      });
      notified += 1;
    }

    if (event.followUpSheetId && hoursLate >= 1.5) {
      await prisma.followUpSheet.update({
        where: { id: event.followUpSheetId },
        data: {
          nextAction: `Vérifier réception : ${event.title}`,
          nextActionAt: now,
          nextActionDone: false,
          urgencyOverride: level === "ROUGE" ? "CRITIQUE" : "URGENT",
        },
      }).catch(() => {});
    }
  }

  return { notified };
}

