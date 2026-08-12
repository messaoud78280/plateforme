/**
 * PILOTAGE-1 — Rentabilité chantier.
 *
 * Chaîne : VENDU → PRÉVU → ENGAGÉ → RÉEL → FACTURÉ → ENCAISSÉ
 * Aucune IA. Formules déterministes. Budget initial figé (snapshot).
 *
 * Forecast catégorie :
 *   estimateCategoryFinalCost(planned, committed, actual)
 *   = max(planned, committed, actualKnown)
 *   où actualKnown = actual si disponible, sinon 0 (ne réduit pas le budget).
 *   → un engagement > budget relève le coût final estimé ;
 *   → une sous-consommation n’abaisse pas le forecast.
 */
import type { PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";
import { isCollectibleInvoiceType } from "@/lib/commercial/invoice-status";
import type { CompositionSnapshot } from "@/lib/commercial/library";
import { isDueDatePast } from "@/lib/commercial/invoice-status";
import { effectiveRetentionStatus } from "@/lib/commercial/retention-calc";

export type CostCategoryKey =
  | "MATERIAL"
  | "LABOR"
  | "EQUIPMENT"
  | "SUBCONTRACT"
  | "OTHER"
  | "UNCLASSIFIED";

export const COST_CATEGORY_LABELS: Record<CostCategoryKey, string> = {
  MATERIAL: "Matériaux",
  LABOR: "Main-d’œuvre",
  EQUIPMENT: "Matériel",
  SUBCONTRACT: "Sous-traitance",
  OTHER: "Autres",
  UNCLASSIFIED: "Non classé",
};

export type ProfitabilityHealth = "STABLE" | "WATCH" | "CRITICAL";

export const PROFITABILITY_HEALTH_LABELS: Record<ProfitabilityHealth, string> = {
  STABLE: "Stable",
  WATCH: "À surveiller",
  CRITICAL: "Critique",
};

const WATCH_POINTS = 2;
const CRITICAL_POINTS = 5;

/** BC économiquement engagés (hors brouillon / validation / annulé / refusé). */
const COMMITTED_PO_STATUSES: PurchaseOrderStatus[] = [
  "VALIDEE",
  "ENVOYEE_FOURNISSEUR",
  "A_CONFIRMER",
  "CONFIRMEE",
  "LIVRAISON_PROGRAMMEE",
  "PARTIELLEMENT_RECUE",
  "RECUE",
  "CLOTUREE",
];

export function isCommittedPurchaseOrder(status: string): boolean {
  return (COMMITTED_PO_STATUSES as string[]).includes(status);
}

export function parseCompositionSnapshot(raw: unknown): CompositionSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<CompositionSnapshot>;
  if (!Array.isArray(s.components)) return null;
  return s as CompositionSnapshot;
}

/**
 * Coût final estimé d’une catégorie.
 * Ne prétend pas prévoir l’avenir : relève le forecast si engagement/réel > prévu.
 */
export function estimateCategoryFinalCost(input: {
  plannedHt: number;
  committedHt: number;
  actualHt: number | null;
}): number {
  const planned = roundMoney(Math.max(0, input.plannedHt), 2);
  const committed = roundMoney(Math.max(0, input.committedHt), 2);
  const actual =
    input.actualHt == null ? 0 : roundMoney(Math.max(0, input.actualHt), 2);
  return roundMoney(Math.max(planned, committed, actual), 2);
}

export function evaluateProfitabilityHealth(input: {
  plannedMarginPercent: number;
  estimatedMarginPercent: number;
  estimatedMarginHt: number;
}): { health: ProfitabilityHealth; driftPoints: number } {
  const driftPoints = roundMoney(
    input.estimatedMarginPercent - input.plannedMarginPercent,
    1,
  );
  const degradation = -driftPoints;
  if (input.estimatedMarginHt < -0.004 || degradation >= CRITICAL_POINTS) {
    return { health: "CRITICAL", driftPoints };
  }
  if (degradation >= WATCH_POINTS) {
    return { health: "WATCH", driftPoints };
  }
  return { health: "STABLE", driftPoints };
}

export type BudgetBreakdown = {
  marketSellHt: number;
  materialsHt: number;
  laborHt: number;
  equipmentHt: number;
  subcontractHt: number;
  otherHt: number;
  feesHt: number;
  totalCostHt: number;
  plannedMarginHt: number;
  plannedMarginPercent: number;
  laborHours: number | null;
};

