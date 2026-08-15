/**
 * ECO-0 — Scénario économique SETRIM (seed + recette).
 * Aucune nouvelle connexion métier. Aucune automatisation manquante.
 */
import type { CommercialComponentType, PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEMO_SCENARIO, demoProjectTitleWhere } from "@/lib/demo-environment/scenario";
import {
  ECO0_MARK,
  ECO0_PAY_REFS,
  ECO0_QUOTE_NUMBER,
  ECO0_QUOTE_SUBJECT,
  EcoEnvironmentError,
  evaluateSetrimEcoGuard,
} from "@/lib/demo-environment/economic-scenario-guard";

export {
  ECO0_MARK,
  ECO0_PAY_REFS,
  ECO0_QUOTE_NUMBER,
  ECO0_QUOTE_SUBJECT,
  EcoEnvironmentError,
  evaluateSetrimEcoGuard,
  SETRIM_ECO_LOGIN_IDENTIFIERS,
} from "@/lib/demo-environment/economic-scenario-guard";
export type {
  DemoIdentityInput,
  EcoGuardResult,
} from "@/lib/demo-environment/economic-scenario-guard";
import { findOrCreateExternalOrganization } from "@/lib/equipe-acces/external-org";
import {
  createWorkItem,
  upsertWorkItemComponent,
} from "@/lib/commercial/library";
import {
  addLineFromWorkItem,
  createQuote,
  transitionQuoteStatus,
} from "@/lib/commercial/quotes";
import { acceptQuoteWithPdfArchive } from "@/lib/commercial/accepted-snapshot";
import {
  initializeProjectBudget,
  loadProjectProfitability,
  type ProjectProfitabilityDto,
} from "@/lib/chantier/project-profitability";
import {
  createProgressStatement,
  generateInvoiceFromProgressStatement,
  getProgressStatementDetail,
  updateProgressStatementLines,
  validateProgressStatement,
} from "@/lib/commercial/progress-statements";
import { issueInvoice, recordPayment } from "@/lib/commercial/invoices";
import { createPurchaseOrder } from "@/lib/purchase-orders/service";
import { createPurchaseOrderReceipt } from "@/lib/purchase-orders/receiving";
import { createSupplierInvoice } from "@/lib/chantier/supplier-invoices";
import { d } from "@/lib/commercial/decimal";

export const ECO0_WORK_ITEMS = [
  {
    reference: "ECO-0-ETANCHEITE",
    name: "Étanchéité terrasse inaccessible — ensemble",
    sellHt: 100_000,
    components: [
      { name: "Membrane / bitume", type: "MATERIAL" as const, unitCostHt: 40_000 },
      { name: "Main-d’œuvre étanchéité", type: "LABOR" as const, unitCostHt: 22_000 },
      { name: "Sous-traitance étanchéité", type: "SUBCONTRACT" as const, unitCostHt: 10_000 },
    ],
  },
  {
    reference: "ECO-0-ISOLATION",
    name: "Isolation thermique toiture-terrasse — ensemble",
    sellHt: 60_000,
    components: [
      { name: "Isolant", type: "MATERIAL" as const, unitCostHt: 28_000 },
      { name: "Main-d’œuvre isolation", type: "LABOR" as const, unitCostHt: 13_200 },
      { name: "Matériel isolation", type: "EQUIPMENT" as const, unitCostHt: 2_000 },
    ],
  },
  {
    reference: "ECO-0-COUVERTURE",
    name: "Couverture / accessoires — ensemble",
    sellHt: 50_000,
    components: [
      { name: "Accessoires couverture", type: "MATERIAL" as const, unitCostHt: 12_000 },
      { name: "Main-d’œuvre couverture", type: "LABOR" as const, unitCostHt: 13_200 },
      { name: "Matériel couverture", type: "EQUIPMENT" as const, unitCostHt: 8_000 },
      { name: "Sous-traitance couverture", type: "SUBCONTRACT" as const, unitCostHt: 2_800 },
    ],
  },
  {
    reference: "ECO-0-DIVERS",
    name: "Divers / sujétions chantier — ensemble",
    sellHt: 40_000,
    components: [
      { name: "Main-d’œuvre divers", type: "LABOR" as const, unitCostHt: 6_600 },
      { name: "Matériel divers", type: "EQUIPMENT" as const, unitCostHt: 5_000 },
      { name: "Sous-traitance divers", type: "SUBCONTRACT" as const, unitCostHt: 12_200 },
      { name: "Autres sujétions", type: "OTHER" as const, unitCostHt: 5_000 },
    ],
  },
] as const;

