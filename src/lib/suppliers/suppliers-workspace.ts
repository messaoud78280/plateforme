/**
 * Fournisseurs V2 — projection liste + KPI (agrégations batch, sans N+1).
 * Réutilise ExternalOrganization + PurchaseOrder + SupplierInvoice.
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";
import { signedSupplierInvoiceHt } from "@/lib/chantier/supplier-invoices";

export const OPEN_PO_STATUSES = [
  "A_VALIDER",
  "VALIDEE",
  "ENVOYEE_FOURNISSEUR",
  "A_CONFIRMER",
  "CONFIRMEE",
  "LIVRAISON_PROGRAMMEE",
  "PARTIELLEMENT_RECUE",
] as const;

export type SuppliersPeriod = "month" | "quarter" | "year" | "last12" | "all";

export type SuppliersView =
  | "all"
  | "active"
  | "with_orders"
  | "with_deliveries"
  | "awaiting_confirm"
  | "incomplete";

export type SuppliersSort =
  | "name"
  | "active"
  | "last_order"
  | "committed"
  | "spent"
  | "confirm"
  | "deliveries"
  | "activity";

export type SupplierWorkspaceRow = {
  id: string;
  name: string;
  tradeName: string | null;
  displayName: string;
  initials: string;
  activity: string | null;
  city: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  siret: string | null;
  status: string;
  contactsCount: number;
  primaryContactName: string | null;
  openOrdersCount: number;
  committedHt: number;
  spentPeriodHt: number;
  awaitingConfirmCount: number;
  upcomingDeliveriesCount: number;
  nextDeliveryAt: string | null;
  nextDeliveryProject: string | null;
  nextDeliveryNumber: string | null;
  lastOrderAt: string | null;
  lastInvoiceAt: string | null;
  incompleteItems: string[];
  isIncomplete: boolean;
  hasOpenOrders: boolean;
  hasUpcomingDelivery: boolean;
};

export type SuppliersWorkspaceSummary = {
  periodLabel: string;
  activeCount: number;
  openOrdersCount: number;
  committedHt: number;
  spentPeriodHt: number;
  awaitingConfirmCount: number;
  upcomingDeliveriesCount: number;
  incompleteCount: number;
};

function periodBounds(period: SuppliersPeriod, now = new Date()): {
  from: Date | null;
  to: Date | null;
  label: string;
} {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (period === "all") return { from: null, to: null, label: "Toutes périodes" };
  if (period === "month") {
    return {
      from: new Date(y, m, 1),
      to: new Date(y, m + 1, 1),
      label: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    };
  }
  if (period === "quarter") {
    const q = Math.floor(m / 3) * 3;
    return {
      from: new Date(y, q, 1),
      to: new Date(y, q + 3, 1),
      label: `T${Math.floor(m / 3) + 1} ${y}`,
    };
  }
  if (period === "year") {
    return { from: new Date(y, 0, 1), to: new Date(y + 1, 0, 1), label: String(y) };
  }
  const from = new Date(now);
  from.setMonth(from.getMonth() - 12);
  from.setHours(0, 0, 0, 0);
  return { from, to: null, label: "12 derniers mois" };
}

function initials(name: string): string {
  const parts = name
    .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function incompleteOf(s: {
  contactsCount: number;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  siret: string | null;
  activity: string | null;
}): string[] {
  const missing: string[] = [];
  if (s.contactsCount === 0 && !s.phone && !s.email) missing.push("contact");
  if (!s.phone && !s.email) missing.push("coordonnées");
  if (!s.address && !s.city) missing.push("adresse");
  if (!s.siret) missing.push("SIRET");
  if (!s.activity) missing.push("activité");
  return missing;
}

export async function loadSuppliersWorkspace(opts: {
  organizationId: string;
  period?: SuppliersPeriod;
  take?: number;
  now?: Date;
}): Promise<{ rows: SupplierWorkspaceRow[]; summary: SuppliersWorkspaceSummary }> {
  const take = opts.take ?? 120;
  const now = opts.now ?? new Date();
  const period = opts.period ?? "month";
  const bounds = periodBounds(period, now);

  const suppliers = await prisma.externalOrganization.findMany({
    where: {
      hostOrganizationId: opts.organizationId,
      type: { in: ["SUPPLIER", "SUBCONTRACTOR"] },
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      activity: true,
      city: true,
      zipCode: true,
      phone: true,
      email: true,
      siret: true,
      address: true,
      status: true,
      updatedAt: true,
      _count: { select: { contacts: true } },
      contacts: {
        where: { isPrimary: true },
        take: 1,
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { name: "asc" },
    take,
  });

  const ids = suppliers.map((s) => s.id);
  if (ids.length === 0) {
    return {
      rows: [],
      summary: {
        periodLabel: bounds.label,
        activeCount: 0,
        openOrdersCount: 0,
        committedHt: 0,
        spentPeriodHt: 0,
        awaitingConfirmCount: 0,
        upcomingDeliveriesCount: 0,
        incompleteCount: 0,
      },
    };
  }

  const [openAgg, awaitingOrders, upcomingOrders, lastOrders, invoices] =
    await Promise.all([
      prisma.purchaseOrder.groupBy({
        by: ["externalOrganizationId"],
        where: {
          organizationId: opts.organizationId,
          externalOrganizationId: { in: ids },
          status: { in: [...OPEN_PO_STATUSES] },
        },
        _count: { _all: true },
        _sum: { amountHt: true },
      }),
      prisma.purchaseOrder.findMany({
        where: {
          organizationId: opts.organizationId,
          externalOrganizationId: { in: ids },
          status: { in: ["A_CONFIRMER", "ENVOYEE_FOURNISSEUR"] },
        },
        select: { id: true, externalOrganizationId: true, number: true },
      }),
      prisma.purchaseOrder.findMany({
        where: {
          organizationId: opts.organizationId,
          externalOrganizationId: { in: ids },
          status: {
            notIn: ["ANNULEE", "REFUSEE", "CLOTUREE", "RECUE", "BROUILLON"],
          },
          OR: [
            { confirmedDeliveryAt: { gte: now } },
            {
              confirmedDeliveryAt: null,
              requestedDeliveryAt: { gte: now },
            },
          ],
        },
        select: {
          externalOrganizationId: true,
          number: true,
          confirmedDeliveryAt: true,
          requestedDeliveryAt: true,
          project: { select: { title: true } },
        },
        orderBy: [{ confirmedDeliveryAt: "asc" }, { requestedDeliveryAt: "asc" }],
        take: 400,
      }),
      prisma.purchaseOrder.findMany({
        where: {
          organizationId: opts.organizationId,
          externalOrganizationId: { in: ids },
        },
        select: {
          externalOrganizationId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
      prisma.supplierInvoice.findMany({
        where: {
          organizationId: opts.organizationId,
          externalOrganizationId: { in: ids },
          status: "RECORDED",
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
          externalOrganizationId: true,
          amountHt: true,
          kind: true,
          invoiceDate: true,
        },
      }),
    ]);

  const openBy = new Map(
    openAgg.map((r) => [
      r.externalOrganizationId,
      {
        count: r._count._all,
        ht: roundMoney(d(r._sum.amountHt ?? 0), 2),
      },
    ]),
  );

  const awaitBy = new Map<string, number>();
  for (const o of awaitingOrders) {
    awaitBy.set(
      o.externalOrganizationId,
      (awaitBy.get(o.externalOrganizationId) ?? 0) + 1,
    );
  }

  const nextBy = new Map<
    string,
    { at: Date; project: string | null; number: string; count: number }
  >();
  for (const o of upcomingOrders) {
    const at = o.confirmedDeliveryAt ?? o.requestedDeliveryAt;
    if (!at) continue;
    const cur = nextBy.get(o.externalOrganizationId);
    if (!cur) {
      nextBy.set(o.externalOrganizationId, {
        at,
        project: o.project?.title ?? null,
        number: o.number,
        count: 1,
      });
    } else {
      cur.count += 1;
      if (at < cur.at) {
        cur.at = at;
        cur.project = o.project?.title ?? null;
        cur.number = o.number;
      }
    }
  }

  const lastOrderBy = new Map<string, Date>();
  for (const o of lastOrders) {
    if (!lastOrderBy.has(o.externalOrganizationId)) {
      lastOrderBy.set(o.externalOrganizationId, o.updatedAt);
    }
  }

  const spentBy = new Map<string, number>();
  const lastInvBy = new Map<string, Date>();
  for (const inv of invoices) {
    const signed = signedSupplierInvoiceHt(inv.kind, Number(inv.amountHt));
    spentBy.set(
      inv.externalOrganizationId,
      roundMoney((spentBy.get(inv.externalOrganizationId) ?? 0) + signed, 2),
    );
    const prev = lastInvBy.get(inv.externalOrganizationId);
    if (!prev || inv.invoiceDate > prev) {
      lastInvBy.set(inv.externalOrganizationId, inv.invoiceDate);
    }
  }

  const rows: SupplierWorkspaceRow[] = suppliers.map((s) => {
    const displayName = s.tradeName || s.name;
    const open = openBy.get(s.id) ?? { count: 0, ht: 0 };
    const awaiting = awaitBy.get(s.id) ?? 0;
    const next = nextBy.get(s.id);
    const incompleteItems = incompleteOf({
      contactsCount: s._count.contacts,
      phone: s.phone,
      email: s.email,
      address: s.address,
      city: s.city,
      siret: s.siret,
      activity: s.activity,
    });
    const primary = s.contacts[0];
    return {
      id: s.id,
      name: s.name,
      tradeName: s.tradeName,
      displayName,
      initials: initials(displayName),
      activity: s.activity,
      city: s.city,
      zipCode: s.zipCode,
      phone: s.phone,
      email: s.email,
      siret: s.siret,
      status: s.status,
      contactsCount: s._count.contacts,
      primaryContactName: primary
        ? `${primary.firstName} ${primary.lastName}`.trim()
        : null,
      openOrdersCount: open.count,
      committedHt: open.ht,
      spentPeriodHt: spentBy.get(s.id) ?? 0,
      awaitingConfirmCount: awaiting,
      upcomingDeliveriesCount: next?.count ?? 0,
      nextDeliveryAt: next?.at.toISOString() ?? null,
      nextDeliveryProject: next?.project ?? null,
      nextDeliveryNumber: next?.number ?? null,
      lastOrderAt: lastOrderBy.get(s.id)?.toISOString() ?? null,
      lastInvoiceAt: lastInvBy.get(s.id)?.toISOString() ?? null,
      incompleteItems,
      isIncomplete: incompleteItems.length >= 2,
      hasOpenOrders: open.count > 0,
      hasUpcomingDelivery: Boolean(next),
    };
  });

  let openOrdersCount = 0;
  let committedHt = 0;
  let spentPeriodHt = 0;
  let awaitingConfirmCount = 0;
  let upcomingDeliveriesCount = 0;
  let incompleteCount = 0;
  let activeCount = 0;
  for (const r of rows) {
    if (r.status === "ACTIVE") activeCount += 1;
    openOrdersCount += r.openOrdersCount;
    committedHt += r.committedHt;
    spentPeriodHt += r.spentPeriodHt;
    awaitingConfirmCount += r.awaitingConfirmCount;
    upcomingDeliveriesCount += r.upcomingDeliveriesCount;
    if (r.isIncomplete) incompleteCount += 1;
  }

  return {
    rows,
    summary: {
      periodLabel: bounds.label,
      activeCount,
      openOrdersCount,
      committedHt: roundMoney(committedHt, 2),
      spentPeriodHt: roundMoney(spentPeriodHt, 2),
      awaitingConfirmCount,
      upcomingDeliveriesCount,
      incompleteCount,
    },
  };
}

/** Perf légère pour fiche détail — uniquement faits objectifs. */
export async function loadSupplierPerformance(opts: {
  organizationId: string;
  supplierId: string;
}): Promise<{
  orderCount: number;
  committedTotalHt: number;
  spentTotalHt: number;
  onTimeLabel: string | null;
  onTimeDetail: string | null;
  anomalyLabel: string | null;
  sampleInsufficient: boolean;
}> {
  const orders = await prisma.purchaseOrder.findMany({
    where: {
      organizationId: opts.organizationId,
      externalOrganizationId: opts.supplierId,
      status: { notIn: ["ANNULEE", "REFUSEE", "BROUILLON"] },
    },
    select: {
      amountHt: true,
      requestedDeliveryAt: true,
      confirmedDeliveryAt: true,
      status: true,
      receipts: {
        where: { cancelledAt: null },
        select: {
          lines: {
            select: { damagedQty: true, refusedQty: true },
          },
        },
      },
    },
    take: 80,
  });

  const invoices = await prisma.supplierInvoice.findMany({
    where: {
      organizationId: opts.organizationId,
      externalOrganizationId: opts.supplierId,
      status: "RECORDED",
    },
    select: { amountHt: true, kind: true },
    take: 120,
  });

  const orderCount = orders.length;
  const committedTotalHt = roundMoney(
    orders.reduce((s, o) => s + Number(o.amountHt ?? 0), 0),
    2,
  );
  const spentTotalHt = roundMoney(
    invoices.reduce(
      (s, i) => s + signedSupplierInvoiceHt(i.kind, Number(i.amountHt)),
      0,
    ),
    2,
  );

  let onTime = 0;
  let timed = 0;
  for (const o of orders) {
    if (!o.requestedDeliveryAt || !o.confirmedDeliveryAt) continue;
    timed += 1;
    if (o.confirmedDeliveryAt.getTime() <= o.requestedDeliveryAt.getTime() + 86_400_000) {
      onTime += 1;
    }
  }

  let anomalies = 0;
  let receipts = 0;
  for (const o of orders) {
    for (const r of o.receipts) {
      receipts += 1;
      if (r.lines.some((l) => Number(l.damagedQty) > 0 || Number(l.refusedQty) > 0)) {
        anomalies += 1;
      }
    }
  }

  const sampleInsufficient = orderCount < 3;
  return {
    orderCount,
    committedTotalHt,
    spentTotalHt,
    onTimeLabel:
      !sampleInsufficient && timed >= 3
        ? `${Math.round((onTime / timed) * 100)} %`
        : null,
    onTimeDetail:
      timed >= 3 ? `${onTime} / ${timed} confirmations dans le délai demandé` : null,
    anomalyLabel:
      receipts >= 3 && anomalies > 0
        ? `${anomalies} anomalie${anomalies > 1 ? "s" : ""} sur ${receipts} réceptions`
        : receipts >= 3
          ? `0 anomalie sur ${receipts} réceptions`
          : null,
    sampleInsufficient,
  };
}
