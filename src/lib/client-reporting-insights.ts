import { prisma } from "@/lib/prisma";
import { CLIENT_DECISION_LABELS, type ClientDecision } from "@/lib/tasks/client-decision";
import { missionTypeLabel } from "@/lib/tasks/mission-types";
import { CLIENT_TASK_STATUS_LABELS, type TaskStatus } from "@/types";

export type ReportingAudience = "client" | "ops";

export type ClientInsightSeverity = "bloquant" | "urgent" | "a_valider" | "info";

export type ClientReportingInsight = {
  id: string;
  severity: ClientInsightSeverity;
  title: string;
  detail: string;
  href?: string;
  count: number;
};

export type ClientReportingDossier = {
  id: string;
  title: string;
  status: string;
  statusLabel: string;
  missionTypeLabel: string;
  priority: string | null;
  desiredDate: string | null;
  projectTitle: string | null;
  assignedToName: string | null;
  /** Raison sociale / nom du client — utile en vue Manager (multi-clients) */
  clientName: string | null;
  daysWaiting: number;
  nextAction: string;
  flag: "bloquant" | "urgent" | "a_valider" | "en_cours";
  flagLabel: string;
  href: string;
};

export type ClientReportingDecision = {
  id: string;
  title: string;
  decision: string;
  decisionLabel: string;
  decidedAt: string | null;
  note: string | null;
  href: string;
};

export type ClientReportingPilotage = {
  id: string;
  projectTitle: string;
  status: string;
  healthLabel: string | null;
  healthScore: number | null;
  plannedEndDate: string | null;
  href: string;
};

export type ClientExecutiveDigest = {
  headline: string;
  bullets: string[];
  shareText: string;
};

export type ClientReportingSnapshot = {
  audience: ReportingAudience;
  awaitingClientDecision: number;
  awaitingClientInfo: number;
  urgentOpen: number;
  overdueDesiredDate: number;
  unreadUrgentAlerts: number;
  docsPending: number;
  openMissions: number;
  activePilotages: number;
  insights: ClientReportingInsight[];
  dossiers: ClientReportingDossier[];
  recentDecisions: ClientReportingDecision[];
  pilotages: ClientReportingPilotage[];
  executiveDigest: ClientExecutiveDigest;
};

const OPEN_STATUSES = [
  "NOUVEAU",
  "EN_ATTENTE",
  "ASSIGNEE",
  "EN_ANALYSE",
  "EN_COURS",
  "EN_ATTENTE_INFO",
  "A_VALIDER",
] as const;

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
}

function isAwaitingClientDecision(t: {
  clientReportSentAt: Date | null;
  clientDecision: string | null;
}): boolean {
  return (
    t.clientDecision === "EN_ATTENTE_CLIENT" ||
    (Boolean(t.clientReportSentAt) && (!t.clientDecision || t.clientDecision === "EN_ATTENTE_CLIENT"))
  );
}

function dossierFlag(
  t: {
    status: string;
    priority: string | null;
    desiredDate: Date | null;
    clientReportSentAt: Date | null;
    clientDecision: string | null;
  },
  today: Date,
): ClientReportingDossier["flag"] {
  if (t.status === "EN_ATTENTE_INFO") return "bloquant";
  if (isAwaitingClientDecision(t)) return "a_valider";
  if ((t.priority ?? "").toUpperCase() === "URGENT") return "urgent";
  if (t.desiredDate && t.desiredDate < today) return "urgent";
  return "en_cours";
}

