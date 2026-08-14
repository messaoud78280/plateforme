/**
 * Boîte « À traiter » unifiée — une seule vue pour savoir qui doit agir.
 *
 * W3-B : fiches → evaluateFollowUpAttention ; commandes → evaluatePurchaseOrderAttention (CDE-3B1).
 * Les autres sources (missions, pièces, blocages…) restent agrégées à part.
 * Portail fournisseur / client externe : pas de diagnostics internes commandes.
 */

import { prisma } from "@/lib/prisma";
import { isAgencyOrManager, isAgent, isClientRole, type SessionUser } from "@/lib/authz";
import { taskWhereForClientUser, projectWhereForClientUser } from "@/lib/organization/access";
import { isBlockerCritical, isBlockerOpen } from "@/lib/pilotage/status-enums";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import {
  followUpSheetAccessWhere,
  resolveFollowUpOwnerUserId,
} from "@/lib/follow-up/access";
import { getFollowUpSettings } from "@/lib/follow-up/settings";
import { loadAttentionForSheets } from "@/lib/follow-up/attention/batch";
import { ensureOrganizationForOwner } from "@/lib/organization/access";
import {
  buildAttentionCard,
  buildPurchaseOrderAttentionCard,
  countAttentionByUrgency,
  countHotAttention,
  sortAttentionCards,
  type ATraiterAttentionCard,
} from "@/lib/a-traiter/attention-board";
import { loadPurchaseOrderAttention } from "@/lib/purchase-orders/attention/batch";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { ttlGet, ttlSet } from "@/lib/perf/ttl-cache";
import {
  withPerfLog,
  timedBranch,
  runWithPerfContext,
  summarizePerfQueries,
} from "@/lib/perf/server-timing";

export type ATraiterSection = "bloquant" | "a_valider" | "urgent" | "relance";

export type ATraiterItem = {
  id: string;
  section: ATraiterSection;
  title: string;
  meta: string;
  href: string;
  source: "mission" | "alerte" | "piece" | "blocage" | "notification" | "message";
  createdAt: Date;
  urgencyLabel?: string;
  assigneeName?: string | null;
  dueLabel?: string | null;
  delayLabel?: string | null;
};

export type ATraiterSnapshot = {
  /** Diagnostics W3-A (une carte par fiche, sans NORMAL). */
  attentionCards: ATraiterAttentionCard[];
  attentionCounts: ReturnType<typeof countAttentionByUrgency>;
  hotCount: number;
  /** Missions, pièces, blocages… (hors fiches). */
  items: ATraiterItem[];
  counts: Record<ATraiterSection, number>;
  total: number;
  /** true si l’échantillon attention a atteint le plafond (badge non exact). */
  attentionCapped?: boolean;
};

const SECTION_ORDER: ATraiterSection[] = ["bloquant", "urgent", "a_valider", "relance"];

function emptyCounts(): Record<ATraiterSection, number> {
  return { bloquant: 0, a_valider: 0, urgent: 0, relance: 0 };
}

function push(items: ATraiterItem[], item: ATraiterItem) {
  items.push(item);
}

