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

/**
 * Batch CTX-03 pour une liste de devis — O(1) requêtes (pas de N+1).
 * Même projection que loadQuoteDetailState / buildQuoteDetailState.
 */
export async function loadQuoteDetailStatesBatch(
  orgId: string,
  quotes: Array<{
    id: string;
    status: string;
    sourcePrepStudyId?: string | null;
  }>,
): Promise<Map<string, QuoteDetailState>> {
  const out = new Map<string, QuoteDetailState>();
  if (quotes.length === 0) return out;

  const quoteIds = quotes.map((q) => q.id);
  const sourceByQuote = new Map(
    quotes.map((q) => [q.id, q.sourcePrepStudyId ?? null] as const),
  );

  const [transfers, links] = await Promise.all([
    prisma.prepQuoteTransfer.findMany({
      where: { organizationId: orgId, quoteId: { in: quoteIds } },
      orderBy: { createdAt: "desc" },
      select: {
        quoteId: true,
        studyId: true,
        studyVersion: true,
      },
    }),
    prisma.prepQuoteLink.findMany({
      where: { organizationId: orgId, quoteId: { in: quoteIds } },
      select: {
        quoteId: true,
        studyId: true,
        studyLineCode: true,
        quantityAtTransfer: true,
      },
    }),
  ]);

  const latestTransferByQuote = new Map<string, (typeof transfers)[number]>();
  for (const t of transfers) {
    if (!latestTransferByQuote.has(t.quoteId)) {
      latestTransferByQuote.set(t.quoteId, t);
    }
  }

  const linksByQuote = new Map<string, typeof links>();
  for (const l of links) {
    const arr = linksByQuote.get(l.quoteId) ?? [];
    arr.push(l);
    linksByQuote.set(l.quoteId, arr);
  }

  const studyIds = new Set<string>();
  for (const q of quotes) {
    const transfer = latestTransferByQuote.get(q.id);
    const qLinks = linksByQuote.get(q.id) ?? [];
    const studyId =
      transfer?.studyId ?? qLinks[0]?.studyId ?? sourceByQuote.get(q.id) ?? null;
    if (studyId) studyIds.add(studyId);
  }

  const studies =
    studyIds.size > 0
      ? await prisma.prepStudy.findMany({
          where: { organizationId: orgId, id: { in: [...studyIds] } },
          select: { id: true, version: true },
        })
      : [];
  const versionByStudy = new Map(studies.map((s) => [s.id, s.version]));

  const takeoffs =
    links.length > 0 && studyIds.size > 0
      ? await prisma.prepTakeoffLine.findMany({
          where: {
            organizationId: orgId,
            studyId: { in: [...studyIds] },
          },
          select: {
            studyId: true,
            code: true,
            validatedQuantity: true,
            computedQuantity: true,
            declaredQuantity: true,
          },
        })
      : [];

  const qtyByStudyCode = new Map<string, number | null>();
  for (const row of takeoffs) {
    const raw =
      row.validatedQuantity ?? row.computedQuantity ?? row.declaredQuantity;
    qtyByStudyCode.set(
      `${row.studyId}:${row.code}`,
      raw != null ? Number(raw) : null,
    );
  }

  for (const q of quotes) {
    const transfer = latestTransferByQuote.get(q.id) ?? null;
    const qLinks = linksByQuote.get(q.id) ?? [];
    const hasMetreProvenance = !!transfer || qLinks.length > 0;
    const studyId =
      transfer?.studyId ??
      qLinks[0]?.studyId ??
      sourceByQuote.get(q.id) ??
      null;
    const currentStudyVersion = studyId
      ? (versionByStudy.get(studyId) ?? null)
      : null;

    let hasSignificantQuantityDiffs: boolean | null = null;
    if (qLinks.length > 0) {
      hasSignificantQuantityDiffs = qLinks.some((l) =>
        hasQuantityDiffAgainstTransfer({
          quantityAtTransfer:
            l.quantityAtTransfer != null ? Number(l.quantityAtTransfer) : null,
          currentQuantity:
            qtyByStudyCode.get(`${l.studyId}:${l.studyLineCode}`) ?? null,
        }),
      );
    }

    out.set(
      q.id,
      buildQuoteDetailState({
        commercialStatus: q.status,
        hasMetreProvenance,
        currentStudyVersion,
        transferStudyVersion: transfer?.studyVersion ?? null,
        hasSignificantQuantityDiffs,
      }),
    );
  }

  return out;
}
