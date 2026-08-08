import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loadAttentionForSheets } from "@/lib/follow-up/attention/batch";
import { getFollowUpSettings } from "@/lib/follow-up/settings";
import { urgencyRank } from "@/lib/follow-up/urgency";
import type { UrgencyLevel } from "@/lib/follow-up/types";

export type DemoHomeStats = {
  urgentActions: number;
  ordersToValidate: number;
  lateDeliveries: number;
  deadlinesThisWeek: number;
  missingDocuments: number;
  projectsWithoutRecentCr: number;
  overdueTasks: number;
  followUpUrgent: number;
  followUpToday: number;
  followUpWeek: number;
  followUpToInvoice: number;
  followUpAvenant: number;
  followUpUnprepared: number;
  /** Compteurs W3-A pour le bandeau Attention. */
  attentionCritique: number;
  attentionUrgent: number;
  attentionImportant: number;
};

export type DemoHomeItem = {
  id: string;
  tone: "critical" | "watch" | "ok" | "info";
  title: string;
  subtitle?: string;
  href: string;
  urgency?: string;
};

export type DemoHomeProject = {
  id: string;
  title: string;
  city: string | null;
  manager: string | null;
  status: string;
};

export type DemoHomeAgendaItem = {
  id: string;
  title: string;
  startAt: Date;
  type: string;
  href: string;
};

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(23, 59, 59, 999);
  return x;
}

