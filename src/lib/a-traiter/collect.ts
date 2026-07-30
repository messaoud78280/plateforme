/**
 * Boîte « À traiter » unifiée — une seule vue pour savoir qui doit agir.
 * Agrège missions (validation client / A_VALIDER), alertes, pièces manquantes
 * et blocages critiques Pilotage. Pas de 4e messagerie : ce sont des actions
 * avec lien vers le bon écran métier.
 */

import { prisma } from "@/lib/prisma";
import { isAgencyOrManager, isAgent, isClientRole, type SessionUser } from "@/lib/authz";
import { taskWhereForClientUser, projectWhereForClientUser } from "@/lib/organization/access";
import { isBlockerCritical, isBlockerOpen } from "@/lib/pilotage/status-enums";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";

export type ATraiterSection = "bloquant" | "a_valider" | "urgent" | "relance";

export type ATraiterItem = {
  id: string;
  section: ATraiterSection;
  title: string;
  meta: string;
  href: string;
  source: "mission" | "alerte" | "piece" | "blocage" | "notification";
  createdAt: Date;
};

export type ATraiterSnapshot = {
  items: ATraiterItem[];
  counts: Record<ATraiterSection, number>;
  total: number;
};

const SECTION_ORDER: ATraiterSection[] = ["bloquant", "a_valider", "urgent", "relance"];

function emptyCounts(): Record<ATraiterSection, number> {
  return { bloquant: 0, a_valider: 0, urgent: 0, relance: 0 };
}

function push(items: ATraiterItem[], item: ATraiterItem) {
  items.push(item);
}

