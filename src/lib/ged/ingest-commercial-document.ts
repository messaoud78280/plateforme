/**
 * GED V2.0.1 — documents commerciaux (devis / facture / situation / avoir).
 * Référence snapshot ou route de génération. Ne recrée pas les PDF. Ne touche pas aux snapshots.
 */
import { prisma } from "@/lib/prisma";
import { indexSourceDocument } from "@/lib/ged/index-source-document";
import { buildDocumentsStorageRef } from "@/lib/storage/supabase-object";

function storageRefFromKey(storageKey: string): string {
  return storageKey.startsWith("storage://")
    ? storageKey
    : buildDocumentsStorageRef(storageKey);
}

export async function ingestCommercialQuoteToGed(opts: {
  quoteId: string;
  addedById: string;
  snapshotId?: string;
  storageKey?: string;
  dryRun?: boolean;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: opts.quoteId },
    select: {
      id: true,
      number: true,
      status: true,
      projectId: true,
      createdById: true,
      createdAt: true,
      sentAt: true,
      acceptedAt: true,
      project: { select: { id: true, clientId: true } },
      clientExternalOrg: { select: { id: true, name: true, tradeName: true } },
    },
  });
  if (!quote?.projectId || !quote.project) {
    return { chantierFileId: null, linked: false, reason: "no_project" };
  }
  if (quote.status === "DRAFT" || quote.status === "TO_VALIDATE") {
    return { chantierFileId: null, linked: false, reason: "not_issued" };
  }

  const clientName =
    quote.clientExternalOrg?.tradeName || quote.clientExternalOrg?.name || null;
  const fileUrl = opts.storageKey
    ? storageRefFromKey(opts.storageKey)
    : `/api/commercial/quotes/${quote.id}/pdf`;

  const extra: { entityType: string; entityId: string; entityLabel?: string | null }[] = [
    {
      entityType: "commercial_quote",
      entityId: quote.id,
      entityLabel: quote.number,
    },
  ];
  if (quote.clientExternalOrg?.id) {
    extra.push({
      entityType: "client",
      entityId: quote.clientExternalOrg.id,
      entityLabel: clientName,
    });
  }

  const primary = opts.snapshotId
    ? {
        entityType: "commercial_quote_snapshot",
        entityId: opts.snapshotId,
        entityLabel: "PDF accepté",
      }
    : {
        entityType: "commercial_quote",
        entityId: quote.id,
        entityLabel: quote.number,
      };

  const result = await indexSourceDocument({
    projectId: quote.projectId,
    clientId: quote.project.clientId,
    addedById: opts.addedById || quote.createdById,
    name: `${quote.number}.pdf`,
    fileUrl,
    mimeType: "application/pdf",
    documentType: "DEVIS",
    category: "Contractuel",
    folderCode: "01",
    classificationStatus: "CLASSE",
    emitterName: clientName,
    createdAt: quote.acceptedAt ?? quote.sentAt ?? quote.createdAt,
    dryRun: opts.dryRun,
    primary,
    extraLinks: opts.snapshotId ? extra : extra.filter((l) => l.entityType !== "commercial_quote"),
    alsoMatch: opts.snapshotId
      ? [{ entityType: "commercial_quote", entityId: quote.id }]
      : undefined,
    comment: opts.storageKey
      ? null
      : "Document généré — ouvrir depuis Devis & Facturation (pas de copie PDF GED).",
  });

  return {
    chantierFileId: result.chantierFileId,
    linked: result.created,
    reason: result.reason,
  };
}

export async function ingestAcceptedQuoteSnapshot(opts: {
  organizationId: string;
  quoteId: string;
  snapshotId: string;
  storageKey: string;
  addedById: string;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: opts.quoteId, organizationId: opts.organizationId },
    select: { id: true },
  });
  if (!quote) return { chantierFileId: null, linked: false, reason: "no_project" };
  return ingestCommercialQuoteToGed({
    quoteId: opts.quoteId,
    addedById: opts.addedById,
    snapshotId: opts.snapshotId,
    storageKey: opts.storageKey,
  });
}