export async function collectATraiter(
  user: {
    id: string;
    role?: string | null;
    personType?: string | null;
  },
  opts?: { light?: boolean; countOnly?: boolean; homePreview?: boolean; mineOnly?: boolean },
): Promise<ATraiterSnapshot> {
  const label = `a-traiter${opts?.countOnly ? ".count" : opts?.homePreview ? ".home" : opts?.light ? ".light" : ".full"}`;
  return runWithPerfContext(() =>
    withPerfLog(label, async () => {
  const homePreview = Boolean(opts?.homePreview);
  const light = Boolean(opts?.light) || Boolean(opts?.countOnly) || homePreview;
  const countOnly = Boolean(opts?.countOnly);
  const items: ATraiterItem[] = [];
  const sessionUser: SessionUser = user;

  // Externes (client / fournisseur hors propriétaire org) : pas le centre interne complet
  const externalPortal =
    user.personType === "CLIENT_EXT" || user.personType === "SUPPLIER";

  const agentOnly = isAgent(sessionUser) && !isAgencyOrManager(sessionUser);
  const mineOnly = Boolean(opts?.mineOnly) || agentOnly;
  /** Plafond d’échantillon attention pour le badge — jamais présenté comme exact si atteint. */
  const attentionTake = countOnly ? 200 : homePreview ? 12 : undefined;

  // Items métier + attention : indépendants → parallèle (évite waterfall staff→attention).
  const itemsPromise = (async () => {
    if (countOnly || homePreview) return;
    if (isClientRole(sessionUser) && !externalPortal) {
      await collectForClient(user.id, items);
    } else if (isAgencyOrManager(sessionUser) || isAgent(sessionUser)) {
      await collectForStaff(user.id, sessionUser, items);
    } else if (isClientRole(sessionUser) && externalPortal) {
      await collectForClient(user.id, items);
    }
  })();

  const attentionPromise = externalPortal
    ? Promise.resolve({ cards: [] as ATraiterAttentionCard[], capped: false })
    : collectUnifiedAttentionCards(
        {
          id: user.id,
          role: user.role,
          personType: user.personType,
          permissionProfile: (user as { permissionProfile?: string | null }).permissionProfile,
        },
        mineOnly ? user.id : null,
        light,
        attentionTake,
      );

  const [, attentionResult] = await Promise.all([itemsPromise, attentionPromise]);
  const attentionCards = attentionResult.cards;
  const attentionCapped = Boolean(
    (countOnly || homePreview) && attentionResult.capped,
  );

  if (!countOnly && !homePreview) {
    items.sort((a, b) => {
      const sa = SECTION_ORDER.indexOf(a.section);
      const sb = SECTION_ORDER.indexOf(b.section);
      if (sa !== sb) return sa - sb;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  const counts = emptyCounts();
  if (countOnly) {
    const hotBuckets = await collectHotCountBuckets(user.id, sessionUser, externalPortal);
    counts.bloquant = hotBuckets.bloquant;
    counts.urgent = hotBuckets.urgent;
  } else if (!homePreview) {
    for (const it of items) counts[it.section] += 1;
  }

  const attentionCounts = countAttentionByUrgency(attentionCards);
  const hotCount = countHotAttention(attentionCards);

  return {
    attentionCards: countOnly
      ? attentionCards.filter(
          (c) => c.effectiveUrgency === "CRITIQUE" || c.effectiveUrgency === "URGENT",
        )
      : homePreview
        ? attentionCards.slice(0, 5)
        : attentionCards,
    attentionCounts,
    hotCount,
    items,
    counts,
    total: homePreview
      ? attentionCards.length
      : attentionCards.length +
        (countOnly
          ? counts.bloquant + counts.urgent + counts.a_valider + counts.relance
          : items.length),
    attentionCapped,
  };
    }).finally(() => {
      const s = summarizePerfQueries(5);
      if (s.count > 0) {
        console.info(`[perf] ${label}.queries count=${s.count}`);
        for (const q of s.top) {
          console.info(`[perf] ${label}.top ${q.model}.${q.action} ${q.ms}ms`);
        }
      }
    }),
  );
}

/** Compteurs SQL hot pour badge — sans findMany détail. */
async function collectHotCountBuckets(
  userId: string,
  sessionUser: SessionUser,
  externalPortal: boolean,
): Promise<{ bloquant: number; urgent: number }> {
  try {
    if (isClientRole(sessionUser)) {
      const projectWhere = await projectWhereForClientUser(userId);
      const [alertUrgentN, missingN] = await Promise.all([
        prisma.alert.count({
          where: { clientId: userId, read: false, level: { in: ["URGENT", "WARNING"] } },
        }),
        prisma.chantierFile.count({
          where: {
            deletedAt: null,
            status: { in: ["MANQUANT", "A_RELANCER"] },
            project: projectWhere,
          },
        }),
      ]);
      return { bloquant: 0, urgent: alertUrgentN + missingN };
    }

    if (externalPortal) return { bloquant: 0, urgent: 0 };

    const isDecideur = isAgencyOrManager(sessionUser);
    const agentOnly = isAgent(sessionUser) && !isDecideur;

    const [urgentTasksN, blockersN] = await Promise.all([
      prisma.task.count({
        where: {
          status: { notIn: ["COMPLETE"] },
          priority: { in: ["URGENT", "PRIORITAIRE"] },
          ...(agentOnly ? { assignedToId: userId } : {}),
        },
      }),
      isDecideur || agentOnly
        ? prisma.pilotageBlocker.count({
            where: {
              archivedAt: null,
              status: { in: ["Ouvert", "En cours"] },
              severity: "Critique",
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
          })
        : Promise.resolve(0),
    ]);

    return { bloquant: blockersN, urgent: urgentTasksN };
  } catch (e) {
    console.error("collectHotCountBuckets:", e);
    return { bloquant: 0, urgent: 0 };
  }
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
    if (!f.project) continue;
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
            pilotage: {
              select: { project: { select: { id: true, title: true } } },
            },
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
      meta: `${b.pilotage.project.title} · Blocage ${b.severity}`,
      href: `/dashboard/projets/${b.pilotage.project.id}/suivi-contractuel?onglet=blocages`,
      source: "blocage",
      createdAt: b.openedAt,
    });
  }

  await collectMessageActions(userId, items);
}

async function collectMessageActions(userId: string, items: ATraiterItem[]) {
  try {
    const now = new Date();
    const actions = await prisma.messageAction.findMany({
      where: {
        status: "OPEN",
        type: { in: ["REMINDER", "ASSIGN"] },
        OR: [{ assigneeId: userId }, { createdById: userId, type: "REMINDER" }],
      },
      select: {
        id: true,
        title: true,
        type: true,
        priority: true,
        dueAt: true,
        createdAt: true,
        sourceMessageKind: true,
        sourceMessageId: true,
        metaJson: true,
      },
      orderBy: { dueAt: "asc" },
      take: 40,
    });

    for (const a of actions) {
      const meta = (a.metaJson ?? {}) as {
        deepLink?: string;
        excerpt?: string;
        projectTitle?: string;
      };
      const overdue = a.dueAt != null && a.dueAt < now;
      const section: ATraiterSection =
        a.priority === "URGENT" || overdue
          ? "bloquant"
          : a.priority === "IMPORTANT"
            ? "urgent"
            : "relance";
      const href =
        meta.deepLink ||
        (a.sourceMessageKind === "TASK"
          ? `/dashboard/messagerie?messageId=${a.sourceMessageId}`
          : `/dashboard/messagerie?tab=messages-directs&messageId=${a.sourceMessageId}`);

      push(items, {
        id: `msg-action-${a.id}`,
        section,
        title: a.title,
        meta:
          a.type === "REMINDER"
            ? `Rappel message${meta.projectTitle ? ` · ${meta.projectTitle}` : ""}`
            : `Assigné depuis messagerie${meta.projectTitle ? ` · ${meta.projectTitle}` : ""}`,
        href,
        source: "message",
        createdAt: a.dueAt ?? a.createdAt,
        dueLabel: a.dueAt
          ? a.dueAt.toLocaleString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
      });
    }
  } catch (e) {
    console.error("collectMessageActions:", e);
  }
}

/** Fiches + commandes → une seule liste triée (sans NORMAL). */
async function collectUnifiedAttentionCards(
  sessionUser: {
    id: string;
    role?: string | null;
    personType?: string | null;
    permissionProfile?: string | null;
  },
  assigneeOnlyId: string | null,
  light = false,
  takeOverride?: number,
): Promise<{ cards: ATraiterAttentionCard[]; capped: boolean }> {
  // Une seule résolution org pour Follow-up + PO (évite double ensureOrganizationForOwner).
  const sharedOrgId = isInternalPurchaseOrderActor(sessionUser)
    ? await resolvePurchaseOrderOrgId(sessionUser)
    : null;

  const [followUp, purchaseOrder] = await Promise.all([
    timedBranch(
      "a-traiter.followUpAttention",
      collectFollowUpAttentionCards(
        sessionUser,
        assigneeOnlyId,
        light,
        takeOverride,
        sharedOrgId,
      ),
    ),
    timedBranch(
      "a-traiter.purchaseOrderAttention",
      collectPurchaseOrderAttentionCards(
        sessionUser,
        assigneeOnlyId,
        light,
        takeOverride,
        sharedOrgId,
      ),
    ),
  ]);
  const take = takeOverride ?? (light ? 40 : 120);
  const capped =
    typeof takeOverride === "number" &&
    (followUp.sampled >= take || purchaseOrder.sampled >= take);
  return {
    cards: [...followUp.cards, ...purchaseOrder.cards].sort(sortAttentionCards),
    capped,
  };
}

/** Fiches → diagnostics W3-A (batch, une carte / fiche, sans NORMAL). */
async function collectFollowUpAttentionCards(
  sessionUser: { id: string; role?: string | null },
  assigneeOnlyId: string | null,
  light = false,
  takeOverride?: number,
  sharedOrgId?: string | null,
): Promise<{ cards: ATraiterAttentionCard[]; sampled: number }> {
  try {
    // accessWhere // ownerUserId : indépendants → parallèle (évite waterfall session).
    const [accessWhere, ownerUserId] = await Promise.all([
      followUpSheetAccessWhere(sessionUser),
      resolveFollowUpOwnerUserId(sessionUser.id),
    ]);
    const settings = await getFollowUpSettings(ownerUserId);
    const orgId =
      sharedOrgId !== undefined
        ? sharedOrgId
        : await ensureOrganizationForOwner(ownerUserId);
    const take = takeOverride ?? (light ? 40 : 120);

    const sheets = await prisma.followUpSheet.findMany({
      where: {
        AND: [
          accessWhere,
          { status: { notIn: ["TERMINE", "ARCHIVE"] } },
          ...(assigneeOnlyId ? [{ assigneeId: assigneeOnlyId }] : []),
        ],
      },
      select: {
        id: true,
        title: true,
        clientName: true,
        osNumber: true,
        orderNumber: true,
        workObject: true,
        nextAction: true,
        nextActionAt: true,
        nextActionDone: true,
        urgencyOverride: true,
        status: true,
        assigneeId: true,
        assignee: { select: { id: true, name: true } },
        project: { select: { title: true } },
        tasks: { select: { id: true }, take: 1, orderBy: { updatedAt: "desc" } },
      },
      orderBy: [
        { urgencyOverride: "desc" },
        { nextActionAt: "asc" },
        { updatedAt: "desc" },
      ],
      take,
    });

    if (sheets.length === 0) return { cards: [], sampled: 0 };

    const { byId: attentionMap, statusEnteredAt } = await loadAttentionForSheets({
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

    const cards: ATraiterAttentionCard[] = [];
    for (const s of sheets) {
      const attention = attentionMap.get(s.id);
      if (!attention) continue;
      const card = buildAttentionCard({
        sheet: {
          id: s.id,
          title: s.title,
          clientName: s.clientName,
          osNumber: s.osNumber,
          orderNumber: s.orderNumber,
          workObject: s.workObject,
          nextAction: s.nextAction,
          nextActionDone: s.nextActionDone,
          nextActionAt: s.nextActionAt?.toISOString() ?? null,
          status: s.status,
          assigneeId: s.assigneeId,
          assigneeName: s.assignee?.name ?? null,
          projectTitle: s.project?.title ?? null,
          statusEnteredAt: statusEnteredAt.get(s.id) ?? null,
          relatedTaskId: s.tasks[0]?.id ?? null,
        },
        attention,
      });
      if (card) cards.push(card);
    }

    return { cards, sampled: sheets.length };
  } catch (e) {
    console.error("collectFollowUpAttentionCards:", e);
    return { cards: [], sampled: 0 };
  }
}

/** Commandes → diagnostics CDE-3B1 (batch, une carte / commande, sans NORMAL). */
async function collectPurchaseOrderAttentionCards(
  sessionUser: {
    id: string;
    role?: string | null;
    personType?: string | null;
    permissionProfile?: string | null;
  },
  assigneeOnlyId: string | null,
  light = false,
  takeOverride?: number,
  sharedOrgId?: string | null,
): Promise<{ cards: ATraiterAttentionCard[]; sampled: number }> {
  try {
    if (!isInternalPurchaseOrderActor(sessionUser)) return { cards: [], sampled: 0 };

    const orgId =
      sharedOrgId !== undefined
        ? sharedOrgId
        : await resolvePurchaseOrderOrgId(sessionUser);
    if (!orgId) return { cards: [], sampled: 0 };

    const take = takeOverride ?? (light ? 40 : 120);
    const rows = await loadPurchaseOrderAttention({
      organizationId: orgId,
      actorUserId: assigneeOnlyId,
      take,
      light,
    });

    const cards: ATraiterAttentionCard[] = [];
    for (const row of rows) {
      const card = buildPurchaseOrderAttentionCard({
        order: {
          id: row.id,
          number: row.number,
          subject: row.subject,
          supplierName: row.supplierName,
          projectId: row.projectId,
          projectTitle: row.projectTitle,
          status: row.status,
          responsibleId: row.responsibleId,
          responsibleName: row.responsibleName,
          lineDesignations: row.lineDesignations,
          agendaEventId: row.agendaEventId,
          confirmedDeliveryAt: row.confirmedDeliveryAt?.toISOString() ?? null,
          requestedDeliveryAt: row.requestedDeliveryAt?.toISOString() ?? null,
          sharedWithSupplier: row.sharedWithSupplier,
        },
        attention: row.attention,
      });
      if (card) cards.push(card);
    }
    return { cards, sampled: rows.length };
  } catch (e) {
    console.error("collectPurchaseOrderAttentionCards:", e);
    return { cards: [], sampled: 0 };
  }
}

export const A_TRAITER_SECTION_LABELS: Record<ATraiterSection, string> = {
  bloquant: "Critique",
  urgent: "Urgent",
  a_valider: "Important",
  relance: "À anticiper",
};

/**
 * Badge nav : URGENT + CRITIQUE + hot items.
 * COUNT léger (countOnly). Si l’échantillon attention est plafonné → capped=true
 * (le UI doit afficher N+ , jamais un sous-compte présenté comme exact).
 */
export async function countATraiter(user: {
  id: string;
  role?: string | null;
  personType?: string | null;
}): Promise<{ total: number; capped: boolean }> {
  const key = `a-traiter-count:${user.id}`;
  const cached = ttlGet<{ total: number; capped: boolean }>(key);
  if (cached && typeof cached.total === "number") return cached;

  const snapshot = await collectATraiter(user, { light: true, countOnly: true });
  const otherHot = snapshot.counts.bloquant + snapshot.counts.urgent;
  const total = snapshot.hotCount + otherHot;
  const payload = { total, capped: Boolean(snapshot.attentionCapped) };
  ttlSet(key, payload, 30_000);
  return payload;
}

/** Compteurs détaillés pour le bandeau Accueil (léger + cache 30 s). */
export async function summarizeATraiter(user: {
  id: string;
  role?: string | null;
  personType?: string | null;
}) {
  const key = `a-traiter-summary:${user.id}`;
  const cached = ttlGet<{
    total: number;
    hotCount: number;
    attentionCounts: ReturnType<typeof countAttentionByUrgency>;
  }>(key);
  if (cached) return cached;

  const snapshot = await collectATraiter(user, { homePreview: true });
  const summary = {
    total: snapshot.total,
    hotCount: snapshot.hotCount,
    attentionCounts: snapshot.attentionCounts,
  };
  ttlSet(key, summary, 30_000);
  ttlSet(
    `a-traiter-count:${user.id}`,
    {
      total: snapshot.hotCount,
      capped: Boolean(snapshot.attentionCapped),
    },
    30_000,
  );
  return summary;
}

/** Accueil V2A — cartes attention (max 5) sans collect staff/client. */
export async function previewATraiterForHome(
  user: {
    id: string;
    role?: string | null;
    personType?: string | null;
  },
  opts?: { mineOnly?: boolean },
) {
  return collectATraiter(user, {
    homePreview: true,
    mineOnly: opts?.mineOnly,
  });
}