function endOfDay(d = new Date()) {
  const x = startOfDay(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** KPIs et listes « Aujourd’hui » — attention W3-A prioritaire. */
export async function collectDemoHomeData(clientId: string): Promise<{
  stats: DemoHomeStats;
  inbox: DemoHomeItem[];
  projects: DemoHomeProject[];
  agendaToday: DemoHomeAgendaItem[];
  firstName: string;
}> {
  const today = startOfDay();
  const weekEnd = endOfWeek();
  const dayEnd = endOfDay();

  const [tasks, docs, projects, user, sheets, agendaRows] = await Promise.all([
    prisma.task.findMany({
      where: { clientId, status: { not: TaskStatus.COMPLETE } },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        priority: true,
        desiredDate: true,
        project: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.document.findMany({
      where: { clientId, status: "EN_ATTENTE" },
      select: { id: true, name: true, projectId: true },
      take: 10,
    }),
    prisma.project.findMany({
      where: { clientId },
      select: {
        id: true,
        title: true,
        siteCity: true,
        internalManager: true,
        chantierStatus: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true },
    }),
    prisma.followUpSheet.findMany({
      where: {
        ownerUserId: clientId,
        status: { notIn: ["TERMINE", "ARCHIVE"] },
      },
      select: {
        id: true,
        title: true,
        status: true,
        nextAction: true,
        nextActionAt: true,
        nextActionDone: true,
        urgencyOverride: true,
        organizationId: true,
        assignee: { select: { name: true } },
      },
      take: 40,
    }),
    prisma.agendaEvent
      .findMany({
        where: {
          OR: [{ createdById: clientId }, { project: { clientId } }],
          status: { not: "ANNULE" },
          startAt: { gte: today, lte: dayEnd },
        },
        select: {
          id: true,
          title: true,
          startAt: true,
          type: true,
          followUpSheetId: true,
          projectId: true,
        },
        orderBy: { startAt: "asc" },
        take: 8,
      })
      .catch(() => []),
  ]);

  const orders = tasks.filter((t) => (t.category ?? "").toLowerCase().includes("bon de commande"));
  const ordersToValidate = orders.filter((t) => t.status === TaskStatus.A_VALIDER).length;
  const lateDeliveries = orders.filter((t) => {
    if (!t.desiredDate) return false;
    return t.desiredDate < today && t.status !== TaskStatus.COMPLETE;
  }).length;

  const overdueTasks = tasks.filter((t) => {
    if (!t.desiredDate) return false;
    return t.desiredDate < today;
  }).length;

  const urgentActions = tasks.filter(
    (t) =>
      t.priority === "URGENT" ||
      t.priority === "PRIORITAIRE" ||
      (t.desiredDate && t.desiredDate <= today),
  ).length;

  const deadlinesThisWeek = tasks.filter((t) => {
    if (!t.desiredDate) return false;
    return t.desiredDate >= today && t.desiredDate <= weekEnd;
  }).length;

  const missingDocuments = docs.length;

  const crOpenProjectIds = new Set(
    tasks
      .filter((t) => (t.category ?? "").toLowerCase().includes("compte rendu"))
      .map((t) => t.project?.id)
      .filter(Boolean) as string[],
  );
  const projectsWithoutRecentCr = crOpenProjectIds.size;

  const settings = await getFollowUpSettings(clientId);
  const orgId = sheets[0]?.organizationId ?? null;
  const { byId: attentionMap } = await loadAttentionForSheets({
    sheets: sheets.map((s) => ({
      id: s.id,
      status: s.status,
      title: s.title,
      nextActionAt: s.nextActionAt?.toISOString() ?? null,
      nextActionDone: s.nextActionDone,
      urgencyOverride: s.urgencyOverride,
    })),
    organizationId: orgId,
    thresholds: settings.thresholds,
  });

  let attentionCritique = 0;
  let attentionUrgent = 0;
  let attentionImportant = 0;
  const inboxFromAttention: DemoHomeItem[] = [];

  for (const s of sheets) {
    const att = attentionMap.get(s.id);
    if (!att || att.effectiveUrgency === "NORMAL" || att.effectiveUrgency === "A_SURVEILLER") {
      continue;
    }
    const level = att.effectiveUrgency as UrgencyLevel;
    if (level === "CRITIQUE") attentionCritique += 1;
    else if (level === "URGENT") attentionUrgent += 1;
    else if (level === "IMPORTANT") attentionImportant += 1;

    const who = s.assignee?.name ? ` · ${s.assignee.name}` : "";
    inboxFromAttention.push({
      id: `fiche-${s.id}`,
      tone: level === "CRITIQUE" || level === "URGENT" ? "critical" : "watch",
      title: s.title,
      subtitle: `${att.primaryReason ?? s.nextAction ?? "À traiter"}${who}`,
      href: `/dashboard/fiches-suivi/${s.id}`,
      urgency: level,
    });
  }

  inboxFromAttention.sort(
    (a, b) =>
      urgencyRank((b.urgency as UrgencyLevel) ?? "NORMAL") -
      urgencyRank((a.urgency as UrgencyLevel) ?? "NORMAL"),
  );

  const followUpUrgent = attentionCritique + attentionUrgent + attentionImportant;
  const followUpToday = sheets.filter((s) => {
    if (!s.nextActionAt || s.nextActionDone) return false;
    return s.nextActionAt >= today && s.nextActionAt <= dayEnd;
  }).length;
  const followUpWeek = sheets.filter((s) => {
    if (!s.nextActionAt || s.nextActionDone) return false;
    return s.nextActionAt >= today && s.nextActionAt <= weekEnd;
  }).length;
  const followUpToInvoice = sheets.filter(
    (s) => s.status === "A_FACTURER" || s.status === "TRAVAUX_TERMINES",
  ).length;
  const followUpAvenant = sheets.filter((s) => s.status === "AVENANT").length;
  const followUpUnprepared = sheets.filter(
    (s) =>
      s.status === "INTERVENTION_PREVUE" ||
      s.status === "COMMANDE_FOURNISSEUR" ||
      (s.nextAction ?? "").toLowerCase().includes("commander"),
  ).length;

  const inbox: DemoHomeItem[] = [...inboxFromAttention.slice(0, 5)];

  for (const t of orders.filter((x) => x.status === TaskStatus.A_VALIDER).slice(0, 2)) {
    if (inbox.length >= 6) break;
    inbox.push({
      id: t.id,
      tone: "critical",
      title: t.title,
      subtitle: t.project?.title ?? "Bon de commande",
      href: `/dashboard/taches/${t.id}`,
    });
  }

  const agendaToday: DemoHomeAgendaItem[] = agendaRows.map((e) => ({
    id: e.id,
    title: e.title,
    startAt: e.startAt,
    type: e.type,
    href: e.followUpSheetId
      ? `/dashboard/fiches-suivi/${e.followUpSheetId}`
      : e.projectId
        ? `/dashboard/projets/${e.projectId}`
        : "/dashboard/agenda",
  }));

  const firstName = (user?.name ?? "vous").split(" ")[0] || "vous";

  return {
    stats: {
      urgentActions: Math.max(urgentActions, followUpUrgent),
      ordersToValidate,
      lateDeliveries,
      deadlinesThisWeek: Math.max(deadlinesThisWeek, followUpWeek),
      missingDocuments,
      projectsWithoutRecentCr,
      overdueTasks,
      followUpUrgent,
      followUpToday,
      followUpWeek,
      followUpToInvoice,
      followUpAvenant,
      followUpUnprepared,
      attentionCritique,
      attentionUrgent,
      attentionImportant,
    },
    inbox: inbox.slice(0, 6),
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      city: p.siteCity,
      manager: p.internalManager,
      status: p.chantierStatus,
    })),
    agendaToday,
    firstName,
  };
}