export async function ingestCommercialInvoiceToGed(opts: {
  invoiceId: string;
  addedById: string;
  dryRun?: boolean;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  const invoice = await prisma.commercialInvoice.findFirst({
    where: { id: opts.invoiceId },
    select: {
      id: true,
      number: true,
      type: true,
      status: true,
      projectId: true,
      quoteId: true,
      createdById: true,
      createdAt: true,
      issuedAt: true,
      project: { select: { clientId: true } },
      clientExternalOrg: { select: { id: true, name: true, tradeName: true } },
      quote: { select: { number: true, projectId: true, project: { select: { clientId: true } } } },
    },
  });
  if (!invoice) return { chantierFileId: null, linked: false, reason: "not_found" };
  if (invoice.status === "DRAFT") {
    return { chantierFileId: null, linked: false, reason: "not_issued" };
  }

  const projectId = invoice.projectId ?? invoice.quote?.projectId ?? null;
  const clientId = invoice.project?.clientId ?? invoice.quote?.project?.clientId ?? null;
  if (!projectId || !clientId) {
    return { chantierFileId: null, linked: false, reason: "no_project" };
  }

  const isAvoir = invoice.type === "CREDIT";
  const clientName =
    invoice.clientExternalOrg?.tradeName || invoice.clientExternalOrg?.name || null;
  const extra: { entityType: string; entityId: string; entityLabel?: string | null }[] = [];
  if (invoice.quoteId) {
    extra.push({
      entityType: "commercial_quote",
      entityId: invoice.quoteId,
      entityLabel: invoice.quote?.number ?? invoice.number,
    });
  }
  if (invoice.clientExternalOrg?.id) {
    extra.push({
      entityType: "client",
      entityId: invoice.clientExternalOrg.id,
      entityLabel: clientName,
    });
  }

  const result = await indexSourceDocument({
    projectId,
    clientId,
    addedById: opts.addedById || invoice.createdById,
    name: `${invoice.number}.pdf`,
    fileUrl: `/api/commercial/invoices/${invoice.id}/pdf`,
    mimeType: "application/pdf",
    documentType: isAvoir ? "AVOIR" : "FACTURE",
    category: isAvoir ? "Factures" : "Factures",
    subcategory: isAvoir ? "Avoir" : null,
    folderCode: "09",
    classificationStatus: "CLASSE",
    emitterName: clientName,
    createdAt: invoice.issuedAt ?? invoice.createdAt,
    dryRun: opts.dryRun,
    primary: {
      entityType: "commercial_invoice",
      entityId: invoice.id,
      entityLabel: invoice.number,
    },
    extraLinks: extra,
    comment: "Document généré à la demande — pas de copie PDF supplémentaire.",
  });

  return {
    chantierFileId: result.chantierFileId,
    linked: result.created,
    reason: result.reason,
  };
}

export async function ingestCommercialProgressToGed(opts: {
  statementId: string;
  addedById: string;
  dryRun?: boolean;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  const st = await prisma.commercialProgressStatement.findFirst({
    where: { id: opts.statementId },
    select: {
      id: true,
      number: true,
      label: true,
      status: true,
      projectId: true,
      quoteId: true,
      createdAt: true,
      validatedAt: true,
      project: { select: { clientId: true } },
      quote: {
        select: {
          number: true,
          projectId: true,
          createdById: true,
          project: { select: { clientId: true } },
          clientExternalOrg: { select: { name: true, tradeName: true } },
        },
      },
    },
  });
  if (!st) return { chantierFileId: null, linked: false, reason: "not_found" };
  if (st.status === "DRAFT") {
    return { chantierFileId: null, linked: false, reason: "not_issued" };
  }

  const projectId = st.projectId ?? st.quote.projectId ?? null;
  const clientId = st.project?.clientId ?? st.quote.project?.clientId ?? null;
  if (!projectId || !clientId) {
    return { chantierFileId: null, linked: false, reason: "no_project" };
  }

  const clientName =
    st.quote.clientExternalOrg?.tradeName || st.quote.clientExternalOrg?.name || null;
  const label = st.label?.trim() || `Situation n°${st.number}`;

  const result = await indexSourceDocument({
    projectId,
    clientId,
    addedById: opts.addedById || st.quote.createdById,
    name: `${st.quote.number} — ${label}`,
    fileUrl: null,
    documentType: "SITUATION",
    category: "Situations",
    folderCode: "09",
    classificationStatus: "CLASSE",
    emitterName: clientName,
    createdAt: st.validatedAt ?? st.createdAt,
    dryRun: opts.dryRun,
    primary: {
      entityType: "commercial_progress",
      entityId: st.id,
      entityLabel: label,
    },
    extraLinks: [
      {
        entityType: "commercial_quote",
        entityId: st.quoteId,
        entityLabel: st.quote.number,
      },
    ],
    comment: "Situation commerciale — ouvrir l’objet métier (pas de PDF stocké).",
  });

  return {
    chantierFileId: result.chantierFileId,
    linked: result.created,
    reason: result.reason,
  };
}