export const ECO0_POS = [
  {
    number: "BC-ECO-2026-101",
    subject: `${ECO0_MARK} Isolation Point.P — Les Lilas`,
    supplierKey: "pointp" as const,
    amountHt: 35_000,
    qty: 35,
    unitPriceHt: 1_000,
    designation: "Isolant toiture-terrasse",
    costCategory: "MATERIAL" as const,
    status: "LIVRAISON_PROGRAMMEE" as PurchaseOrderStatus,
    withDelivery: true,
    receipt: { receivedQty: 20, kind: "partial" as const },
    invoice: {
      supplierNumber: "FAC-ECO-PP-001",
      amountHt: 33_500,
      category: "MATERIAL",
    },
  },
  {
    number: "BC-ECO-2026-102",
    subject: `${ECO0_MARK} Membrane étanchéité — Les Lilas`,
    supplierKey: "membrane" as const,
    amountHt: 25_000,
    qty: 1,
    unitPriceHt: 25_000,
    designation: "Membrane étanchéité — ensemble",
    costCategory: "MATERIAL" as const,
    status: "LIVRAISON_PROGRAMMEE" as PurchaseOrderStatus,
    withDelivery: true,
    receipt: { receivedQty: 1, kind: "total" as const },
    invoice: {
      supplierNumber: "FAC-ECO-MEM-001",
      amountHt: 24_700,
      category: "MATERIAL",
    },
  },
  {
    number: "BC-ECO-2026-103",
    subject: `${ECO0_MARK} Location nacelle — Les Lilas`,
    supplierKey: "location" as const,
    amountHt: 8_000,
    qty: 1,
    unitPriceHt: 8_000,
    designation: "Location nacelle — 1 mois",
    costCategory: "EQUIPMENT" as const,
    status: "A_CONFIRMER" as PurchaseOrderStatus,
    withDelivery: false,
    receipt: null,
    invoice: {
      supplierNumber: "FAC-ECO-LOC-001",
      amountHt: 7_600,
      category: "EQUIPMENT",
    },
  },
] as const;

export type SetrimEcoContext = {
  organizationId: string;
  rootUserId: string;
  loginIdentifier: string;
  companyName: string | null;
};

export async function resolveSetrimDemoForEconomicSeed(): Promise<SetrimEcoContext> {
  const rows = await prisma.demoEnvironment.findMany({
    where: { status: "ACTIVE", organizationId: { not: null } },
    select: {
      loginIdentifier: true,
      organizationId: true,
      rootUserId: true,
      companyName: true,
      status: true,
    },
  });

  const accepted: SetrimEcoContext[] = [];
  for (const row of rows) {
    const guard = evaluateSetrimEcoGuard(row);
    if (!guard.ok) continue;
    if (!row.organizationId) continue;
    accepted.push({
      organizationId: row.organizationId,
      rootUserId: row.rootUserId,
      loginIdentifier: guard.loginIdentifier,
      companyName: row.companyName,
    });
  }

  if (accepted.length === 0) {
    throw new EcoEnvironmentError(
      "Aucune DemoEnvironment SETRIM active avec organizationId. Seed refusé.",
    );
  }
  if (accepted.length > 1) {
    throw new EcoEnvironmentError(
      `Plusieurs DemoEnvironment SETRIM actives (${accepted
        .map((a) => a.loginIdentifier)
        .join(", ")}) — refus, ne pas deviner.`,
    );
  }
  return accepted[0];
}

export type EcoSeedLog = {
  step: string;
  action: "created" | "reused" | "skipped" | "manual" | "info" | "warn";
  detail: string;
};

export type EcoSeedResult = {
  context: SetrimEcoContext;
  projectId: string;
  projectTitle: string;
  clientName: string;
  quoteId: string;
  quoteNumber: string;
  quoteStatus: string;
  budgetMode: "MANUEL" | "EXISTANT";
  budgetId: string | null;
  pdfArchived: boolean | null;
  pdfArchiveError: string | null;
  suppliers: { key: string; id: string; name: string }[];
  purchaseOrderIds: string[];
  receiptIds: string[];
  supplierInvoiceIds: string[];
  progressIds: string[];
  invoiceIds: string[];
  paymentIds: string[];
  preexistingPurchaseOrders: { number: string; amountHt: number; status: string }[];
  preexistingInvoices: { number: string; totalSellHt: number; status: string }[];
  logs: EcoSeedLog[];
  profitability: ProjectProfitabilityDto | null;
};

function log(
  logs: EcoSeedLog[],
  step: string,
  action: EcoSeedLog["action"],
  detail: string,
) {
  logs.push({ step, action, detail });
  const prefix =
    action === "warn" ? "!" : action === "created" ? "+" : action === "reused" ? "=" : "·";
  console.log(`  ${prefix} [${step}] ${detail}`);
}

async function findPrimaryProject(orgId: string) {
  return prisma.project.findFirst({
    where: {
      organizationId: orgId,
      ...demoProjectTitleWhere("primary"),
    },
    select: {
      id: true,
      title: true,
      siteAddress: true,
      siteCity: true,
      clientId: true,
      client: { select: { name: true, company: true } },
    },
  });
}

