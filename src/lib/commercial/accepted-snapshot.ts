/**
 * GESTION-COMMERCIALE-V1C-A — PDF figé à l’acceptation (privé, hashé, idempotent).
 * Ce n’est PAS une signature électronique ni une preuve juridique certifiée.
 */
import { createHash } from "crypto";
import type { CommercialQuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase";
import { transitionQuoteStatus } from "@/lib/commercial/quotes";
import { DOCUMENTS_BUCKET, downloadStorageObject } from "@/lib/storage/supabase-object";
import { generateCommercialQuotePdf } from "@/lib/commercial/pdf-quote";
import { buildQuotePdfInputFromVersion } from "@/lib/commercial/quote-pdf-input";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";

export const ACCEPTED_PDF_KIND = "ACCEPTED_PDF";

export type AcceptedQuoteSnapshotRow = {
  id: string;
  organizationId: string;
  quoteId: string;
  quoteVersionId: string;
  kind: string;
  storageKey: string;
  sha256: string;
  mimeType: string;
  fileSize: number;
  generatedAt: Date;
  createdAt: Date;
};

export function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function acceptedPdfStoragePath(opts: {
  organizationId: string;
  quoteId: string;
  versionId: string;
  sha256: string;
}): string {
  return `commercial/${opts.organizationId}/quotes/${opts.quoteId}/versions/${opts.versionId}/accepted-${opts.sha256}.pdf`;
}

export async function getAcceptedQuoteSnapshot(
  orgId: string,
  quoteId: string,
): Promise<AcceptedQuoteSnapshotRow | null> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: { acceptedVersionId: true },
  });
  if (!quote?.acceptedVersionId) return null;

  return prisma.commercialQuoteSnapshot.findUnique({
    where: {
      quoteVersionId_kind: {
        quoteVersionId: quote.acceptedVersionId,
        kind: ACCEPTED_PDF_KIND,
      },
    },
  });
}

export async function getSnapshotForVersion(
  orgId: string,
  versionId: string,
): Promise<AcceptedQuoteSnapshotRow | null> {
  return prisma.commercialQuoteSnapshot.findFirst({
    where: {
      organizationId: orgId,
      quoteVersionId: versionId,
      kind: ACCEPTED_PDF_KIND,
    },
  });
}

async function loadVersionPdfContext(orgId: string, quoteId: string, versionId: string) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      issueDate: true,
      validityDate: true,
      paymentTerms: true,
      paymentScheduleJson: true,
      clientNotes: true,
      siteAddressSnapshot: true,
      clientSnapshotJson: true,
      issuerSnapshotJson: true,
      currency: true,
      acceptedVersionId: true,
      acceptedAt: true,
      projectId: true,
      project: { select: { title: true } },
    },
  });
  if (!quote) throw new Error("Devis introuvable");

  const version = await prisma.commercialQuoteVersion.findFirst({
    where: { id: versionId, quoteId, organizationId: orgId },
    include: {
      sections: { orderBy: { sortOrder: "asc" } },
      lines: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!version) throw new Error("Version introuvable");

  const settings = await ensureCommercialOrgSettings(orgId);

  return {
    quote: {
      ...quote,
      projectTitle: quote.project?.title ?? null,
    },
    version,
    quoteMentions: settings.quoteMentions,
    legalMentions: settings.legalMentions,
  };
}

export function generatePdfForQuoteVersion(opts: {
  quote: Parameters<typeof buildQuotePdfInputFromVersion>[0]["quote"];
  version: Parameters<typeof buildQuotePdfInputFromVersion>[0]["version"];
  statusForPdf?: string;
  quoteMentions?: string | null;
  legalMentions?: string | null;
}): Buffer {
  const input = buildQuotePdfInputFromVersion(opts);
  return generateCommercialQuotePdf(input);
}

function isAlreadyExistsError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("already exists") || m.includes("duplicate") || m.includes("resource already");
}

async function uploadWriteOnce(path: string, bytes: Buffer): Promise<void> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("Storage privé indisponible — archivage PDF impossible");
  }
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, bytes, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error && !isAlreadyExistsError(error.message)) {
    throw new Error(`Archivage PDF échoué : ${error.message}`);
  }
}

export async function downloadAcceptedSnapshotBytes(
  orgId: string,
  snapshot: AcceptedQuoteSnapshotRow,
): Promise<Buffer> {
  if (snapshot.organizationId !== orgId) {
    throw new Error("Accès refusé");
  }
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Storage privé indisponible");
  const downloaded = await downloadStorageObject(supabase, DOCUMENTS_BUCKET, snapshot.storageKey);
  if (!downloaded) throw new Error("Fichier snapshot introuvable");
  const buf = Buffer.from(await downloaded.blob.arrayBuffer());
  return buf;
}

/**
 * Idempotent. Si le snapshot ACCEPTED_PDF existe pour acceptedVersionId → le retourne.
 * Sinon génère le PDF de CETTE version, hash, upload write-once, enregistre.
 */