function nextActionFor(
  flag: ClientReportingDossier["flag"],
  t: { status: string; desiredDate: Date | null },
  today: Date,
  audience: ReportingAudience,
): string {
  const isOps = audience === "ops";
  if (flag === "bloquant") {
    return isOps ? "Relancer le client — info / pièce manquante" : "Compléter les informations / pièces manquantes";
  }
  if (flag === "a_valider") {
    return isOps
      ? "Relancer le client pour validation (accepter / refuser / réserves)"
      : "Valider, refuser ou émettre des réserves";
  }
  if (flag === "urgent" && t.desiredDate && t.desiredDate < today) {
    return isOps ? "Recadrer la date souhaitée avec le client" : "Recadrer la date souhaitée avec BeWork";
  }
  if (flag === "urgent") return isOps ? "Suivre en priorité" : "Suivre en priorité avec BeWork";
  if (t.status === "A_VALIDER") {
    return isOps ? "Finaliser le livrable puis l’envoyer au client" : "BeWork finalise — rester disponible pour validation";
  }
  return "Suivre l’avancement";
}

const FLAG_LABELS: Record<ClientReportingDossier["flag"], string> = {
  bloquant: "Bloquant",
  urgent: "Urgent",
  a_valider: "À valider",
  en_cours: "En cours",
};

function buildExecutiveDigest(
  input: {
    awaitingDecision: number;
    awaitingInfo: number;
    urgentOpen: number;
    overdue: number;
    openMissions: number;
    activePilotages: number;
    docsPending: number;
    topDossiers: { title: string; flagLabel: string; nextAction: string; clientName?: string | null }[];
  },
  audience: ReportingAudience,
): ClientExecutiveDigest {
  const isOps = audience === "ops";
  const blockers = input.awaitingInfo + input.awaitingDecision + input.overdue;
  const headline = isOps
    ? blockers === 0
      ? "Situation claire : aucun dossier bloquant sur l’ensemble des clients."
      : `${blockers} point${blockers > 1 ? "s" : ""} à traiter sur l’ensemble des dossiers clients.`
    : blockers === 0
      ? "Situation claire : aucun point bloquant côté validation client."
      : `${blockers} point${blockers > 1 ? "s" : ""} à traiter pour sécuriser vos dossiers.`;

  const bullets: string[] = isOps
    ? [
        `${input.openMissions} mission${input.openMissions > 1 ? "s" : ""} ouverte${input.openMissions > 1 ? "s" : ""} tous clients confondus`,
        `${input.awaitingDecision} livrable${input.awaitingDecision > 1 ? "s" : ""} en attente de validation client`,
        `${input.awaitingInfo} dossier${input.awaitingInfo > 1 ? "s" : ""} bloqué${input.awaitingInfo > 1 ? "s" : ""} faute d’information client — à relancer`,
        `${input.urgentOpen} mission${input.urgentOpen > 1 ? "s" : ""} urgente${input.urgentOpen > 1 ? "s" : ""} · ${input.overdue} date${input.overdue > 1 ? "s" : ""} souhaitée${input.overdue > 1 ? "s" : ""} dépassée${input.overdue > 1 ? "s" : ""}`,
        `${input.activePilotages} chantier${input.activePilotages > 1 ? "s" : ""} en pilotage · ${input.docsPending} document${input.docsPending > 1 ? "s" : ""} en attente`,
      ]
    : [
        `${input.openMissions} mission${input.openMissions > 1 ? "s" : ""} ouverte${input.openMissions > 1 ? "s" : ""} chez BeWork`,
        `${input.awaitingDecision} livrable${input.awaitingDecision > 1 ? "s" : ""} à valider par votre entreprise`,
        `${input.awaitingInfo} dossier${input.awaitingInfo > 1 ? "s" : ""} bloqué${input.awaitingInfo > 1 ? "s" : ""} faute d’information client`,
        `${input.urgentOpen} mission${input.urgentOpen > 1 ? "s" : ""} urgente${input.urgentOpen > 1 ? "s" : ""} · ${input.overdue} date${input.overdue > 1 ? "s" : ""} souhaitée${input.overdue > 1 ? "s" : ""} dépassée${input.overdue > 1 ? "s" : ""}`,
        `${input.activePilotages} chantier${input.activePilotages > 1 ? "s" : ""} en pilotage · ${input.docsPending} document${input.docsPending > 1 ? "s" : ""} en attente`,
      ];

  if (input.topDossiers.length > 0) {
    bullets.push(
      ...input.topDossiers
        .slice(0, 3)
        .map(
          (d) =>
            `${d.flagLabel} — ${d.title}${isOps && d.clientName ? ` (${d.clientName})` : ""} → ${d.nextAction}`,
        ),
    );
  }

  const shareText = [
    isOps ? "Synthèse BeWork — pilotage activité" : "Synthèse BeWork — reporting client",
    headline,
    "",
    ...bullets.map((b) => `• ${b}`),
    "",
    isOps
      ? "Vue consolidée tous clients — chaque dossier reste validé par le client concerné."
      : "BeWork prépare et suit. Votre entreprise valide prix, choix techniques et engagements.",
  ].join("\n");

  return { headline, bullets, shareText };
}