async function findClientExternalOrg(orgId: string) {
  const name = DEMO_SCENARIO.client.name;
  const existing = await prisma.externalOrganization.findFirst({
    where: {
      hostOrganizationId: orgId,
      type: { in: ["CLIENT_EXT", "CLIENT"] },
      OR: [
        { name: { contains: "Horizon Copro", mode: "insensitive" } },
        { name: { equals: name, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true },
  });
  if (existing) return existing;
  const id = await findOrCreateExternalOrganization({
    hostOrganizationId: orgId,
    name,
    personType: "CLIENT_EXT",
  });
  if (!id) throw new Error("Impossible de créer le client démo Horizon Copro");
  return { id, name };
}

async function findSupplier(
  orgId: string,
  tokens: string[],
  createName: string,
): Promise<{ id: string; name: string }> {
  const existing = await prisma.externalOrganization.findFirst({
    where: {
      hostOrganizationId: orgId,
      type: "SUPPLIER",
      OR: tokens.flatMap((t) => [
        { name: { contains: t, mode: "insensitive" } },
        { tradeName: { contains: t, mode: "insensitive" } },
      ]),
    },
    select: { id: true, name: true, tradeName: true },
  });
  if (existing) {
    return { id: existing.id, name: existing.tradeName || existing.name };
  }
  const id = await findOrCreateExternalOrganization({
    hostOrganizationId: orgId,
    name: createName,
    personType: "SUPPLIER",
  });
  if (!id) throw new Error(`Fournisseur démo introuvable : ${createName}`);
  return { id, name: createName };
}

async function ensureWorkItems(orgId: string, userId: string, logs: EcoSeedLog[]) {
  const ids: Record<string, string> = {};
  for (const spec of ECO0_WORK_ITEMS) {
    const existing = await prisma.commercialWorkItem.findFirst({
      where: { organizationId: orgId, reference: spec.reference },
      include: { components: { select: { id: true } } },
    });
    const item =
      existing ??
      (await createWorkItem(orgId, {
        name: spec.name,
        reference: spec.reference,
        family: "ECO-0",
        saleUnit: "ens",
        kind: "SIMPLE",
        unitSellHt: spec.sellHt,
        sellMode: "FIXED_SELL",
        createdById: userId,
      }).then((created) =>
        prisma.commercialWorkItem.findFirstOrThrow({
          where: { id: created.id },
          include: { components: { select: { id: true } } },
        }),
      ));
    if (!item) throw new Error(`Ouvrage ${spec.reference} introuvable après création`);
    if (!existing) {
      log(logs, "biblio", "created", `${spec.reference} — ${spec.sellHt} € HT`);
    } else {
      log(logs, "biblio", "reused", spec.reference);
    }
    if (item.components.length === 0) {
      for (const c of spec.components) {
        await upsertWorkItemComponent(orgId, item.id, {
          name: c.name,
          type: c.type as CommercialComponentType,
          quantityPerUnit: 1,
          unit: "ens",
          unitCostHt: c.unitCostHt,
        });
      }
      log(logs, "biblio", "created", `${spec.reference} — composition coûts`);
    }
    ids[spec.reference] = item.id;
  }
  return ids;
}

async function ensureQuote(opts: {
  orgId: string;
  userId: string;
  projectId: string;
  clientExternalOrgId: string;
  siteAddress: string | null;
  workItemIds: Record<string, string>;
  logs: EcoSeedLog[];
}) {
  let quote = await prisma.commercialQuote.findFirst({
    where: {
      organizationId: opts.orgId,
      OR: [
        { number: ECO0_QUOTE_NUMBER },
        { subject: { contains: ECO0_MARK } },
      ],
    },
    include: {
      currentVersion: { include: { lines: { select: { id: true, kind: true } } } },
    },
  });

  if (!quote) {
    const created = await createQuote({
      orgId: opts.orgId,
      userId: opts.userId,
      subject: ECO0_QUOTE_SUBJECT,
      clientExternalOrgId: opts.clientExternalOrgId,
      projectId: opts.projectId,
      siteAddressSnapshot: opts.siteAddress,
      paymentTerms: "30 jours",
      clientNotes: "Marché de référence ECO-0 — démo SETRIM. Données fictives.",
    });
    const taken = await prisma.commercialQuote.findFirst({
      where: { organizationId: opts.orgId, number: ECO0_QUOTE_NUMBER },
      select: { id: true },
    });
    quote = await prisma.commercialQuote.update({
      where: { id: created.id },
      data: taken ? {} : { number: ECO0_QUOTE_NUMBER },
      include: {
        currentVersion: { include: { lines: { select: { id: true, kind: true } } } },
      },
    });
    log(opts.logs, "devis", "created", `${quote.number} — ${ECO0_QUOTE_SUBJECT}`);
  } else {
    log(opts.logs, "devis", "reused", `${quote.number} (${quote.status})`);
  }

  if (!quote) throw new Error("Devis ECO-0 introuvable après création");

  const workLines = quote.currentVersion?.lines.filter((l) => l.kind === "WORK") ?? [];
  if (quote.status === "DRAFT" && workLines.length < ECO0_WORK_ITEMS.length) {
    for (const spec of ECO0_WORK_ITEMS) {
      const already = quote.currentVersion?.lines.length
        ? await prisma.commercialQuoteLine.findFirst({
            where: {
              versionId: quote.currentVersionId ?? undefined,
              reference: spec.reference,
            },
            select: { id: true },
          })
        : null;
      if (already) continue;
      await addLineFromWorkItem(opts.orgId, quote.id, {
        workItemId: opts.workItemIds[spec.reference],
        quantity: 1,
      });
    }
    log(opts.logs, "devis", "created", "4 lots bibliothèque → lignes devis");
  }

  return prisma.commercialQuote.findFirstOrThrow({
    where: { id: quote.id },
    select: {
      id: true,
      number: true,
      status: true,
      totalSellHt: true,
      acceptedVersionId: true,
      currentVersionId: true,
    },
  });
}

async function ensureAccepted(opts: {
  orgId: string;
  userId: string;
  quoteId: string;
  status: string;
  logs: EcoSeedLog[];
}) {
  if (opts.status === "ACCEPTED") {
    const snap = await prisma.commercialQuoteSnapshot.findFirst({
      where: { quoteId: opts.quoteId, organizationId: opts.orgId, kind: "ACCEPTED_PDF" },
      select: { id: true, storageKey: true },
    });
    log(
      opts.logs,
      "acceptation",
      "reused",
      snap
        ? `ACCEPTED — snapshot ${snap.id}`
        : "ACCEPTED — snapshot PDF éventuellement manquant (moteur existant)",
    );
    return { pdfArchived: Boolean(snap?.storageKey), pdfArchiveError: null as string | null };
  }

  if (opts.status === "DRAFT" || opts.status === "TO_VALIDATE" || opts.status === "VALIDATED") {
    await transitionQuoteStatus(opts.orgId, opts.quoteId, "SENT", opts.userId);
    log(opts.logs, "acceptation", "created", "DRAFT → SENT (workflow existant)");
  }

  const result = await acceptQuoteWithPdfArchive({
    orgId: opts.orgId,
    quoteId: opts.quoteId,
    actorUserId: opts.userId,
  });
  log(
    opts.logs,
    "acceptation",
    "created",
    result.pdfArchived
      ? "SENT → ACCEPTED + snapshot PDF"
      : `SENT → ACCEPTED — PDF : ${result.pdfArchiveError ?? "non archivé"}`,
  );
  return {
    pdfArchived: result.pdfArchived,
    pdfArchiveError: result.pdfArchiveError,
  };
}

async function ensureBudget(opts: {
  orgId: string;
  projectId: string;
  quoteId: string;
  userId: string;
  logs: EcoSeedLog[];
}): Promise<{ mode: "MANUEL" | "EXISTANT"; budgetId: string | null }> {
  const existing = await prisma.projectBudget.findUnique({
    where: { projectId: opts.projectId },
    select: { id: true, sourceQuoteId: true, sourceQuoteNumber: true, totalCostHt: true },
  });
  if (existing) {
    log(
      opts.logs,
      "budget",
      "reused",
      existing.sourceQuoteId === opts.quoteId
        ? `Budget déjà initialisé depuis ${existing.sourceQuoteNumber}`
        : `Budget existant depuis ${existing.sourceQuoteNumber} — NON écrasé (moteur refuse BUDGET_EXISTS)`,
    );
    return { mode: "EXISTANT", budgetId: existing.id };
  }

  try {
    const budget = await initializeProjectBudget({
      orgId: opts.orgId,
      projectId: opts.projectId,
      quoteId: opts.quoteId,
      userId: opts.userId,
    });
    log(
      opts.logs,
      "budget",
      "manual",
      `initializeProjectBudget reprise — ${d(budget.totalCostHt)} € coûts / ${d(budget.marketSellHt)} € CA`,
    );
    return { mode: "MANUEL", budgetId: budget.id };
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "BUDGET_EXISTS") {
      const again = await prisma.projectBudget.findUnique({
        where: { projectId: opts.projectId },
        select: { id: true },
      });
      log(opts.logs, "budget", "reused", "BUDGET_EXISTS");
      return { mode: "EXISTANT", budgetId: again?.id ?? null };
    }
    throw e;
  }
}

async function ensurePurchaseOrders(opts: {
  orgId: string;
  projectId: string;
  userId: string;
  suppliers: Record<"pointp" | "membrane" | "location", { id: string; name: string }>;
  deliveryAddress: string;
  logs: EcoSeedLog[];
}) {
  const ids: string[] = [];
  const deliveryAt = new Date("2026-09-08T07:30:00+02:00");

  for (const spec of ECO0_POS) {
    let po = await prisma.purchaseOrder.findFirst({
      where: {
        organizationId: opts.orgId,
        OR: [{ number: spec.number }, { subject: spec.subject }],
      },
      include: { lines: { select: { id: true, quantity: true } } },
    });
    if (!po) {
      const created = await createPurchaseOrder({
        organizationId: opts.orgId,
        subject: spec.subject,
        projectId: opts.projectId,
        externalOrganizationId: opts.suppliers[spec.supplierKey].id,
        requestedById: opts.userId,
        responsibleId: opts.userId,
        requestedDeliveryAt: spec.withDelivery ? deliveryAt : null,
        deliveryPlaceType: "CHANTIER",
        deliveryAddress: opts.deliveryAddress,
        status: spec.status,
        defaultCostCategory: spec.costCategory,
        lines: [
          {
            designation: spec.designation,
            quantity: spec.qty,
            unit: "U",
            unitPriceHt: spec.unitPriceHt,
            costCategory: spec.costCategory,
          },
        ],
      });
      const taken = await prisma.purchaseOrder.findFirst({
        where: { organizationId: opts.orgId, number: spec.number },
        select: { id: true },
      });
      if (!taken) {
        po = await prisma.purchaseOrder.update({
          where: { id: created.id },
          data: { number: spec.number },
          include: { lines: { select: { id: true, quantity: true } } },
        });
      } else {
        po = await prisma.purchaseOrder.findFirstOrThrow({
          where: { id: created.id },
          include: { lines: { select: { id: true, quantity: true } } },
        });
      }
      log(
        opts.logs,
        "commande",
        "created",
        `${po.number} — ${spec.amountHt} € HT — ${opts.suppliers[spec.supplierKey].name}`,
      );
    } else {
      log(opts.logs, "commande", "reused", `${po.number} (${po.status})`);
    }
    ids.push(po.id);
    await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: { defaultCostCategory: spec.costCategory },
    });
    await prisma.purchaseOrderLine.updateMany({
      where: { orderId: po.id },
      data: { costCategory: spec.costCategory },
    });
  }

  const membraneOps = await prisma.purchaseOrder.findFirst({
    where: { organizationId: opts.orgId, number: "BC-2026-043" },
    select: { id: true, projectId: true },
  });
  if (membraneOps && membraneOps.projectId === opts.projectId) {
    await prisma.purchaseOrder.update({
      where: { id: membraneOps.id },
      data: { defaultCostCategory: "MATERIAL" },
    });
    await prisma.purchaseOrderLine.updateMany({
      where: { orderId: membraneOps.id },
      data: { costCategory: "MATERIAL" },
    });
    log(
      opts.logs,
      "commande",
      "info",
      "BC-2026-043 classé MATERIAL (recette : membrane, pas le nom Point.P)",
    );
  }
  return ids;
}