export async function ensureAcceptedQuoteSnapshot(
  orgId: string,
  quoteId: string,
): Promise<{
  snapshot: AcceptedQuoteSnapshotRow;
  created: boolean;
  generationMs: number;
}> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: {
      id: true,
      status: true,
      acceptedVersionId: true,
    },
  });
  if (!quote) throw new Error("Devis introuvable");
  if (!quote.acceptedVersionId) {
    throw new Error("Aucune version acceptée — snapshot PDF impossible");
  }

  const existing = await getSnapshotForVersion(orgId, quote.acceptedVersionId);
  if (existing) {
    return { snapshot: existing, created: false, generationMs: 0 };
  }

  const versionId = quote.acceptedVersionId;
  const ctx = await loadVersionPdfContext(orgId, quoteId, versionId);

  const t0 = Date.now();
  const bytes = generatePdfForQuoteVersion({
    quote: ctx.quote,
    version: ctx.version,
    statusForPdf: "ACCEPTED",
    quoteMentions: ctx.quoteMentions,
    legalMentions: ctx.legalMentions,
  });
  const generationMs = Date.now() - t0;
  const hash = sha256Hex(bytes);
  const path = acceptedPdfStoragePath({
    organizationId: orgId,
    quoteId,
    versionId,
    sha256: hash,
  });

  // Concurrence : la version acceptée a pu changer entre lecture et archivage.
  const fresh = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: { acceptedVersionId: true },
  });
  if (!fresh?.acceptedVersionId || fresh.acceptedVersionId !== versionId) {
    throw new Error(
      "La version acceptée a changé pendant l’archivage — retry sur acceptedVersionId",
    );
  }

  const raced = await getSnapshotForVersion(orgId, versionId);
  if (raced) {
    return { snapshot: raced, created: false, generationMs };
  }

  await uploadWriteOnce(path, bytes);

  try {
    const snapshot = await prisma.commercialQuoteSnapshot.create({
      data: {
        organizationId: orgId,
        quoteId,
        quoteVersionId: versionId,
        kind: ACCEPTED_PDF_KIND,
        storageKey: path,
        sha256: hash,
        mimeType: "application/pdf",
        fileSize: bytes.length,
        generatedAt: new Date(),
      },
    });
    return { snapshot, created: true, generationMs };
  } catch (e) {
    const again = await getSnapshotForVersion(orgId, versionId);
    if (again) {
      return { snapshot: again, created: false, generationMs };
    }
    throw e instanceof Error ? e : new Error("Enregistrement snapshot échoué");
  }
}

export type AcceptedArchiveUi = {
  hasAcceptedVersion: boolean;
  snapshot: AcceptedQuoteSnapshotRow | null;
  /** ACCEPTED historique sans fichier — ne pas prétendre « figé à l’acceptation ». */
  historicalMissing: boolean;
  versionNumber: number | null;
  acceptedAt: Date | null;
  quoteNumber: string;
};

export async function loadAcceptedArchiveUi(
  orgId: string,
  quoteId: string,
): Promise<AcceptedArchiveUi | null> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: {
      number: true,
      status: true,
      acceptedAt: true,
      acceptedVersionId: true,
    },
  });
  if (!quote) return null;

  if (!quote.acceptedVersionId) {
    return {
      hasAcceptedVersion: false,
      snapshot: null,
      historicalMissing: false,
      versionNumber: null,
      acceptedAt: quote.acceptedAt,
      quoteNumber: quote.number,
    };
  }

  const [version, snapshot] = await Promise.all([
    prisma.commercialQuoteVersion.findFirst({
      where: { id: quote.acceptedVersionId, organizationId: orgId },
      select: { versionNumber: true },
    }),
    getSnapshotForVersion(orgId, quote.acceptedVersionId),
  ]);

  const wasAccepted =
    quote.status === "ACCEPTED" ||
    quote.status === "CANCELLED" ||
    Boolean(quote.acceptedAt);

  return {
    hasAcceptedVersion: true,
    snapshot,
    historicalMissing: wasAccepted && !snapshot,
    versionNumber: version?.versionNumber ?? null,
    acceptedAt: quote.acceptedAt,
    quoteNumber: quote.number,
  };
}

/** Preview : version courante. Snapshot : acceptedVersionId uniquement. */
export async function generateCurrentQuotePdfPreview(
  orgId: string,
  quoteId: string,
): Promise<{ buffer: Buffer; filename: string } | null> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: { id: true, number: true, currentVersionId: true },
  });
  if (!quote?.currentVersionId) return null;
  const ctx = await loadVersionPdfContext(orgId, quoteId, quote.currentVersionId);
  const buffer = generatePdfForQuoteVersion({
    quote: ctx.quote,
    version: ctx.version,
    quoteMentions: ctx.quoteMentions,
    legalMentions: ctx.legalMentions,
  });
  return { buffer, filename: `${quote.number}.pdf` };
}

export async function acceptQuoteWithPdfArchive(opts: {
  orgId: string;
  quoteId: string;
  actorUserId: string;
}) {
  const quote = await transitionQuoteStatus(
    opts.orgId,
    opts.quoteId,
    "ACCEPTED" as CommercialQuoteStatus,
    opts.actorUserId,
  );
  try {
    const result = await ensureAcceptedQuoteSnapshot(opts.orgId, opts.quoteId);
    return {
      quote,
      snapshot: result.snapshot,
      pdfArchived: true as const,
      pdfArchiveError: null as string | null,
      generationMs: result.generationMs,
    };
  } catch (e) {
    return {
      quote,
      snapshot: null,
      pdfArchived: false as const,
      pdfArchiveError: e instanceof Error ? e.message : "Archivage PDF à finaliser",
      generationMs: 0,
    };
  }
}
