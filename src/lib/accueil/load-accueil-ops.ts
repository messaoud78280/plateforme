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
import { purchaseOrderAttentionActionUrl } from "@/lib/purchase-orders/attention/sync-notifications";
import {
  withPerfLog,
  timedBranch,
  runWithPerfContext,
  summarizePerfQueries,
} from "@/lib/perf/server-timing";
import {
  formatPurchaseOrderDeliveryTime,
  getEffectivePurchaseOrderDeliveryAt,
  PURCHASE_ORDER_DISPLAY_TZ,
} from "@/lib/purchase-orders/delivery-display";

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
  urgentCount: number;
  overdueTasks: number;
  nextEventLabel: string | null;
  nextDeliveryLabel: string | null;
};

export type AccueilOrderItem = {
  id: string;
  number: string;
  supplierName: string;
  projectTitle: string | null;
  deliveryAt: string | null;
  deliveryLabel: string | null;
  statusLabel: string;
  receiptLabel: string | null;
  hasIssue: boolean;
  href: string;
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
    nouveauDocument: string;
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
    // Accueil = action, pas copie verbatim de la raison W3 (board À traiter garde le détail).
    title: c.title,
    reason: c.nextAction ?? c.primaryReason ?? "À traiter",
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
  return runWithPerfContext(() =>
    withPerfLog("accueil.total", async () => {
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

    // Attention n’a pas besoin de projectWhere — démarrer en parallèle (chemin critique).
    const attentionPromise = timedBranch(
      "accueil.attention",
      previewATraiterForHome(
        {
          id: opts.userId,
          role: opts.role,
          personType: opts.personType,
        },
        { mineOnly },
      ),
    );

    const projectWhere = await timedBranch(
      "accueil.projectWhere",
      projectWhereForClientUser(opts.userId),
    );

    const [attentionSnap, projects, agendaToday, agendaSoon, ordersRaw, tasksRaw, teamEvents] =
      await Promise.all([
        attentionPromise,
        timedBranch(
          "accueil.projects",
          prisma.project.findMany({
            where: projectWhere,
            select: { id: true, title: true },
            orderBy: { updatedAt: "desc" },
            take: 20,
          }),
        ),
        timedBranch(
          "accueil.agendaToday",
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
        ),
        timedBranch(
          "accueil.agendaSoon",
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
        ),
        timedBranch(
          "accueil.orders",
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
              lines: {
                select: { quantity: true, receivedQty: true },
                take: 40,
              },
            },
          }),
        ),
        timedBranch(
          "accueil.tasks",
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
        ),
        timedBranch(
          "accueil.teamEvents",
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
        ),
      ]);

    const projectIds = projects.map((p) => p.id);

    // Agrégats batch chantiers (pas de cockpit × N)
    const [overdueByProject, nextEvents, nextDeliveries] = await Promise.all([
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
      projectIds.length
        ? prisma.purchaseOrder.findMany({
            where: {
              projectId: { in: projectIds },
              status: { in: PO_WATCH },
              OR: [
                { confirmedDeliveryAt: { gte: day0, lte: soon } },
                { requestedDeliveryAt: { gte: day0, lte: soon } },
              ],
            },
            orderBy: [{ confirmedDeliveryAt: "asc" }, { requestedDeliveryAt: "asc" }],
            take: 40,
            select: {
              projectId: true,
              confirmedDeliveryAt: true,
              requestedDeliveryAt: true,
              externalOrganization: { select: { name: true, tradeName: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const overdueMap = new Map(
      overdueByProject
        .filter((r) => r.projectId)
        .map((r) => [r.projectId!, r._count._all]),
    );

    const attentionByProject = new Map<string, { n: number; crit: number; urg: number }>();
    for (const c of attentionSnap.attentionCards) {
      if (!c.projectId) continue;
      const cur = attentionByProject.get(c.projectId) ?? { n: 0, crit: 0, urg: 0 };
      cur.n += 1;
      if (c.effectiveUrgency === "CRITIQUE") cur.crit += 1;
      else if (c.effectiveUrgency === "URGENT") cur.urg += 1;
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

    const nextDeliveryByProject = new Map<string, string>();
    for (const o of nextDeliveries) {
      if (!o.projectId || nextDeliveryByProject.has(o.projectId)) continue;
      const when = getEffectivePurchaseOrderDeliveryAt(o);
      if (!when) continue;
      const supplier = o.externalOrganization.tradeName || o.externalOrganization.name;
      const whenLabel = when.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: PURCHASE_ORDER_DISPLAY_TZ,
      });
      nextDeliveryByProject.set(o.projectId, `Livraison ${supplier} · ${whenLabel}`);
    }

    const attentionPoIds = new Set(
      attentionSnap.attentionCards
        .filter((c) => c.subjectType === "PURCHASE_ORDER")
        .map((c) => c.subjectId),
    );

    const chantiersScored = projects
      .map((p) => {
        const att = attentionByProject.get(p.id) ?? { n: 0, crit: 0, urg: 0 };
        const overdue = overdueMap.get(p.id) ?? 0;
        const next = nextByProject.get(p.id);
        // Dédup Accueil : si le chantier a déjà des attentions, ne pas répéter la livraison
        // comme alerte — seulement comme signal calendrier si pas d’attention.
        const nextDeliveryLabel =
          att.n > 0 ? null : (nextDeliveryByProject.get(p.id) ?? null);
        const score =
          att.crit * 10 +
          att.urg * 6 +
          att.n * 3 +
          overdue * 4 +
          (nextDeliveryLabel ? 2 : 0) +
          (next ? 1 : 0);
        const nextEventLabel = next
          ? `${next.startAt.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: PURCHASE_ORDER_DISPLAY_TZ,
            })} · ${next.title}`
          : null;
        return {
          id: p.id,
          title: p.title,
          attentionCount: att.n,
          criticalCount: att.crit,
          urgentCount: att.urg,
          overdueTasks: overdue,
          nextEventLabel,
          nextDeliveryLabel,
          score,
        };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ score: _s, ...rest }) => rest);

    const agendaSource = agendaToday.length > 0 ? agendaToday : agendaSoon;
    const agendaTitle = (
      agendaToday.length > 0 ? "Aujourd’hui" : "Prochainement"
    ) as AccueilOpsSummary["agendaTitle"];

    const issueStatuses = new Set([
      "A_CONFIRMER",
      "A_VALIDER",
      "ENVOYEE_FOURNISSEUR",
      "PARTIELLEMENT_RECUE",
      "REFUSEE",
    ]);

    function focusCodeForOrder(o: (typeof ordersRaw)[number]): string | null {
      if (o.proposedDeliveryStatus === "PENDING") return "SUPPLIER_PROPOSAL_PENDING";
      if (o.status === "PARTIELLEMENT_RECUE") return "PARTIAL_RECEIPT_PENDING";
      if (o.status === "A_CONFIRMER" || o.status === "ENVOYEE_FOURNISSEUR") {
        return "DELIVERY_UNCONFIRMED";
      }
      if (o.status === "REFUSEE") return "SUPPLIER_REFUSED";
      if (o.status === "A_VALIDER") return "ORDER_NOT_SENT";
      return null;
    }

    function receiptLabelFor(o: (typeof ordersRaw)[number]): string | null {
      if (!o.lines.length) return null;
      const ordered = o.lines.reduce((s, l) => s + Number(l.quantity), 0);
      const received = o.lines.reduce((s, l) => s + Number(l.receivedQty), 0);
      if (ordered <= 0) return null;
      if (o.status === "PARTIELLEMENT_RECUE" || (received > 0 && received < ordered)) {
        return `${Math.round(received)} / ${Math.round(ordered)} reçus`;
      }
      return null;
    }

    function deliveryLabelFor(delivery: Date | null | undefined): string | null {
      if (!delivery) return null;
      const diff = Math.round(
        (startOfDay(delivery).getTime() - day0.getTime()) / 86400000,
      );
      const time = formatPurchaseOrderDeliveryTime(delivery) ?? "";
      if (diff === 0) return `Aujourd’hui ${time}`.trim();
      if (diff === 1) return `Demain ${time}`.trim();
      if (diff < 0) return `En retard · ${fmtShort(delivery)}`;
      return fmtShort(delivery);
    }

    function fmtShort(d: Date) {
      return d.toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: PURCHASE_ORDER_DISPLAY_TZ,
      });
    }

    const ordersScored = ordersRaw.map((o) => {
      const delivery = getEffectivePurchaseOrderDeliveryAt(o);
      let score = 0;
      if (issueStatuses.has(o.status)) score += 40;
      if (o.status === "PARTIELLEMENT_RECUE") score += 20;
      if (o.proposedDeliveryStatus === "PENDING") score += 30;
      if (delivery && delivery >= day0 && delivery <= soon) score += 25;
      if (delivery && delivery < day0 && issueStatuses.has(o.status)) score += 35;
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
      orders: ordersScored.slice(0, 3).map(({ o, delivery }) => {
        const focusCode = focusCodeForOrder(o);
        const inAttention = attentionPoIds.has(o.id);
        const statusExtra =
          o.proposedDeliveryStatus === "PENDING"
            ? "À confirmer"
            : PURCHASE_ORDER_STATUS_LABELS[o.status] ?? o.status;
        return {
          id: o.id,
          number: o.number,
          supplierName: o.externalOrganization.tradeName || o.externalOrganization.name,
          projectTitle: o.project?.title ?? null,
          deliveryAt: delivery?.toISOString() ?? null,
          deliveryLabel: deliveryLabelFor(delivery),
          // Dédup : À traiter porte l’alerte ; ici résumé opérationnel (créneau / statut court).
          statusLabel: inAttention ? (deliveryLabelFor(delivery) ? "Planifiée" : "À suivre") : statusExtra,
          receiptLabel: receiptLabelFor(o),
          hasIssue: inAttention
            ? false
            : issueStatuses.has(o.status) || o.proposedDeliveryStatus === "PENDING",
          href: purchaseOrderAttentionActionUrl(o.id, focusCode),
        };
      }),
      tasks: tasksSorted.slice(0, 5).map((t) => {
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
        nouveauDocument: "/dashboard/documents",
      },
    };
    }).finally(() => {
      const s = summarizePerfQueries(5);
      if (s.count > 0) {
        console.info(`[perf] accueil.queries count=${s.count}`);
        for (const q of s.top) {
          console.info(`[perf] accueil.top ${q.model}.${q.action} ${q.ms}ms`);
        }
      }
    }),
  );
}
