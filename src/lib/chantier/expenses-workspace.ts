/**
 * Dépenses V2.1 — projection liste + KPI (source unique).
 * Date de période = date facture fournisseur (invoiceDate).
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";
import {
  parseSupplierInvoiceCategory,
  signedSupplierInvoiceHt,
  SUPPLIER_INVOICE_CATEGORY_LABELS,
  SUPPLIER_INVOICE_KIND_LABELS,
  SUPPLIER_INVOICE_STATUS_LABELS,
  type SupplierCostCategory,
} from "@/lib/chantier/supplier-invoices";
import { computeInvoiceVariance } from "@/lib/chantier/prepare-supplier-invoice";
import type { SupplierInvoiceKind, SupplierInvoiceStatus } from "@prisma/client";

export type ExpensesView =
  | "all"
  | "to_control"
  | "with_po"
  | "without_po"
  | "with_variance";

export type ExpensesSort =
  | "recent"
  | "oldest"
  | "amount_desc"
  | "amount_asc"
  | "supplier"
  | "project"
  | "variance"
  | "created";

export type ExpensesPeriod =
  | "month"
  | "this_month"
  | "prev_month"
  | "quarter"
  | "year"
  | "all";

export type ExpenseControlStatus =
  | "coherent"
  | "to_verify"
  | "without_po"
  | "missing_receipt"
  | "unclassified"
  | "cancelled"
  | "credit";

export type ExpenseControlReason =
  | "variance"
  | "missing_receipt"
  | "partial_receipt"
  | "without_po"
  | "unclassified";

export type ExpenseListRow = {
  id: string;
  supplierNumber: string;
  /** Date métier = date facture (filtre période + affichage). */
  invoiceDate: string;
  createdAt: string;
  kind: SupplierInvoiceKind;
  kindLabel: string;
  status: SupplierInvoiceStatus;
  statusLabel: string;
  category: SupplierCostCategory;
  categoryLabel: string;
  amountHt: number;
  amountVat: number;
  amountTtc: number;
  signedHt: number;
  notes: string | null;
  supplierId: string;
  supplierName: string;
  projectId: string;
  projectTitle: string | null;
  projectCity: string | null;
  projectLocation: string | null;
  purchaseOrderId: string | null;
  purchaseOrderNumber: string | null;
  orderAmountHt: number | null;
  varianceHt: number | null;
  variancePercent: number | null;
  orderedQty: number;
  receivedQty: number;
  fullyReceived: boolean;
  hasReceipt: boolean;
  hasBl: boolean;
  blCount: number;
  controlStatus: ExpenseControlStatus;
  controlLabel: string;
  controlReasons: ExpenseControlReason[];
  needsControl: boolean;
  inProfitability: boolean;
  profitabilityHref: string;
  documentsHref: string;
  purchaseOrderHref: string | null;
  receiptHref: string | null;
};

export type ExpensesWorkspaceSummary = {
  periodLabel: string;
  /** Champ date utilisé pour la période. */
  periodDateFieldLabel: string;
  invoiceCount: number;
  spentPeriodHt: number;
  /** Montant pris en compte rentabilité (RECORDED + catégorisé). */
  actualCostHt: number;
  toControlCount: number;
  toControlHt: number;
  missingReceiptCount: number;
  withoutPoCount: number;
  varianceCount: number;
  /** Somme des |écarts| — ne masque pas les anomalies. */
  varianceAbsHt: number;
  unclassifiedCount: number;
  supplierCount: number;
  categoryShares: Array<{
    key: SupplierCostCategory;
    label: string;
    ht: number;
    pct: number;
  }>;
  topProjects: Array<{ projectId: string; title: string; ht: number }>;
};

function normalizePeriod(period: ExpensesPeriod): Exclude<ExpensesPeriod, "this_month"> {
  return period === "this_month" ? "month" : period;
}

export function periodBounds(
  period: ExpensesPeriod,
  now = new Date(),
): { from: Date | null; to: Date | null; label: string } {
  const p = normalizePeriod(period);
  const y = now.getFullYear();
  const m = now.getMonth();
  if (p === "all") return { from: null, to: null, label: "Toutes périodes" };
  if (p === "month") {
    return {
      from: new Date(y, m, 1),
      to: new Date(y, m + 1, 1),
      label: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    };
  }
  if (p === "prev_month") {
    return {
      from: new Date(y, m - 1, 1),
      to: new Date(y, m, 1),
      label: new Date(y, m - 1, 1).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
    };
  }
  if (p === "quarter") {
    const q = Math.floor(m / 3) * 3;
    return {
      from: new Date(y, q, 1),
      to: new Date(y, q + 3, 1),
      label: `T${Math.floor(m / 3) + 1} ${y}`,
    };
  }
  return { from: new Date(y, 0, 1), to: new Date(y + 1, 0, 1), label: String(y) };
}

