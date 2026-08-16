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

export type SerializedAnnualIntervention = {
  id: string;
  contractId: string;
  plannedDate: string | null;
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
  attentionLevel: string | null;
  attentionReason: string | null;
};

export type SerializedAnnualContract = {
  id: string;
  clientName: string;
  siteName: string | null;
  siteAddress: string;
  contractType: string;
  amountHt: number | null;
  amountHtLabel: string | null;
  plannedCrewCount: number | null;
  plannedDuration: string | null;
  comment: string | null;
  status: AnnualContractStatus;
  statusLabel: string;
  nextPlannedDate: string | null;
  projectId: string | null;
  openIntervention: SerializedAnnualIntervention | null;
  history: SerializedAnnualIntervention[];
};

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
  },
  now: Date,
): SerializedAnnualIntervention {
  const prep = evaluateAnnualInterventionAttention({
    plannedDate: i.plannedDate,
    status: i.status,
    now,
  });
  const bill = evaluateAnnualBillingAttention({
    billingNeededAt: i.billingNeededAt,
    billedAt: i.billedAt,
    now,
  });
  const att = bill ?? prep;
  return {
    id: i.id,
    contractId: i.contractId,
    plannedDate: i.plannedDate.toISOString().slice(0, 10),
    completedAt: i.completedAt?.toISOString() ?? null,
    plannedCrewCount: i.plannedCrewCount,
    actualCrewCount: i.actualCrewCount,
    plannedDuration: i.plannedDuration,
    status: i.status,
    statusLabel: ANNUAL_INTERVENTION_STATUS_LABELS[i.status],
    comment: i.comment,
    agendaEventId: i.agendaEventId,
    followUpSheetId: i.followUpSheetId,
    billingNeeded: Boolean(i.billingNeededAt && !i.billedAt),
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
        orderBy: { plannedDate: "desc" },
      },
    },
    orderBy: [{ clientName: "asc" }, { siteAddress: "asc" }],
  });

  const serialized: SerializedAnnualContract[] = contracts.map((c) => {
    const open =
      c.interventions.find(
        (i) => i.status === "TO_PREPARE" || i.status === "SCHEDULED",
      ) ?? null;
    const history = c.interventions
      .filter((i) => i.status === "COMPLETED")
      .map((i) => serializeIntervention(i, now));
    const amount = Number(c.amountHt);
    return {
      id: c.id,
      clientName: c.clientName,
      siteName: c.siteName,
      siteAddress: c.siteAddress,
      contractType: c.contractType,
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
      openIntervention: open ? serializeIntervention(open, now) : null,
      history,
    };
  });

  type PilotCard = {
    bucket: AnnualPilotBucket;
    contract: SerializedAnnualContract;
    intervention: SerializedAnnualIntervention;
  };

  const pilot: PilotCard[] = [];
  for (const c of serialized) {
    if (c.status === "TERMINATED") continue;
    const open = c.openIntervention;
    if (open) {
      if (!open.plannedDate) {
        pilot.push({ bucket: "to_prepare", contract: c, intervention: open });
        continue;
      }
      const planned = new Date(open.plannedDate + "T00:00:00.000Z");
      const days = daysBetweenDateOnly(today, planned);
      if (days < 0) {
        pilot.push({ bucket: "overdue", contract: c, intervention: open });
      } else if (open.status === "TO_PREPARE" && days <= 15) {
        pilot.push({ bucket: "to_confirm", contract: c, intervention: open });
      } else if (days <= 7) {
        pilot.push({
          bucket: open.status === "SCHEDULED" ? "within_7" : "to_confirm",
          contract: c,
          intervention: open,
        });
      } else if (days <= 15) {
        pilot.push({ bucket: "within_15", contract: c, intervention: open });
      } else if (days <= 30 || open.status === "TO_PREPARE") {
        pilot.push({ bucket: "to_prepare", contract: c, intervention: open });
      }
    }
    for (const h of c.history) {
      if (h.billingNeeded) {
        pilot.push({ bucket: "to_bill", contract: c, intervention: h });
      }
    }
  }

  const bucketOrder: AnnualPilotBucket[] = [
    "overdue",
    "to_bill",
    "within_7",
    "to_confirm",
    "within_15",
    "to_prepare",
  ];
  pilot.sort((a, b) => {
    const ba = bucketOrder.indexOf(a.bucket);
    const bb = bucketOrder.indexOf(b.bucket);
    if (ba !== bb) return ba - bb;
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
        intervention: serializeIntervention(i, now),
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
  const toPrepareCount = pilot.filter((p) => p.bucket === "to_prepare").length;
  const within30 = serialized.filter((c) => {
    if (!c.nextPlannedDate || c.status === "TERMINATED") return false;
    const d = daysBetweenDateOnly(today, new Date(c.nextPlannedDate + "T00:00:00.000Z"));
    return d >= 0 && d <= 30;
  }).length;
  const toBillCount = pilot.filter((p) => p.bucket === "to_bill").length;
  const portfolioHt = opts.includeFinancials
    ? active.reduce((s, c) => s + Number(c.amountHt), 0)
    : null;

  return {
    year,
    contracts: serialized,
    pilot,
    planningCells,
    kpis: {
      toPrepare: toPrepareCount,
      within30,
      toBill: toBillCount,
      portfolioHt,
      portfolioHtLabel:
        portfolioHt != null ? formatAmountHt(portfolioHt) : null,
    },
    includeFinancials: opts.includeFinancials,
  };
}