/** Agrège les coûts prévus depuis les lignes WORK d’un devis (snapshots composition). */
export function buildBudgetBreakdownFromQuoteLines(
  lines: Array<{
    kind: string;
    quantity: number;
    unitCostHt: number;
    lineCostHt: number;
    lineSellHt: number;
    compositionSnapshotJson: unknown;
  }>,
): BudgetBreakdown {
  let marketSellHt = 0;
  let materialsHt = 0;
  let laborHt = 0;
  let equipmentHt = 0;
  let subcontractHt = 0;
  let otherHt = 0;
  let feesHt = 0;
  let laborHours = 0;
  let hasLaborHours = false;

  for (const line of lines) {
    if (line.kind !== "WORK") continue;
    const qty = Number(line.quantity) || 0;
    marketSellHt += Number(line.lineSellHt) || 0;
    const snap = parseCompositionSnapshot(line.compositionSnapshotJson);
    if (snap?.breakdown) {
      const b = snap.breakdown;
      materialsHt += (b.materialsHt || 0) * qty;
      laborHt += (b.laborHt || 0) * qty;
      equipmentHt += (b.equipmentHt || 0) * qty;
      subcontractHt += (b.subcontractHt || 0) * qty;
      otherHt += (b.otherHt || 0) * qty;
      feesHt += (b.feesHt || 0) * qty;
      for (const c of snap.components || []) {
        if (c.type === "LABOR") {
          laborHours += (Number(c.quantityPerUnit) || 0) * qty;
          hasLaborHours = true;
        }
      }
    } else {
      // Pas de composition : coût ligne → Autres (ne pas inventer de répartition)
      otherHt += Number(line.lineCostHt) || (Number(line.unitCostHt) || 0) * qty;
    }
  }

  const totalCostHt = roundMoney(
    materialsHt + laborHt + equipmentHt + subcontractHt + otherHt + feesHt,
    2,
  );
  marketSellHt = roundMoney(marketSellHt, 2);
  const plannedMarginHt = roundMoney(marketSellHt - totalCostHt, 2);
  const plannedMarginPercent =
    marketSellHt > 0.004
      ? roundMoney((plannedMarginHt / marketSellHt) * 100, 2)
      : 0;

  return {
    marketSellHt,
    materialsHt: roundMoney(materialsHt, 2),
    laborHt: roundMoney(laborHt, 2),
    equipmentHt: roundMoney(equipmentHt, 2),
    subcontractHt: roundMoney(subcontractHt, 2),
    otherHt: roundMoney(otherHt, 2),
    feesHt: roundMoney(feesHt, 2),
    totalCostHt,
    plannedMarginHt,
    plannedMarginPercent,
    laborHours: hasLaborHours ? roundMoney(laborHours, 2) : null,
  };
}

export type CategorySlice = {
  key: CostCategoryKey;
  label: string;
  plannedHt: number;
  committedHt: number;
  actualHt: number | null;
  actualAvailable: boolean;
  forecastHt: number;
  overrunHt: number;
  consumptionPercent: number | null;
};

export type ProjectProfitabilityDto = {
  projectId: string;
  projectTitle: string;
  clientName: string | null;
  organizationId: string;
  budget: null | {
    id: string;
    sourceQuoteId: string;
    sourceQuoteNumber: string | null;
    snappedAt: string;
    marketSellHt: number;
    totalCostHt: number;
    plannedMarginHt: number;
    plannedMarginPercent: number;
    laborHours: number | null;
  };
  acceptedQuotes: Array<{ id: string; number: string; totalSellHt: number }>;
  categories: CategorySlice[];
  committedTotalHt: number;
  actualTotalHt: number | null;
  actualIncomplete: boolean;
  forecastTotalHt: number;
  estimatedMarginHt: number;
  estimatedMarginPercent: number;
  driftPoints: number;
  health: ProfitabilityHealth;
  healthLabel: string;
  commercial: {
    marketSellHt: number;
    invoicedHt: number;
    remainingToInvoiceHt: number;
    collectedTtc: number;
    remainingToCollectTtc: number;
    overdueTtc: number;
    progressPercent: number | null;
    invoicedPercentOfMarket: number | null;
    billingLagWarning: boolean;
    /** DF-6A — null si pas de devis budget / pas de RG */
    retention: null | {
      heldHt: number;
      releasedHt: number;
      settledHt: number;
    };
  };
  cashSimple: {
    actualSpentHt: number | null;
    collectedTtc: number;
    gapHt: number | null;
  };
  commitments: Array<{
    id: string;
    number: string;
    supplierName: string | null;
    amountHt: number;
    status: string;
    category: CostCategoryKey;
  }>;
};