/**
 * Snapshot reporting — version enrichie (pilotage décisionnel).
 * `audience: "client"` → dossiers d'un client (clientId requis).
 * `audience: "ops"` → vue consolidée Manager/Agence, tous clients confondus.
 * Règles métier uniquement (pas d’hypothèse IA).
 */
export async function getClientReportingSnapshot(
  clientId: string,
  audience: ReportingAudience = "client",
): Promise<ClientReportingSnapshot> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();
  const isOps = audience === "ops";
  const scopeWhere = isOps ? {} : { clientId };

  const [openTasks, pendingDocs, unreadAlerts, decidedTasks, pilotagesRaw] = await Promise.all([
    prisma.task.findMany({
      where: {
        ...scopeWhere,
        status: { in: [...OPEN_STATUSES] },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        missionType: true,
        desiredDate: true,
        clientReportSentAt: true,
        clientDecision: true,
        updatedAt: true,
        createdAt: true,
        project: { select: { title: true } },
        assignedTo: { select: { name: true } },
        client: isOps ? { select: { name: true, company: true } } : undefined,
      },
      orderBy: { updatedAt: "desc" },
      take: isOps ? 500 : 200,
    }),
    prisma.document.count({
      where: { ...scopeWhere, status: "EN_ATTENTE" },
    }),
    prisma.alert.findMany({
      where: {
        ...scopeWhere,
        read: false,
        level: { in: ["URGENT", "WARNING"] },
      },
      select: { id: true, level: true, title: true, actionUrl: true },
      take: isOps ? 200 : 50,
    }),
    prisma.task.findMany({
      where: {
        ...scopeWhere,
        clientDecision: { in: ["ACCEPTE", "REFUSE", "RESERVES"] },
        clientDecisionAt: { not: null },
      },
      select: {
        id: true,
        title: true,
        clientDecision: true,
        clientDecisionAt: true,
        clientDecisionNote: true,
        client: isOps ? { select: { name: true, company: true } } : undefined,
      },
      orderBy: { clientDecisionAt: "desc" },
      take: isOps ? 20 : 10,
    }),
    prisma.worksitePilotage.findMany({
      where: {
        ...scopeWhere,
        archivedAt: null,
        status: { not: "TERMINE" },
      },
      select: {
        id: true,
        status: true,
        healthLabel: true,
        healthScore: true,
        plannedEndDate: true,
        project: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: isOps ? 30 : 10,
    }),
  ]);

  const awaitingDecision = openTasks.filter(isAwaitingClientDecision);
  const awaitingInfo = openTasks.filter((t) => t.status === "EN_ATTENTE_INFO");
  const urgentOpen = openTasks.filter((t) => (t.priority ?? "").toUpperCase() === "URGENT");
  const overdue = openTasks.filter((t) => t.desiredDate && t.desiredDate < today);
  const unreadUrgentAlerts = unreadAlerts.filter((a) => a.level === "URGENT").length;

  const insights: ClientReportingInsight[] = [];

  if (awaitingDecision.length > 0) {
    insights.push({
      id: "awaiting-decision",
      severity: "a_valider",
      title: "Livrables à valider",
      detail: isOps
        ? `${awaitingDecision.length} dossier${awaitingDecision.length > 1 ? "s" : ""} transmis en attente de validation client — à relancer si besoin.`
        : awaitingDecision.length === 1
          ? `« ${awaitingDecision[0]!.title} » attend votre décision (accepter, refuser ou réserver).`
          : `${awaitingDecision.length} dossiers transmis par BeWork attendent votre validation.`,
      href: "/dashboard/taches",
      count: awaitingDecision.length,
    });
  }

  if (awaitingInfo.length > 0) {
    insights.push({
      id: "awaiting-info",
      severity: "bloquant",
      title: "Informations manquantes",
      detail: isOps
        ? `${awaitingInfo.length} mission${awaitingInfo.length > 1 ? "s" : ""} en attente d’information client — risque de retard, à relancer.`
        : awaitingInfo.length === 1
          ? `BeWork est bloqué sur « ${awaitingInfo[0]!.title} » — une info ou une pièce manque de votre côté.`
          : `${awaitingInfo.length} missions en attente d’information client — risque de retard si non complété.`,
      href: "/dashboard/taches?statut=EN_ATTENTE_INFO",
      count: awaitingInfo.length,
    });
  }

  if (urgentOpen.length > 0) {
    insights.push({
      id: "urgent-open",
      severity: "urgent",
      title: "Missions urgentes en cours",
      detail: `${urgentOpen.length} mission${urgentOpen.length > 1 ? "s" : ""} urgente${urgentOpen.length > 1 ? "s" : ""} — suivi prioritaire.`,
      href: "/dashboard/taches",
      count: urgentOpen.length,
    });
  }

  if (overdue.length > 0) {
    insights.push({
      id: "overdue-desired",
      severity: "urgent",
      title: "Date souhaitée dépassée",
      detail: `${overdue.length} dossier${overdue.length > 1 ? "s" : ""} dépasse${overdue.length > 1 ? "nt" : ""} la date souhaitée — à recalibrer avec BeWork.`,
      href: "/dashboard/taches",
      count: overdue.length,
    });
  }

  if (unreadUrgentAlerts > 0 || unreadAlerts.length > 0) {
    insights.push({
      id: "alerts",
      severity: unreadUrgentAlerts > 0 ? "bloquant" : "info",
      title: unreadUrgentAlerts > 0 ? "Alertes urgentes non lues" : "Alertes à traiter",
      detail: `${unreadAlerts.length} alerte${unreadAlerts.length > 1 ? "s" : ""} non lue${unreadAlerts.length > 1 ? "s" : ""}.`,
      href: "/dashboard",
      count: unreadAlerts.length,
    });
  }

  if (pendingDocs > 0) {
    insights.push({
      id: "docs-pending",
      severity: "info",
      title: "Documents en attente",
      detail: `${pendingDocs} document${pendingDocs > 1 ? "s" : ""} encore « en attente ».`,
      href: "/dashboard/documents",
      count: pendingDocs,
    });
  }

  if (pilotagesRaw.length > 0) {
    const critique = pilotagesRaw.filter(
      (p) => p.healthLabel === "CRITIQUE" || p.healthLabel === "EN_DIFFICULTE",
    );
    insights.push({
      id: "pilotage",
      severity: critique.length > 0 ? "urgent" : "info",
      title: critique.length > 0 ? "Pilotage chantier à surveiller" : "Pilotage chantier actif",
      detail:
        critique.length > 0
          ? `${critique.length} chantier${critique.length > 1 ? "s" : ""} en difficulté / critique.`
          : `${pilotagesRaw.length} chantier${pilotagesRaw.length > 1 ? "s" : ""} suivi${pilotagesRaw.length > 1 ? "s" : ""} en pilotage.`,
      href: "/dashboard/pilotage-travaux",
      count: pilotagesRaw.length,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "all-clear",
      severity: "info",
      title: "Aucun point bloquant",
      detail: isOps
        ? "Rien d’urgent tous clients confondus."
        : "Rien d’urgent à valider de votre côté. BeWork suit vos dossiers en cours.",
      href: "/dashboard/taches",
      count: 0,
    });
  }

  const order: Record<ClientInsightSeverity, number> = {
    bloquant: 0,
    urgent: 1,
    a_valider: 2,
    info: 3,
  };
  insights.sort((a, b) => order[a.severity] - order[b.severity]);

  const flagOrder: Record<ClientReportingDossier["flag"], number> = {
    bloquant: 0,
    a_valider: 1,
    urgent: 2,
    en_cours: 3,
  };

  const dossiers: ClientReportingDossier[] = openTasks
    .map((t) => {
      const flag = dossierFlag(t, today);
      const waitFrom =
        flag === "a_valider" && t.clientReportSentAt ? t.clientReportSentAt : t.updatedAt ?? t.createdAt;
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        statusLabel: CLIENT_TASK_STATUS_LABELS[t.status as TaskStatus] ?? t.status,
        missionTypeLabel: missionTypeLabel(t.missionType),
        priority: t.priority,
        desiredDate: t.desiredDate ? t.desiredDate.toISOString().slice(0, 10) : null,
        projectTitle: t.project?.title ?? null,
        assignedToName: t.assignedTo?.name ?? null,
        clientName: isOps ? t.client?.company ?? t.client?.name ?? null : null,
        daysWaiting: daysBetween(waitFrom, now),
        nextAction: nextActionFor(flag, t, today, audience),
        flag,
        flagLabel: FLAG_LABELS[flag],
        href: `/dashboard/taches/${t.id}`,
      };
    })
    .sort((a, b) => flagOrder[a.flag] - flagOrder[b.flag] || b.daysWaiting - a.daysWaiting)
    .slice(0, 20);

  const recentDecisions: ClientReportingDecision[] = decidedTasks.map((t) => {
    const decision = (t.clientDecision ?? "") as ClientDecision;
    const clientSuffix = isOps ? (t.client?.company ?? t.client?.name ?? null) : null;
    return {
      id: t.id,
      title: clientSuffix ? `${t.title} · ${clientSuffix}` : t.title,
      decision: t.clientDecision ?? "",
      decisionLabel: CLIENT_DECISION_LABELS[decision] ?? t.clientDecision ?? "Décision",
      decidedAt: t.clientDecisionAt ? t.clientDecisionAt.toISOString() : null,
      note: t.clientDecisionNote,
      href: `/dashboard/taches/${t.id}`,
    };
  });

  const pilotages: ClientReportingPilotage[] = pilotagesRaw.map((p) => ({
    id: p.id,
    projectTitle: p.project.title,
    status: p.status,
    healthLabel: p.healthLabel,
    healthScore: p.healthScore,
    plannedEndDate: p.plannedEndDate ? p.plannedEndDate.toISOString().slice(0, 10) : null,
    href: `/dashboard/projets/${p.project.id}`,
  }));

  const executiveDigest = buildExecutiveDigest(
    {
      awaitingDecision: awaitingDecision.length,
      awaitingInfo: awaitingInfo.length,
      urgentOpen: urgentOpen.length,
      overdue: overdue.length,
      openMissions: openTasks.length,
      activePilotages: pilotagesRaw.length,
      docsPending: pendingDocs,
      topDossiers: dossiers
        .filter((d) => d.flag !== "en_cours")
        .slice(0, 3)
        .map((d) => ({
          title: d.title,
          flagLabel: d.flagLabel,
          nextAction: d.nextAction,
          clientName: d.clientName,
        })),
    },
    audience,
  );

  return {
    audience,
    awaitingClientDecision: awaitingDecision.length,
    awaitingClientInfo: awaitingInfo.length,
    urgentOpen: urgentOpen.length,
    overdueDesiredDate: overdue.length,
    unreadUrgentAlerts,
    docsPending: pendingDocs,
    openMissions: openTasks.length,
    activePilotages: pilotagesRaw.length,
    insights,
    dossiers,
    recentDecisions,
    pilotages,
    executiveDigest,
  };
}