function projectLocationLabel(
  address: string | null | undefined,
  city: string | null | undefined,
): string | null {
  const a = address?.trim() || "";
  const c = city?.trim() || "";
  if (a && c) {
    // Si la ville est déjà dans l’adresse, ne pas dupliquer une ville erronée seule.
    if (a.toLowerCase().includes(c.toLowerCase())) {
      const parts = a.split(/[·,]/).map((s) => s.trim()).filter(Boolean);
      return parts[parts.length - 1] || c;
    }
    return c;
  }
  if (c) return c;
  if (a) {
    const parts = a.split(/[·,]/).map((s) => s.trim()).filter(Boolean);
    return parts[parts.length - 1] || a;
  }
  return null;
}

/**
 * Source unique : état de contrôle achat (liste / KPI / drawer).
 */
export function getSupplierInvoiceControlState(input: {
  status: SupplierInvoiceStatus;
  kind: SupplierInvoiceKind;
  category: SupplierCostCategory;
  purchaseOrderId: string | null;
  varianceHt: number | null;
  orderedQty: number;
  receivedQty: number;
  hasReceipt: boolean;
}): {
  status: ExpenseControlStatus;
  label: string;
  needsControl: boolean;
  reasons: ExpenseControlReason[];
} {
  if (input.status === "CANCELLED") {
    return { status: "cancelled", label: "Annulée", needsControl: false, reasons: [] };
  }
  if (input.kind === "CREDIT") {
    return { status: "credit", label: "Avoir", needsControl: false, reasons: [] };
  }

  const reasons: ExpenseControlReason[] = [];
  if (input.category === "UNCLASSIFIED") reasons.push("unclassified");
  if (!input.purchaseOrderId) reasons.push("without_po");
  if (input.purchaseOrderId && input.orderedQty > 0.004 && !input.hasReceipt) {
    reasons.push("missing_receipt");
  }
  if (
    input.purchaseOrderId &&
    input.hasReceipt &&
    input.orderedQty > 0.004 &&
    input.receivedQty + 0.004 < input.orderedQty
  ) {
    reasons.push("partial_receipt");
  }
  if (input.varianceHt != null && Math.abs(input.varianceHt) > 0.004) {
    reasons.push("variance");
  }

  if (reasons.includes("unclassified")) {
    return {
      status: "unclassified",
      label: "À classer",
      needsControl: input.status === "RECORDED",
      reasons,
    };
  }
  if (reasons.includes("without_po")) {
    return {
      status: "without_po",
      label: "Sans commande",
      needsControl: input.status === "RECORDED",
      reasons,
    };
  }
  if (reasons.includes("missing_receipt")) {
    return {
      status: "missing_receipt",
      label: "Réception manquante",
      needsControl: input.status === "RECORDED",
      reasons,
    };
  }
  if (reasons.includes("variance")) {
    const sign = (input.varianceHt ?? 0) > 0 ? "+" : "";
    return {
      status: "to_verify",
      label: `Écart de ${sign}${Math.round(input.varianceHt ?? 0).toLocaleString("fr-FR")} €`,
      needsControl: input.status === "RECORDED",
      reasons,
    };
  }
  if (reasons.includes("partial_receipt")) {
    return {
      status: "to_verify",
      label: "Réception partielle",
      needsControl: input.status === "RECORDED",
      reasons,
    };
  }
  return { status: "coherent", label: "Conforme", needsControl: false, reasons: [] };
}

