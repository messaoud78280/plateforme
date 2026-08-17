import { prisma } from "@/lib/prisma";
import type { AnnualContractStatus, AnnualInterventionStatus } from "@prisma/client";
import {
  evaluateAnnualBillingAttention,
  evaluateAnnualInterventionAttention,
} from "@/lib/annual-contracts/evaluate-attention";
import {
  daysBetweenDateOnly,
  formatAmountHt,
  startOfDayParis,
  ANNUAL_CONTRACT_STATUS_LABELS,
  ANNUAL_INTERVENTION_STATUS_LABELS,
  type AnnualPilotBucket,
} from "@/lib/annual-contracts/types";

export type AnnualBillingState =
  | "none"
  | "to_bill"
  | "preparing"
  | "invoiced"
  | "paid";

export type SerializedAnnualIntervention = {
  id: string;
  contractId: string;
  plannedDate: string | null;
  plannedYear: number | null;
  completedAt: string | null;
  plannedCrewCount: number | null;
  actualCrewCount: number | null;
  plannedDuration: string | null;
  status: AnnualInterventionStatus;
  statusLabel: string;
  comment: string | null;
  agendaEventId: string | null;
  followUpSheetId: string | null;
  billingNeeded: boolean;
  billingState: AnnualBillingState;
  billingStateLabel: string;
  commercialInvoiceId: string | null;
  commercialInvoiceNumber: string | null;
  commercialInvoiceHref: string | null;
  invoiceTotalHt: number | null;
  invoiceTotalHtLabel: string | null;
  invoiceAmountPaid: number | null;
  invoiceAmountDue: number | null;
  /** Jours de retard (>0) si date planifiée dépassée et non réalisée. */
  daysOverdue: number | null;
  attentionLevel: string | null;
  attentionReason: string | null;
};

export type SerializedAnnualContract = {
  id: string;
  clientName: string;
  siteName: string | null;
  siteAddress: string;
  contractType: string;
  /** Fréquence affichée — aujourd’hui annuelle uniquement. */
  frequencyLabel: string;
  amountHt: number | null;
  amountHtLabel: string | null;
  plannedCrewCount: number | null;
  plannedDuration: string | null;
  comment: string | null;
  status: AnnualContractStatus;
  statusLabel: string;
  nextPlannedDate: string | null;
  projectId: string | null;
  lastCompletedDate: string | null;
  lastCompletedYear: number | null;
  openIntervention: SerializedAnnualIntervention | null;
  history: SerializedAnnualIntervention[];
  allInterventions: SerializedAnnualIntervention[];
};

function deriveBillingState(opts: {
  billingNeededAt: Date | null;
  billedAt: Date | null;
  invoiceStatus: string | null;
}): { state: AnnualBillingState; label: string } {
  const st = opts.invoiceStatus;
  if (st === "PAID") return { state: "paid", label: "Encaissée" };
  if (st && !["DRAFT", "CANCELLED"].includes(st)) {
    return { state: "invoiced", label: "Émise" };
  }
  if (st === "DRAFT") return { state: "preparing", label: "Brouillon" };
  if (opts.billingNeededAt && !opts.billedAt) {
    return { state: "to_bill", label: "À facturer" };
  }
  return { state: "none", label: "" };
}

