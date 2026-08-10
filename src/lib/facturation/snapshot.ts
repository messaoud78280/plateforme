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
  billingUrgencyLabel,
  formatSinceDays,
  isBillingDoneStatus,
  isBillingOverdueLevel,
  isBillingPipelineStatus,
  isBillingWaitingStatus,
  isBillingWatchLevel,
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
      organizationId: true,
      assignee: { select: { id: true, name: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
  });

  const organizationId =
    sheets.find((s) => s.organizationId)?.organizationId ?? null;

  const attentionBatch = await loadAttentionForSheets({
    sheets: sheets.map((s) => ({
      id: s.id,
      status: s.status,
      title: s.title,
      nextActionAt: s.nextActionAt?.toISOString() ?? null,
      nextActionDone: s.nextActionDone,
      urgencyOverride: s.urgencyOverride,
    })),
    organizationId,
    now,
  });

  const items: BillingListItem[] = [];
  const attentionPreview: BillingSnapshot["attention"] = [];

  for (const s of sheets) {
    const att = attentionBatch.byId.get(s.id);
    const enteredIso = attentionBatch.statusEnteredAt.get(s.id);
    const enteredAt = enteredIso ? new Date(enteredIso) : null;
    const sinceDays = enteredAt ? daysBetween(enteredAt, now) : null;
    const sinceLabel = formatSinceDays(sinceDays);

    const billingItems =
      att?.attentionItems.filter((i) => i.code === "BILLING_PENDING") ?? [];
    const primaryBilling = billingItems[0] ?? null;
    const billingLevel = primaryBilling?.level ?? null;
    const isOverdueAttention = Boolean(
      primaryBilling && isBillingOverdueLevel(billingLevel),
    );
    const isWatchAttention = Boolean(
      primaryBilling && isBillingWatchLevel(billingLevel),
    );

    const href = withReturnTo(
      `/dashboard/fiches-suivi/${s.id}`,
      FACTURATION_HREF,
    );

    const primaryAction = resolveBillingPrimaryAction(s.status);
    const actionLabel =
      (!s.nextActionDone && s.nextAction?.trim()) || primaryAction;

    const bucket = resolveBillingBucket({
      status: s.status,
      isOverdueAttention,
    });

    items.push({
      id: s.id,
      title: s.title,
      clientName: s.clientName,
      projectId: s.project?.id ?? s.projectId,
      projectTitle: s.project?.title ?? null,
      status: s.status,
      statusLabel:
        s.status === "ATTENTE_REGLEMENT"
          ? "Suite client"
          : s.status === "FACTURE" || s.status === "TERMINE"
            ? "Clôturé"
            : (STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] ?? s.status),
      assigneeName: s.assignee?.name ?? null,
      assigneeId: s.assigneeId,
      nextAction: s.nextActionDone ? null : s.nextAction,
      sinceLabel,
      sinceDays,
      primaryAction,
      href,
      urgency: att?.effectiveUrgency ?? null,
      billingLevel,
      attentionReason: primaryBilling?.reason ?? null,
      isOverdueAttention,
      isWatchAttention,
      bucket,
    });

    if (primaryBilling && billingLevel && billingLevel !== "NORMAL") {
      const sinceFromReason =
        sinceLabel != null
          ? sinceLabel === "aujourd’hui"
            ? "depuis aujourd’hui"
            : `depuis ${sinceLabel}`
          : null;
      attentionPreview.push({
        id: s.id,
        title: s.project?.title || s.title,
        headline: "Facturation à préparer",
        reason: primaryBilling.reason,
        sinceLabel: sinceFromReason,
        urgency: billingLevel,
        urgencyLabel: billingUrgencyLabel(billingLevel),
        href,
        actionLabel:
          primaryBilling.actionLabel ??
          actionLabel ??
          "Préparer la facturation",
        assigneeName: s.assignee?.name ?? null,
        projectTitle: s.project?.title ?? null,
        clientName: s.clientName,
      });
    }
  }

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
  const aSurveiller = items.filter((i) => i.isWatchAttention).length;
  const soldes = items.filter((i) => isBillingDoneStatus(i.status)).length;

  const kpis: BillingKpi[] = [];
  if (pipelineCount > 0) {
    kpis.push({
      key: "a_facturer",
      label: "À facturer",
      count: pipelineCount,
      hint:
        pipelineCount === 1
          ? "1 dossier à l’étape facturation"
          : `${pipelineCount} dossiers à l’étape facturation`,
      href: `${FACTURATION_HREF}?filtre=a_facturer`,
    });
  }
  if (enAttente > 0) {
    kpis.push({
      key: "en_attente",
      label: "Suite client",
      count: enAttente,
      hint:
        enAttente === 1
          ? "1 dossier en attente de suite"
          : `${enAttente} dossiers en attente de suite`,
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
          ? "1 préparation hors délai"
          : `${enRetard} préparations hors délai`,
      href: `${FACTURATION_HREF}?filtre=en_retard`,
    });
  }
  if (soldes > 0) {
    kpis.push({
      key: "soldes",
      label: "Clôturés",
      count: soldes,
      hint:
        soldes === 1 ? "1 dossier clôturé" : `${soldes} dossiers clôturés`,
      href: `${FACTURATION_HREF}?filtre=soldes`,
    });
  }

  const watchSummary =
    aSurveiller > 0
      ? aSurveiller === 1
        ? "1 dossier à surveiller"
        : `${aSurveiller} dossiers à surveiller`
      : null;

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

  const [invoiceCount, situationCount] = await Promise.all([
    prisma.invoice.count(),
    prisma.workSituation.count({ where: { archivedAt: null } }),
  ]);

  return {
    kpis,
    watchSummary,
    attention: attentionPreview.slice(0, 5),
    items: filteredItems,
    totals: {
      aFacturer: pipelineCount,
      enAttente,
      enRetard,
      aSurveiller,
      soldes,
      attention: attentionPreview.length,
    },
    filterAvailability: {
      all: true,
      a_facturer: pipelineCount > 0,
      en_attente: enAttente > 0,
      en_retard: enRetard > 0,
      soldes: soldes > 0,
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
      snap.totals.enRetard > 0
        ? "Facturation en retard"
        : snap.attention.length > 0
          ? "Facturation à préparer"
          : "À facturer",
    count: n,
    href: withReturnTo(
      `${FACTURATION_HREF}?filtre=a_facturer`,
      `/dashboard/projets/${opts.projectId}`,
    ),
  };
}
