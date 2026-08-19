/**
 * Cockpit Devis & Facturation — agrégats centralisés.
 * L’UI ne recalcule pas la logique métier.
 */
import type { CommercialQuoteStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";
import { daysOverdue } from "@/lib/commercial/invoice-status";
import {
  aggregateQuoteStatusCounts,
  quoteNextActionLabel,
} from "@/lib/commercial/dashboard-kpis";
import {
  adaptiveGranularity,
  bucketKey,
  bucketLabel,
  enumerateBuckets,
  trendChange,
  type DashboardGranularity,
  type DashboardPeriod,
  type TrendChange,
} from "@/lib/commercial/dashboard-periods";
import {
  getElectronicConnectionState,
  type ElectronicConnectionState,
} from "@/lib/commercial/electronic-invoicing";
import {
  getApplicableFiscalAlerts,
  type FiscalThresholdAlert,
} from "@/lib/commercial/fiscal-thresholds";

const ISSUED: Array<"ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE"> = [
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
];
const OPEN: Array<"ISSUED" | "PARTIALLY_PAID" | "OVERDUE"> = [
  "ISSUED",
  "PARTIALLY_PAID",
  "OVERDUE",
];
const DECIDED: CommercialQuoteStatus[] = ["ACCEPTED", "REFUSED"];

export type DashboardAgingKey =
  | "not_due"
  | "d1_30"
  | "d31_60"
  | "d61_90"
  | "d90_plus";

export const DASHBOARD_AGING_LABELS: Record<DashboardAgingKey, string> = {
  not_due: "Non échu",
  d1_30: "1–30 j",
  d31_60: "31–60 j",
  d61_90: "61–90 j",
  d90_plus: "+90 j",
};

export type DashboardAlertPriority = "critical" | "urgent" | "watch" | "info";

export type DashboardAlert = {
  id: string;
  kind:
    | "invoice_overdue"
    | "quote_relance"
    | "invoice_draft"
    | "invoice_partial"
    | "to_invoice";
  priority: DashboardAlertPriority;
  title: string;
  reference: string;
  client: string | null;
  reason: string;
  amountLabel: string | null;
  amountValue: number | null;
  amountBasis: "HT" | "TTC" | null;
  href: string;
  actionLabel: string;
};

export type DashboardDocRow = {
  id: string;
  href: string;
  number: string;
  client: string | null;
  project: string | null;
  date: string | null;
  amountHt: number | null;
  amountTtc: number | null;
  amountPaid: number | null;
  amountDue: number | null;
  status: string;
  overdue: boolean;
  daysLate: number;
  action: string | null;
};

export type DashboardSeriesPoint = {
  key: string;
  label: string;
  billedHt: number;
  collectedTtc: number;
  acceptedHt: number;
};

export type QuotePipelineStage = {
  key: string;
  label: string;
  statuses: CommercialQuoteStatus[];
  count: number;
  amountHt: number;
  href: string;
};

export type ReceivablesAgingBucket = {
  key: DashboardAgingKey;
  label: string;
  amountTtc: number;
  count: number;
};

export type CommercialDashboardMetrics = {
  period: {
    preset: DashboardPeriod["preset"];
    from: string;
    toExclusive: string;
    label: string;
    previousLabel: string;
    granularity: DashboardGranularity;
  };
  empty: boolean;
  summary: {
    billedHt: number;
    billedHtTrend: TrendChange;
    billedCount: number;
    collectedTtc: number;
    collectedTtcTrend: TrendChange;
    collectedCount: number;
    outstandingTtc: number;
    outstandingCount: number;
    overdueTtc: number;
    overdueCount: number;
    conversionRate: number | null;
    conversionTrend: TrendChange | null;
    conversionAccepted: number;
    conversionDecided: number;
    pipelineHt: number;
    pipelineCount: number;
    wonHt: number;
    billedSpark: number[];
    collectedSpark: number[];
  };
  trends: {
    billedHtPrevious: number;
    collectedTtcPrevious: number;
  };
  revenueSeries: DashboardSeriesPoint[];
  quotePipeline: {
    stages: QuotePipelineStage[];
    conversionRate: number | null;
    avgBasketHt: number | null;
    avgAcceptanceDays: number | null;
  };
  receivablesAging: {
    totalTtc: number;
    buckets: ReceivablesAgingBucket[];
  };
  alerts: DashboardAlert[];
  recentQuotes: DashboardDocRow[];
  recentInvoices: DashboardDocRow[];
  salesPerformance: {
    conversionRate: number | null;
    conversionAccepted: number;
    conversionDecided: number;
    conversionTrend: TrendChange | null;
    avgQuoteBasketHt: number | null;
    avgInvoiceBasketHt: number | null;
    invoiceBasketTrend: TrendChange | null;
    avgAcceptanceDays: number | null;
    avgCollectionDays: number | null;
    paidOnTimeRate: number | null;
    paidOnTimeCount: number;
    paidOnTimeTotal: number;
  };
  vat: {
    billedVat: number;
    purchaseVatRecorded: number | null;
    estimatedBalance: number | null;
    isEstimate: true;
    method: string;
  };
  electronicInvoices: ElectronicConnectionState;
  fiscalAlerts: FiscalThresholdAlert[];
  filters: {
    clients: Array<{ id: string; name: string }>;
    projects: Array<{ id: string; title: string }>;
  };
};

export type DashboardMetricsInput = {
  orgId: string;
  period: DashboardPeriod;
  clientId?: string | null;
  projectId?: string | null;
  canSeePurchases?: boolean;
};

function money0(n: number) {
  return `${roundMoney(n, 0).toLocaleString("fr-FR")} €`;
}

function clientName(org: { name: string | null; tradeName: string | null } | null | undefined) {
  return org?.tradeName || org?.name || null;
}

function agingKey(daysLate: number): DashboardAgingKey {
  if (daysLate <= 0) return "not_due";
  if (daysLate <= 30) return "d1_30";
  if (daysLate <= 60) return "d31_60";
  if (daysLate <= 90) return "d61_90";
  return "d90_plus";
}

function issuedWhere(
  orgId: string,
  from: Date,
  toExclusive: Date,
  extra: Prisma.CommercialInvoiceWhereInput,
): Prisma.CommercialInvoiceWhereInput {
  return {
    organizationId: orgId,
    status: { in: ISSUED },
    issueDate: { gte: from, lt: toExclusive },
    ...extra,
  };
}

export async function getCommercialDashboardMetrics(
  input: DashboardMetricsInput,
): Promise<CommercialDashboardMetrics> {
  const { orgId, period } = input;
  const clientId = input.clientId?.trim() || undefined;
  const projectId = input.projectId?.trim() || undefined;
  const extra: Prisma.CommercialInvoiceWhereInput = {
    ...(clientId ? { clientExternalOrgId: clientId } : {}),
    ...(projectId ? { projectId } : {}),
  };
  const quoteExtra: Prisma.CommercialQuoteWhereInput = {
    ...(clientId ? { clientExternalOrgId: clientId } : {}),
    ...(projectId ? { projectId } : {}),
  };
  const now = new Date();
  const relanceBefore = new Date(now);
  relanceBefore.setDate(relanceBefore.getDate() - 7);

  const [
    quoteCount,
    groupedQuotes,
    billedNow,
    billedPrev,
    creditNow,
    creditPrev,
    collectedNow,
    collectedPrev,
    billedVatNow,
    creditVatNow,
    purchaseVat,
    openInvoices,
    seriesInvoices,
    seriesPayments,
    seriesAccepted,
    decidedNow,
    decidedPrev,
    acceptedTiming,
    paidTiming,
    quotesRelance,
    draftInvoices,
    partialInvoices,
    toInvoiceSituations,
    recentQuotes,
    recentInvoices,
    clients,
    projects,
  ] = await Promise.all([
    prisma.commercialQuote.count({
      where: { organizationId: orgId, ...quoteExtra },
    }),
    prisma.commercialQuote.groupBy({
      by: ["status"],
      where: { organizationId: orgId, ...quoteExtra },
      _count: true,
      _sum: { totalSellHt: true },
    }),
    prisma.commercialInvoice.aggregate({
      where: issuedWhere(orgId, period.from, period.toExclusive, {
        ...extra,
        type: { not: "CREDIT" },
      }),
      _sum: { totalSellHt: true, totalTtc: true },
      _count: true,
    }),
    prisma.commercialInvoice.aggregate({
      where: issuedWhere(orgId, period.previousFrom, period.previousToExclusive, {
        ...extra,
        type: { not: "CREDIT" },
      }),
      _sum: { totalSellHt: true },
      _count: true,
    }),
    prisma.commercialInvoice.aggregate({
      where: issuedWhere(orgId, period.from, period.toExclusive, {
        ...extra,
        type: "CREDIT",
      }),
      _sum: { totalSellHt: true, totalVat: true },
    }),
    prisma.commercialInvoice.aggregate({
      where: issuedWhere(orgId, period.previousFrom, period.previousToExclusive, {
        ...extra,
        type: "CREDIT",
      }),
      _sum: { totalSellHt: true },
    }),
    prisma.commercialPayment.aggregate({
      where: {
        organizationId: orgId,
        cancelledAt: null,
        paidAt: { gte: period.from, lt: period.toExclusive },
        invoice: { type: { not: "CREDIT" }, ...extra },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.commercialPayment.aggregate({
      where: {
        organizationId: orgId,
        cancelledAt: null,
        paidAt: { gte: period.previousFrom, lt: period.previousToExclusive },
        invoice: { type: { not: "CREDIT" }, ...extra },
      },
      _sum: { amount: true },
    }),
    prisma.commercialInvoice.aggregate({
      where: issuedWhere(orgId, period.from, period.toExclusive, {
        ...extra,
        type: { not: "CREDIT" },
      }),
      _sum: { totalVat: true },
    }),
    prisma.commercialInvoice.aggregate({
      where: issuedWhere(orgId, period.from, period.toExclusive, {
        ...extra,
        type: "CREDIT",
      }),
      _sum: { totalVat: true },
    }),
    input.canSeePurchases
      ? prisma.supplierInvoice.aggregate({
          where: {
            organizationId: orgId,
            status: "RECORDED",
            kind: { not: "CREDIT" },
            cancelledAt: null,
            invoiceDate: { gte: period.from, lt: period.toExclusive },
            ...(projectId ? { projectId } : {}),
          },
          _sum: { amountVat: true },
        })
      : Promise.resolve(null),
    prisma.commercialInvoice.findMany({
      where: {
        organizationId: orgId,
        status: { in: OPEN },
        type: { not: "CREDIT" },
        amountDue: { gt: 0 },
        ...extra,
      },
      select: {
        id: true,
        number: true,
        status: true,
        amountDue: true,
        amountPaid: true,
        totalTtc: true,
        dueDate: true,
        clientExternalOrg: { select: { name: true, tradeName: true } },
      },
    }),
    prisma.commercialInvoice.findMany({
      where: issuedWhere(orgId, period.from, period.toExclusive, {
        ...extra,
        type: { not: "CREDIT" },
      }),
      select: { issueDate: true, totalSellHt: true },
    }),
    prisma.commercialPayment.findMany({
      where: {
        organizationId: orgId,
        cancelledAt: null,
        paidAt: { gte: period.from, lt: period.toExclusive },
        invoice: { type: { not: "CREDIT" }, ...extra },
      },
      select: { paidAt: true, amount: true },
    }),
    prisma.commercialQuote.findMany({
      where: {
        organizationId: orgId,
        status: "ACCEPTED",
        acceptedAt: { gte: period.from, lt: period.toExclusive },
        ...quoteExtra,
      },
      select: { acceptedAt: true, totalSellHt: true, sentAt: true },
    }),
    prisma.commercialQuote.groupBy({
      by: ["status"],
      where: {
        organizationId: orgId,
        status: { in: DECIDED },
        OR: [
          { acceptedAt: { gte: period.from, lt: period.toExclusive } },
          {
            acceptedAt: null,
            status: "REFUSED",
            updatedAt: { gte: period.from, lt: period.toExclusive },
          },
        ],
        ...quoteExtra,
      },
      _count: true,
      _sum: { totalSellHt: true },
    }),
    prisma.commercialQuote.groupBy({
      by: ["status"],
      where: {
        organizationId: orgId,
        status: { in: DECIDED },
        OR: [
          {
            acceptedAt: {
              gte: period.previousFrom,
              lt: period.previousToExclusive,
            },
          },
          {
            acceptedAt: null,
            status: "REFUSED",
            updatedAt: {
              gte: period.previousFrom,
              lt: period.previousToExclusive,
            },
          },
        ],
        ...quoteExtra,
      },
      _count: true,
    }),
    prisma.commercialQuote.findMany({
      where: {
        organizationId: orgId,
        status: "ACCEPTED",
        acceptedAt: { gte: period.from, lt: period.toExclusive },
        sentAt: { not: null },
        ...quoteExtra,
      },
      select: { acceptedAt: true, sentAt: true, totalSellHt: true },
    }),
    prisma.commercialInvoice.findMany({
      where: {
        organizationId: orgId,
        status: "PAID",
        type: { not: "CREDIT" },
        issueDate: { gte: period.from, lt: period.toExclusive },
        ...extra,
      },
      select: {
        issueDate: true,
        dueDate: true,
        payments: {
          where: { cancelledAt: null },
          select: { paidAt: true },
          orderBy: { paidAt: "desc" },
          take: 1,
        },
      },
      take: 400,
    }),
    prisma.commercialQuote.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["SENT", "VIEWED"] },
        OR: [
          { sentAt: { lte: relanceBefore } },
          { AND: [{ sentAt: null }, { updatedAt: { lte: relanceBefore } }] },
        ],
        ...quoteExtra,
      },
      orderBy: { updatedAt: "asc" },
      take: 4,
      select: {
        id: true,
        number: true,
        totalSellHt: true,
        sentAt: true,
        updatedAt: true,
        clientExternalOrg: { select: { name: true, tradeName: true } },
      },
    }),
    prisma.commercialInvoice.findMany({
      where: {
        organizationId: orgId,
        status: "DRAFT",
        type: { not: "CREDIT" },
        ...extra,
      },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: {
        id: true,
        number: true,
        totalTtc: true,
        clientExternalOrg: { select: { name: true, tradeName: true } },
      },
    }),
    prisma.commercialInvoice.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["PARTIALLY_PAID", "OVERDUE"] },
        type: { not: "CREDIT" },
        amountPaid: { gt: 0 },
        amountDue: { gt: 0 },
        ...extra,
      },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: {
        id: true,
        number: true,
        amountPaid: true,
        amountDue: true,
        totalTtc: true,
        clientExternalOrg: { select: { name: true, tradeName: true } },
      },
    }),
    prisma.commercialProgressStatement.findMany({
      where: {
        organizationId: orgId,
        status: "VALIDATED",
        invoice: null,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: {
        id: true,
        number: true,
        label: true,
        periodSellHt: true,
        quote: {
          select: {
            number: true,
            clientExternalOrg: { select: { name: true, tradeName: true } },
          },
        },
      },
    }),
    prisma.commercialQuote.findMany({
      where: { organizationId: orgId, ...quoteExtra },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        number: true,
        status: true,
        totalSellHt: true,
        issueDate: true,
        projectId: true,
        validityDate: true,
        clientExternalOrg: { select: { name: true, tradeName: true } },
        project: { select: { title: true } },
      },
    }),
    prisma.commercialInvoice.findMany({
      where: { organizationId: orgId, type: { not: "CREDIT" }, ...extra },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        number: true,
        status: true,
        totalTtc: true,
        amountPaid: true,
        amountDue: true,
        issueDate: true,
        dueDate: true,
        clientExternalOrg: { select: { name: true, tradeName: true } },
        project: { select: { title: true } },
      },
    }),
    prisma.externalOrganization.findMany({
      where: {
        hostOrganizationId: orgId,
        type: { in: ["CLIENT_EXT", "CLIENT"] },
        status: "ACTIVE",
      },
      select: { id: true, name: true, tradeName: true },
      orderBy: { name: "asc" },
      take: 80,
    }),
    prisma.project.findMany({
      where: { organizationId: orgId },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 60,
    }),
  ]);

  const invoiceCount = billedNow._count + recentInvoices.length;
  const empty = quoteCount === 0 && invoiceCount === 0 && openInvoices.length === 0;

  const billedHt = roundMoney(
    d(billedNow._sum.totalSellHt) - d(creditNow._sum.totalSellHt),
    2,
  );
  const billedHtPrevious = roundMoney(
    d(billedPrev._sum.totalSellHt) - d(creditPrev._sum.totalSellHt),
    2,
  );
  const collectedTtc = roundMoney(d(collectedNow._sum.amount), 2);
  const collectedTtcPrevious = roundMoney(d(collectedPrev._sum.amount), 2);
  const billedCount = billedNow._count;
  const collectedCount = collectedNow._count;
  const billedVat = roundMoney(
    d(billedVatNow._sum.totalVat) - d(creditVatNow._sum.totalVat),
    2,
  );
  const purchaseVatRecorded = purchaseVat
    ? roundMoney(d(purchaseVat._sum.amountVat), 2)
    : null;

  const agingMap: Record<DashboardAgingKey, { amountTtc: number; count: number }> = {
    not_due: { amountTtc: 0, count: 0 },
    d1_30: { amountTtc: 0, count: 0 },
    d31_60: { amountTtc: 0, count: 0 },
    d61_90: { amountTtc: 0, count: 0 },
    d90_plus: { amountTtc: 0, count: 0 },
  };
  let outstandingTtc = 0;
  let overdueTtc = 0;
  let overdueCount = 0;
  const overdueRows: typeof openInvoices = [];
  for (const inv of openInvoices) {
    const due = d(inv.amountDue);
    outstandingTtc += due;
    const late = daysOverdue(inv.dueDate, now);
    const key = agingKey(late);
    agingMap[key].amountTtc += due;
    agingMap[key].count += 1;
    if (late > 0 || inv.status === "OVERDUE") {
      overdueTtc += due;
      overdueCount += 1;
      overdueRows.push(inv);
    }
  }
  outstandingTtc = roundMoney(outstandingTtc, 2);
  overdueTtc = roundMoney(overdueTtc, 2);

  const counts = aggregateQuoteStatusCounts(groupedQuotes);
  const byStatus = new Map(
    groupedQuotes.map((row) => [
      row.status,
      { count: row._count, ht: d(row._sum.totalSellHt) },
    ]),
  );
  const stage = (
    key: string,
    label: string,
    statuses: CommercialQuoteStatus[],
    href: string,
  ): QuotePipelineStage => {
    let count = 0;
    let amountHt = 0;
    for (const st of statuses) {
      const row = byStatus.get(st);
      if (!row) continue;
      count += row.count;
      amountHt += row.ht;
    }
    return {
      key,
      label,
      statuses,
      count,
      amountHt: roundMoney(amountHt, 2),
      href,
    };
  };
  const stages: QuotePipelineStage[] = [
    stage("draft", "Brouillon", ["DRAFT", "TO_VALIDATE", "VALIDATED"], "/dashboard/devis-facturation/devis?status=DRAFT"),
    stage("sent", "Envoyé", ["SENT"], "/dashboard/devis-facturation/devis?status=SENT"),
    stage("waiting", "En attente", ["VIEWED"], "/dashboard/devis-facturation/devis?status=VIEWED"),
    stage("accepted", "Accepté", ["ACCEPTED"], "/dashboard/devis-facturation/devis?status=ACCEPTED"),
    stage("refused", "Refusé", ["REFUSED"], "/dashboard/devis-facturation/devis?status=REFUSED"),
  ];

  function conversionOf(
    rows: { status: CommercialQuoteStatus; _count: number }[],
  ): { rate: number | null; accepted: number; decided: number } {
    let accepted = 0;
    let refused = 0;
    for (const row of rows) {
      if (row.status === "ACCEPTED") accepted += row._count;
      if (row.status === "REFUSED") refused += row._count;
    }
    const decided = accepted + refused;
    if (decided === 0) return { rate: null, accepted, decided };
    return { rate: roundMoney((accepted / decided) * 100, 1), accepted, decided };
  }
  const convNow = conversionOf(decidedNow);
  const convPrev = conversionOf(decidedPrev);

  const granularity = adaptiveGranularity(period.from, period.toExclusive, [
    ...seriesInvoices.map((i) => i.issueDate),
    ...seriesPayments.map((p) => p.paidAt),
    ...seriesAccepted
      .map((q) => q.acceptedAt)
      .filter((d): d is Date => Boolean(d)),
  ]);

  const keys = enumerateBuckets(period.from, period.toExclusive, granularity);
  const billedMap = new Map<string, number>();
  const collectedMap = new Map<string, number>();
  const acceptedMap = new Map<string, number>();
  for (const inv of seriesInvoices) {
    const key = bucketKey(inv.issueDate, granularity);
    billedMap.set(key, (billedMap.get(key) ?? 0) + d(inv.totalSellHt));
  }
  for (const pay of seriesPayments) {
    const key = bucketKey(pay.paidAt, granularity);
    collectedMap.set(key, (collectedMap.get(key) ?? 0) + d(pay.amount));
  }
  for (const q of seriesAccepted) {
    if (!q.acceptedAt) continue;
    const key = bucketKey(q.acceptedAt, granularity);
    acceptedMap.set(key, (acceptedMap.get(key) ?? 0) + d(q.totalSellHt));
  }
  const revenueSeries: DashboardSeriesPoint[] = keys.map((key) => ({
    key,
    label: bucketLabel(key, granularity),
    billedHt: roundMoney(billedMap.get(key) ?? 0, 2),
    collectedTtc: roundMoney(collectedMap.get(key) ?? 0, 2),
    acceptedHt: roundMoney(acceptedMap.get(key) ?? 0, 2),
  }));

  const acceptanceDays = acceptedTiming
    .map((q) => {
      if (!q.acceptedAt || !q.sentAt) return null;
      const days = (q.acceptedAt.getTime() - q.sentAt.getTime()) / 86_400_000;
      return days >= 0 ? days : null;
    })
    .filter((n): n is number => n != null);
  const avgAcceptanceDays =
    acceptanceDays.length > 0
      ? roundMoney(
          acceptanceDays.reduce((s, n) => s + n, 0) / acceptanceDays.length,
          1,
        )
      : null;

  const collectionDays: number[] = [];
  let onTime = 0;
  let timed = 0;
  for (const inv of paidTiming) {
    const paidAt = inv.payments[0]?.paidAt;
    if (!paidAt) continue;
    const days = (paidAt.getTime() - inv.issueDate.getTime()) / 86_400_000;
    if (days >= 0) collectionDays.push(days);
    if (inv.dueDate) {
      timed += 1;
      const due = new Date(inv.dueDate);
      const p0 = Date.UTC(paidAt.getFullYear(), paidAt.getMonth(), paidAt.getDate());
      const d0 = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
      if (p0 <= d0) onTime += 1;
    }
  }
  const avgCollectionDays =
    collectionDays.length > 0
      ? roundMoney(
          collectionDays.reduce((s, n) => s + n, 0) / collectionDays.length,
          1,
        )
      : null;
  const paidOnTimeRate =
    timed > 0 ? roundMoney((onTime / timed) * 100, 1) : null;

  const avgQuoteBasketHt =
    seriesAccepted.length > 0
      ? roundMoney(
          seriesAccepted.reduce((s, q) => s + d(q.totalSellHt), 0) /
            seriesAccepted.length,
          2,
        )
      : null;
  const avgInvoiceBasketHt =
    billedNow._count > 0
      ? roundMoney(d(billedNow._sum.totalSellHt) / billedNow._count, 2)
      : null;

  const alerts: DashboardAlert[] = [];
  overdueRows
    .sort((a, b) => daysOverdue(b.dueDate, now) - daysOverdue(a.dueDate, now))
    .slice(0, 4)
    .forEach((inv) => {
      const days = daysOverdue(inv.dueDate, now);
      alerts.push({
        id: `io:${inv.id}`,
        kind: "invoice_overdue",
        priority: days >= 30 ? "critical" : "urgent",
        title: "Facture en retard",
        reference: inv.number,
        client: clientName(inv.clientExternalOrg),
        reason: `${days} j de retard`,
        amountLabel: `${money0(d(inv.amountDue))} TTC`,
        amountValue: roundMoney(d(inv.amountDue), 2),
        amountBasis: "TTC",
        href: `/dashboard/devis-facturation/factures/${inv.id}`,
        actionLabel: "Voir",
      });
    });
  for (const q of quotesRelance) {
    const days = Math.max(
      0,
      Math.floor((now.getTime() - (q.sentAt ?? q.updatedAt).getTime()) / 86_400_000),
    );
    alerts.push({
      id: `qr:${q.id}`,
      kind: "quote_relance",
      priority: days >= 21 ? "urgent" : "watch",
      title: "Devis sans réponse",
      reference: q.number,
      client: clientName(q.clientExternalOrg),
      reason: `Envoyé depuis ${days} j`,
      amountLabel: `${money0(d(q.totalSellHt))} HT`,
      amountValue: roundMoney(d(q.totalSellHt), 2),
      amountBasis: "HT",
      href: `/dashboard/devis-facturation/devis/${q.id}`,
      actionLabel: "Relancer",
    });
  }
  for (const inv of draftInvoices) {
    alerts.push({
      id: `id:${inv.id}`,
      kind: "invoice_draft",
      priority: "watch",
      title: "Facture à finaliser",
      reference: inv.number,
      client: clientName(inv.clientExternalOrg),
      reason: "Brouillon — à émettre",
      amountLabel: `${money0(d(inv.totalTtc))} TTC`,
      amountValue: roundMoney(d(inv.totalTtc), 2),
      amountBasis: "TTC",
      href: `/dashboard/devis-facturation/factures/${inv.id}`,
      actionLabel: "Continuer",
    });
  }
  for (const inv of partialInvoices) {
    alerts.push({
      id: `ip:${inv.id}`,
      kind: "invoice_partial",
      priority: "watch",
      title: "Paiement partiel",
      reference: inv.number,
      client: clientName(inv.clientExternalOrg),
      reason: `Payé ${money0(d(inv.amountPaid))} · reste ${money0(d(inv.amountDue))}`,
      amountLabel: `${money0(d(inv.amountDue))} TTC`,
      amountValue: roundMoney(d(inv.amountDue), 2),
      amountBasis: "TTC",
      href: `/dashboard/devis-facturation/factures/${inv.id}`,
      actionLabel: "Voir",
    });
  }
  for (const s of toInvoiceSituations) {
    alerts.push({
      id: `si:${s.id}`,
      kind: "to_invoice",
      priority: "urgent",
      title: "Situation à facturer",
      reference: `Sit. ${s.number}`,
      client: clientName(s.quote.clientExternalOrg),
      reason: `${s.label} · ${s.quote.number}`,
      amountLabel: `${money0(d(s.periodSellHt))} HT`,
      amountValue: roundMoney(d(s.periodSellHt), 2),
      amountBasis: "HT",
      href: `/dashboard/devis-facturation/situations/${s.id}`,
      actionLabel: "Continuer",
    });
  }
  const kindRank: Record<DashboardAlert["kind"], number> = {
    invoice_overdue: 0,
    invoice_partial: 1,
    invoice_draft: 2,
    to_invoice: 3,
    quote_relance: 4,
  };
  const priorityRank: Record<DashboardAlertPriority, number> = {
    critical: 0,
    urgent: 1,
    watch: 2,
    info: 3,
  };
  alerts.sort((a, b) => {
    const k = kindRank[a.kind] - kindRank[b.kind];
    if (k !== 0) return k;
    return priorityRank[a.priority] - priorityRank[b.priority];
  });

  const vatMethod =
    "TVA facturée sur les factures clients émises de la période, moins la TVA enregistrée sur les factures fournisseurs (si accessible). Estimation : le régime d’exigibilité (débits / encaissements) n’est pas déterminé.";

  const wonHt = roundMoney(
    seriesAccepted.reduce((s, q) => s + d(q.totalSellHt), 0),
    2,
  );
  const avgInvoiceBasketHtPrev =
    billedPrev._count > 0
      ? roundMoney(d(billedPrev._sum.totalSellHt) / billedPrev._count, 2)
      : null;
  const invoiceBasketTrend =
    avgInvoiceBasketHt != null && avgInvoiceBasketHtPrev != null
      ? trendChange(avgInvoiceBasketHt, avgInvoiceBasketHtPrev)
      : avgInvoiceBasketHt != null && billedPrev._count === 0
        ? trendChange(avgInvoiceBasketHt, 0)
        : null;
  const conversionTrend =
    convNow.rate != null && convPrev.rate != null
      ? trendChange(convNow.rate, convPrev.rate)
      : convNow.rate != null
        ? trendChange(convNow.rate, 0)
        : null;

  return {
    period: {
      preset: period.preset,
      from: period.from.toISOString(),
      toExclusive: period.toExclusive.toISOString(),
      label: period.label,
      previousLabel: period.previousLabel,
      granularity,
    },
    empty,
    summary: {
      billedHt,
      billedHtTrend: trendChange(billedHt, billedHtPrevious),
      billedCount,
      collectedTtc,
      collectedTtcTrend: trendChange(collectedTtc, collectedTtcPrevious),
      collectedCount,
      outstandingTtc,
      outstandingCount: openInvoices.length,
      overdueTtc,
      overdueCount,
      conversionRate: convNow.rate,
      conversionTrend,
      conversionAccepted: convNow.accepted,
      conversionDecided: convNow.decided,
      pipelineHt: counts.pipelineDevisHt,
      pipelineCount: counts.enPreparation + counts.envoyes,
      wonHt,
      billedSpark: revenueSeries.map((p) => p.billedHt),
      collectedSpark: revenueSeries.map((p) => p.collectedTtc),
    },
    trends: {
      billedHtPrevious,
      collectedTtcPrevious,
    },
    revenueSeries,
    quotePipeline: {
      stages,
      conversionRate: convNow.rate,
      avgBasketHt: avgQuoteBasketHt,
      avgAcceptanceDays,
    },
    receivablesAging: {
      totalTtc: outstandingTtc,
      buckets: (Object.keys(DASHBOARD_AGING_LABELS) as DashboardAgingKey[]).map(
        (key) => ({
          key,
          label: DASHBOARD_AGING_LABELS[key],
          amountTtc: roundMoney(agingMap[key].amountTtc, 2),
          count: agingMap[key].count,
        }),
      ),
    },
    alerts: alerts.slice(0, 5),
    recentQuotes: recentQuotes.map((q) => ({
      id: q.id,
      href: `/dashboard/devis-facturation/devis/${q.id}`,
      number: q.number,
      client: clientName(q.clientExternalOrg),
      project: q.project?.title ?? null,
      date: q.issueDate?.toISOString() ?? null,
      amountHt: d(q.totalSellHt),
      amountTtc: null,
      amountPaid: null,
      amountDue: null,
      status: q.status,
      overdue: false,
      daysLate: 0,
      action: quoteNextActionLabel({
        status: q.status,
        projectId: q.projectId,
        validityDate: q.validityDate,
      }),
    })),
    recentInvoices: recentInvoices.map((inv) => {
      const late = daysOverdue(inv.dueDate, now);
      return {
        id: inv.id,
        href: `/dashboard/devis-facturation/factures/${inv.id}`,
        number: inv.number,
        client: clientName(inv.clientExternalOrg),
        project: inv.project?.title ?? null,
        date: inv.issueDate?.toISOString() ?? null,
        amountHt: null,
        amountTtc: d(inv.totalTtc),
        amountPaid: d(inv.amountPaid),
        amountDue: d(inv.amountDue),
        status: inv.status,
        overdue: late > 0 || inv.status === "OVERDUE",
        daysLate: late,
        action: inv.dueDate
          ? `Éch. ${inv.dueDate.toLocaleDateString("fr-FR")}`
          : null,
      };
    }),
    salesPerformance: {
      conversionRate: convNow.rate,
      conversionAccepted: convNow.accepted,
      conversionDecided: convNow.decided,
      conversionTrend,
      avgQuoteBasketHt,
      avgInvoiceBasketHt,
      invoiceBasketTrend,
      avgAcceptanceDays,
      avgCollectionDays,
      paidOnTimeRate,
      paidOnTimeCount: onTime,
      paidOnTimeTotal: timed,
    },
    vat: {
      billedVat,
      purchaseVatRecorded,
      estimatedBalance:
        purchaseVatRecorded != null
          ? roundMoney(billedVat - purchaseVatRecorded, 2)
          : null,
      isEstimate: true,
      method: vatMethod,
    },
    electronicInvoices: getElectronicConnectionState(orgId),
    fiscalAlerts: getApplicableFiscalAlerts({
      profile: null,
      revenueHt: billedHt,
    }),
    filters: {
      clients: clients.map((c) => ({
        id: c.id,
        name: c.tradeName || c.name,
      })),
      projects: projects.map((p) => ({ id: p.id, title: p.title })),
    },
  };
}