function serializeIntervention(
  i: {
    id: string;
    contractId: string;
    plannedDate: Date;
    completedAt: Date | null;
    plannedCrewCount: number | null;
    actualCrewCount: number | null;
    plannedDuration: string | null;
    status: AnnualInterventionStatus;
    comment: string | null;
    agendaEventId: string | null;
    followUpSheetId: string | null;
    billingNeededAt: Date | null;
    billedAt: Date | null;
    commercialInvoiceId: string | null;
    commercialInvoice: {
      id: string;
      number: string;
      status: string;
      totalSellHt: unknown;
      amountPaid: unknown;
      amountDue: unknown;
    } | null;
  },
  now: Date,
  today: Date,
): SerializedAnnualIntervention {
  const invoiceStatus = i.commercialInvoice?.status ?? null;
  const prep = evaluateAnnualInterventionAttention({
    plannedDate: i.plannedDate,
    status: i.status,
    now,
  });
  const bill = evaluateAnnualBillingAttention({
    billingNeededAt: i.billingNeededAt,
    billedAt: i.billedAt,
    invoiceStatus,
    now,
  });
  const att = bill ?? prep;
  const billing = deriveBillingState({
    billingNeededAt: i.billingNeededAt,
    billedAt: i.billedAt,
    invoiceStatus,
  });
  const invoiceId = i.commercialInvoice?.id ?? i.commercialInvoiceId;
  const totalHt =
    i.commercialInvoice?.totalSellHt != null
      ? Number(i.commercialInvoice.totalSellHt)
      : null;
  let daysOverdue: number | null = null;
  if (
    i.status !== "COMPLETED" &&
    i.status !== "CANCELLED" &&
    i.plannedDate
  ) {
    const days = daysBetweenDateOnly(today, i.plannedDate);
    if (days < 0) daysOverdue = Math.abs(days);
  }
  return {
    id: i.id,
    contractId: i.contractId,
    plannedDate: i.plannedDate.toISOString().slice(0, 10),
    plannedYear: i.plannedDate.getUTCFullYear(),
    completedAt: i.completedAt?.toISOString() ?? null,
    plannedCrewCount: i.plannedCrewCount,
    actualCrewCount: i.actualCrewCount,
    plannedDuration: i.plannedDuration,
    status: i.status,
    statusLabel: ANNUAL_INTERVENTION_STATUS_LABELS[i.status],
    comment: i.comment,
    agendaEventId: i.agendaEventId,
    followUpSheetId: i.followUpSheetId,
    billingNeeded: billing.state === "to_bill" || billing.state === "preparing",
    billingState: billing.state,
    billingStateLabel: billing.label,
    commercialInvoiceId: invoiceId,
    commercialInvoiceNumber: i.commercialInvoice?.number ?? null,
    commercialInvoiceHref: invoiceId
      ? `/dashboard/devis-facturation/factures/${invoiceId}`
      : null,
    invoiceTotalHt: totalHt,
    invoiceTotalHtLabel: totalHt != null ? formatAmountHt(totalHt) : null,
    invoiceAmountPaid:
      i.commercialInvoice?.amountPaid != null
        ? Number(i.commercialInvoice.amountPaid)
        : null,
    invoiceAmountDue:
      i.commercialInvoice?.amountDue != null
        ? Number(i.commercialInvoice.amountDue)
        : null,
    daysOverdue,
    attentionLevel: att?.level ?? null,
    attentionReason: att?.reason ?? null,
  };
}

