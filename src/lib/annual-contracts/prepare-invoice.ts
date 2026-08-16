/**
 * CONTRATS-ANNUELS-2 — Préparer / retrouver une CommercialInvoice DRAFT
 * depuis une intervention annuelle (sans faux chantier).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createStandardInvoice } from "@/lib/commercial/invoices";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";
import { d } from "@/lib/commercial/decimal";
import { canViewAnnualContractFinancials } from "@/lib/annual-contracts/access";

export type PrepareAnnualInvoiceResult = {
  action: "created" | "continue" | "view";
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  href: string;
};

function invoiceHref(invoiceId: string): string {
  return `/dashboard/devis-facturation/factures/${invoiceId}`;
}

function formatDateFr(date: Date): string {
  return date.toLocaleDateString("fr-FR", { timeZone: "UTC" });
}

export function canPrepareAnnualInvoice(user: {
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
}): boolean {
  return canViewAnnualContractFinancials(user);
}

async function buildIssuerSnapshot(orgId: string): Promise<Prisma.InputJsonValue> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      name: true,
      siret: true,
      demoEnvironment: { select: { logoUrl: true, companyName: true } },
      owner: {
        select: {
          company: true,
          phone: true,
          email: true,
          billingAddressLine1: true,
          billingAddressLine2: true,
          billingCity: true,
          billingPostalCode: true,
          billingCountry: true,
          formeJuridique: true,
        },
      },
    },
  });
  const owner = org?.owner;
  return {
    name: org?.name ?? org?.demoEnvironment?.companyName ?? owner?.company ?? "Entreprise",
    siret: org?.siret ?? null,
    formeJuridique: owner?.formeJuridique ?? null,
    email: owner?.email ?? null,
    phone: owner?.phone ?? null,
    addressLine1: owner?.billingAddressLine1 ?? null,
    addressLine2: owner?.billingAddressLine2 ?? null,
    city: owner?.billingCity ?? null,
    postalCode: owner?.billingPostalCode ?? null,
    country: owner?.billingCountry ?? "France",
    logoPath: org?.demoEnvironment?.logoUrl?.trim() || null,
  };
}

export async function prepareAnnualInterventionInvoice(opts: {
  organizationId: string;
  interventionId: string;
  actorUserId: string;
}): Promise<PrepareAnnualInvoiceResult> {
  const intervention = await prisma.annualServiceIntervention.findFirst({
    where: {
      id: opts.interventionId,
      organizationId: opts.organizationId,
      status: "COMPLETED",
    },
    include: {
      contract: true,
      commercialInvoice: {
        select: { id: true, number: true, status: true },
      },
    },
  });
  if (!intervention) {
    throw new Error("Intervention réalisée introuvable");
  }

  // Idempotence : facture déjà liée
  if (intervention.commercialInvoiceId) {
    const inv = intervention.commercialInvoice;
    if (!inv || inv.status === "CANCELLED") {
      const { onAnnualInvoiceCancelledOrDeleted } = await import(
        "@/lib/annual-contracts/sync-invoice-status"
      );
      await onAnnualInvoiceCancelledOrDeleted({
        orgId: opts.organizationId,
        invoiceId: intervention.commercialInvoiceId,
        actorUserId: opts.actorUserId,
      });
    } else if (inv.status === "DRAFT") {
      return {
        action: "continue",
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        status: inv.status,
        href: invoiceHref(inv.id),
      };
    } else {
      return {
        action: "view",
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        status: inv.status,
        href: invoiceHref(inv.id),
      };
    }
  }

  const settings = await ensureCommercialOrgSettings(opts.organizationId);
  const vatRate = d(settings.defaultVatRate);
  const amountHt = Number(intervention.contract.amountHt);
  const completed =
    intervention.completedAt ?? intervention.plannedDate;
  const year = intervention.plannedDate.getUTCFullYear();
  const clientName = intervention.contract.clientName;
  const siteAddress = intervention.contract.siteAddress;
  const contractType = intervention.contract.contractType || "CE";

  const designation = `Intervention annuelle contrat ${contractType} — ${clientName}`;
  const description = `Intervention annuelle réalisée le ${formatDateFr(completed)} — ${siteAddress}`;
  const subject = `Contrat annuel ${contractType} ${year} — ${clientName}`;

  const clientSnapshotJson: Prisma.InputJsonValue = {
    name: clientName,
    addressLine1: siteAddress,
    city: null,
    postalCode: null,
    country: "France",
  };

  const issuerSnapshotJson = await buildIssuerSnapshot(opts.organizationId);

  // Pas de faux chantier : uniquement un projectId réel déjà lié au contrat, sinon null.
  const invoice = await createStandardInvoice({
    orgId: opts.organizationId,
    userId: opts.actorUserId,
    subject,
    projectId: intervention.contract.projectId ?? null,
    clientSnapshotJson,
    issuerSnapshotJson,
    lines: [
      {
        designation,
        description,
        quantity: 1,
        unit: "U",
        unitSellHt: amountHt,
        vatRate,
      },
    ],
  });

  await prisma.annualServiceIntervention.update({
    where: { id: intervention.id },
    data: { commercialInvoiceId: invoice.id },
  });

  if (intervention.followUpSheetId) {
    await prisma.followUpSheet.updateMany({
      where: {
        id: intervention.followUpSheetId,
        organizationId: opts.organizationId,
        status: "A_FACTURER",
      },
      data: {
        nextAction: "Continuer la facture",
      },
    });
    await prisma.followUpTimelineEvent.create({
      data: {
        sheetId: intervention.followUpSheetId,
        authorId: opts.actorUserId,
        kind: "action",
        label: "Facture préparée",
        detail: `Brouillon ${invoice.number} créé depuis le contrat annuel`,
      },
    });
  }

  return {
    action: "created",
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    status: invoice.status,
    href: invoiceHref(invoice.id),
  };
}
