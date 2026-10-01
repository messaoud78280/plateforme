/**
 * Charge uniquement les relations nécessaires à CTX-03 pour UN devis.
 * Pas de getProjectWorkspace — requête ciblée.
 */

import { prisma } from "@/lib/prisma";
import { hasQuantityDiffAgainstTransfer } from "@/lib/preparation/quote-bridge/quote-sync-state";
import { buildQuoteDetailState, type QuoteDetailState } from "./quote-detail-state";

export type QuoteMetreSyncInputs = {
  hasMetreProvenance: boolean;
  currentStudyVersion: number | null;
  transferStudyVersion: number | null;
  hasSignificantQuantityDiffs: boolean | null;
  studyId: string | null;
};

/**
 * Provenance métré d’un devis précis (PrepQuoteTransfer + PrepQuoteLink).
 * Isolé par quoteId — jamais le transfert d’un autre devis.
 */
export async function loadQuoteMetreSyncInputs(
  orgId: string,
  quoteId: string,
  opts?: {
    sourcePrepStudyId?: string | null;
  },
): Promise<QuoteMetreSyncInputs> {
  const [transfer, links] = await Promise.all([
    prisma.prepQuoteTransfer.findFirst({
      where: { organizationId: orgId, quoteId },
      orderBy: { createdAt: "desc" },
      select: {
        studyId: true,
        studyVersion: true,
      },
    }),
    prisma.prepQuoteLink.findMany({
      where: { organizationId: orgId, quoteId },
      select: {
        studyId: true,
        studyLineCode: true,
        quantityAtTransfer: true,
      },
      take: 200,
    }),
  ]);

  const hasMetreProvenance = !!transfer || links.length > 0;
  const studyId =
    transfer?.studyId ??
    links[0]?.studyId ??
    opts?.sourcePrepStudyId ??
    null;

  let currentStudyVersion: number | null = null;
  if (studyId) {
    const study = await prisma.prepStudy.findFirst({
      where: { id: studyId, organizationId: orgId },
      select: { version: true },
    });
    currentStudyVersion = study?.version ?? null;
  }

  let hasSignificantQuantityDiffs: boolean | null = null;
  if (links.length > 0 && studyId) {
    const codes = [...new Set(links.map((l) => l.studyLineCode))];
    const takeoffs = await prisma.prepTakeoffLine.findMany({
      where: {
        organizationId: orgId,
        studyId,
        code: { in: codes },
      },
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
    hasSignificantQuantityDiffs = links.some((l) =>
      hasQuantityDiffAgainstTransfer({
        quantityAtTransfer:
          l.quantityAtTransfer != null ? Number(l.quantityAtTransfer) : null,
        currentQuantity: qtyByCode.get(l.studyLineCode) ?? null,
      }),
    );
  }

  return {
    hasMetreProvenance,
    currentStudyVersion,
    transferStudyVersion: transfer?.studyVersion ?? null,
    hasSignificantQuantityDiffs,
    studyId,
  };
}

/** Charge + projette l’état détail devis (CTX-03). */
export async function loadQuoteDetailState(
  orgId: string,
  quote: {
    id: string;
    status: string;
    sourcePrepStudyId?: string | null;
  },
): Promise<QuoteDetailState> {
  const sync = await loadQuoteMetreSyncInputs(orgId, quote.id, {
    sourcePrepStudyId: quote.sourcePrepStudyId,
  });
  return buildQuoteDetailState({
    commercialStatus: quote.status,
    hasMetreProvenance: sync.hasMetreProvenance,
    currentStudyVersion: sync.currentStudyVersion,
    transferStudyVersion: sync.transferStudyVersion,
    hasSignificantQuantityDiffs: sync.hasSignificantQuantityDiffs,
  });
}
