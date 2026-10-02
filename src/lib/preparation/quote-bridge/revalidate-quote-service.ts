/**
 * Revalidation atomique devis ↔ métré (CTX-03).
 * Ne mute jamais CommercialQuote.status ni PrepSchedulePlan.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasQuantityDiffAgainstTransfer } from "@/lib/preparation/quote-bridge/quote-sync-state";
import {
  evaluateQuoteRevalidationEligibility,
  type QuoteRevalidationEligibility,
  type QuoteRevalidationReason,
} from "@/lib/preparation/quote-bridge/revalidate-metre-sync";
import { buildQuoteDetailState, type QuoteDetailState } from "@/lib/chantier/quote-detail-state";

export class QuoteRevalidateError extends Error {
  constructor(
    message: string,
    public code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "REVALIDATION_REQUIRES_SYNC"
      | "REVALIDATION_STALE"
      | "STATUS_LOCKED"
      | "FINANCIAL_LOCKED"
      | "NOT_STALE"
      | "NO_TRANSFER"
      | "ERROR",
    public status = 400,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export type RevalidateQuoteMetreSyncInput = {
  orgId: string;
  quoteId: string;
  userId: string;
  expectedQuoteVersion: number;
  expectedStudyVersion: number;
  expectedTransferStudyVersion: number;
};

export type RevalidateQuoteMetreSyncResult = {
  ok: true;
  fromStudyVersion: number;
  toStudyVersion: number;
  quoteStatus: string;
  eligibility: QuoteRevalidationEligibility;
  metreSync: QuoteDetailState;
};

async function loadFinancialLock(orgId: string, quoteId: string): Promise<boolean> {
  const [invoiceCount, depositCount, paidCount] = await Promise.all([
    prisma.commercialInvoice.count({
      where: {
        organizationId: orgId,
        quoteId,
        status: { notIn: ["CANCELLED", "DRAFT"] },
      },
    }),
    prisma.commercialInvoice.count({
      where: {
        organizationId: orgId,
        quoteId,
        type: "DEPOSIT",
        status: { in: ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"] },
      },
    }),
    prisma.commercialInvoice.count({
      where: {
        organizationId: orgId,
        quoteId,
        amountPaid: { gt: 0 },
      },
    }),
  ]);
  return invoiceCount > 0 || depositCount > 0 || paidCount > 0;
}

async function computeQuantityDiffs(
  orgId: string,
  quoteId: string,
  studyId: string,
): Promise<{ hasDiffs: boolean; codes: string[] }> {
  const links = await prisma.prepQuoteLink.findMany({
    where: { organizationId: orgId, quoteId, studyId },
    select: {
      id: true,
      studyLineCode: true,
      quantityAtTransfer: true,
    },
    take: 500,
  });
  if (links.length === 0) return { hasDiffs: false, codes: [] };

  const codes = [...new Set(links.map((l) => l.studyLineCode))];
  const takeoffs = await prisma.prepTakeoffLine.findMany({
    where: { organizationId: orgId, studyId, code: { in: codes } },
    select: {
      code: true,
      validatedQuantity: true,
      computedQuantity: true,
      declaredQuantity: true,
    },
  });
  const qtyByCode = new Map<string, number | null>();
  for (const row of takeoffs) {
    const raw =
      row.validatedQuantity ?? row.computedQuantity ?? row.declaredQuantity;
    qtyByCode.set(row.code, raw != null ? Number(raw) : null);
  }

  const diffCodes: string[] = [];
  for (const l of links) {
    const diff = hasQuantityDiffAgainstTransfer({
      quantityAtTransfer:
        l.quantityAtTransfer != null ? Number(l.quantityAtTransfer) : null,
      currentQuantity: qtyByCode.get(l.studyLineCode) ?? null,
    });
    if (diff) diffCodes.push(l.studyLineCode);
  }
  return { hasDiffs: diffCodes.length > 0, codes: diffCodes };
}

export async function revalidateQuoteMetreSync(
  input: RevalidateQuoteMetreSyncInput,
): Promise<RevalidateQuoteMetreSyncResult> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: input.quoteId, organizationId: input.orgId },
    select: {
      id: true,
      status: true,
      sourcePrepStudyId: true,
      currentVersion: { select: { versionNumber: true } },
    },
  });
  if (!quote) {
    throw new QuoteRevalidateError("Devis introuvable", "NOT_FOUND", 404);
  }

  const quoteVersion = quote.currentVersion?.versionNumber ?? null;
  if (quoteVersion !== input.expectedQuoteVersion) {
    throw new QuoteRevalidateError(
      "Le devis a été modifié depuis son dernier affichage. Rechargez avant de revalider.",
      "REVALIDATION_STALE",
      409,
      { expectedQuoteVersion: input.expectedQuoteVersion, actualQuoteVersion: quoteVersion },
    );
  }

  const transfer = await prisma.prepQuoteTransfer.findFirst({
    where: { organizationId: input.orgId, quoteId: input.quoteId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      studyId: true,
      studyVersion: true,
    },
  });
  if (!transfer) {
    throw new QuoteRevalidateError(
      "Aucun transfert métré lié à ce devis.",
      "NO_TRANSFER",
      422,
    );
  }

  if (transfer.studyVersion !== input.expectedTransferStudyVersion) {
    throw new QuoteRevalidateError(
      "La référence métré du devis a changé depuis l'affichage. Rechargez avant de revalider.",
      "REVALIDATION_STALE",
      409,
      {
        expectedTransferStudyVersion: input.expectedTransferStudyVersion,
        actualTransferStudyVersion: transfer.studyVersion,
      },
    );
  }

  const study = await prisma.prepStudy.findFirst({
    where: {
      id: transfer.studyId,
      organizationId: input.orgId,
      archivedAt: null,
    },
    select: { id: true, version: true },
  });
  if (!study) {
    throw new QuoteRevalidateError("Métré source introuvable", "NOT_FOUND", 404);
  }

  if (study.version !== input.expectedStudyVersion) {
    throw new QuoteRevalidateError(
      "Le métré a été modifié depuis l'affichage. Rechargez avant de revalider.",
      "REVALIDATION_STALE",
      409,
      {
        expectedStudyVersion: input.expectedStudyVersion,
        actualStudyVersion: study.version,
        reason: "VERSION_CHANGED" satisfies QuoteRevalidationReason,
      },
    );
  }

  const [qtyDiff, financialLock] = await Promise.all([
    computeQuantityDiffs(input.orgId, input.quoteId, study.id),
    loadFinancialLock(input.orgId, input.quoteId),
  ]);

  const eligibility = evaluateQuoteRevalidationEligibility({
    commercialStatus: quote.status,
    hasMetreProvenance: true,
    hasTransfer: true,
    currentStudyVersion: study.version,
    transferStudyVersion: transfer.studyVersion,
    hasSignificantQuantityDiffs: qtyDiff.hasDiffs,
    hasFinancialLock: financialLock,
  });

  if (eligibility.reason === "NOT_STALE") {
    const metreSync = buildQuoteDetailState({
      commercialStatus: quote.status,
      hasMetreProvenance: true,
      currentStudyVersion: study.version,
      transferStudyVersion: transfer.studyVersion,
      hasSignificantQuantityDiffs: false,
    });
    return {
      ok: true,
      fromStudyVersion: transfer.studyVersion,
      toStudyVersion: transfer.studyVersion,
      quoteStatus: quote.status,
      eligibility,
      metreSync,
    };
  }

  if (eligibility.reason === "QUANTITY_DIFFS") {
    throw new QuoteRevalidateError(
      eligibility.userMessage ??
        "Des quantités du devis diffèrent du métré. Synchronisez d'abord.",
      "REVALIDATION_REQUIRES_SYNC",
      422,
      { codes: qtyDiff.codes, eligibility },
    );
  }

  if (eligibility.reason === "STATUS_LOCKED") {
    throw new QuoteRevalidateError(
      eligibility.userMessage ?? "Statut commercial verrouillé",
      "STATUS_LOCKED",
      422,
      { status: quote.status },
    );
  }

  if (eligibility.reason === "FINANCIAL_LOCKED") {
    throw new QuoteRevalidateError(
      eligibility.userMessage ?? "Verrou facturation",
      "FINANCIAL_LOCKED",
      422,
    );
  }

  if (!eligibility.eligible) {
    throw new QuoteRevalidateError(
      eligibility.userMessage ?? "Revalidation non autorisée",
      "ERROR",
      422,
      { reason: eligibility.reason },
    );
  }

  const fromStudyVersion = transfer.studyVersion;
  const toStudyVersion = study.version;

  await prisma.$transaction(async (tx) => {
    // Re-check concurrency inside TX
    const liveStudy = await tx.prepStudy.findFirst({
      where: { id: study.id, organizationId: input.orgId },
      select: { version: true },
    });
    if (!liveStudy || liveStudy.version !== input.expectedStudyVersion) {
      throw new QuoteRevalidateError(
        "Le métré a été modifié depuis l'affichage. Rechargez avant de revalider.",
        "REVALIDATION_STALE",
        409,
      );
    }
    const liveTransfer = await tx.prepQuoteTransfer.findFirst({
      where: { id: transfer.id },
      select: { studyVersion: true },
    });
    if (!liveTransfer || liveTransfer.studyVersion !== input.expectedTransferStudyVersion) {
      throw new QuoteRevalidateError(
        "La référence métré du devis a changé depuis l'affichage. Rechargez avant de revalider.",
        "REVALIDATION_STALE",
        409,
      );
    }

    // Uniquement CE devis — jamais les autres transfers du même study
    await tx.prepQuoteTransfer.update({
      where: { id: transfer.id },
      data: { studyVersion: toStudyVersion },
    });

    /**
     * quantityAtTransfer = snapshot dernier alignement (sémantique A).
     * Ici aucun écart significatif n’existe déjà (contrôlé avant TX) :
     * le snapshot est déjà égal aux quantités métré courantes → pas de
     * réécriture N×1 (timeout PgBouncer / transaction interactive).
     * Une sync qty (quote-sync / FULL_SYNC) reste le chemin qui réécrit
     * quantityAtTransfer quand les valeurs changent réellement.
     */

    await tx.commercialStatusEvent.create({
      data: {
        organizationId: input.orgId,
        entityType: "QUOTE",
        entityId: input.quoteId,
        fromStatus: quote.status,
        toStatus: quote.status,
        label: "REVALIDATE_QUOTE_METRE_SYNC",
        detail: JSON.stringify({
          studyId: study.id,
          fromStudyVersion,
          toStudyVersion,
          quoteVersion: input.expectedQuoteVersion,
          reason: "ELIGIBLE",
        }),
        actorUserId: input.userId,
      },
    });

    // Trace côté métré (study events) — string libre, pas de migration
    await tx.prepStudyEvent.create({
      data: {
        studyId: study.id,
        organizationId: input.orgId,
        kind: "REVALIDATE_QUOTE_METRE_SYNC",
        detailJson: {
          quoteId: input.quoteId,
          fromStudyVersion,
          toStudyVersion,
          quoteVersion: input.expectedQuoteVersion,
        } as Prisma.InputJsonValue,
        actorUserId: input.userId,
      },
    });
  });

  const metreSync = buildQuoteDetailState({
    commercialStatus: quote.status,
    hasMetreProvenance: true,
    currentStudyVersion: toStudyVersion,
    transferStudyVersion: toStudyVersion,
    hasSignificantQuantityDiffs: false,
  });

  const afterEligibility = evaluateQuoteRevalidationEligibility({
    commercialStatus: quote.status,
    hasMetreProvenance: true,
    hasTransfer: true,
    currentStudyVersion: toStudyVersion,
    transferStudyVersion: toStudyVersion,
    hasSignificantQuantityDiffs: false,
    hasFinancialLock: financialLock,
  });

  return {
    ok: true,
    fromStudyVersion,
    toStudyVersion,
    quoteStatus: quote.status,
    eligibility: afterEligibility,
    metreSync,
  };
}

