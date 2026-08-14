/**
 * PILOTAGE-2 — Factures fournisseurs / dépenses réelles.
 * Aucune IA. Aucun OCR. Pas de comptabilité générale.
 *
 * Réel constaté :
 *   facture fournisseur RECORDED
 *   + réception valorisée UNIQUEMENT si le BC n’a aucune facture enregistrée.
 * Jamais facture + réception du même BC.
 */
import type { SupplierInvoiceKind, SupplierInvoiceStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";

export type SupplierCostCategory =
  | "MATERIAL"
  | "EQUIPMENT"
  | "SUBCONTRACT"
  | "OTHER"
  | "UNCLASSIFIED";

export const SUPPLIER_INVOICE_CATEGORY_LABELS: Record<SupplierCostCategory, string> = {
  MATERIAL: "Matériaux",
  EQUIPMENT: "Matériel",
  SUBCONTRACT: "Sous-traitance",
  OTHER: "Autres",
  UNCLASSIFIED: "Non classé",
};

export const SUPPLIER_INVOICE_CATEGORIES: SupplierCostCategory[] = [
  "MATERIAL",
  "EQUIPMENT",
  "SUBCONTRACT",
  "OTHER",
  "UNCLASSIFIED",
];


export const SUPPLIER_INVOICE_STATUS_LABELS: Record<SupplierInvoiceStatus, string> = {
  DRAFT: "Brouillon",
  RECORDED: "Enregistrée",
  CANCELLED: "Annulée",
};

export const SUPPLIER_INVOICE_KIND_LABELS: Record<SupplierInvoiceKind, string> = {
  STANDARD: "Facture",
  CREDIT: "Avoir",
};

export function isRecordedSupplierInvoice(status: string): boolean {
  return status === "RECORDED";
}

export function classifySupplierCostCategory(
  extType: string | null | undefined,
): SupplierCostCategory {
  if (extType === "SUBCONTRACTOR") return "SUBCONTRACT";
  return "UNCLASSIFIED";
}

export function parseSupplierInvoiceCategory(raw: unknown): SupplierCostCategory {
  const v = String(raw ?? "").trim();
  if ((SUPPLIER_INVOICE_CATEGORIES as string[]).includes(v)) {
    return v as SupplierCostCategory;
  }
  return "UNCLASSIFIED";
}

/**
 * Réel d’un BC : facture si elle existe, sinon réception.
 * Ne jamais additionner les deux.
 */
export function resolvePurchaseActualHt(input: {
  recordedInvoiceHt: number;
  hasRecordedInvoice: boolean;
  receiptHt: number;
}): { actualHt: number; source: "invoice" | "receipt" | "none" } {
  if (input.hasRecordedInvoice) {
    return {
      actualHt: roundMoney(input.recordedInvoiceHt, 2),
      source: "invoice",
    };
  }
  if (input.receiptHt > 0.004) {
    return { actualHt: roundMoney(input.receiptHt, 2), source: "receipt" };
  }
  return { actualHt: 0, source: "none" };
}

/** HT signé : STANDARD ajoute, CREDIT retranche. */
export function signedSupplierInvoiceHt(kind: string, amountHt: number): number {
  const abs = Math.abs(roundMoney(amountHt, 2));
  return kind === "CREDIT" ? roundMoney(-abs, 2) : abs;
}

export type SupplierInvoiceDto = {
  id: string;
  projectId: string;
  projectTitle: string | null;
  purchaseOrderId: string | null;
  purchaseOrderNumber: string | null;
  supplierId: string;
  supplierName: string | null;
  supplierNumber: string;
  kind: SupplierInvoiceKind;
  kindLabel: string;
  status: SupplierInvoiceStatus;
  statusLabel: string;
  category: SupplierCostCategory;
  categoryLabel: string;
  invoiceDate: string;
  amountHt: number;
  amountVat: number;
  amountTtc: number;
  signedHt: number;
  notes: string | null;
};

function mapDto(row: {
  id: string;
  projectId: string;
  purchaseOrderId: string | null;
  externalOrganizationId: string;
  supplierNumber: string;
  kind: SupplierInvoiceKind;
  status: SupplierInvoiceStatus;
  category: string;
  invoiceDate: Date;
  amountHt: unknown;
  amountVat: unknown;
  amountTtc: unknown;
  notes: string | null;
  project?: { title: string } | null;
  purchaseOrder?: { number: string } | null;
  externalOrganization?: { name: string; tradeName: string | null } | null;
}): SupplierInvoiceDto {
  const category = parseSupplierInvoiceCategory(row.category);
  const amountHt = roundMoney(d(row.amountHt), 2);
  return {
    id: row.id,
    projectId: row.projectId,
    projectTitle: row.project?.title ?? null,
    purchaseOrderId: row.purchaseOrderId,
    purchaseOrderNumber: row.purchaseOrder?.number ?? null,
    supplierId: row.externalOrganizationId,
    supplierName:
      row.externalOrganization?.tradeName ||
      row.externalOrganization?.name ||
      null,
    supplierNumber: row.supplierNumber,
    kind: row.kind,
    kindLabel: SUPPLIER_INVOICE_KIND_LABELS[row.kind],
    status: row.status,
    statusLabel: SUPPLIER_INVOICE_STATUS_LABELS[row.status],
    category,
    categoryLabel: SUPPLIER_INVOICE_CATEGORY_LABELS[category],
    invoiceDate: row.invoiceDate.toISOString().slice(0, 10),
    amountHt,
    amountVat: roundMoney(d(row.amountVat), 2),
    amountTtc: roundMoney(d(row.amountTtc), 2),
    signedHt: signedSupplierInvoiceHt(row.kind, amountHt),
    notes: row.notes,
  };
}

const detailSelect = {
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
  project: { select: { title: true } },
  purchaseOrder: { select: { number: true } },
  externalOrganization: { select: { name: true, tradeName: true } },
} as const;

export async function listSupplierInvoices(input: {
  orgId: string;
  projectId?: string;
  purchaseOrderId?: string;
}) {
  const rows = await prisma.supplierInvoice.findMany({
    where: {
      organizationId: input.orgId,
      ...(input.projectId ? { projectId: input.projectId } : {}),
      ...(input.purchaseOrderId ? { purchaseOrderId: input.purchaseOrderId } : {}),
    },
    select: detailSelect,
    orderBy: [{ invoiceDate: "desc" }, { createdAt: "desc" }],
    take: 120,
  });
  return rows.map(mapDto);
}

export async function createSupplierInvoice(input: {
  orgId: string;
  userId: string;
  projectId: string;
  purchaseOrderId?: string | null;
  externalOrganizationId: string;
  supplierNumber: string;
  kind?: SupplierInvoiceKind;
  category?: string;
  invoiceDate: Date;
  amountHt: number;
  amountVat?: number;
  amountTtc?: number;
  notes?: string | null;
}) {
  const supplierNumber = input.supplierNumber.trim();
  if (!supplierNumber) {
    throw Object.assign(new Error("N° de facture fournisseur requis"), {
      code: "NUMBER_REQUIRED",
    });
  }
  const amountHt = roundMoney(Math.abs(input.amountHt), 2);
  if (amountHt < 0.004) {
    throw Object.assign(new Error("Montant HT invalide"), { code: "AMOUNT" });
  }

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.orgId },
    select: { id: true },
  });
  if (!project) throw new Error("Chantier introuvable");

  const supplier = await prisma.externalOrganization.findFirst({
    where: {
      id: input.externalOrganizationId,
      hostOrganizationId: input.orgId,
    },
    select: { id: true, type: true },
  });
  if (!supplier) throw new Error("Fournisseur introuvable");

  let purchaseOrderId: string | null = input.purchaseOrderId ?? null;
  if (purchaseOrderId) {
    const po = await prisma.purchaseOrder.findFirst({
      where: {
        id: purchaseOrderId,
        organizationId: input.orgId,
      },
      select: {
        id: true,
        projectId: true,
        externalOrganizationId: true,
      },
    });
    if (!po) throw new Error("Commande introuvable");
    if (po.externalOrganizationId !== supplier.id) {
      throw new Error("Le fournisseur ne correspond pas à la commande");
    }
    if (po.projectId && po.projectId !== input.projectId) {
      throw new Error("La commande n’est pas rattachée à ce chantier");
    }
  }

  const kind: SupplierInvoiceKind = input.kind === "CREDIT" ? "CREDIT" : "STANDARD";
  const category = input.category
    ? parseSupplierInvoiceCategory(input.category)
    : classifySupplierCostCategory(supplier.type);
  const amountVat = roundMoney(Math.max(0, input.amountVat ?? 0), 2);
  const amountTtc =
    input.amountTtc != null && Number.isFinite(input.amountTtc)
      ? roundMoney(Math.abs(input.amountTtc), 2)
      : roundMoney(amountHt + amountVat, 2);

  try {
    const created = await prisma.supplierInvoice.create({
      data: {
        organizationId: input.orgId,
        projectId: input.projectId,
        purchaseOrderId,
        externalOrganizationId: supplier.id,
        supplierNumber,
        kind,
        status: "RECORDED",
        category,
        invoiceDate: input.invoiceDate,
        amountHt,
        amountVat,
        amountTtc,
        notes: input.notes?.trim() || null,
        createdById: input.userId,
      },
      select: detailSelect,
    });
    return mapDto(created);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const err = new Error(
        "Cette facture fournisseur est déjà enregistrée.",
      ) as Error & { code?: string };
      err.code = "DUPLICATE";
      throw err;
    }
    throw e;
  }
}

export async function cancelSupplierInvoice(input: {
  orgId: string;
  userId: string;
  id: string;
}) {
  const existing = await prisma.supplierInvoice.findFirst({
    where: { id: input.id, organizationId: input.orgId },
    select: { id: true, status: true },
  });
  if (!existing) throw new Error("Facture introuvable");
  if (existing.status === "CANCELLED") {
    const err = new Error("Cette facture est déjà annulée.") as Error & {
      code?: string;
    };
    err.code = "ALREADY_CANCELLED";
    throw err;
  }

  const updated = await prisma.supplierInvoice.update({
    where: { id: existing.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledById: input.userId,
    },
    select: detailSelect,
  });
  return mapDto(updated);
}
