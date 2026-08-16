/**
 * CONTRATS-ANNUELS-2 — Sync facture Commercial ↔ intervention annuelle.
 */
import { prisma } from "@/lib/prisma";

/** Après émission d’une facture : clôture A_FACTURER + billedAt. */
export async function onAnnualInvoiceIssued(opts: {
  orgId: string;
  invoiceId: string;
  actorUserId: string;
}): Promise<void> {
  const intervention = await prisma.annualServiceIntervention.findFirst({
    where: {
      organizationId: opts.orgId,
      commercialInvoiceId: opts.invoiceId,
      status: "COMPLETED",
    },
    select: { id: true, followUpSheetId: true },
  });
  if (!intervention) return;

  const now = new Date();
  await prisma.annualServiceIntervention.update({
    where: { id: intervention.id },
    data: { billedAt: now },
  });

  if (intervention.followUpSheetId) {
    const sheet = await prisma.followUpSheet.findFirst({
      where: {
        id: intervention.followUpSheetId,
        organizationId: opts.orgId,
        status: "A_FACTURER",
      },
      select: { id: true },
    });
    if (sheet) {
      await prisma.followUpSheet.update({
        where: { id: sheet.id },
        data: {
          status: "FACTURE",
          nextAction: "Facture commerciale émise",
          nextActionDone: true,
          urgencyOverride: null,
        },
      });
      await prisma.followUpTimelineEvent.create({
        data: {
          sheetId: sheet.id,
          authorId: opts.actorUserId,
          kind: "statut",
          label: "Facturée",
          detail: `Facture Commercial ${opts.invoiceId} émise depuis contrat annuel`,
        },
      });
    }
  }
}

/** DRAFT annulée/supprimée : revenir À facturer si aucune autre facture valide. */
export async function onAnnualInvoiceCancelledOrDeleted(opts: {
  orgId: string;
  invoiceId: string;
  actorUserId?: string;
}): Promise<void> {
  const intervention = await prisma.annualServiceIntervention.findFirst({
    where: {
      organizationId: opts.orgId,
      commercialInvoiceId: opts.invoiceId,
      status: "COMPLETED",
    },
    select: { id: true, followUpSheetId: true, billingNeededAt: true },
  });
  if (!intervention) return;

  await prisma.annualServiceIntervention.update({
    where: { id: intervention.id },
    data: {
      commercialInvoiceId: null,
      billedAt: null,
      billingNeededAt: intervention.billingNeededAt ?? new Date(),
    },
  });

  if (intervention.followUpSheetId) {
    await prisma.followUpSheet.updateMany({
      where: {
        id: intervention.followUpSheetId,
        organizationId: opts.orgId,
        status: { in: ["FACTURE", "ATTENTE_REGLEMENT", "TERMINE"] },
      },
      data: {
        status: "A_FACTURER",
        nextAction: "Préparer la facture",
        nextActionDone: false,
        urgencyOverride: "IMPORTANT",
      },
    });
  }
}
