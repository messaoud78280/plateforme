/**
 * FACTURATION-V1A-LITE — snapshot unique (KPI comptes + liste + attention).
 * Réutilise loadAttentionForSheets / BILLING_PENDING — pas de second moteur.
 */
import { prisma } from "@/lib/prisma";
import { followUpSheetAccessWhere } from "@/lib/follow-up/access";
import { loadAttentionForSheets } from "@/lib/follow-up/attention/batch";
import { STATUS_LABELS } from "@/lib/follow-up/types";
import { withReturnTo } from "@/lib/navigation/safe-return-to";
import {
  type BillingFilter,
  type BillingKpi,
  type BillingListItem,
  type BillingSnapshot,
  formatSinceDays,
  isBillingDoneStatus,
  isBillingPipelineStatus,
  isBillingWaitingStatus,
  resolveBillingBucket,
  resolveBillingPrimaryAction,
  BILLING_DONE_STATUSES,
  BILLING_PIPELINE_STATUSES,
  BILLING_WAITING_STATUSES,
} from "@/lib/facturation/types";

const FACTURATION_HREF = "/dashboard/facturation";

function daysBetween(from: Date, to: Date): number {
  const a = new Date(from);
  a.setHours(0, 0, 0, 0);
  const b = new Date(to);
  b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

export async function getBillingSnapshot(opts: {
  user: { id: string; role?: string | null; personType?: string | null };
  filter?: BillingFilter;
  projectId?: string | null;
  now?: Date;
}): Promise<BillingSnapshot> {
  const now = opts.now ?? new Date();
  const accessWhere = await followUpSheetAccessWhere(opts.user);

  const statusFilter = [
    ...BILLING_PIPELINE_STATUSES,
    ...BILLING_WAITING_STATUSES,
    ...BILLING_DONE_STATUSES,
  ];

  const sheets = await prisma.followUpSheet.findMany({
    where: {
      AND: [
        accessWhere,
        { status: { in: [...statusFilter] } },
        ...(opts.projectId ? [{ projectId: opts.projectId }] : []),
      ],
    },
    select: {
      id: true,
      title: true,
      clientName: true,
      status: true,
      nextAction: true,
      nextActionDone: true,
      nextActionAt: true,
      urgencyOverride: true,
      assigneeId: true,
      projectId: true,
      assignee: { select: { id: true, name: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
  });

  const attentionBatch = await loadAttentionForSheets({
    sheets: sheets.map((s) => ({
      id: s.id,
      status: s.status,
      title: s.title,
      nextActionAt: s.nextActionAt?.toISOString() ?? null,
      nextActionDone: s.nextActionDone,
      urgencyOverride: s.urgencyOverride,
    })),
    now,
  });

  const items: BillingListItem[] = [];
  const attentionPreview: BillingSnapshot["attention"] = [];

  for (const s of sheets) {
    const att = attentionBatch.byId.get(s.id);
    const enteredIso = attentionBatch.statusEnteredAt.get(s.id);
    const enteredAt = enteredIso ? new Date(enteredIso) : null;
    const sinceDays = enteredAt ? daysBetween(enteredAt, now) : null;

    const billingItems =
      att?.attentionItems.filter((i) => i.code === "BILLING_PENDING") ?? [];
    const primaryBilling = billingItems[0] ?? null;
    const isOverdueAttention = Boolean(
      primaryBilling &&
        (att?.effectiveUrgency === "URGENT" ||
          att?.effectiveUrgency === "CRITIQUE" ||
          att?.effectiveUrgency === "IMPORTANT"),
    );

    const href = withReturnTo(
      `/dashboard/fiches-suivi/${s.id}`,
      FACTURATION_HREF,
    );

    const bucket = resolveBillingBucket({
      status: s.status,
      isOverdueAttention: Boolean(primaryBilling),
    });

    // "en_retard" = diagnostic BILLING_PENDING réellement levé
    const effectiveBucket =
      primaryBilling &&
      (att?.effectiveUrgency === "URGENT" || att?.effectiveUrgency === "CRITIQUE")
        ? "en_retard"
        : bucket === "en_retard"
          ? "a_facturer"
          : bucket;

    items.push({
      id: s.id,
      title: s.title,
      clientName: s.clientName,
      projectId: s.project?.id ?? s.projectId,
      projectTitle: s.project?.title ?? null,
      status: s.status,
      statusLabel:
        STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] ?? s.status,
      assigneeName: s.assignee?.name ?? null,
      assigneeId: s.assigneeId,
      nextAction: s.nextActionDone ? null : s.nextAction,
      sinceLabel: formatSinceDays(sinceDays),
      sinceDays,
      primaryAction: resolveBillingPrimaryAction(s.status),
      href,
      urgency: att?.effectiveUrgency ?? null,
      attentionReason: primaryBilling?.reason ?? att?.primaryReason ?? null,
      isOverdueAttention: Boolean(primaryBilling),
      bucket: effectiveBucket,
    });

    if (primaryBilling && att && att.effectiveUrgency !== "NORMAL") {
      attentionPreview.push({
        id: s.id,
        title: s.title,
        reason: primaryBilling.reason,
        urgency: att.effectiveUrgency,
        href,
        assigneeName: s.assignee?.name ?? null,
        projectTitle: s.project?.title ?? null,
      });
    }
  }

  // Tri : retards → à facturer → en attente → soldés
  const rank: Record<BillingListItem["bucket"], number> = {
    en_retard: 0,
    a_facturer: 1,
    en_attente: 2,
    suivi: 3,
    soldes: 4,
  };
  items.sort((a, b) => {
    const d = rank[a.bucket] - rank[b.bucket];
    if (d !== 0) return d;
    return (b.sinceDays ?? 0) - (a.sinceDays ?? 0);
  });

  attentionPreview.sort((a, b) => {
    const ur: Record<string, number> = {
      CRITIQUE: 0,
      URGENT: 1,
      IMPORTANT: 2,
      A_SURVEILLER: 3,
    };
    return (ur[a.urgency] ?? 9) - (ur[b.urgency] ?? 9);
  });

  const aFacturer = items.filter((i) => isBillingPipelineStatus(i.status)).length;
  const pipelineCount = aFacturer;
  const enAttente = items.filter((i) => isBillingWaitingStatus(i.status)).length;
  const enRetard = items.filter((i) => i.isOverdueAttention).length;
  const soldes = items.filter((i) => isBillingDoneStatus(i.status)).length;

  const kpis: BillingKpi[] = [];
  if (pipelineCount > 0 || enRetard > 0) {
    kpis.push({
      key: "a_facturer",
      label: "À facturer",
      count: pipelineCount,
      hint:
        pipelineCount === 1
          ? "1 dossier à préparer"
          : `${pipelineCount} dossiers à préparer`,
      href: `${FACTURATION_HREF}?filtre=a_facturer`,
    });
  }
  if (enAttente > 0) {
    kpis.push({
      key: "en_attente",
      label: "En attente",
      count: enAttente,
      hint:
        enAttente === 1
          ? "1 règlement à suivre"
          : `${enAttente} règlements à suivre`,
      href: `${FACTURATION_HREF}?filtre=en_attente`,
    });
  }
  if (enRetard > 0) {
    kpis.push({
      key: "en_retard",
      label: "En retard",
      count: enRetard,
      hint:
        enRetard === 1
          ? "1 oubli de facturation"
          : `${enRetard} oublis de facturation`,
      href: `${FACTURATION_HREF}?filtre=en_retard`,
    });
  }
  if (soldes > 0) {
    kpis.push({
      key: "soldes",
      label: "Soldés",
      count: soldes,
      hint:
        soldes === 1 ? "1 dossier clôturé" : `${soldes} dossiers clôturés`,
      href: `${FACTURATION_HREF}?filtre=soldes`,
    });
  }

  const filter = opts.filter ?? "all";
  const filteredItems =
    filter === "all"
      ? items.filter((i) => !isBillingDoneStatus(i.status) || i.isOverdueAttention)
      : filter === "a_facturer"
        ? items.filter((i) => isBillingPipelineStatus(i.status))
        : filter === "en_attente"
          ? items.filter((i) => isBillingWaitingStatus(i.status))
          : filter === "en_retard"
            ? items.filter((i) => i.isOverdueAttention)
            : filter === "soldes"
              ? items.filter((i) => isBillingDoneStatus(i.status))
              : items;

  // Données € optionnelles (présence seule — jamais affichées en V1A-lite)
  const [invoiceCount, situationCount] = await Promise.all([
    prisma.invoice.count(),
    prisma.workSituation.count({ where: { archivedAt: null } }),
  ]);

  return {
    kpis,
    attention: attentionPreview.slice(0, 5),
    items: filteredItems,
    totals: {
      aFacturer: pipelineCount,
      enAttente,
      enRetard,
      soldes,
      attention: attentionPreview.length,
    },
    hasInvoiceRows: invoiceCount > 0,
    hasSituationRows: situationCount > 0,
    invoiceCount,
    situationCount,
  };
}

/** Synthèse compacte pour un chantier (cockpit). */
export async function getProjectBillingHint(opts: {
  user: { id: string; role?: string | null; personType?: string | null };
  projectId: string;
}): Promise<{
  show: boolean;
  label: string;
  count: number;
  href: string;
} | null> {
  const snap = await getBillingSnapshot({
    user: opts.user,
    projectId: opts.projectId,
    filter: "all",
  });
  const open = snap.items.filter((i) => !isBillingDoneStatus(i.status));
  if (open.length === 0 && snap.attention.length === 0) return null;
  const n = Math.max(open.length, snap.attention.length);
  return {
    show: true,
    label:
      snap.attention.length > 0
        ? "Action financière requise"
        : "À facturer",
    count: n,
    href: withReturnTo(
      `${FACTURATION_HREF}?filtre=a_facturer`,
      `/dashboard/projets/${opts.projectId}`,
    ),
  };
}