/**
 * Classification engagement → poste budgétaire.
 * Uniquement si la donnée org externe est fiable (type SUBCONTRACTOR).
 * Sinon : Non classé (pas de matching texte inventé).
 */
function classifyPoCategory(extType: string | null | undefined): CostCategoryKey {
  if (extType === "SUBCONTRACTOR") return "SUBCONTRACT";
  return "UNCLASSIFIED";
}

export async function listAcceptedQuotesForProject(
  orgId: string,
  projectId: string,
) {
  return prisma.commercialQuote.findMany({
    where: {
      organizationId: orgId,
      projectId,
      status: "ACCEPTED",
    },
    select: {
      id: true,
      number: true,
      totalSellHt: true,
      acceptedAt: true,
      subject: true,
    },
    orderBy: { acceptedAt: "desc" },
  });
}

/**
 * Initialise le budget initial depuis un devis accepté.
 * Idempotent : refuse si un budget existe déjà.
 */
export async function initializeProjectBudget(input: {
  orgId: string;
  projectId: string;
  quoteId: string;
  userId: string;
}) {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.orgId },
    select: { id: true },
  });
  if (!project) throw new Error("Chantier introuvable");

  const existing = await prisma.projectBudget.findUnique({
    where: { projectId: input.projectId },
    select: { id: true },
  });
  if (existing) {
    const err = new Error(
      "Le budget initial de ce chantier existe déjà.",
    ) as Error & { code?: string };
    err.code = "BUDGET_EXISTS";
    throw err;
  }

  const quote = await prisma.commercialQuote.findFirst({
    where: {
      id: input.quoteId,
      organizationId: input.orgId,
      projectId: input.projectId,
      status: "ACCEPTED",
    },
    select: {
      id: true,
      number: true,
      totalSellHt: true,
      acceptedVersionId: true,
      currentVersionId: true,
    },
  });
  if (!quote) {
    throw new Error("Devis accepté introuvable pour ce chantier");
  }

  const versionId = quote.acceptedVersionId || quote.currentVersionId;
  if (!versionId) {
    throw new Error(
      "Ce devis accepté n’a pas de version figée — impossible d’initialiser le budget.",
    );
  }

  const lines = await prisma.commercialQuoteLine.findMany({
    where: {
      organizationId: input.orgId,
      versionId,
      kind: "WORK",
    },
    select: {
      kind: true,
      quantity: true,
      unitCostHt: true,
      lineCostHt: true,
      lineSellHt: true,
      compositionSnapshotJson: true,
    },
  });

  const breakdown = buildBudgetBreakdownFromQuoteLines(
    lines.map((l) => ({
      kind: l.kind,
      quantity: d(l.quantity),
      unitCostHt: d(l.unitCostHt),
      lineCostHt: d(l.lineCostHt),
      lineSellHt: d(l.lineSellHt),
      compositionSnapshotJson: l.compositionSnapshotJson,
    })),
  );

  // Si les lignes n’ont pas de sell agrégé, basculer sur total devis
  const marketSellHt =
    breakdown.marketSellHt > 0.004
      ? breakdown.marketSellHt
      : roundMoney(d(quote.totalSellHt), 2);
  const plannedMarginHt = roundMoney(marketSellHt - breakdown.totalCostHt, 2);
  const plannedMarginPercent =
    marketSellHt > 0.004
      ? roundMoney((plannedMarginHt / marketSellHt) * 100, 2)
      : 0;

  return prisma.projectBudget.create({
    data: {
      organizationId: input.orgId,
      projectId: input.projectId,
      sourceQuoteId: quote.id,
      sourceQuoteNumber: quote.number,
      createdById: input.userId,
      marketSellHt,
      materialsHt: breakdown.materialsHt,
      laborHt: breakdown.laborHt,
      equipmentHt: breakdown.equipmentHt,
      subcontractHt: breakdown.subcontractHt,
      otherHt: breakdown.otherHt,
      feesHt: breakdown.feesHt,
      totalCostHt: breakdown.totalCostHt,
      plannedMarginHt,
      plannedMarginPercent,
      laborHours: breakdown.laborHours,
    },
  });
}

