/**
 * COMMERCIAL-WORKSPACE-2 — actions « À faire » dashboard (déterministe).
 */
import type { CommercialQuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";
import { listCollectionsInvoices } from "@/lib/commercial/collections";
import {
  loadCommercialDashboardKpis,
  type CommercialDashboardKpis,
} from "@/lib/commercial/dashboard-kpis";

export type CommercialTodoItem = {
  id: string;
  kind: "quote_relance" | "invoice_draft" | "invoice_overdue" | "a_facturer";
  title: string;
  client: string | null;
  reference: string;
  amountLabel: string | null;
  reason: string;
  href: string;
};

export type CommercialDashboardBundle = CommercialDashboardKpis & {
  /** HT facturé ce mois (factures émises, hors CREDIT). */
  factureMoisHt: number;
  todos: CommercialTodoItem[];
  recentInvoices: Array<{
    id: string;
    number: string;
    status: string;
    totalTtc: number;
    clientName: string | null;
    issueDate: string | null;
  }>;
};

function clientName(org: { name: string | null; tradeName: string | null } | null | undefined) {
  return org?.tradeName || org?.name || null;
}

export async function loadCommercialDashboardBundle(
  orgId: string,
): Promise<CommercialDashboardBundle> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const relanceBefore = new Date(now);
  relanceBefore.setDate(relanceBefore.getDate() - 7);

  const [kpis, factureAgg, quotesRelance, draftInvoices, overdue, recentInvoices] =
    await Promise.all([
      loadCommercialDashboardKpis(orgId),
      prisma.commercialInvoice.aggregate({
        where: {
          organizationId: orgId,
          type: { not: "CREDIT" },
          status: { in: ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"] },
          issueDate: { gte: monthStart },
        },
        _sum: { totalSellHt: true },
      }),
      prisma.commercialQuote.findMany({
        where: {
          organizationId: orgId,
          status: { in: ["SENT", "VIEWED"] satisfies CommercialQuoteStatus[] },
          OR: [
            { sentAt: { lte: relanceBefore } },
            { AND: [{ sentAt: null }, { updatedAt: { lte: relanceBefore } }] },
          ],
        },
        orderBy: { updatedAt: "asc" },
        take: 3,
        select: {
          id: true,
          number: true,
          totalSellHt: true,
          status: true,
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
        },
        orderBy: { updatedAt: "desc" },
        take: 2,
        select: {
          id: true,
          number: true,
          totalTtc: true,
          clientExternalOrg: { select: { name: true, tradeName: true } },
        },
      }),
      listCollectionsInvoices(orgId, { filter: "overdue" }),
      prisma.commercialInvoice.findMany({
        where: { organizationId: orgId, type: { not: "CREDIT" } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          number: true,
          status: true,
          totalTtc: true,
          issueDate: true,
          clientExternalOrg: { select: { name: true, tradeName: true } },
        },
      }),
    ]);

  const todos: CommercialTodoItem[] = [];

  for (const q of quotesRelance) {
    const days = Math.max(
      0,
      Math.floor(
        (now.getTime() - (q.sentAt ?? q.updatedAt).getTime()) / 86400000,
      ),
    );
    todos.push({
      id: `qr:${q.id}`,
      kind: "quote_relance",
      title: "Devis à relancer",
      client: clientName(q.clientExternalOrg),
      reference: q.number,
      amountLabel: `${roundMoney(d(q.totalSellHt), 0).toLocaleString("fr-FR")} € HT`,
      reason: `Envoyé il y a ${days} j — en attente client`,
      href: `/dashboard/devis-facturation/devis/${q.id}`,
    });
  }

  for (const inv of draftInvoices) {
    todos.push({
      id: `id:${inv.id}`,
      kind: "invoice_draft",
      title: "Facture à finaliser",
      client: clientName(inv.clientExternalOrg),
      reference: inv.number,
      amountLabel: `${roundMoney(d(inv.totalTtc), 0).toLocaleString("fr-FR")} € TTC`,
      reason: "Brouillon — à émettre",
      href: `/dashboard/devis-facturation/factures/${inv.id}`,
    });
  }

  for (const row of overdue.slice(0, 2)) {
    todos.push({
      id: `io:${row.id}`,
      kind: "invoice_overdue",
      title: "Facture impayée",
      client: row.clientName,
      reference: row.number,
      amountLabel: `${roundMoney(row.amountDue, 0).toLocaleString("fr-FR")} € TTC`,
      reason: `${row.daysLate} j de retard`,
      href: `/dashboard/devis-facturation/factures/${row.id}`,
    });
  }

  return {
    ...kpis,
    factureMoisHt: roundMoney(d(factureAgg._sum.totalSellHt), 2),
    todos: todos.slice(0, 5),
    recentInvoices: recentInvoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      totalTtc: d(inv.totalTtc),
      clientName: clientName(inv.clientExternalOrg),
      issueDate: inv.issueDate?.toISOString() ?? null,
    })),
  };
}
