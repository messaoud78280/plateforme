/**
 * ECO-2 — Préparation d’une facture fournisseur depuis un BC / une réception.
 * Aucune IA. Aucun OCR. Ne crée pas de facture. Ne touche pas au réel.
 */
import { roundMoney } from "@/lib/commercial/money";
import { lineTotalHt } from "@/lib/purchase-orders/totals";
import {
  derivePurchaseOrderInvoiceCategory,
  PURCHASE_COST_CATEGORY_LABELS,
  resolvePurchaseLineCostCategory,
  type SupplierCostCategory,
} from "@/lib/purchase-orders/cost-category";
import {
  isRecordedSupplierInvoice,
  signedSupplierInvoiceHt,
} from "@/lib/chantier/supplier-invoices";

export type PrefillLineInput = {
  designation: string;
  quantity: number;
  unit?: string | null;
  unitPriceHt?: number | null;
  costCategory?: string | null;
  receivedConforming?: number | null;
  hasMaterialRequirement?: boolean;
};

export type SupplierInvoicePrefill = {
  supplierId: string;
  supplierName: string | null;
  projectId: string;
  projectTitle: string | null;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  category: SupplierCostCategory;
  categoryKnown: boolean;
  categoryLabel: string;
  mixedCategories: boolean;
  orderAmountHt: number | null;
  receivedAmountHt: number | null;
  hasReceipt: boolean;
  receivedQty: number;
  orderedQty: number;
  lines: Array<{
    designation: string;
    orderedQty: number;
    receivedQty: number;
    unit: string;
    unitPriceHt: number | null;
    theoreticalHt: number | null;
    category: SupplierCostCategory;
  }>;
};

export function computeReceivedTheoreticalHt(
  lines: Array<{
    unitPriceHt?: number | null;
    receivedConforming?: number | null;
  }>,
): number | null {
  let sum = 0;
  let any = false;
  for (const line of lines) {
    const qty = Number(line.receivedConforming ?? 0);
    if (qty <= 0) continue;
    const ht = lineTotalHt({
      quantity: qty,
      unitPriceHt: line.unitPriceHt ?? null,
    });
    if (ht == null) continue;
    any = true;
    sum = roundMoney(sum + ht, 2);
  }
  return any ? sum : null;
}

export function buildSupplierInvoicePrefill(input: {
  supplierId: string;
  supplierName?: string | null;
  projectId: string;
  projectTitle?: string | null;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  orderAmountHt?: number | null;
  defaultCostCategory?: string | null;
  lines: PrefillLineInput[];
}): SupplierInvoicePrefill {
  const mapped = input.lines.map((line) => {
    const orderedQty = Number(line.quantity) || 0;
    const receivedQty = Math.max(0, Number(line.receivedConforming ?? 0) || 0);
    const category = resolvePurchaseLineCostCategory({
      costCategory: line.costCategory,
      hasMaterialRequirement: Boolean(line.hasMaterialRequirement),
      defaultCostCategory: input.defaultCostCategory,
    });
    const theoreticalHt = lineTotalHt({
      quantity: receivedQty > 0 ? receivedQty : orderedQty,
      unitPriceHt: line.unitPriceHt ?? null,
    });
    return {
      designation: line.designation,
      orderedQty,
      receivedQty,
      unit: line.unit?.trim() || "U",
      unitPriceHt: line.unitPriceHt ?? null,
      theoreticalHt,
      category,
    };
  });

  const category = derivePurchaseOrderInvoiceCategory({
    lines: input.lines.map((line) => ({
      quantity: Number(line.quantity) || 0,
      unitPriceHt: line.unitPriceHt ?? null,
      costCategory: line.costCategory,
      hasMaterialRequirement: Boolean(line.hasMaterialRequirement),
    })),
    defaultCostCategory: input.defaultCostCategory,
  });
  const used = new Set(
    mapped
      .filter((l) => l.category !== "UNCLASSIFIED")
      .map((l) => l.category),
  );
  const mixedCategories = used.size > 1;
  const receivedAmountHt = computeReceivedTheoreticalHt(
    input.lines.map((line) => ({
      unitPriceHt: line.unitPriceHt,
      receivedConforming: line.receivedConforming,
    })),
  );
  const receivedQty = mapped.reduce((s, l) => s + l.receivedQty, 0);
  const orderedQty = mapped.reduce((s, l) => s + l.orderedQty, 0);
  const orderAmountHt =
    input.orderAmountHt != null && Number.isFinite(Number(input.orderAmountHt))
      ? roundMoney(Number(input.orderAmountHt), 2)
      : null;

  return {
    supplierId: input.supplierId,
    supplierName: input.supplierName ?? null,
    projectId: input.projectId,
    projectTitle: input.projectTitle ?? null,
    purchaseOrderId: input.purchaseOrderId,
    purchaseOrderNumber: input.purchaseOrderNumber,
    category,
    categoryKnown: category !== "UNCLASSIFIED" && !mixedCategories,
    categoryLabel: PURCHASE_COST_CATEGORY_LABELS[category],
    mixedCategories,
    orderAmountHt,
    receivedAmountHt,
    hasReceipt: receivedQty > 0.0004,
    receivedQty,
    orderedQty,
    lines: mapped,
  };
}

export function computeInvoiceVariance(
  orderHt: number | null,
  invoiceHt: number,
): {
  orderHt: number | null;
  invoiceHt: number;
  varianceHt: number | null;
  overOrder: boolean;
} {
  const invoice = roundMoney(Math.abs(invoiceHt), 2);
  if (orderHt == null || !Number.isFinite(orderHt)) {
    return { orderHt: null, invoiceHt: invoice, varianceHt: null, overOrder: false };
  }
  const order = roundMoney(orderHt, 2);
  const varianceHt = roundMoney(invoice - order, 2);
  return {
    orderHt: order,
    invoiceHt: invoice,
    varianceHt,
    overOrder: varianceHt > 0.004,
  };
}

export function summarizePoSupplierBilling(input: {
  orderHt?: number | null;
  invoices: Array<{ kind: string; amountHt: number; status: string }>;
}): {
  invoicedHt: number;
  remainingHt: number | null;
  invoiceCount: number;
} {
  const recorded = input.invoices.filter((inv) => isRecordedSupplierInvoice(inv.status));
  const invoicedHt = roundMoney(
    recorded.reduce(
      (s, inv) => s + signedSupplierInvoiceHt(inv.kind, inv.amountHt),
      0,
    ),
    2,
  );
  const orderHt =
    input.orderHt != null && Number.isFinite(Number(input.orderHt))
      ? roundMoney(Number(input.orderHt), 2)
      : null;
  return {
    invoicedHt,
    remainingHt: orderHt == null ? null : roundMoney(orderHt - invoicedHt, 2),
    invoiceCount: recorded.length,
  };
}