export async function loadProjectProfitability(
  orgId: string,
  projectId: string,
): Promise<ProjectProfitabilityDto | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: {
      id: true,
      title: true,
      organizationId: true,
      client: { select: { name: true, company: true } },
    },
  });
  if (!project || !project.organizationId) return null;

  const now = new Date();

  const [budget, acceptedQuotes, orders, invoices, progress, retentions] =
    await Promise.all([
    prisma.projectBudget.findFirst({
      where: { projectId, organizationId: orgId },
    }),
    listAcceptedQuotesForProject(orgId, projectId),
    prisma.purchaseOrder.findMany({
      where: { organizationId: orgId, projectId },
      select: {
        id: true,
        number: true,
        status: true,
        amountHt: true,
        externalOrganization: {
          select: { name: true, tradeName: true, type: true },
        },
        lines: {
          select: {
            id: true,
            quantity: true,
            unitPriceHt: true,
            receiptLines: {
              where: { receipt: { cancelledAt: null } },
              select: {
                receivedQty: true,
                damagedQty: true,
                refusedQty: true,
              },
            },
          },
        },
      },
    }),
    prisma.commercialInvoice.findMany({
      where: {
        organizationId: orgId,
        projectId,
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      select: {
        id: true,
        type: true,
        status: true,
        totalSellHt: true,
        totalTtc: true,
        amountPaid: true,
        amountDue: true,
        dueDate: true,
      },
    }),
    prisma.commercialProgressStatement.findFirst({
      where: {
        organizationId: orgId,
        projectId,
        status: { in: ["VALIDATED", "INVOICED"] },
      },
      orderBy: { number: "desc" },
      select: {
        cumulativeSellHt: true,
        marketSellHt: true,
      },
    }),
    prisma.commercialRetentionGuarantee.findMany({
      where: { organizationId: orgId, quote: { projectId } },
      select: {
        amountHt: true,
        status: true,
        plannedReleaseDate: true,
      },
    }),
  ]);

  // —— Engagements / réel achats ——
  const committedByCat: Record<CostCategoryKey, number> = {
    MATERIAL: 0,
    LABOR: 0,
    EQUIPMENT: 0,
    SUBCONTRACT: 0,
    OTHER: 0,
    UNCLASSIFIED: 0,
  };
  const actualByCat: Record<CostCategoryKey, number> = {
    MATERIAL: 0,
    LABOR: 0,
    EQUIPMENT: 0,
    SUBCONTRACT: 0,
    OTHER: 0,
    UNCLASSIFIED: 0,
  };
  let hasAnyReceiptValue = false;
  const commitments: ProjectProfitabilityDto["commitments"] = [];

  for (const po of orders) {
    if (!isCommittedPurchaseOrder(po.status)) continue;
    const amountHt = po.amountHt != null ? d(po.amountHt) : 0;
    const cat = classifyPoCategory(po.externalOrganization?.type);
    committedByCat[cat] += amountHt;
    commitments.push({
      id: po.id,
      number: po.number,
      supplierName:
        po.externalOrganization?.tradeName ||
        po.externalOrganization?.name ||
        null,
      amountHt: roundMoney(amountHt, 2),
      status: po.status,
      category: cat,
    });

    // Réel = qty conforme reçue × PU commande
    let receivedHt = 0;
    for (const line of po.lines) {
      if (line.unitPriceHt == null) continue;
      const pu = d(line.unitPriceHt);
      let qtyOk = 0;
      for (const rl of line.receiptLines) {
        qtyOk +=
          d(rl.receivedQty) - d(rl.damagedQty) - d(rl.refusedQty);
      }
      if (qtyOk > 0) {
        receivedHt += qtyOk * pu;
        hasAnyReceiptValue = true;
      }
    }
    actualByCat[cat] += receivedHt;
  }

  const planned = {
    MATERIAL: budget ? d(budget.materialsHt) : 0,
    LABOR: budget ? d(budget.laborHt) : 0,
    EQUIPMENT: budget ? d(budget.equipmentHt) : 0,
    SUBCONTRACT: budget ? d(budget.subcontractHt) : 0,
    OTHER: budget
      ? d(budget.otherHt) + d(budget.feesHt)
      : 0,
    UNCLASSIFIED: 0,
  };

  const categoryKeys: CostCategoryKey[] = [
    "MATERIAL",
    "LABOR",
    "EQUIPMENT",
    "SUBCONTRACT",
    "OTHER",
    "UNCLASSIFIED",
  ];

  const categories: CategorySlice[] = categoryKeys
    .map((key) => {
      const plannedHt = roundMoney(planned[key], 2);
      const committedHt = roundMoney(committedByCat[key], 2);
      // MO réel : non disponible (pas de pointage) — ne pas afficher 0 trompeur
      const actualAvailable =
        key === "LABOR" ? false : hasAnyReceiptValue || committedHt > 0;
      const actualHt =
        key === "LABOR"
          ? null
          : hasAnyReceiptValue
            ? roundMoney(actualByCat[key], 2)
            : committedHt > 0
              ? roundMoney(actualByCat[key], 2)
              : null;
      const forecastHt = estimateCategoryFinalCost({
        plannedHt,
        committedHt,
        actualHt: key === "LABOR" ? null : actualHt,
      });
      const overrunHt = roundMoney(Math.max(0, committedHt - plannedHt), 2);
      const consumptionPercent =
        plannedHt > 0.004
          ? roundMoney((committedHt / plannedHt) * 100, 1)
          : null;
      return {
        key,
        label: COST_CATEGORY_LABELS[key],
        plannedHt,
        committedHt,
        actualHt,
        actualAvailable: key === "LABOR" ? false : actualAvailable,
        forecastHt,
        overrunHt,
        consumptionPercent,
      };
    })
    .filter(
      (c) =>
        c.plannedHt > 0.004 ||
        c.committedHt > 0.004 ||
        (c.actualHt != null && c.actualHt > 0.004),
    );

  const committedTotalHt = roundMoney(
    Object.values(committedByCat).reduce((s, n) => s + n, 0),
    2,
  );
  const actualSum = Object.values(actualByCat).reduce((s, n) => s + n, 0);
  // V1 : MO réel absent → données réelles toujours incomplètes
  const actualIncomplete = true;
  const actualTotalHt = hasAnyReceiptValue ? roundMoney(actualSum, 2) : null;

  const forecastTotalHt = roundMoney(
    categoryKeys.reduce((s, k) => {
      const slice = categories.find((c) => c.key === k);
      if (slice) return s + slice.forecastHt;
      // catégories filtrées à 0
      return (
        s +
        estimateCategoryFinalCost({
          plannedHt: planned[k],
          committedHt: committedByCat[k],
          actualHt: k === "LABOR" ? null : actualByCat[k],
        })
      );
    }, 0),
    2,
  );

  // —— Commercial ——
  let invoicedHt = 0;
  let collectedTtc = 0;
  let remainingToCollectTtc = 0;
  let overdueTtc = 0;
  for (const inv of invoices) {
    if (!isCollectibleInvoiceType(inv.type)) {
      // CREDIT : réduit le facturé HT
      if (inv.type === "CREDIT") {
        invoicedHt -= Math.abs(d(inv.totalSellHt));
      }
      continue;
    }
    invoicedHt += d(inv.totalSellHt);
    collectedTtc += d(inv.amountPaid);
    remainingToCollectTtc += d(inv.amountDue);
    if (
      d(inv.amountDue) > 0.004 &&
      (inv.status === "OVERDUE" || isDueDatePast(inv.dueDate, now))
    ) {
      overdueTtc += d(inv.amountDue);
    }
  }
  invoicedHt = roundMoney(invoicedHt, 2);
  collectedTtc = roundMoney(collectedTtc, 2);
  remainingToCollectTtc = roundMoney(remainingToCollectTtc, 2);
  overdueTtc = roundMoney(overdueTtc, 2);

  const marketSellHt = budget
    ? d(budget.marketSellHt)
    : acceptedQuotes.reduce((s, q) => s + d(q.totalSellHt), 0);
  const remainingToInvoiceHt = roundMoney(
    Math.max(0, marketSellHt - invoicedHt),
    2,
  );

  let progressPercent: number | null = null;
  if (progress && d(progress.marketSellHt) > 0.004) {
    progressPercent = roundMoney(
      (d(progress.cumulativeSellHt) / d(progress.marketSellHt)) * 100,
      1,
    );
  }
  const invoicedPercentOfMarket =
    marketSellHt > 0.004
      ? roundMoney((invoicedHt / marketSellHt) * 100, 1)
      : null;
  const billingLagWarning =
    progressPercent != null &&
    invoicedPercentOfMarket != null &&
    progressPercent - invoicedPercentOfMarket >= 10;

  let retention: ProjectProfitabilityDto["commercial"]["retention"] = null;
  if (retentions.length > 0) {
    let heldHt = 0;
    let releasedHt = 0;
    let settledHt = 0;
    for (const r of retentions) {
      const amt = d(r.amountHt);
      const eff = effectiveRetentionStatus(r.status, r.plannedReleaseDate);
      if (eff === "SETTLED") settledHt += amt;
      else if (eff === "RELEASED") releasedHt += amt;
      else heldHt += amt;
    }
    retention = {
      heldHt: roundMoney(heldHt, 2),
      releasedHt: roundMoney(releasedHt, 2),
      settledHt: roundMoney(settledHt, 2),
    };
  }

  const plannedMarginHt = budget ? d(budget.plannedMarginHt) : 0;
  const plannedMarginPercent = budget ? d(budget.plannedMarginPercent) : 0;
  const estimatedMarginHt = roundMoney(marketSellHt - forecastTotalHt, 2);
  const estimatedMarginPercent =
    marketSellHt > 0.004
      ? roundMoney((estimatedMarginHt / marketSellHt) * 100, 2)
      : 0;
  const { health, driftPoints } = evaluateProfitabilityHealth({
    plannedMarginPercent,
    estimatedMarginPercent,
    estimatedMarginHt,
  });

  return {
    projectId: project.id,
    projectTitle: project.title,
    clientName: project.client.company || project.client.name || null,
    organizationId: orgId,
    budget: budget
      ? {
          id: budget.id,
          sourceQuoteId: budget.sourceQuoteId,
          sourceQuoteNumber: budget.sourceQuoteNumber,
          snappedAt: budget.snappedAt.toISOString(),
          marketSellHt: d(budget.marketSellHt),
          totalCostHt: d(budget.totalCostHt),
          plannedMarginHt,
          plannedMarginPercent,
          laborHours:
            budget.laborHours != null ? d(budget.laborHours) : null,
        }
      : null,
    acceptedQuotes: acceptedQuotes.map((q) => ({
      id: q.id,
      number: q.number,
      totalSellHt: d(q.totalSellHt),
    })),
    categories,
    committedTotalHt,
    actualTotalHt,
    actualIncomplete,
    forecastTotalHt,
    estimatedMarginHt,
    estimatedMarginPercent,
    driftPoints,
    health,
    healthLabel: PROFITABILITY_HEALTH_LABELS[health],
    commercial: {
      marketSellHt: roundMoney(marketSellHt, 2),
      invoicedHt,
      remainingToInvoiceHt,
      collectedTtc,
      remainingToCollectTtc,
      overdueTtc,
      progressPercent,
      invoicedPercentOfMarket,
      billingLagWarning,
      retention,
    },
    cashSimple: {
      actualSpentHt: actualTotalHt,
      collectedTtc,
      gapHt:
        actualTotalHt != null
          ? roundMoney(collectedTtc - actualTotalHt, 2)
          : null,
    },
    commitments: commitments.sort((a, b) => b.amountHt - a.amountHt),
  };
}

export async function loadPortfolioProfitability(orgId: string) {
  const projects = await prisma.project.findMany({
    where: {
      organizationId: orgId,
      chantierStatus: { notIn: ["TERMINE"] },
    },
    select: { id: true, title: true },
    take: 80,
    orderBy: { updatedAt: "desc" },
  });

  const rows = (
    await Promise.all(
      projects.map((p) => loadProjectProfitability(orgId, p.id)),
    )
  ).filter((dto): dto is NonNullable<typeof dto> => Boolean(dto));

  rows.sort((a, b) => {
    const rank = { CRITICAL: 0, WATCH: 1, STABLE: 2 };
    const ra = rank[a.health] - rank[b.health];
    if (ra !== 0) return ra;
    return b.commercial.marketSellHt - a.commercial.marketSellHt;
  });

  return {
    rows,
    counts: {
      total: rows.length,
      stable: rows.filter((r) => r.health === "STABLE").length,
      watch: rows.filter((r) => r.health === "WATCH").length,
      critical: rows.filter((r) => r.health === "CRITICAL").length,
    },
  };
}