/** Charge l’éligibilité pour l’UI (lecture seule). */
export async function loadQuoteRevalidationEligibility(
  orgId: string,
  quote: { id: string; status: string; sourcePrepStudyId?: string | null },
): Promise<QuoteRevalidationEligibility & { studyId: string | null; transferId: string | null }> {
  const transfer = await prisma.prepQuoteTransfer.findFirst({
    where: { organizationId: orgId, quoteId: quote.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, studyId: true, studyVersion: true },
  });
  const link = !transfer
    ? await prisma.prepQuoteLink.findFirst({
        where: { organizationId: orgId, quoteId: quote.id },
        select: { studyId: true },
      })
    : null;
  const studyId =
    transfer?.studyId ?? link?.studyId ?? quote.sourcePrepStudyId ?? null;

  let currentStudyVersion: number | null = null;
  if (studyId) {
    const study = await prisma.prepStudy.findFirst({
      where: { id: studyId, organizationId: orgId },
      select: { version: true },
    });
    currentStudyVersion = study?.version ?? null;
  }

  let hasSignificantQuantityDiffs: boolean | null = null;
  if (transfer && studyId) {
    const diff = await computeQuantityDiffs(orgId, quote.id, studyId);
    hasSignificantQuantityDiffs = diff.hasDiffs;
  }

  const financialLock = await loadFinancialLock(orgId, quote.id);
  const eligibility = evaluateQuoteRevalidationEligibility({
    commercialStatus: quote.status,
    hasMetreProvenance: !!transfer || !!link || !!quote.sourcePrepStudyId,
    hasTransfer: !!transfer,
    currentStudyVersion,
    transferStudyVersion: transfer?.studyVersion ?? null,
    hasSignificantQuantityDiffs,
    hasFinancialLock: financialLock,
  });

  return {
    ...eligibility,
    studyId,
    transferId: transfer?.id ?? null,
  };
}
