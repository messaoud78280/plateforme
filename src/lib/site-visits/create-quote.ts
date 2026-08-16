/**
 * VISITES-METRES-1 — Créer / ouvrir CommercialQuote depuis une visite (idempotent).
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createQuote, addLineFromWorkItem } from "@/lib/commercial/quotes";
import { d } from "@/lib/commercial/decimal";
import { unitsCompatible } from "@/lib/site-visits/measurements";

export type CreateQuoteFromVisitResult = {
  action: "created" | "opened";
  quoteId: string;
  quoteNumber: string;
  href: string;
};

export async function createOrOpenQuoteFromVisit(opts: {
  organizationId: string;
  visitId: string;
  actorUserId: string;
}): Promise<CreateQuoteFromVisitResult> {
  const visit = await prisma.siteVisit.findFirst({
    where: { id: opts.visitId, organizationId: opts.organizationId },
    include: {
      commercialQuote: { select: { id: true, number: true } },
      measurements: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!visit) throw new Error("Visite introuvable");
  if (visit.status === "CANCELLED") throw new Error("Visite annulée");

  if (visit.commercialQuoteId && visit.commercialQuote) {
    return {
      action: "opened",
      quoteId: visit.commercialQuote.id,
      quoteNumber: visit.commercialQuote.number,
      href: `/dashboard/devis-facturation/devis/${visit.commercialQuote.id}?fromVisit=${visit.id}`,
    };
  }

  const dateLabel = visit.scheduledAt
    ? visit.scheduledAt.toLocaleDateString("fr-FR")
    : new Date().toLocaleDateString("fr-FR");

  const measureNotes = visit.measurements
    .map((m) => {
      const q = d(m.computedQuantity);
      return `- ${m.zone ? `${m.zone} — ` : ""}${m.label} : ${q} ${m.unit}`;
    })
    .join("\n");

  const clientSnapshotJson: Prisma.InputJsonValue = {
    name: visit.clientName,
    address: visit.siteAddress,
    phone: visit.contactPhone,
    contactName: visit.contactName,
  };

  const quote = await createQuote({
    orgId: opts.organizationId,
    userId: opts.actorUserId,
    subject: `Visite ${visit.siteName || visit.clientName} — ${dateLabel}`,
    clientExternalOrgId: visit.clientExternalOrgId,
    projectId: visit.projectId,
    responsibleId: visit.responsibleId,
    siteAddressSnapshot: visit.siteAddress,
    clientSnapshotJson,
    internalNotes: [
      `Origine : visite terrain ${visit.id}`,
      visit.clientNeed ? `Besoin client : ${visit.clientNeed}` : null,
      visit.comments ? `Notes : ${visit.comments}` : null,
      measureNotes ? `Avant-métré :\n${measureNotes}` : null,
      visit.estimatedCrewCount
        ? `Équipe estimée : ${visit.estimatedCrewCount}`
        : null,
      visit.estimatedDuration
        ? `Durée estimée : ${visit.estimatedDuration}`
        : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
    clientNotes: visit.clientNeed,
  });

  await prisma.siteVisit.update({
    where: { id: visit.id },
    data: {
      commercialQuoteId: quote.id,
      status: "TRANSMITTED",
    },
  });

  return {
    action: "created",
    quoteId: quote.id,
    quoteNumber: quote.number,
    href: `/dashboard/devis-facturation/devis/${quote.id}?fromVisit=${visit.id}`,
  };
}

/** Associe un relevé à un ouvrage bibliothèque → ligne devis (qty = métré). */
export async function addQuoteLineFromMeasurement(opts: {
  organizationId: string;
  visitId: string;
  quoteId: string;
  measurementId: string;
  workItemId: string;
  /** Forcer malgré unités différentes (décision chiffreur). */
  forceUnitMismatch?: boolean;
}) {
  const visit = await prisma.siteVisit.findFirst({
    where: { id: opts.visitId, organizationId: opts.organizationId },
    select: { id: true, commercialQuoteId: true },
  });
  if (!visit) throw new Error("Visite introuvable");
  if (visit.commercialQuoteId !== opts.quoteId) {
    throw new Error("Devis non lié à cette visite");
  }

  const measurement = await prisma.siteVisitMeasurement.findFirst({
    where: {
      id: opts.measurementId,
      visitId: visit.id,
      organizationId: opts.organizationId,
    },
  });
  if (!measurement) throw new Error("Relevé introuvable");

  const wi = await prisma.commercialWorkItem.findFirst({
    where: { id: opts.workItemId, organizationId: opts.organizationId },
    select: { id: true, saleUnit: true, name: true },
  });
  if (!wi) throw new Error("Ouvrage introuvable");

  if (
    !opts.forceUnitMismatch &&
    !unitsCompatible(measurement.unit, wi.saleUnit)
  ) {
    throw new Error(
      `Unités incompatibles : relevé ${measurement.unit} vs ouvrage ${wi.saleUnit}. Confirmer manuellement.`,
    );
  }

  const qty = d(measurement.computedQuantity);
  if (qty <= 0) throw new Error("Quantité relevé invalide");

  const line = await addLineFromWorkItem(opts.organizationId, opts.quoteId, {
    workItemId: wi.id,
    quantity: qty,
  });

  return {
    lineId: line.id,
    quantity: qty,
    unit: measurement.unit,
    workItemName: wi.name,
    measurementLabel: measurement.label,
  };
}
