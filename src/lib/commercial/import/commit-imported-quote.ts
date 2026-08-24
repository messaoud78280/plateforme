/**
 * Commit d’un ImportedQuoteDraft → CommercialQuote DRAFT (moteur existant).
 */
import type { Prisma } from "@prisma/client";
import {
  createQuote,
  addSection,
  upsertLine,
  updateSectionTitle,
} from "@/lib/commercial/quotes";
import { prisma } from "@/lib/prisma";
import {
  createCommercialClientFromImport,
} from "@/lib/commercial/import/match-client";
import type { ImportedQuoteDraft } from "@/lib/commercial/import/types";
import {
  normalizeScheduleForStorage,
  type PaymentSchedule,
} from "@/lib/commercial/payment-schedule";

function buildSchedule(percents: number[]): PaymentSchedule | null {
  if (percents.length < 2) return null;
  const lines = percents.map((percent, i) => {
    const type =
      i === 0 ? ("DEPOSIT" as const) : i === percents.length - 1 ? ("FINAL" as const) : ("PROGRESS" as const);
    const label =
      type === "DEPOSIT"
        ? "Acompte à la commande"
        : type === "FINAL"
          ? "Solde"
          : "Situation intermédiaire";
    return { type, percent, label, sortOrder: i };
  });
  return normalizeScheduleForStorage({ basis: "TTC", lines });
}

export async function commitImportedQuote(opts: {
  orgId: string;
  userId: string;
  draft: ImportedQuoteDraft;
  clientExternalOrgId?: string | null;
  createClientIfMissing?: boolean;
  projectId?: string | null;
}): Promise<{ quoteId: string; quoteNumber: string; href: string }> {
  const draft = opts.draft;
  if (draft.source.scannedPdf) {
    throw new Error(
      "PDF numérisé : l’import automatique n’est pas disponible. Conservez le fichier ou saisissez le devis manuellement.",
    );
  }

  let clientId = opts.clientExternalOrgId ?? null;
  if (!clientId && opts.createClientIfMissing !== false && draft.customer.name) {
    const created = await createCommercialClientFromImport({
      orgId: opts.orgId,
      customer: draft.customer,
    });
    clientId = created.id;
  }

  const subject =
    draft.subject?.trim() ||
    (draft.reference
      ? `Import devis ${draft.reference}`
      : `Import ${draft.source.fileName}`);

  const schedule = draft.paymentSchedule
    ? buildSchedule(draft.paymentSchedule.percents)
    : null;

  const siteAddress = [
    draft.customer.addressLine1,
    [draft.customer.postalCode, draft.customer.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const noteParts = [
    `Importé depuis ${draft.source.fileName}`,
    draft.reference ? `Réf. d’origine : ${draft.reference}` : null,
    draft.source.sha256 ? `importHash:${draft.source.sha256}` : null,
    draft.source.storageKey ? `storageKey:${draft.source.storageKey}` : null,
    draft.issuer.note,
    draft.flags.bonPourAccordMention
      ? "Mention « Bon pour accord » détectée dans le document — statut laissé en brouillon."
      : null,
  ].filter(Boolean);

  const clientSnapshotJson: Prisma.InputJsonValue | null = draft.customer.name
    ? {
        name: draft.customer.name,
        email: draft.customer.email,
        phone: draft.customer.phone,
        addressLine1: draft.customer.addressLine1,
        postalCode: draft.customer.postalCode,
        city: draft.customer.city,
      }
    : null;

  const quote = await createQuote({
    orgId: opts.orgId,
    userId: opts.userId,
    subject,
    clientExternalOrgId: clientId,
    projectId: opts.projectId ?? null,
    siteAddressSnapshot: siteAddress || null,
    paymentScheduleJson: schedule,
    internalNotes: noteParts.join("\n"),
    clientSnapshotJson: clientId ? undefined : clientSnapshotJson,
  });

  // Date historique
  if (draft.issueDate) {
    const d = new Date(`${draft.issueDate}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      await prisma.commercialQuote.update({
        where: { id: quote.id },
        data: { issueDate: d },
      });
    }
  }

  const version = await prisma.commercialQuoteVersion.findFirst({
    where: { quoteId: quote.id, organizationId: opts.orgId },
    orderBy: { versionNumber: "asc" },
    select: {
      id: true,
      sections: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true } },
    },
  });
  if (!version) throw new Error("Version devis introuvable après création");

  let firstSectionId = version.sections[0]?.id ?? null;
  const sections = draft.sections.filter((s) => s.lines.some((l) => l.kind === "WORK"));

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i]!;
    let sectionId: string | null;
    if (i === 0 && firstSectionId) {
      await updateSectionTitle(opts.orgId, quote.id, firstSectionId, sec.title);
      sectionId = firstSectionId;
    } else {
      const created = await addSection(opts.orgId, quote.id, sec.title);
      sectionId = created.id;
    }

    for (const line of sec.lines) {
      if (line.kind !== "WORK") continue;
      await upsertLine(opts.orgId, quote.id, {
        sectionId,
        kind: "WORK",
        designation: line.designation,
        description: line.description,
        quantity: line.quantity ?? 1,
        unit: line.unit ?? "U",
        unitSellHt: line.unitSellHt ?? 0,
        discountPercent: line.discountPercent ?? 0,
        vatRate: line.vatRate ?? undefined,
      });
    }
  }

  return {
    quoteId: quote.id,
    quoteNumber: quote.number,
    href: `/dashboard/devis-facturation/devis/${quote.id}`,
  };
}