function buildSummary(
  periodRows: ExpenseListRow[],
  periodLabel: string,
): ExpensesWorkspaceSummary {
  let spentPeriodHt = 0;
  let actualCostHt = 0;
  let toControlCount = 0;
  let toControlHt = 0;
  let withoutPoCount = 0;
  let varianceCount = 0;
  let varianceAbsHt = 0;
  let unclassifiedCount = 0;
  let missingReceiptCount = 0;
  const suppliers = new Set<string>();
  const byCat = new Map<SupplierCostCategory, number>();
  const byProject = new Map<string, { title: string; ht: number }>();

  for (const r of periodRows) {
    if (r.status !== "RECORDED") continue;
    spentPeriodHt += r.signedHt;
    suppliers.add(r.supplierId);
    byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.signedHt);
    const pt = r.projectTitle ?? "Chantier";
    const cur = byProject.get(r.projectId) ?? { title: pt, ht: 0 };
    cur.ht += r.signedHt;
    byProject.set(r.projectId, cur);
    if (r.inProfitability) actualCostHt += r.signedHt;
    if (r.needsControl) {
      toControlCount += 1;
      toControlHt += Math.abs(r.signedHt);
    }
    if (!r.purchaseOrderId) withoutPoCount += 1;
    if (r.controlReasons.includes("variance")) {
      varianceCount += 1;
      varianceAbsHt += Math.abs(r.varianceHt ?? 0);
    }
    if (r.category === "UNCLASSIFIED") unclassifiedCount += 1;
    if (r.controlReasons.includes("missing_receipt")) missingReceiptCount += 1;
  }

  const totalAbs = Math.abs(spentPeriodHt) || 1;
  const categoryShares = (
    ["MATERIAL", "EQUIPMENT", "SUBCONTRACT", "OTHER", "UNCLASSIFIED"] as const
  )
    .map((key) => {
      const ht = roundMoney(byCat.get(key) ?? 0, 2);
      return {
        key,
        label:
          key === "UNCLASSIFIED"
            ? "À classer"
            : SUPPLIER_INVOICE_CATEGORY_LABELS[key],
        ht,
        pct: Math.round((Math.abs(ht) / totalAbs) * 100),
      };
    })
    .filter((c) => Math.abs(c.ht) > 0.004);

  const topProjects = [...byProject.entries()]
    .map(([projectId, v]) => ({
      projectId,
      title: v.title,
      ht: roundMoney(v.ht, 2),
    }))
    .sort((a, b) => Math.abs(b.ht) - Math.abs(a.ht))
    .slice(0, 5);

  return {
    periodLabel,
    periodDateFieldLabel: "Date facture",
    invoiceCount: periodRows.filter((r) => r.status === "RECORDED").length,
    spentPeriodHt: roundMoney(spentPeriodHt, 2),
    actualCostHt: roundMoney(actualCostHt, 2),
    toControlCount,
    toControlHt: roundMoney(toControlHt, 2),
    missingReceiptCount,
    withoutPoCount,
    varianceCount,
    varianceAbsHt: roundMoney(varianceAbsHt, 2),
    unclassifiedCount,
    supplierCount: suppliers.size,
    categoryShares,
    topProjects,
  };
}

