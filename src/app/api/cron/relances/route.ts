import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyManagers } from "@/lib/notifications";
import { processAgendaReminders, processAgendaUnclosed } from "@/lib/agenda/notify";
import { processFollowUpAlerts } from "@/lib/follow-up/process-alerts";

/**
 * POST /api/cron/relances
 * Relances automatiques : pièces manquantes du classeur chantier (MANQUANT / A_RELANCER,
 * non traitées depuis 3 jours) et échéances de mission proches (desiredDate ≤ 3 jours, non terminées).
 *
 * Déclenchement : planificateur externe (Railway Cron Job, GitHub Actions) avec header
 * x-secret = RELANCES_CRON_SECRET, ou déclenchement manuel par un MANAGER connecté.
 *
 * Idempotent : une relance n'est renvoyée que si aucune alerte/notification équivalente
 * n'a déjà été créée dans les 3 derniers jours pour le même élément (pas de spam).
 */
const RELANCE_INTERVAL_DAYS = 3;
const DEADLINE_WINDOW_DAYS = 3;
const MAX_ITEMS_PER_RUN = 300;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const secret = request.headers.get("x-secret");
  const expected = process.env.RELANCES_CRON_SECRET;
  if (expected && secret === expected) return true;

  const session = await getServerSession(authOptions);
  return session?.user?.role === "MANAGER";
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const staleThreshold = daysAgo(RELANCE_INTERVAL_DAYS);
  const deadlineLimit = new Date(now.getTime() + DEADLINE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  let missingPieceNotified = 0;
  let deadlineNotified = 0;
  const errors: string[] = [];

  // 1) Pièces manquantes / à relancer dans le classeur chantier
  try {
    const staleFiles = await prisma.chantierFile.findMany({
      where: {
        deletedAt: null,
        status: { in: ["MANQUANT", "A_RELANCER"] },
        updatedAt: { lte: staleThreshold },
      },
      select: {
        id: true,
        name: true,
        status: true,
        clientId: true,
        projectId: true,
        project: { select: { title: true, assignedToId: true } },
        folder: { select: { label: true } },
      },
      take: MAX_ITEMS_PER_RUN,
      orderBy: { updatedAt: "asc" },
    });

    for (const file of staleFiles) {
      const actionUrl = `/dashboard/projets/${file.projectId}#dossier-chantier`;

      const recentAlert = await prisma.alert.findFirst({
        where: { clientId: file.clientId, actionUrl, createdAt: { gte: staleThreshold } },
        select: { id: true },
      });
      if (recentAlert) continue;

      const label = file.status === "MANQUANT" ? "manquante" : "à relancer";
      const title = "Pièce chantier " + label;
      const message = `« ${file.name} » (${file.folder.label}) — ${file.project.title} : pièce ${label} depuis plusieurs jours.`;

      try {
        await prisma.alert.create({
          data: {
            title,
            message,
            level: "WARNING",
            clientId: file.clientId,
            actionUrl,
          },
        });

        if (file.project.assignedToId) {
          await createNotification({
            userId: file.project.assignedToId,
            type: "MISSING_PIECE",
            title: `Relance envoyée — ${title.toLowerCase()}`,
            message,
            actionUrl,
          });
        } else {
          await notifyManagers({
            type: "MISSING_PIECE",
            title: `Relance envoyée — ${title.toLowerCase()}`,
            message,
            actionUrl,
          });
        }
        missingPieceNotified += 1;
      } catch (e) {
        errors.push(`chantierFile ${file.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(`scan pièces manquantes: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2) Échéances de mission proches (non terminées)
  try {
    const upcomingTasks = await prisma.task.findMany({
      where: {
        desiredDate: { not: null, gte: now, lte: deadlineLimit },
        status: { notIn: ["COMPLETE"] },
      },
      select: {
        id: true,
        title: true,
        desiredDate: true,
        assignedToId: true,
      },
      take: MAX_ITEMS_PER_RUN,
      orderBy: { desiredDate: "asc" },
    });

    for (const task of upcomingTasks) {
      const actionUrl = `/dashboard/taches/${task.id}`;

      const recentNotif = await prisma.notification.findFirst({
        where: { type: "DEADLINE_NEAR", actionUrl, createdAt: { gte: staleThreshold } },
        select: { id: true },
      });
      if (recentNotif) continue;

      const dateLabel = task.desiredDate
        ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long" }).format(task.desiredDate)
        : "bientôt";
      const title = "Échéance proche";
      const message = `« ${task.title} » — échéance souhaitée le ${dateLabel}, mission non terminée.`;

      try {
        if (task.assignedToId) {
          await createNotification({
            userId: task.assignedToId,
            type: "DEADLINE_NEAR",
            title,
            message,
            actionUrl,
          });
        } else {
          await notifyManagers({ type: "DEADLINE_NEAR", title, message, actionUrl });
        }
        deadlineNotified += 1;
      } catch (e) {
        errors.push(`task ${task.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(`scan échéances: ${e instanceof Error ? e.message : String(e)}`);
  }

  let agendaReminders = 0;
  try {
    const r = await processAgendaReminders(now);
    agendaReminders = r.notified;
  } catch (e) {
    errors.push(`agenda rappels: ${e instanceof Error ? e.message : String(e)}`);
  }

  let agendaUnclosed = 0;
  try {
    const r = await processAgendaUnclosed(now);
    agendaUnclosed = r.notified;
  } catch (e) {
    errors.push(`agenda non clôturés: ${e instanceof Error ? e.message : String(e)}`);
  }

  let followUpAlerts = 0;
  try {
    const r = await processFollowUpAlerts(now);
    followUpAlerts = r.notified;
  } catch (e) {
    errors.push(`fiches suivi alertes: ${e instanceof Error ? e.message : String(e)}`);
  }

  return NextResponse.json({
    ok: errors.length === 0,
    missingPieceNotified,
    deadlineNotified,
    agendaReminders,
    agendaUnclosed,
    followUpAlerts,
    errors,
    ranAt: now.toISOString(),
  });
}