async function ensureReceipts(opts: {
  orgId: string;
  userId: string;
  userName: string;
  logs: EcoSeedLog[];
}) {
  const ids: string[] = [];
  for (const spec of ECO0_POS) {
    if (!spec.receipt) continue;
    const po = await prisma.purchaseOrder.findFirst({
      where: { organizationId: opts.orgId, OR: [{ number: spec.number }, { subject: spec.subject }] },
      include: {
        lines: { select: { id: true } },
        receipts: { where: { cancelledAt: null }, select: { id: true } },
      },
    });
    if (!po?.lines[0]) continue;
    if (po.receipts.length > 0) {
      ids.push(po.receipts[0].id);
      log(opts.logs, "reception", "reused", `${po.number} — réception existante`);
      continue;
    }
    await createPurchaseOrderReceipt({
      organizationId: opts.orgId,
      orderId: po.id,
      receivedById: opts.userId,
      receivedByName: opts.userName,
      deliveryNoteNumber: `BL-ECO-${spec.number.slice(-3)}`,
      commentInternal: `ECO-0 réception ${spec.receipt.kind}`,
      lines: [
        {
          orderLineId: po.lines[0].id,
          receivedQty: spec.receipt.receivedQty,
          damagedQty: 0,
          refusedQty: 0,
        },
      ],
    });
    const created = await prisma.purchaseOrderReceipt.findFirst({
      where: { purchaseOrderId: po.id, cancelledAt: null },
      orderBy: { receivedAt: "desc" },
      select: { id: true },
    });
    if (created) ids.push(created.id);
    log(
      opts.logs,
      "reception",
      "created",
      `${po.number} — ${spec.receipt.kind} (${spec.receipt.receivedQty}/${spec.qty})`,
    );
  }
  return ids;
}

