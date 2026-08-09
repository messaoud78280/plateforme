/**
 * CHANTIERS-V2B — Projection portefeuille batch.
 * Pas de loadChantierCockpitOps × N. Réutilise attention / agenda / PO / tasks.
 */
import { TaskStatus, type ChantierStatus, type PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loadAttentionForSheets } from "@/lib/follow-up/attention/batch";
import { loadPurchaseOrderAttention } from "@/lib/purchase-orders/attention/batch";
import { displayUserRoleLabel } from "@/lib/equipe-acces/display-role";
import { CHANTIER_STATUS_LABELS } from "@/lib/chantier-dossier/constants";
import { canDeleteChantierProject } from "@/lib/chantier-dossier/access";
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

const ACTIVE_STATUSES: ChantierStatus[] = ["ETUDE", "EN_COURS", "EN_ATTENTE", "RECEPTION"];

export type PortfolioAttentionLevel = "none" | "watch" | "urgent" | "critical";

export type PortfolioProjectRow = {
  id: string;
  title: string;
  chantierStatus: ChantierStatus;
  statusLabel: string;
  siteAddress: string | null;
  siteCity: string | null;
  locationLabel: string | null;
  clientLabel: string | null;
  responsibleName: string | null;
  responsibleRoleLabel: string | null;
  /** Source: assignedTo | internalManager | null */
  responsibleSource: "assignedTo" | "internalManager" | null;
  attentionCount: number;
  criticalCount: number;
  urgentCount: number;
  attentionLevel: PortfolioAttentionLevel;
  attentionLabel: string | null;
  nextEvent: {
    id: string;
    title: string;
    startAt: string;
    href: string;
  } | null;
  nextDelivery: {
    id: string;
    supplierName: string;
    at: string;
    statusHint: string | null;
    href: string;
  } | null;
  openTasks: number;
  overdueTasks: number;
  documentsCount: number;
  updatedAt: string;
  canDelete: boolean;
  href: string;
  /** Score tri Attention */
  attentionScore: number;
};

export type PortfolioSummary = {
  total: number;
  enCours: number;
  etude: number;
  enAttente: number;
  reception: number;
  termine: number;
  withAttention: number;
  missingPieces: number;
};

