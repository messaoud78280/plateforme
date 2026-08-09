/**
 * ACCUEIL-V2A — Tour de contrôle entreprise (loaders légers).
 * Pas de collectATraiter full, pas de loadChantierCockpitOps × N.
 */
import { TaskStatus, type PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { previewATraiterForHome } from "@/lib/a-traiter/collect";
import type { ATraiterAttentionCard } from "@/lib/a-traiter/attention-board";
import { projectWhereForClientUser } from "@/lib/organization/access";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/purchase-orders/status";
import { withPerfLog } from "@/lib/perf/server-timing";

const PO_WATCH: PurchaseOrderStatus[] = [
  "A_VALIDER",
  "A_CONFIRMER",
  "ENVOYEE_FOURNISSEUR",
  "CONFIRMEE",
  "LIVRAISON_PROGRAMMEE",
  "PARTIELLEMENT_RECUE",
  "REFUSEE",
];

export type AccueilScope = "mine" | "team";

export type AccueilAttentionItem = {
  id: string;
  title: string;
  reason: string;
  urgency: string;
  projectTitle: string | null;
  href: string;
};

export type AccueilAgendaItem = {
  id: string;
  title: string;
  startAt: string;
  type: string;
  projectTitle: string | null;
  projectId: string | null;
  status: string;
};

export type AccueilChantierWatch = {
  id: string;
  title: string;
  attentionCount: number;
  criticalCount: number;
  overdueTasks: number;
  nextEventLabel: string | null;
};

export type AccueilOrderItem = {
  id: string;
  number: string;
  supplierName: string;
  projectTitle: string | null;
  deliveryAt: string | null;
  statusLabel: string;
  hasIssue: boolean;
};

export type AccueilTaskItem = {
  id: string;
  title: string;
  projectTitle: string | null;
  assigneeName: string | null;
  desiredDate: string | null;
  overdue: boolean;
  dueLabel: string;
};

export type AccueilTeamSlot = {
  id: string;
  name: string;
  projectTitle: string | null;
  title: string;
};

export type AccueilOpsSummary = {
  firstName: string;
  dateLabel: string;
  scope: AccueilScope;
  canSwitchScope: boolean;
  attentionTotal: number;
  attentionCapped: boolean;
  attention: AccueilAttentionItem[];
  agendaTitle: "Aujourd’hui" | "Prochainement";
  agenda: AccueilAgendaItem[];
  chantiers: AccueilChantierWatch[];
  orders: AccueilOrderItem[];
  tasks: AccueilTaskItem[];
  teamToday: AccueilTeamSlot[];
  links: {
    aTraiter: string;
    agenda: string;
    commandes: string;
    taches: string;
    messagerie: string;
    projets: string;
    nouvelleTache: string;
    nouvelEvenement: string;
    nouvelleFiche: string;
    nouvelleCommande: string;
  };
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function dueLabel(iso: string | null, now: Date): string {
  if (!iso) return "";
  const d = new Date(iso);
  const t0 = startOfDay(now).getTime();
  const t1 = startOfDay(d).getTime();
  const diff = Math.round((t1 - t0) / 86400000);
  if (diff < 0) return "En retard";
  if (diff === 0) return "Aujourd’hui";
  if (diff === 1) return "Demain";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function mapAttention(cards: ATraiterAttentionCard[]): AccueilAttentionItem[] {
  return cards.map((c) => ({
    id: `${c.subjectType}:${c.subjectId}`,
    title: c.title,
    reason: c.primaryReason ?? c.nextAction ?? "À traiter",
    urgency: c.effectiveUrgency,
    projectTitle: c.projectTitle,
    href: c.actionUrl,
  }));
}

/**
 * Synthèse Accueil pour un utilisateur interne.
 * Scope mine = assignee/responsible filtré côté attention + tâches.
 */
export async function loadAccueilOps(opts: {
  userId: string;
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
  name?: string | null;
  scope?: AccueilScope;
  now?: Date;
}): Promise<AccueilOpsSummary> {
  return withPerfLog("loadAccueilOps", async () => {
    const now = opts.now ?? new Date();
    const profile = (opts.permissionProfile ?? "").toUpperCase();
    const isDirection =
      profile === "DIRECTION" ||
      opts.role === "MANAGER" ||
      opts.role === "AGENCE";
    const isConducteur =
      profile === "CONDUCTEUR" ||
      profile === "CHEF_CHANTIER" ||
      (opts.role === "AGENT" && !isDirection);

    const canSwitchScope = isDirection || profile === "ADMINISTRATIF";
    const scope: AccueilScope =
      opts.scope ?? (isConducteur ? "mine" : canSwitchScope ? "team" : "mine");
    const mineOnly = scope === "mine";

    const day0 = startOfDay(now);
    const day1 = endOfDay(now);
    const soon = endOfDay(addDays(day0, 5));

    const firstName = (opts.name ?? "vous").trim().split(/\s+/)[0] || "vous";
    const dateLabel = now.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const projectWhere = await projectWhereForClientUser(opts.userId);

    const [attentionSnap, projects, agendaToday, agendaSoon, ordersRaw, tasksRaw, teamEvents] =
      await Promise.all([
        previewATraiterForHome(
          {
            id: opts.userId,
            role: opts.role,
            personType: opts.personType,
          },
          { mineOnly },
        ),
        prisma.project.findMany({
          where: projectWhere,
          select: { id: true, title: true },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        prisma.agendaEvent.findMany({
          where: {
            project: projectWhere,
            status: { not: "ANNULE" },
            startAt: { gte: day0, lte: day1 },
          },
          orderBy: { startAt: "asc" },
          take: 6,
          select: {
            id: true,
            title: true,
            startAt: true,
            type: true,
            status: true,
            projectId: true,
            project: { select: { title: true } },
          },
        }),
        prisma.agendaEvent.findMany({
          where: {
            project: projectWhere,
            status: { not: "ANNULE" },
            startAt: { gt: day1, lte: soon },
          },
          orderBy: { startAt: "asc" },
          take: 6,
          select: {
            id: true,
            title: true,
            startAt: true,
            type: true,
            status: true,
            projectId: true,
            project: { select: { title: true } },
          },
        }),
        prisma.purchaseOrder.findMany({
          where: {
            project: projectWhere,
            status: { in: PO_WATCH },
            ...(mineOnly ? { responsibleId: opts.userId } : {}),
          },
          orderBy: { updatedAt: "desc" },
          take: 12,
          select: {
            id: true,
            number: true,
            status: true,
            confirmedDeliveryAt: true,
            requestedDeliveryAt: true,
            proposedDeliveryStatus: true,
            sharedWithSupplier: true,
            project: { select: { title: true } },
            externalOrganization: { select: { name: true, tradeName: true } },
          },
        }),
        prisma.task.findMany({
          where: {
            status: { not: TaskStatus.COMPLETE },
            project: projectWhere,
            ...(mineOnly ? { assignedToId: opts.userId } : {}),
          },
          orderBy: [{ desiredDate: "asc" }, { updatedAt: "desc" }],
          take: 12,
          select: {
            id: true,
            title: true,
            desiredDate: true,
            assignedTo: { select: { name: true } },
            project: { select: { title: true } },
          },
        }),
        prisma.agendaEvent.findMany({
          where: {
            project: projectWhere,
            status: { not: "ANNULE" },
            startAt: { lte: day1 },
            endAt: { gte: day0 },
            responsibleId: { not: null },
          },
          orderBy: { startAt: "asc" },
          take: 10,
          select: {
            id: true,
            title: true,
            responsible: { select: { id: true, name: true } },
            project: { select: { title: true } },
          },
        }),
      ]);

    const projectIds = projects.map((p) => p.id);

    // Agrégats batch chantiers (pas de cockpit × N)
    const [overdueByProject, nextEvents] = await Promise.all([
      projectIds.length
        ? prisma.task.groupBy({
            by: ["projectId"],
            where: {
              projectId: { in: projectIds },
              status: { not: TaskStatus.COMPLETE },
              desiredDate: { lt: day0 },
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      projectIds.length
        ? prisma.agendaEvent.findMany({
            where: {
              projectId: { in: projectIds },
              status: { not: "ANNULE" },
              startAt: { gte: day0, lte: soon },
            },
            orderBy: { startAt: "asc" },
            select: {
              projectId: true,
              title: true,
              startAt: true,
              type: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const overdueMap = new Map(
      overdueByProject
        .filter((r) => r.projectId)
        .map((r) => [r.projectId!, r._count._all]),
    );

    const attentionByProject = new Map<string, { n: number; crit: number }>();
    for (const c of attentionSnap.attentionCards) {
      if (!c.projectId) continue;
      const cur = attentionByProject.get(c.projectId) ?? { n: 0, crit: 0 };
      cur.n += 1;
      if (c.effectiveUrgency === "CRITIQUE" || c.effectiveUrgency === "URGENT") {
        cur.crit += 1;
      }
      attentionByProject.set(c.projectId, cur);
    }

    const nextByProject = new Map<string, { title: string; startAt: Date; type: string }>();
    for (const ev of nextEvents) {
      if (!ev.projectId || nextByProject.has(ev.projectId)) continue;
      nextByProject.set(ev.projectId, {
        title: ev.title,
        startAt: ev.startAt,
        type: ev.type,
      });
    }

    const chantiersScored = projects
      .map((p) => {
        const att = attentionByProject.get(p.id) ?? { n: 0, crit: 0 };
        const overdue = overdueMap.get(p.id) ?? 0;
        const next = nextByProject.get(p.id);
        const score = att.crit * 10 + att.n * 3 + overdue * 4 + (next ? 1 : 0);
        const nextEventLabel = next
          ? `${next.startAt.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })} · ${next.title}`
          : null;
        return {
          id: p.id,
          title: p.title,
          attentionCount: att.n,
          criticalCount: att.crit,
          overdueTasks: overdue,
          nextEventLabel,
          score,
        };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ score: _s, ...rest }) => rest);

    const agendaSource = agendaToday.length > 0 ? agendaToday : agendaSoon;
    const agendaTitle = agendaToday.length > 0 ? "Aujourd’hui" : "Prochainement";

    const issueStatuses = new Set([
      "A_CONFIRMER",
      "A_VALIDER",
      "ENVOYEE_FOURNISSEUR",
      "PARTIELLEMENT_RECUE",
      "REFUSEE",
    ]);

    const ordersScored = ordersRaw.map((o) => {
      const delivery = o.confirmedDeliveryAt ?? o.requestedDeliveryAt;
      let score = 0;
      if (issueStatuses.has(o.status)) score += 40;
      if (o.status === "PARTIELLEMENT_RECUE") score += 20;
      if (o.proposedDeliveryStatus === "PENDING") score += 30;
      if (delivery && delivery >= day0 && delivery <= soon) score += 25;
      return { o, score, delivery };
    });
    ordersScored.sort((a, b) => b.score - a.score);

    const tasksSorted = [...tasksRaw].sort((a, b) => {
      const aOver = a.desiredDate && a.desiredDate < day0 ? 0 : 1;
      const bOver = b.desiredDate && b.desiredDate < day0 ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      const ad = a.desiredDate?.getTime() ?? Number.POSITIVE_INFINITY;
      const bd = b.desiredDate?.getTime() ?? Number.POSITIVE_INFINITY;
      return ad - bd;
    });

    const teamToday: AccueilTeamSlot[] = [];
    const seen = new Set<string>();
    for (const ev of teamEvents) {
      const id = ev.responsible?.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      teamToday.push({
        id: ev.id,
        name: ev.responsible!.name,
        projectTitle: ev.project?.title ?? null,
        title: ev.title,
      });
      if (teamToday.length >= 4) break;
    }

    return {
      firstName,
      dateLabel,
      scope,
      canSwitchScope,
      attentionTotal: attentionSnap.total,
      attentionCapped: Boolean(attentionSnap.attentionCapped),
      attention: mapAttention(attentionSnap.attentionCards),
      agendaTitle,
      agenda: agendaSource.map((e) => ({
        id: e.id,
        title: e.title,
        startAt: e.startAt.toISOString(),
        type: e.type,
        status: e.status,
        projectId: e.projectId,
        projectTitle: e.project?.title ?? null,
      })),
      chantiers: chantiersScored,
      orders: ordersScored.slice(0, 3).map(({ o, delivery }) => ({
        id: o.id,
        number: o.number,
        supplierName: o.externalOrganization.tradeName || o.externalOrganization.name,
        projectTitle: o.project?.title ?? null,
        deliveryAt: delivery?.toISOString() ?? null,
        statusLabel: PURCHASE_ORDER_STATUS_LABELS[o.status] ?? o.status,
        hasIssue: issueStatuses.has(o.status),
      })),
      tasks: tasksSorted.slice(0, 4).map((t) => {
        const desired = t.desiredDate?.toISOString() ?? null;
        return {
          id: t.id,
          title: t.title,
          projectTitle: t.project?.title ?? null,
          assigneeName: t.assignedTo?.name ?? null,
          desiredDate: desired,
          overdue: Boolean(t.desiredDate && t.desiredDate < day0),
          dueLabel: dueLabel(desired, now),
        };
      }),
      teamToday,
      links: {
        aTraiter: "/dashboard/a-traiter",
        agenda: "/dashboard/agenda",
        commandes: "/dashboard/commandes",
        taches: "/dashboard/taches",
        messagerie: "/dashboard/messagerie",
        projets: "/dashboard/projets",
        nouvelleTache: "/dashboard/taches?nouvelle=1",
        nouvelEvenement: "/dashboard/agenda?new=1",
        nouvelleFiche: "/dashboard/fiches-suivi/nouvelle",
        nouvelleCommande: "/dashboard/commandes/nouvelle",
      },
    };
  });
}