async function ensureSupplierInvoices(opts: {
  orgId: string;
  projectId: string;
  userId: string;
  suppliers: Record<"pointp" | "membrane" | "location", { id: string; name: string }>;
  logs: EcoSeedLog[];
}) {
  const ids: string[] = [];
  const invoiceDate = new Date("2026-09-10T00:00:00+02:00");
  for (const spec of ECO0_POS) {
    const existing = await prisma.supplierInvoice.findFirst({
      where: {
        organizationId: opts.orgId,
        supplierNumber: spec.invoice.supplierNumber,
      },
      select: { id: true },
    });
    if (existing) {
      ids.push(existing.id);
      log(opts.logs, "facture-fourn", "reused", spec.invoice.supplierNumber);
      continue;
    }
    const po = await prisma.purchaseOrder.findFirst({
      where: {
        organizationId: opts.orgId,
        OR: [{ number: spec.number }, { subject: spec.subject }],
      },
      select: { id: true },
    });
    const vat = Math.round(spec.invoice.amountHt * 0.2 * 100) / 100;
    const created = await createSupplierInvoice({
      orgId: opts.orgId,
      userId: opts.userId,
      projectId: opts.projectId,
      purchaseOrderId: po?.id ?? null,
      externalOrganizationId: opts.suppliers[spec.supplierKey].id,
      supplierNumber: spec.invoice.supplierNumber,
      category: spec.invoice.category,
      invoiceDate,
      amountHt: spec.invoice.amountHt,
      amountVat: vat,
      amountTtc: spec.invoice.amountHt + vat,
      notes: `${ECO0_MARK} saisie manuelle — aucune génération depuis réception`,
    });
    ids.push(created.id);
    log(
      opts.logs,
      "facture-fourn",
      "created",
      `${spec.invoice.supplierNumber} — ${spec.invoice.amountHt} € HT lié PO ${spec.number}`,
    );
  }
  return ids;
}

