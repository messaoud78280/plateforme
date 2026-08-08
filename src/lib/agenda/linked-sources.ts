/**
 * Agrège des échéances métier existantes (tâches, jalons chantier) en événements
 * calendrier en lecture seule — sans dupliquer en base.
 */

import type { Prisma } from "@prisma/client";
import { projectWhereForClientUser } from "@/lib/organization/access";
import { prisma } from "@/lib/prisma";
import { isBeworkStaff } from "@/lib/authz";
import { resolveAgendaOwnerUserId } from "@/lib/agenda/access";

export type LinkedAgendaItem = {
  id: string;
  source: "task" | "project_start" | "project_end" | "appointment";
  title: string;
  description: string | null;
  location: string | null;
  type: string;
  status: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  projectId: string | null;
  responsibleId: string | null;
  reminderMinutes: number | null;
  recurrence: string | null;
  readOnly: true;
  href: string | null;
  project: { id: string; title: string; siteCity: string | null; siteAddress: string | null } | null;
  responsible: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
  attendees: [];
};

type SessionUser = { id: string; role?: string | null; email?: string | null };

function dayRange(d: Date): { start: Date; end: Date } {
  const start = new Date(d);
  start.setHours(9, 0, 0, 0);
  const end = new Date(d);
  end.setHours(10, 0, 0, 0);
  return { start, end };
}

export async function listLinkedAgendaItems(
  sessionUser: SessionUser,
  opts: {
    from: Date;
    to: Date;
    projectId?: string | null;
    q?: string | null;
    includeAppointments?: boolean;
  },
): Promise<LinkedAgendaItem[]> {
  const staff = isBeworkStaff(sessionUser);
  const ownerUserId = await resolveAgendaOwnerUserId(sessionUser.id);
  const projectWhere: Prisma.ProjectWhereInput = staff
    ? {}
    : await projectWhereForClientUser(sessionUser.id);

  const projectFilter = opts.projectId
    ? { AND: [projectWhere, { id: opts.projectId }] }
    : projectWhere;

  const projects = await prisma.project.findMany({
    where: projectFilter,
    select: {
      id: true,
      title: true,
      siteCity: true,
      siteAddress: true,
      plannedStartDate: true,
      plannedEndDate: true,
      deadline: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
    },
    take: 200,
  });
  const projectIds = projects.map((p) => p.id);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const taskWhere: Prisma.TaskWhereInput = {
    desiredDate: { gte: opts.from, lte: opts.to },
    status: { not: "COMPLETE" },
    ...(opts.projectId
      ? { projectId: opts.projectId }
      : staff
        ? {}
        : {
            OR: [
              { clientId: ownerUserId },
              ...(projectIds.length ? [{ projectId: { in: projectIds } }] : []),
            ],
          }),
  };

  const tasks = await prisma.task.findMany({
    where: taskWhere,
    select: {
      id: true,
      title: true,
      desiredDate: true,
      category: true,
      projectId: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true, siteCity: true, siteAddress: true } },
    },
    take: 300,
    orderBy: { desiredDate: "asc" },
  });

  const items: LinkedAgendaItem[] = [];

  for (const t of tasks) {
    if (!t.desiredDate) continue;
    if (opts.q) {
      const hay = `${t.title} ${t.project?.title ?? ""}`.toLowerCase();
      if (!hay.includes(opts.q.toLowerCase())) continue;
    }
    const { start, end } = dayRange(t.desiredDate);
    const isBc = (t.category ?? "").toLowerCase().includes("commande");
    items.push({
      id: `task:${t.id}`,
      source: "task",
      title: t.title,
      description: isBc ? "Échéance tâche / commande (BeWork)" : "Échéance tâche (BeWork)",
      location: null,
      type: isBc ? "COMMANDE" : "ECHEANCE",
      status: "PLANIFIE",
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      allDay: true,
      projectId: t.projectId,
      responsibleId: t.assignedTo?.id ?? null,
      reminderMinutes: null,
      recurrence: null,
      readOnly: true,
      href: `/dashboard/taches/${t.id}`,
      project: t.project,
      responsible: t.assignedTo,
      createdBy: t.assignedTo ?? { id: ownerUserId, name: "BeWork", email: "" },
      attendees: [],
    });
  }

  for (const p of projects) {
    const milestones: { date: Date | null; label: string; source: LinkedAgendaItem["source"] }[] = [
      { date: p.plannedStartDate, label: `Démarrage — ${p.title}`, source: "project_start" },
      { date: p.plannedEndDate ?? p.deadline, label: `Fin prévue — ${p.title}`, source: "project_end" },
    ];
    for (const m of milestones) {
      if (!m.date) continue;
      if (m.date < opts.from || m.date > opts.to) continue;
      if (opts.q) {
        const hay = `${m.label} ${p.title}`.toLowerCase();
        if (!hay.includes(opts.q.toLowerCase())) continue;
      }
      const { start, end } = dayRange(m.date);
      items.push({
        id: `${m.source}:${p.id}`,
        source: m.source,
        title: m.label,
        description: "Jalon chantier (non modifiable depuis l’agenda)",
        location: p.siteAddress,
        type: "INTERVENTION",
        status: "PLANIFIE",
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        allDay: true,
        projectId: p.id,
        responsibleId: p.assignedTo?.id ?? null,
        reminderMinutes: null,
        recurrence: null,
        readOnly: true,
        href: `/dashboard/projets/${p.id}`,
        project: {
          id: p.id,
          title: p.title,
          siteCity: p.siteCity,
          siteAddress: p.siteAddress,
        },
        responsible: p.assignedTo,
        createdBy: p.client,
        attendees: [],
      });
    }
  }

  if (opts.includeAppointments !== false) {
    const appointments = await prisma.appointment.findMany({
      where: {
        status: { not: "ANNULE" },
        startAt: { lte: opts.to },
        endAt: { gte: opts.from },
        ...(staff
          ? {}
          : {
              OR: [
                { clientId: ownerUserId },
                { organizerId: sessionUser.id },
                ...(sessionUser.email ? [{ clientEmail: sessionUser.email }] : []),
              ],
            }),
        ...(opts.projectId ? { projectId: opts.projectId } : {}),
      },
      include: {
        project: { select: { id: true, title: true, siteCity: true, siteAddress: true } },
        organizer: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
      },
      take: 200,
    });

    for (const a of appointments) {
      if (opts.q) {
        const hay = `${a.title} ${a.project?.title ?? ""}`.toLowerCase();
        if (!hay.includes(opts.q.toLowerCase())) continue;
      }
      items.push({
        id: `appointment:${a.id}`,
        source: "appointment",
        title: a.title,
        description: a.notes,
        location: null,
        type: "RDV_CLIENT",
        status: a.status,
        startAt: a.startAt.toISOString(),
        endAt: a.endAt.toISOString(),
        allDay: false,
        projectId: a.projectId,
        responsibleId: a.organizerId,
        reminderMinutes: null,
        recurrence: a.recurrence,
        readOnly: true,
        href: "/dashboard/messages",
        project: a.project,
        responsible: a.organizer,
        createdBy: a.organizer,
        attendees: [],
      });
    }
  }

  void projectMap;
  return items.sort((a, b) => a.startAt.localeCompare(b.startAt));
}