export async function loadAnnualContractsBoard(opts: {
  organizationId: string;
  includeFinancials: boolean;
  year?: number;
  now?: Date;
}) {
  const now = opts.now ?? new Date();
  const today = startOfDayParis(now);
  const year = opts.year ?? today.getUTCFullYear();

  const contracts = await prisma.annualServiceContract.findMany({
    where: { organizationId: opts.organizationId },
    include: {
      interventions: {
        include: {
          commercialInvoice: {
            select: {
              id: true,
              number: true,
              status: true,
              totalSellHt: true,
              amountPaid: true,
              amountDue: true,
            },
          },
        },
        orderBy: { plannedDate: "desc" },
      },
    },
    orderBy: [{ clientName: "asc" }, { siteAddress: "asc" }],
  });

  const serialized: SerializedAnnualContract[] = contracts.map((c) => {
    const all = c.interventions.map((i) => serializeIntervention(i, now, today));
    const open =
      all.find((i) => i.status === "TO_PREPARE" || i.status === "SCHEDULED") ??
      null;
    const history = all.filter((i) => i.status === "COMPLETED");
    const lastDone = history[0] ?? null;
    const amount = Number(c.amountHt);
    return {
      id: c.id,
      clientName: c.clientName,
      siteName: c.siteName,
      siteAddress: c.siteAddress,
      contractType: c.contractType,
      frequencyLabel: "Annuelle",
      amountHt: opts.includeFinancials ? amount : null,
      amountHtLabel: opts.includeFinancials ? formatAmountHt(amount) : null,
      plannedCrewCount: c.plannedCrewCount,
      plannedDuration: c.plannedDuration,
      comment: c.comment,
      status: c.status,
      statusLabel: ANNUAL_CONTRACT_STATUS_LABELS[c.status],
      nextPlannedDate: c.nextPlannedDate
        ? c.nextPlannedDate.toISOString().slice(0, 10)
        : null,
      projectId: c.projectId,
      lastCompletedDate: lastDone?.completedAt?.slice(0, 10) ?? lastDone?.plannedDate ?? null,
      lastCompletedYear: lastDone?.plannedYear ?? null,
      openIntervention: open,
      history,
      allInterventions: all,
    };
  });

  type PilotCard = {
    bucket: AnnualPilotBucket;
    contract: SerializedAnnualContract;
    intervention: SerializedAnnualIntervention;
    /** Libellé de contexte cycle. */
    cycleLabel: string;
  };

  const pilot: PilotCard[] = [];
  const usedKeys = new Set<string>();

  function pushPilot(
    bucket: AnnualPilotBucket,
    contract: SerializedAnnualContract,
    intervention: SerializedAnnualIntervention,
    cycleLabel: string,
  ) {
    const key = `${bucket}:${intervention.id}`;
    if (usedKeys.has(key)) return;
    usedKeys.add(key);
    pilot.push({ bucket, contract, intervention, cycleLabel });
  }

  for (const c of serialized) {
    if (c.status === "TERMINATED") continue;
    const open = c.openIntervention;
    if (open) {
      if (!open.plannedDate) {
        pushPilot(
          "to_prepare",
          c,
          open,
          `Cycle ${open.plannedYear ?? "—"} · Intervention`,
        );
      } else {
        const planned = new Date(open.plannedDate + "T00:00:00.000Z");
        const days = daysBetweenDateOnly(today, planned);
        const cycleLabel = `Cycle ${open.plannedYear ?? "—"} · Intervention`;
        if (days < 0) {
          pushPilot("overdue", c, open, cycleLabel);
        } else if (days <= 7) {
          pushPilot("this_week", c, open, cycleLabel);
        } else if (days <= 30) {
          pushPilot("within_30", c, open, cycleLabel);
        } else if (open.status === "TO_PREPARE") {
          pushPilot("to_prepare", c, open, cycleLabel);
        }
      }
    }
    for (const h of c.history) {
      if (h.billingState === "to_bill") {
        pushPilot(
          "to_bill",
          c,
          h,
          `Cycle ${h.plannedYear ?? "—"} · Facturation`,
        );
      } else if (h.billingState === "preparing") {
        pushPilot(
          "preparing",
          c,
          h,
          `Cycle ${h.plannedYear ?? "—"} · Facturation`,
        );
      }
    }
  }

  const bucketOrder: AnnualPilotBucket[] = [
    "overdue",
    "this_week",
    "within_30",
    "to_bill",
    "preparing",
    "to_prepare",
  ];
  pilot.sort((a, b) => {
    const ba = bucketOrder.indexOf(a.bucket);
    const bb = bucketOrder.indexOf(b.bucket);
    if (ba !== bb) return ba - bb;
    if (a.bucket === "overdue") {
      return (b.intervention.daysOverdue ?? 0) - (a.intervention.daysOverdue ?? 0);
    }
    return (a.intervention.plannedDate ?? "").localeCompare(
      b.intervention.plannedDate ?? "",
    );
  });

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));
  const planningCells: {
    contractId: string;
    month: number;
    intervention: SerializedAnnualIntervention;
    clientName: string;
    siteAddress: string;
    amountHtLabel: string | null;
    plannedCrewCount: number | null;
    status: AnnualContractStatus;
  }[] = [];

  for (const c of contracts) {
    for (const i of c.interventions) {
      if (i.status === "CANCELLED") continue;
      if (i.plannedDate < yearStart || i.plannedDate > yearEnd) continue;
      planningCells.push({
        contractId: c.id,
        month: i.plannedDate.getUTCMonth(),
        intervention: serializeIntervention(i, now, today),
        clientName: c.clientName,
        siteAddress: c.siteAddress,
        amountHtLabel: opts.includeFinancials
          ? formatAmountHt(Number(c.amountHt))
          : null,
        plannedCrewCount: i.plannedCrewCount ?? c.plannedCrewCount,
        status: c.status,
      });
    }
  }

  const active = contracts.filter((c) => c.status === "ACTIVE");
  const overdueCount = pilot.filter((p) => p.bucket === "overdue").length;
  const within30 = pilot.filter(
    (p) => p.bucket === "this_week" || p.bucket === "within_30",
  ).length;
  const toBillCount = pilot.filter((p) => p.bucket === "to_bill").length;
  const preparingCount = pilot.filter((p) => p.bucket === "preparing").length;

  // Finance année = factures liées aux interventions de l’année sélectionnée
  let yearInvoicedHt = 0;
  let yearCollected = 0;
  let yearDue = 0;
  if (opts.includeFinancials) {
    for (const c of serialized) {
      for (const i of c.allInterventions) {
        if (i.plannedYear !== year) continue;
        if (
          i.billingState === "invoiced" ||
          i.billingState === "paid" ||
          i.billingState === "preparing"
        ) {
          if (
            i.billingState === "invoiced" ||
            i.billingState === "paid"
          ) {
            yearInvoicedHt += i.invoiceTotalHt ?? 0;
            yearCollected += i.invoiceAmountPaid ?? 0;
            yearDue += i.invoiceAmountDue ?? 0;
          }
        }
      }
    }
  }

  const portfolioHt = opts.includeFinancials
    ? active.reduce((s, c) => s + Number(c.amountHt), 0)
    : null;

  const billingView = {
    toBill: [] as PilotCard[],
    preparing: [] as PilotCard[],
    invoiced: [] as PilotCard[],
    toCollect: [] as PilotCard[],
    collected: [] as PilotCard[],
  };
  for (const c of serialized) {
    if (c.status === "TERMINATED") continue;
    for (const h of c.allInterventions) {
      if (h.status !== "COMPLETED" && h.billingState === "none") continue;
      if (h.plannedYear != null && h.plannedYear !== year && h.billingState === "none") {
        continue;
      }
      const card: PilotCard = {
        bucket:
          h.billingState === "preparing"
            ? "preparing"
            : h.billingState === "to_bill"
              ? "to_bill"
              : "to_bill",
        contract: c,
        intervention: h,
        cycleLabel: `Cycle ${h.plannedYear ?? "—"} · Facturation`,
      };
      if (h.billingState === "to_bill") billingView.toBill.push(card);
      else if (h.billingState === "preparing") billingView.preparing.push(card);
      else if (h.billingState === "invoiced") {
        billingView.invoiced.push(card);
        if ((h.invoiceAmountDue ?? 0) > 0.01) billingView.toCollect.push(card);
      } else if (h.billingState === "paid") billingView.collected.push(card);
    }
  }

  return {
    year,
    contracts: serialized,
    pilot,
    planningCells,
    billingView,
    kpis: {
      portfolioHt,
      portfolioHtLabel:
        portfolioHt != null ? formatAmountHt(portfolioHt) : null,
      activeCount: active.length,
      overdue: overdueCount,
      within30,
      toBill: toBillCount,
      preparing: preparingCount,
      /** Secondaires finance (année sélectionnée). */
      yearInvoicedHt,
      yearInvoicedHtLabel: opts.includeFinancials
        ? formatAmountHt(yearInvoicedHt)
        : null,
      yearCollected,
      yearCollectedLabel: opts.includeFinancials
        ? formatAmountHt(yearCollected)
        : null,
      yearDue,
      yearDueLabel: opts.includeFinancials ? formatAmountHt(yearDue) : null,
      /** Legacy aliases (compat). */
      toPrepare: pilot.filter((p) => p.bucket === "to_prepare").length,
      invoiced: billingView.invoiced.length,
      paid: billingView.collected.length,
    },
    includeFinancials: opts.includeFinancials,
  };
}