async function ensureProgressAndInvoices(opts: {
  orgId: string;
  userId: string;
  quoteId: string;
  logs: EcoSeedLog[];
}) {
  const progressIds: string[] = [];
  const invoiceIds: string[] = [];
  const paymentIds: string[] = [];

  for (const sit of [
    { number: 1, periodPercent: 30, payRef: ECO0_PAY_REFS.s1, payMode: "full" as const },
    { number: 2, periodPercent: 30, payRef: ECO0_PAY_REFS.s2, payMode: "partial" as const },
  ]) {
    let statement = await prisma.commercialProgressStatement.findFirst({
      where: { organizationId: opts.orgId, quoteId: opts.quoteId, number: sit.number },
      select: { id: true, status: true },
    });
    if (!statement) {
      const created = await createProgressStatement({
        orgId: opts.orgId,
        userId: opts.userId,
        quoteId: opts.quoteId,
      });
      statement = { id: created.id, status: created.status };
      log(opts.logs, "situation", "created", `Situation n°${sit.number} brouillon`);
    } else {
      log(opts.logs, "situation", "reused", `Situation n°${sit.number} (${statement.status})`);
    }
    progressIds.push(statement.id);

    if (statement.status === "DRAFT") {
      const detail = await getProgressStatementDetail(opts.orgId, statement.id);
      if (!detail) throw new Error("Situation introuvable après création");
      await updateProgressStatementLines({
        orgId: opts.orgId,
        statementId: statement.id,
        lines: detail.lines.map((l) => ({
          id: l.id,
          periodPercent: sit.periodPercent,
          inputMode: "percent" as const,
        })),
      });
      await validateProgressStatement({
        orgId: opts.orgId,
        userId: opts.userId,
        statementId: statement.id,
      });
      log(opts.logs, "situation", "created", `Situation n°${sit.number} validée à +${sit.periodPercent} %`);
    }

    let invoice = await prisma.commercialInvoice.findFirst({
      where: { organizationId: opts.orgId, progressStatementId: statement.id },
      select: { id: true, status: true, totalTtc: true, amountPaid: true, number: true },
    });
    if (!invoice) {
      const generated = await generateInvoiceFromProgressStatement({
        orgId: opts.orgId,
        userId: opts.userId,
        statementId: statement.id,
      });
      invoice = await prisma.commercialInvoice.findFirstOrThrow({
        where: { id: generated.id },
        select: { id: true, status: true, totalTtc: true, amountPaid: true, number: true },
      });
      log(opts.logs, "facture-client", "created", `${invoice.number} depuis situation n°${sit.number}`);
    } else {
      log(opts.logs, "facture-client", "reused", `${invoice.number} (${invoice.status})`);
    }
    invoiceIds.push(invoice.id);

    if (invoice.status === "DRAFT") {
      await issueInvoice(opts.orgId, invoice.id, opts.userId);
      invoice = await prisma.commercialInvoice.findFirstOrThrow({
        where: { id: invoice.id },
        select: { id: true, status: true, totalTtc: true, amountPaid: true, number: true },
      });
      log(opts.logs, "facture-client", "created", `${invoice.number} émise`);
    }

    const existingPay = await prisma.commercialPayment.findFirst({
      where: {
        organizationId: opts.orgId,
        invoiceId: invoice.id,
        reference: sit.payRef,
        cancelledAt: null,
      },
      select: { id: true },
    });
    if (existingPay) {
      paymentIds.push(existingPay.id);
      log(opts.logs, "encaissement", "reused", sit.payRef);
      continue;
    }
    const totalTtc = d(invoice.totalTtc);
    const alreadyPaid = d(invoice.amountPaid);
    const remaining = Math.max(0, totalTtc - alreadyPaid);
    if (remaining < 0.004) {
      log(opts.logs, "encaissement", "skipped", `${invoice.number} déjà soldée`);
      continue;
    }
    const amount =
      sit.payMode === "full"
        ? remaining
        : Math.min(remaining, Math.round(totalTtc * 0.5 * 100) / 100);
    const pay = await recordPayment({
      orgId: opts.orgId,
      invoiceId: invoice.id,
      userId: opts.userId,
      amount,
      method: "VIREMENT",
      reference: sit.payRef,
      comment: sit.payMode === "full" ? "ECO-0 encaissement total" : "ECO-0 encaissement partiel",
    });
    paymentIds.push(pay.id);
    log(
      opts.logs,
      "encaissement",
      "created",
      `${sit.payRef} — ${amount} € TTC (${sit.payMode})`,
    );
  }

  return { progressIds, invoiceIds, paymentIds };
}

