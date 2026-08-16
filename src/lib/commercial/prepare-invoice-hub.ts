/**
 * COMMERCIAL-INVOICE-FIX — sources réellement facturables pour le hub « Préparer ».
 * Aucun montant inventé : lecture Prisma + moteurs existants uniquement.
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { buildPrepareBillingHref } from "@/lib/facturation/prepare-billing";
import { isBillingPipelineStatus } from "@/lib/facturation/types";

export type PrepareInvoiceSource =
  | {
      kind: "situation";
      id: string;
      title: string;
      clientName: string | null;
      siteLabel: string | null;
      amountHt: number | null;
      amountLabel: string;
      href: string;
      action: "open" | "invoice";
      meta: string;
    }
  | {
      kind: "annual";
      id: string;
      title: string;
      clientName: string | null;
      siteLabel: string | null;
      amountHt: number | null;
      amountLabel: string;
      href: string;
      action: "prepare-annual";
      meta: string;
    }
  | {
      kind: "followup";
      id: string;
      title: string;
      clientName: string | null;
      siteLabel: string | null;
      amountHt: number | null;
      amountLabel: string;
      href: string;
      action: "open";
      meta: string;
    };

function moneyFr(n: number) {
  return `${n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} € HT`;
}

export async function loadPrepareInvoiceSources(orgId: string): Promise<{
  sources: PrepareInvoiceSource[];
  defaultVatRate: number;
  defaultCurrency: string;
}> {
  const [settings, situations, annuals, sheets] = await Promise.all([
    prisma.commercialOrgSettings.findUnique({
      where: { organizationId: orgId },
      select: { defaultVatRate: true, defaultCurrency: true },
    }),
    prisma.commercialProgressStatement.findMany({
      where: {
        organizationId: orgId,
        status: "VALIDATED",
        invoice: null,
      },
      select: {
        id: true,
        number: true,
        label: true,
        periodSellHt: true,
        quote: {
          select: {
            number: true,
            subject: true,
            project: { select: { title: true } },
            clientExternalOrg: { select: { name: true, tradeName: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
    }),
    prisma.annualServiceIntervention.findMany({
      where: {
        organizationId: orgId,
        status: "COMPLETED",
        OR: [
          { commercialInvoiceId: null },
          { commercialInvoice: { status: "DRAFT" } },
        ],
      },
      select: {
        id: true,
        plannedDate: true,
        completedAt: true,
        commercialInvoiceId: true,
        followUpSheetId: true,
        commercialInvoice: { select: { id: true, status: true, number: true } },
        contract: {
          select: {
            id: true,
            clientName: true,
            siteAddress: true,
            amountHt: true,
            contractType: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
      take: 25,
    }),
    prisma.followUpSheet.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["A_FACTURER", "TRAVAUX_TERMINES"] },
      },
      select: {
        id: true,
        title: true,
        status: true,
        clientName: true,
        projectId: true,
        project: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
    }),
  ]);

  const sources: PrepareInvoiceSource[] = [];

  for (const s of situations) {
    const ht = d(s.periodSellHt);
    const client =
      s.quote.clientExternalOrg?.tradeName ||
      s.quote.clientExternalOrg?.name ||
      null;
    sources.push({
      kind: "situation",
      id: s.id,
      title: s.quote.project?.title || s.quote.subject || `Situation ${s.number}`,
      clientName: client,
      siteLabel: s.quote.project?.title ?? null,
      amountHt: ht,
      amountLabel: moneyFr(ht),
      href: `/dashboard/devis-facturation/situations/${s.id}`,
      action: "invoice",
      meta: `Situation n°${s.number} validée · ${s.label} · marché ${s.quote.number}`,
    });
  }

  const linkedSheetIds = new Set<string>();
  for (const a of annuals) {
    const ht = d(a.contract.amountHt);
    const draft = a.commercialInvoice?.status === "DRAFT" ? a.commercialInvoice : null;
    if (a.followUpSheetId) linkedSheetIds.add(a.followUpSheetId);
    sources.push({
      kind: "annual",
      id: a.id,
      title: `${a.contract.clientName} — ${a.contract.contractType || "CE"}`,
      clientName: a.contract.clientName,
      siteLabel: a.contract.siteAddress,
      amountHt: ht,
      amountLabel: moneyFr(ht),
      href: draft
        ? `/dashboard/devis-facturation/factures/${draft.id}`
        : `/api/annual-contracts/interventions/${a.id}/prepare-invoice`,
      action: "prepare-annual",
      meta: draft
        ? `Continuer le brouillon ${draft.number}`
        : "Intervention annuelle réalisée",
    });
  }

  for (const sheet of sheets) {
    if (!isBillingPipelineStatus(sheet.status)) continue;
    if (linkedSheetIds.has(sheet.id)) continue;
    const projectId = sheet.projectId ?? sheet.project?.id ?? null;
    const href = projectId
      ? buildPrepareBillingHref({
          projectId,
          sheetId: sheet.id,
        })
      : `/dashboard/fiches-suivi/${sheet.id}`;
    sources.push({
      kind: "followup",
      id: sheet.id,
      title: sheet.title,
      clientName: sheet.clientName,
      siteLabel: sheet.project?.title ?? null,
      amountHt: null,
      amountLabel: "Montant via moteur Commercial",
      href,
      action: "open",
      meta:
        sheet.status === "A_FACTURER"
          ? "Fiche À facturer (ECO-4)"
          : "Travaux terminés — préparer la facturation",
    });
  }

  return {
    sources,
    defaultVatRate: settings ? d(settings.defaultVatRate) : 20,
    defaultCurrency: settings?.defaultCurrency ?? "EUR",
  };
}