export async function loadExpensesWorkspace(opts: {
  organizationId: string;
  take?: number;
  period?: ExpensesPeriod;
  projectId?: string | null;
  supplierId?: string | null;
  purchaseOrderId?: string | null;
  now?: Date;
}): Promise<{ rows: ExpenseListRow[]; summary: ExpensesWorkspaceSummary }> {
  const take = opts.take ?? 300;
  const now = opts.now ?? new Date();
  const period = opts.period ?? "month";
  const bounds = periodBounds(period, now);

  const rowsDb = await prisma.supplierInvoice.findMany({
    where: {
      organizationId: opts.organizationId,
      ...(opts.projectId ? { projectId: opts.projectId } : {}),
      ...(opts.supplierId ? { externalOrganizationId: opts.supplierId } : {}),
      ...(opts.purchaseOrderId ? { purchaseOrderId: opts.purchaseOrderId } : {}),
      ...(bounds.from || bounds.to
        ? {
            invoiceDate: {
              ...(bounds.from ? { gte: bounds.from } : {}),
              ...(bounds.to ? { lt: bounds.to } : {}),
            },
          }
        : {}),
    },
    select: {
      id: true,
      projectId: true,
      purchaseOrderId: true,
      externalOrganizationId: true,
      supplierNumber: true,
      kind: true,
      status: true,
      category: true,
      invoiceDate: true,
      amountHt: true,
      amountVat: true,
      amountTtc: true,
      notes: true,
      createdAt: true,
      project: {
        select: { id: true, title: true, siteCity: true, siteAddress: true },
      },
      externalOrganization: { select: { id: true, name: true, tradeName: true } },
      purchaseOrder: {
        select: {
          id: true,
          number: true,
          amountHt: true,
          lines: {
            select: { quantity: true, receivedQty: true },
          },
          receipts: {
            where: { cancelledAt: null },
            select: {
              id: true,
              documents: {
                where: { kind: "BL" },
                select: { id: true },
                take: 3,
              },
            },
          },
        },
      },
    },
    orderBy: [{ invoiceDate: "desc" }, { createdAt: "desc" }],
    take,
  });

  const rows: ExpenseListRow[] = rowsDb.map((row) => {
    const category = parseSupplierInvoiceCategory(row.category);
    const amountHt = roundMoney(d(row.amountHt), 2);
    const amountVat = roundMoney(d(row.amountVat), 2);
    const amountTtc = roundMoney(d(row.amountTtc), 2);
    const signedHt = signedSupplierInvoiceHt(row.kind, amountHt);
    const po = row.purchaseOrder;
    const orderAmountHt =
      po?.amountHt != null ? roundMoney(d(po.amountHt), 2) : null;
    const variance = computeInvoiceVariance(orderAmountHt, Math.abs(signedHt));
    const orderedQty = (po?.lines ?? []).reduce(
      (s, l) => s + Number(l.quantity),
      0,
    );
    const receivedQty = (po?.lines ?? []).reduce(
      (s, l) => s + Number(l.receivedQty ?? 0),
      0,
    );
    const hasReceipt = (po?.receipts.length ?? 0) > 0 || receivedQty > 0.004;
    const blCount = (po?.receipts ?? []).reduce(
      (s, r) => s + r.documents.length,
      0,
    );
    const fullyReceived =
      orderedQty > 0.004 && receivedQty + 0.004 >= orderedQty;
    const varianceHt = variance.varianceHt;
    const variancePercent =
      variance.orderHt != null &&
      Math.abs(variance.orderHt) > 0.004 &&
      varianceHt != null
        ? roundMoney((varianceHt / variance.orderHt) * 100, 1)
        : null;

    const control = getSupplierInvoiceControlState({
      status: row.status,
      kind: row.kind,
      category,
      purchaseOrderId: row.purchaseOrderId,
      varianceHt,
      orderedQty,
      receivedQty,
      hasReceipt,
    });

    const invoiceDate = row.invoiceDate.toISOString().slice(0, 10);
    const supplierName =
      row.externalOrganization.tradeName ||
      row.externalOrganization.name ||
      "Fournisseur";
    const projectLocation = projectLocationLabel(
      row.project?.siteAddress,
      row.project?.siteCity,
    );

    return {
      id: row.id,
      supplierNumber: row.supplierNumber,
      invoiceDate,
      createdAt: row.createdAt.toISOString(),
      kind: row.kind,
      kindLabel: SUPPLIER_INVOICE_KIND_LABELS[row.kind],
      status: row.status,
      statusLabel: SUPPLIER_INVOICE_STATUS_LABELS[row.status],
      category,
      categoryLabel:
        category === "UNCLASSIFIED"
          ? "À classer"
          : SUPPLIER_INVOICE_CATEGORY_LABELS[category],
      amountHt,
      amountVat,
      amountTtc,
      signedHt,
      notes: row.notes,
      supplierId: row.externalOrganizationId,
      supplierName,
      projectId: row.projectId,
      projectTitle: row.project?.title ?? null,
      projectCity: row.project?.siteCity ?? null,
      projectLocation,
      purchaseOrderId: row.purchaseOrderId,
      purchaseOrderNumber: po?.number ?? null,
      orderAmountHt,
      varianceHt,
      variancePercent,
      orderedQty,
      receivedQty,
      fullyReceived,
      hasReceipt,
      hasBl: blCount > 0,
      blCount,
      controlStatus: control.status,
      controlLabel: control.label,
      controlReasons: control.reasons,
      needsControl: control.needsControl,
      inProfitability: row.status === "RECORDED" && category !== "UNCLASSIFIED",
      profitabilityHref: `/dashboard/projets/${row.projectId}?tab=rentabilite`,
      documentsHref: `/dashboard/documents?q=${encodeURIComponent(row.supplierNumber)}`,
      purchaseOrderHref: row.purchaseOrderId
        ? `/dashboard/commandes/${row.purchaseOrderId}`
        : null,
      receiptHref: row.purchaseOrderId
        ? `/dashboard/commandes/${row.purchaseOrderId}?tab=reception`
        : null,
    };
  });

  // KPI = mêmes lignes (période déjà filtrée en requête).
  return {
    rows,
    summary: buildSummary(rows, bounds.label),
  };
}