export async function runSetrimEconomicScenario(): Promise<EcoSeedResult> {
  const context = await resolveSetrimDemoForEconomicSeed();
  const logs: EcoSeedLog[] = [];
  log(
    logs,
    "env",
    "info",
    `SETRIM ${context.loginIdentifier} / org ${context.organizationId}`,
  );

  const project = await findPrimaryProject(context.organizationId);
  if (!project) {
    throw new EcoEnvironmentError(
      "Chantier primaire SETRIM (Les Lilas / Victor Hugo) introuvable. Seed refusé — pas de chantier inventé.",
    );
  }
  log(logs, "chantier", "reused", project.title);

  const actor = await prisma.user.findUnique({
    where: { id: context.rootUserId },
    select: { id: true, name: true },
  });
  const userName = actor?.name?.trim() || "Direction SETRIM";

  const client = await findClientExternalOrg(context.organizationId);
  log(logs, "client", "reused", client.name);

  const pointp = await findSupplier(
    context.organizationId,
    ["Point.P", "POINT.P"],
    "Point.P",
  );
  const membrane = await findSupplier(
    context.organizationId,
    ["Soprema"],
    "Soprema Distribution",
  );
  const location = await findSupplier(
    context.organizationId,
    ["Kiloutou"],
    "Kiloutou",
  );
  const suppliers = { pointp, membrane, location };
  log(logs, "fournisseurs", "info", `${pointp.name} · ${membrane.name} · ${location.name}`);

  const preexistingPurchaseOrders = (
    await prisma.purchaseOrder.findMany({
      where: { organizationId: context.organizationId, projectId: project.id },
      select: { number: true, amountHt: true, status: true, subject: true },
    })
  )
    .filter((p) => !p.subject.includes(ECO0_MARK) && !p.number.startsWith("BC-ECO-"))
    .map((p) => ({
      number: p.number,
      amountHt: p.amountHt != null ? d(p.amountHt) : 0,
      status: p.status,
    }));
  if (preexistingPurchaseOrders.length) {
    log(
      logs,
      "chantier",
      "warn",
      `PO opérationnels préexistants : ${preexistingPurchaseOrders
        .map((p) => `${p.number} ${p.amountHt}€`)
        .join(", ")} — le moteur les agrège`,
    );
  }

  const preexistingInvoices = (
    await prisma.commercialInvoice.findMany({
      where: {
        organizationId: context.organizationId,
        projectId: project.id,
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      select: { number: true, totalSellHt: true, status: true, progressStatement: { select: { quote: { select: { number: true } } } } },
    })
  )
    .filter((inv) => inv.progressStatement?.quote.number !== ECO0_QUOTE_NUMBER)
    .map((inv) => ({
      number: inv.number,
      totalSellHt: d(inv.totalSellHt),
      status: inv.status,
    }));
  if (preexistingInvoices.length) {
    log(
      logs,
      "chantier",
      "warn",
      `Factures client préexistantes : ${preexistingInvoices
        .map((i) => `${i.number} ${i.totalSellHt}€`)
        .join(", ")}`,
    );
  }

  const workItemIds = await ensureWorkItems(context.organizationId, context.rootUserId, logs);
  const siteAddress = [project.siteAddress, project.siteCity].filter(Boolean).join(", ") || null;
  const quote = await ensureQuote({
    orgId: context.organizationId,
    userId: context.rootUserId,
    projectId: project.id,
    clientExternalOrgId: client.id,
    siteAddress,
    workItemIds,
    logs,
  });
  const accept = await ensureAccepted({
    orgId: context.organizationId,
    userId: context.rootUserId,
    quoteId: quote.id,
    status: quote.status,
    logs,
  });
  const budget = await ensureBudget({
    orgId: context.organizationId,
    projectId: project.id,
    quoteId: quote.id,
    userId: context.rootUserId,
    logs,
  });
  const purchaseOrderIds = await ensurePurchaseOrders({
    orgId: context.organizationId,
    projectId: project.id,
    userId: context.rootUserId,
    suppliers,
    deliveryAddress: siteAddress || "18 rue des Lilas, Aubervilliers",
    logs,
  });
  const receiptIds = await ensureReceipts({
    orgId: context.organizationId,
    userId: context.rootUserId,
    userName,
    logs,
  });
  const supplierInvoiceIds = await ensureSupplierInvoices({
    orgId: context.organizationId,
    projectId: project.id,
    userId: context.rootUserId,
    suppliers,
    logs,
  });
  const commercial = await ensureProgressAndInvoices({
    orgId: context.organizationId,
    userId: context.rootUserId,
    quoteId: quote.id,
    logs,
  });

  const profitability = await loadProjectProfitability(context.organizationId, project.id);
  log(
    logs,
    "rentabilite",
    "info",
    profitability
      ? `CA prévu ${profitability.commercial.marketSellHt} · engagé ${profitability.committedTotalHt} · réel ${profitability.actualTotalHt} · facturé ${profitability.commercial.invoicedHt} · encaissé ${profitability.commercial.collectedTtc}`
      : "loadProjectProfitability a renvoyé null",
  );

  const freshQuote = await prisma.commercialQuote.findFirstOrThrow({
    where: { id: quote.id },
    select: { number: true, status: true },
  });

  return {
    context,
    projectId: project.id,
    projectTitle: project.title,
    clientName: client.name,
    quoteId: quote.id,
    quoteNumber: freshQuote.number,
    quoteStatus: freshQuote.status,
    budgetMode: budget.mode,
    budgetId: budget.budgetId,
    pdfArchived: accept.pdfArchived,
    pdfArchiveError: accept.pdfArchiveError,
    suppliers: [
      { key: "pointp", id: pointp.id, name: pointp.name },
      { key: "membrane", id: membrane.id, name: membrane.name },
      { key: "location", id: location.id, name: location.name },
    ],
    purchaseOrderIds,
    receiptIds,
    supplierInvoiceIds,
    progressIds: commercial.progressIds,
    invoiceIds: commercial.invoiceIds,
    paymentIds: commercial.paymentIds,
    preexistingPurchaseOrders,
    preexistingInvoices,
    logs,
    profitability,
  };
}

export function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function cat(
  p: ProjectProfitabilityDto | null,
  key: string,
): { plannedHt: number; committedHt: number; actualHt: number | null } | null {
  return p?.categories.find((c) => c.key === key) ?? null;
}

export function formatEco0MarkdownReport(result: EcoSeedResult): string {
  const p = result.profitability;
  const labor = cat(p, "LABOR");
  const material = cat(p, "MATERIAL");
  const sub = cat(p, "SUBCONTRACT");
  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push("# ECO-0 — Scénario économique SETRIM");
  push("");
  push("## Scénario");
  push("");
  push(`* chantier : ${result.projectTitle}`);
  push(`* client : ${result.clientName}`);
  push(`* marché HT : ${money(p?.commercial.marketSellHt ?? p?.budget?.marketSellHt)}`);
  push(
    `* fournisseurs : ${result.suppliers.map((s) => s.name).join(" · ")}`,
  );
  push(`* devis : ${result.quoteNumber} (${result.quoteStatus})`);
  push(
    `* budget : ${result.budgetMode === "MANUEL" ? "initialisé manuellement (API existante)" : "déjà présent — non écrasé"}`,
  );
  push(`* commandes ECO-0 : ${result.purchaseOrderIds.length}`);
  push(`* réceptions ECO-0 : ${result.receiptIds.length}`);
  push(`* factures fournisseurs ECO-0 : ${result.supplierInvoiceIds.length}`);
  push(`* situations : ${result.progressIds.length}`);
  push(`* factures clients : ${result.invoiceIds.length}`);
  push(`* paiements : ${result.paymentIds.length}`);
  if (result.preexistingPurchaseOrders.length) {
    push(
      `* PO opérationnels préexistants (agrégés par le moteur) : ${result.preexistingPurchaseOrders
        .map((o) => `${o.number} ${money(o.amountHt)} ${o.status}`)
        .join(" · ")}`,
    );
  }
  if (result.preexistingInvoices.length) {
    push(
      `* factures client préexistantes (agrégées) : ${result.preexistingInvoices
        .map((i) => `${i.number} ${money(i.totalSellHt)}`)
        .join(" · ")}`,
    );
  }
  push("");
  push("## Seed");
  push("");
  push("* script : `scripts/seed-setrim-economic-scenario.ts`");
  push("* environnement protégé : OUI (loginIdentifier SETRIM + platformKey setrim + organizationId)");
  push("* idempotent x2 : à confirmer par la 2ᵉ exécution");
  push(`* snapshot PDF : ${result.pdfArchived ? "oui" : result.pdfArchiveError ?? "non / à finaliser"}`);
  push("");
  push("## Chaîne commerciale");
  push("");
  push("| Étape                      | Connexion | Automatique / manuel / absent |");
  push("| -------------------------- | --------- | ----------------------------- |");
  push("| Bibliothèque → Devis       | addLineFromWorkItem | MANUEL MAIS SUPPORTÉ |");
  push("| Devis → Acceptation        | acceptQuoteWithPdfArchive | MANUEL MAIS SUPPORTÉ |");
  push("| Acceptation → Budget       | tryInitializeProjectBudgetAfterAccept → initializeProjectBudget | AUTOMATIQUE |");
  push("| Budget → Rentabilité       | loadProjectProfitability | AUTOMATIQUE (lecture) |");
  push("| Situation → Facture        | generateInvoiceFromProgressStatement | MANUEL MAIS SUPPORTÉ |");
  push("| Facture → Encaissement     | recordPayment | MANUEL MAIS SUPPORTÉ |");
  push("| Encaissement → Rentabilité | commercial.collectedTtc | AUTOMATIQUE (lecture) |");
  push("");
  push("## Chaîne achats");
  push("");
  push("| Étape                       | Connexion | Automatique / manuel / absent |");
  push("| --------------------------- | --------- | ----------------------------- |");
  push("| Commande → Livraison        | syncPurchaseOrderDeliveryEvent si date | AUTOMATIQUE |");
  push("| Livraison → Réception       | createPurchaseOrderReceipt | MANUEL MAIS SUPPORTÉ |");
  push("| Réception → SupplierInvoice | préparer facture (formulaire prérempli, enregistrement manuel) | MANUEL MAIS SUPPORTÉ |");
  push("| SupplierInvoice → coût réel | status RECORDED | AUTOMATIQUE |");
  push("| Commande → engagé           | statuts COMMITTED dès A_CONFIRMER | AUTOMATIQUE |");
  push("| Coûts → Rentabilité         | loadProjectProfitability | AUTOMATIQUE (lecture) |");
  push("");
  push("## Vérité économique calculée");
  push("");
  push("| Indicateur        | Valeur | Source | Fiable |");
  push("| ----------------- | -----: | ------ | ------ |");
  push(
    `| CA prévu          | ${money(p?.commercial.marketSellHt)} | ${p?.budget ? "ProjectBudget.marketSellHt" : "somme devis ACCEPTED"} | ${p?.budget ? "oui" : "partiel"} |`,
  );
  push(
    `| Budget initial    | ${money(p?.budget?.totalCostHt)} | ProjectBudget.totalCostHt | ${p?.budget ? "oui" : "non"} |`,
  );
  push(
    `| Engagé            | ${money(p?.committedTotalHt)} | PurchaseOrder lignes (costCategory) | oui |`,
  );
  push(
    `| Coût réel connu   | ${money(p?.actualTotalHt)} | SupplierInvoice RECORDED, sinon réception (anti-double-comptage) | partiel |`,
  );
  push(
    `| Coût MO réel      | ${money(labor?.actualHt)} | LABOR actualHt forcé null | non — actualIncomplete |`,
  );
  push(
    `| Facturé           | ${money(p?.commercial.invoicedHt)} | CommercialInvoice hors DRAFT/CANCELLED | oui |`,
  );
  push(
    `| Encaissé          | ${money(p?.commercial.collectedTtc)} | CommercialPayment (TTC) | oui |`,
  );
  push(
    `| Reste à encaisser | ${money(p?.commercial.remainingToCollectTtc)} | invoice.amountDue | oui |`,
  );
  push(
    `| Marge prévue      | ${money(p?.budget?.plannedMarginHt)} (${p?.budget?.plannedMarginPercent ?? "—"} %) | ProjectBudget | ${p?.budget ? "oui" : "non"} |`,
  );
  push(
    `| Marge actuelle    | ${money(p?.estimatedMarginHt)} (${p?.estimatedMarginPercent ?? "—"} %) | marketSell − forecast(max prévu/engagé/réel par cat.) | ${(p?.categories.find((c) => c.key === "UNCLASSIFIED")?.committedHt ?? 0) > 0.004 ? "partiel — engagements à classer" : "oui"} |`,
  );
  push("");
  push("### Détail catégories moteur");
  push("");
  if (p) {
    for (const c of p.categories) {
      push(
        `* ${c.label} : prévu ${money(c.plannedHt)} · engagé ${money(c.committedHt)} · réel ${money(c.actualHt)} · forecast ${money(c.forecastHt)}`,
      );
    }
    push(`* actualIncomplete : ${p.actualIncomplete}`);
    push(`* santé : ${p.healthLabel} (dérive ${p.driftPoints} pts)`);
    push(`* réel matériaux : ${money(material?.actualHt)}`);
    push(`* réel sous-traitance : ${money(sub?.actualHt)}`);
  } else {
    push("* moteur : non chargé");
  }
  push("");
  return lines.join("\n");
}