export type ProjectsPortfolioResult = {
  rows: PortfolioProjectRow[];
  summary: PortfolioSummary;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function isInternalAssignee(u: {
  personType?: string | null;
  role?: string | null;
  accessStatus?: string | null;
}): boolean {
  if (u.accessStatus === "DISABLED" || u.accessStatus === "REVOKED") return false;
  if (u.personType === "CLIENT_EXT" || u.personType === "SUPPLIER") return false;
  if (u.personType === "SUBCONTRACTOR" || u.personType === "PARTNER") return false;
  if (u.personType === "INTERNAL") return true;
  if (u.role === "MANAGER" || u.role === "AGENCE" || u.role === "AGENT") return true;
  // CLIENT + profil interne (personas démo)
  return u.personType == null || u.personType === "INTERNAL";
}

function locationLabel(address: string | null, city: string | null): string | null {
  const a = address?.trim() || "";
  const c = city?.trim() || "";
  if (a && c) {
    const full = `${a} · ${c}`;
    return full.length > 56 ? c : full;
  }
  return a || c || null;
}

function attentionLevel(crit: number, urg: number, n: number): PortfolioAttentionLevel {
  if (crit > 0) return "critical";
  if (urg > 0) return "urgent";
  if (n > 0) return "watch";
  return "none";
}

function attentionLabel(level: PortfolioAttentionLevel, n: number): string | null {
  if (level === "none" || n <= 0) return null;
  if (level === "critical") return n === 1 ? "Critique" : `${n} critiques`;
  if (level === "urgent") return n === 1 ? "Urgent" : `${n} urgents`;
  return n === 1 ? "1 point à traiter" : `${n} points à traiter`;
}

export async function loadProjectsPortfolio(opts: {
  user: {
    id: string;
    role?: string | null;
    personType?: string | null;
    permissionProfile?: string | null;
  };
  whereProject: Record<string, unknown>;
  search?: string;
  statusFilter?: ChantierStatus;
  take?: number;
}): Promise<ProjectsPortfolioResult> {
  return withPerfLog("loadProjectsPortfolio", async () => {
    const take = Math.min(Math.max(opts.take ?? 80, 1), 120);
    const search = (opts.search ?? "").trim();
    const day0 = startOfDay(new Date());
    const soon = addDays(day0, 21);

    const where = {
      ...opts.whereProject,
      ...(opts.statusFilter ? { chantierStatus: opts.statusFilter } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { siteCity: { contains: search, mode: "insensitive" as const } },
              { siteAddress: { contains: search, mode: "insensitive" as const } },
              { client: { name: { contains: search, mode: "insensitive" as const } } },
              { client: { company: { contains: search, mode: "insensitive" as const } } },
              { internalManager: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [projects, counts, missingPieces] = await Promise.all([
      prisma.project.findMany({
        where,
        take,
        orderBy: { updatedAt: "desc" },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              personType: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              role: true,
              personType: true,
              permissionProfile: true,
              jobTitle: true,
              accessStatus: true,
            },
          },
          organization: { select: { id: true, name: true } },
          _count: { select: { chantierFiles: true } },
        },
      }),
      prisma.project.groupBy({
        by: ["chantierStatus"],
        _count: true,
        where: opts.whereProject,
      }),
      prisma.chantierFile.count({
        where: {
          status: { in: ["MANQUANT", "A_RELANCER"] },
          deletedAt: null,
          project: opts.whereProject,
        },
      }),
    ]);

    const projectIds = projects.map((p) => p.id);
    const orgIds = [
      ...new Set(
        projects.map((p) => p.organizationId).filter((id): id is string => Boolean(id)),
      ),
    ];

    const [openTasksByProject, overdueByProject, nextEvents, nextDeliveries, clientAccess, sheets] =
      await Promise.all([
        projectIds.length
          ? prisma.task.groupBy({
              by: ["projectId"],
              where: {
                projectId: { in: projectIds },
                status: { not: TaskStatus.COMPLETE },
              },
              _count: { _all: true },
            })
          : Promise.resolve([]),
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
                id: true,
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
              take: 80,
              select: {
                id: true,
                projectId: true,
                status: true,
                confirmedDeliveryAt: true,
                requestedDeliveryAt: true,
                proposedDeliveryStatus: true,
                externalOrganization: { select: { name: true, tradeName: true } },
              },
            })
          : Promise.resolve([]),
        projectIds.length
          ? prisma.projectAccess.findMany({
              where: {
                projectId: { in: projectIds },
                user: { personType: "CLIENT_EXT", accessStatus: "ACTIVE" },
              },
              select: {
                projectId: true,
                user: { select: { name: true, company: true } },
              },
            })
          : Promise.resolve([]),
        projectIds.length
          ? prisma.followUpSheet.findMany({
              where: { projectId: { in: projectIds } },
              select: {
                id: true,
                projectId: true,
                status: true,
                title: true,
                clientName: true,
                nextActionAt: true,
                nextActionDone: true,
                urgencyOverride: true,
              },
              take: 200,
            })
          : Promise.resolve([]),
      ]);

    const [sheetAttention, ...poAttBatches] = await Promise.all([
      sheets.length
        ? loadAttentionForSheets({
            sheets: sheets.map((s) => ({
              id: s.id,
              status: s.status,
              title: s.title,
              nextActionAt: s.nextActionAt?.toISOString() ?? null,
              nextActionDone: s.nextActionDone,
              urgencyOverride: s.urgencyOverride,
            })),
          })
        : Promise.resolve({ byId: new Map() }),
      ...orgIds.map((organizationId) =>
        loadPurchaseOrderAttention({
          organizationId,
          actorUserId: opts.user.role === "AGENT" ? opts.user.id : null,
          take: 80,
          light: true,
        }).catch(() => []),
      ),
    ]);

    const openMap = new Map(
      openTasksByProject.filter((r) => r.projectId).map((r) => [r.projectId!, r._count._all]),
    );
    const overdueMap = new Map(
      overdueByProject.filter((r) => r.projectId).map((r) => [r.projectId!, r._count._all]),
    );

    const attentionByProject = new Map<string, { n: number; crit: number; urg: number }>();
    function bumpAttention(pid: string | null | undefined, urgency: string) {
      if (!pid || urgency === "NORMAL") return;
      const cur = attentionByProject.get(pid) ?? { n: 0, crit: 0, urg: 0 };
      cur.n += 1;
      if (urgency === "CRITIQUE") cur.crit += 1;
      else if (urgency === "URGENT") cur.urg += 1;
      attentionByProject.set(pid, cur);
    }

    for (const s of sheets) {
      if (!s.projectId) continue;
      const att = sheetAttention.byId.get(s.id);
      if (!att) continue;
      bumpAttention(s.projectId, att.effectiveUrgency);
    }

    for (const batch of poAttBatches) {
      for (const row of batch) {
        if (!row.projectId || !projectIds.includes(row.projectId)) continue;
        bumpAttention(row.projectId, row.attention.effectiveUrgency);
      }
    }

    const nextByProject = new Map<
      string,
      { id: string; title: string; startAt: Date }
    >();
    for (const ev of nextEvents) {
      if (!ev.projectId || nextByProject.has(ev.projectId)) continue;
      nextByProject.set(ev.projectId, {
        id: ev.id,
        title: ev.title,
        startAt: ev.startAt,
      });
    }

    const nextDeliveryByProject = new Map<
      string,
      {
        id: string;
        supplierName: string;
        at: Date;
        statusHint: string | null;
      }
    >();
    for (const o of nextDeliveries) {
      if (!o.projectId || nextDeliveryByProject.has(o.projectId)) continue;
      const when = o.confirmedDeliveryAt ?? o.requestedDeliveryAt;
      if (!when) continue;
      const supplier =
        o.externalOrganization.tradeName?.trim() ||
        o.externalOrganization.name?.trim() ||
        "Fournisseur";
      let statusHint: string | null = null;
      if (!o.confirmedDeliveryAt && o.requestedDeliveryAt) statusHint = "À confirmer";
      if (o.proposedDeliveryStatus === "PENDING") statusHint = "Proposition fournisseur";
      nextDeliveryByProject.set(o.projectId, {
        id: o.id,
        supplierName: supplier,
        at: when,
        statusHint,
      });
    }

    const clientExtByProject = new Map<string, string>();
    for (const a of clientAccess) {
      if (clientExtByProject.has(a.projectId)) continue;
      const label = a.user.company?.trim() || a.user.name?.trim();
      if (label) clientExtByProject.set(a.projectId, label);
    }
    const sheetClientByProject = new Map<string, string>();
    for (const s of sheets) {
      if (!s.projectId || sheetClientByProject.has(s.projectId)) continue;
      const cn = s.clientName?.trim();
      if (cn) sheetClientByProject.set(s.projectId, cn);
    }

    const byStatus = Object.fromEntries(counts.map((c) => [c.chantierStatus, c._count])) as Record<
      string,
      number
    >;
    const total = counts.reduce((acc, c) => acc + c._count, 0);

    const rows: PortfolioProjectRow[] = projects.map((p) => {
      const att = attentionByProject.get(p.id) ?? { n: 0, crit: 0, urg: 0 };
      const level = attentionLevel(att.crit, att.urg, att.n);
      const openTasks = openMap.get(p.id) ?? 0;
      const overdueTasks = overdueMap.get(p.id) ?? 0;
      const next = nextByProject.get(p.id);
      const del = nextDeliveryByProject.get(p.id);

      let responsibleName: string | null = null;
      let responsibleRoleLabel: string | null = null;
      let responsibleSource: PortfolioProjectRow["responsibleSource"] = null;

      if (p.assignedTo && isInternalAssignee(p.assignedTo)) {
        responsibleName = p.assignedTo.name;
        responsibleRoleLabel = displayUserRoleLabel({
          role: p.assignedTo.role,
          personType: p.assignedTo.personType,
          permissionProfile: p.assignedTo.permissionProfile,
          jobTitle: p.assignedTo.jobTitle,
        });
        responsibleSource = "assignedTo";
      } else if (p.internalManager?.trim()) {
        // Ne jamais afficher un CLIENT_EXT connu comme responsable interne
        const im = p.internalManager.trim();
        const looksExternal =
          im.toLowerCase() === "sophie martin" ||
          (p.client.personType === "CLIENT_EXT" && im === p.client.name);
        if (!looksExternal) {
          responsibleName = im;
          responsibleRoleLabel = "Responsable chantier";
          responsibleSource = "internalManager";
        }
      }

      const clientLabel =
        sheetClientByProject.get(p.id) ||
        clientExtByProject.get(p.id) ||
        p.client.company?.trim() ||
        (p.client.personType === "CLIENT_EXT" ? p.client.name : null) ||
        p.organization?.name?.trim() ||
        null;

      const attentionScore =
        att.crit * 10 +
        att.urg * 6 +
        att.n * 3 +
        overdueTasks * 4 +
        (del ? 2 : 0) +
        (next ? 1 : 0) +
        (ACTIVE_STATUSES.includes(p.chantierStatus) ? 0.5 : 0);

      return {
        id: p.id,
        title: p.title,
        chantierStatus: p.chantierStatus,
        statusLabel: CHANTIER_STATUS_LABELS[p.chantierStatus],
        siteAddress: p.siteAddress,
        siteCity: p.siteCity,
        locationLabel: locationLabel(p.siteAddress, p.siteCity),
        clientLabel,
        responsibleName,
        responsibleRoleLabel,
        responsibleSource,
        attentionCount: att.n,
        criticalCount: att.crit,
        urgentCount: att.urg,
        attentionLevel: level,
        attentionLabel: attentionLabel(level, att.n),
        nextEvent: next
          ? {
              id: next.id,
              title: next.title,
              startAt: next.startAt.toISOString(),
              href: `/dashboard/agenda?event=${next.id}`,
            }
          : null,
        nextDelivery: del
          ? {
              id: del.id,
              supplierName: del.supplierName,
              at: del.at.toISOString(),
              statusHint: del.statusHint,
              href: `/dashboard/commandes/${del.id}`,
            }
          : null,
        openTasks,
        overdueTasks,
        documentsCount: p._count.chantierFiles,
        updatedAt: p.updatedAt.toISOString(),
        canDelete: canDeleteChantierProject(opts.user, p),
        href: `/dashboard/projets/${p.id}`,
        attentionScore,
      };
    });

    // Tri défaut : attention → actif → activité récente
    rows.sort((a, b) => {
      if (b.attentionScore !== a.attentionScore) return b.attentionScore - a.attentionScore;
      const aActive = ACTIVE_STATUSES.includes(a.chantierStatus) ? 1 : 0;
      const bActive = ACTIVE_STATUSES.includes(b.chantierStatus) ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const withAttention = rows.filter((r) => r.attentionCount > 0).length;

    return {
      rows,
      summary: {
        total,
        enCours: byStatus.EN_COURS ?? 0,
        etude: byStatus.ETUDE ?? 0,
        enAttente: byStatus.EN_ATTENTE ?? 0,
        reception: byStatus.RECEPTION ?? 0,
        termine: byStatus.TERMINE ?? 0,
        withAttention,
        missingPieces,
      },
    };
  });
}