export async function collectATraiter(user: {
  id: string;
  role?: string | null;
}): Promise<ATraiterSnapshot> {
  const items: ATraiterItem[] = [];
  const sessionUser: SessionUser = user;

  if (isClientRole(sessionUser)) {
    await collectForClient(user.id, items);
  } else if (isAgencyOrManager(sessionUser) || isAgent(sessionUser)) {
    await collectForStaff(user.id, sessionUser, items);
  }

  items.sort((a, b) => {
    const sa = SECTION_ORDER.indexOf(a.section);
    const sb = SECTION_ORDER.indexOf(b.section);
    if (sa !== sb) return sa - sb;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const counts = emptyCounts();
  for (const it of items) counts[it.section] += 1;

  return { items, counts, total: items.length };
}

async function collectForClient(userId: string, items: ATraiterItem[]) {
  const taskWhere = await taskWhereForClientUser(userId);
  const projectWhere = await projectWhereForClientUser(userId);

  const [awaitingDecision, alerts, missingFiles] = await Promise.all([
    prisma.task.findMany({
      where: {
        AND: [
          taskWhere,
          { status: { not: "COMPLETE" } },
          {
            OR: [
              { clientDecision: "EN_ATTENTE_CLIENT" },
              {
                AND: [
                  { clientReportSentAt: { not: null } },
                  { OR: [{ clientDecision: null }, { clientDecision: "EN_ATTENTE_CLIENT" }] },
                ],
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        clientReportSentAt: true,
        updatedAt: true,
        project: { select: { title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.alert.findMany({
      where: { clientId: userId, read: false },
      select: { id: true, title: true, message: true, actionUrl: true, createdAt: true, level: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.chantierFile.findMany({
      where: {
        deletedAt: null,
        status: { in: ["MANQUANT", "A_RELANCER"] },
        project: projectWhere,
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        project: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);

  for (const t of awaitingDecision) {
    push(items, {
      id: `task-decision-${t.id}`,
      section: "a_valider",
      title: t.title,
      meta: t.project?.title
        ? `Livrable à valider · ${t.project.title}`
        : "Livrable transmis — accepter, réserve ou refus",
      href: `/dashboard/taches/${t.id}#validation-client`,
      source: "mission",
      createdAt: t.clientReportSentAt ?? t.updatedAt,
    });
  }

  for (const a of alerts) {
    const section =
      a.level === "URGENT" ? "bloquant" : a.level === "WARNING" ? "urgent" : "relance";
    push(items, {
      id: `alert-${a.id}`,
      section,
      title: a.title,
      meta: a.message.slice(0, 120),
      href: a.actionUrl || "/dashboard",
      source: "alerte",
      createdAt: a.createdAt,
    });
  }

  for (const f of missingFiles) {
    push(items, {
      id: `file-${f.id}`,
      section: f.status === "A_RELANCER" ? "relance" : "urgent",
      title: f.name,
      meta: `Pièce ${f.status === "A_RELANCER" ? "à relancer" : "manquante"} · ${f.project.title}`,
      href: `/dashboard/projets/${f.project.id}#dossier-chantier`,
      source: "piece",
      createdAt: f.updatedAt,
    });
  }
}

async function collectForStaff(
  userId: string,
  sessionUser: SessionUser,
  items: ATraiterItem[],
) {
  const isDecideur = isAgencyOrManager(sessionUser);
  const agentOnly = isAgent(sessionUser);

  const [toValidate, awaitingInfo, urgentTasks, notifications, blockers] = await Promise.all([
    isDecideur
      ? prisma.task.findMany({
          where: { status: "A_VALIDER" },
          select: {
            id: true,
            title: true,
            updatedAt: true,
            client: { select: { name: true, company: true } },
            assignedTo: { select: { name: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 40,
        })
      : Promise.resolve([]),
    prisma.task.findMany({
      where: {
        status: "EN_ATTENTE_INFO",
        ...(agentOnly ? { assignedToId: userId } : {}),
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        client: { select: { name: true, company: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.task.findMany({
      where: {
        status: { notIn: ["COMPLETE"] },
        priority: { in: ["URGENT", "PRIORITAIRE"] },
        ...(agentOnly ? { assignedToId: userId } : {}),
      },
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        updatedAt: true,
        client: { select: { name: true, company: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.notification.findMany({
      where: { userId, read: false },
      select: { id: true, title: true, message: true, actionUrl: true, createdAt: true, type: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    isDecideur || agentOnly
      ? prisma.pilotageBlocker.findMany({
          where: {
            archivedAt: null,
            status: { in: ["Ouvert", "En cours"] },
            ...(agentOnly
              ? {
                  pilotage: {
                    OR: [
                      { assistantId: userId },
                      { conducteurId: userId },
                      { project: { assignedToId: userId } },
                    ],
                  },
                }
              : {}),
          },
          select: {
            id: true,
            title: true,
            severity: true,
            status: true,
            openedAt: true,
            pilotageId: true,
            pilotage: { select: { project: { select: { title: true } } } },
          },
          orderBy: { openedAt: "asc" },
          take: 40,
        })
      : Promise.resolve([]),
  ]);

  for (const t of toValidate) {
    const clientLabel = t.client.company ?? t.client.name;
    push(items, {
      id: `task-valider-${t.id}`,
      section: "a_valider",
      title: t.title,
      meta: `Mission à valider · ${clientLabel}${t.assignedTo?.name ? ` · ${t.assignedTo.name}` : ""}`,
      href: `/dashboard/taches/${t.id}`,
      source: "mission",
      createdAt: t.updatedAt,
    });
  }

  for (const t of awaitingInfo) {
    const clientLabel = t.client.company ?? t.client.name;
    push(items, {
      id: `task-info-${t.id}`,
      section: "bloquant",
      title: t.title,
      meta: `En attente d’information · ${clientLabel}`,
      href: `/dashboard/taches/${t.id}`,
      source: "mission",
      createdAt: t.updatedAt,
    });
  }

  for (const t of urgentTasks) {
    if (t.status === "A_VALIDER" || t.status === "EN_ATTENTE_INFO") continue;
    const clientLabel = t.client.company ?? t.client.name;
    push(items, {
      id: `task-urgent-${t.id}`,
      section: t.priority === "URGENT" ? "bloquant" : "urgent",
      title: t.title,
      meta: `Priorité ${t.priority === "URGENT" ? "urgente" : "prioritaire"} · ${clientLabel}`,
      href: `/dashboard/taches/${t.id}`,
      source: "mission",
      createdAt: t.updatedAt,
    });
  }

  for (const n of notifications) {
    push(items, {
      id: `notif-${n.id}`,
      section: "relance",
      title: n.title,
      meta: n.message.slice(0, 120),
      href: n.actionUrl || "/dashboard",
      source: "notification",
      createdAt: n.createdAt,
    });
  }

  for (const b of blockers) {
    if (!isBlockerOpen(b.status)) continue;
    const critical = isBlockerCritical(b.severity);
    push(items, {
      id: `blocker-${b.id}`,
      section: critical ? "bloquant" : "urgent",
      title: b.title,
      meta: `Blocage ${b.severity} · ${b.pilotage.project.title}`,
      href: `${PILOTAGE_LIST_PATH}/${b.pilotageId}?onglet=blocages`,
      source: "blocage",
      createdAt: b.openedAt,
    });
  }
}

export const A_TRAITER_SECTION_LABELS: Record<ATraiterSection, string> = {
  bloquant: "Bloquant",
  a_valider: "À valider",
  urgent: "Urgent",
  relance: "Relances / infos",
};
