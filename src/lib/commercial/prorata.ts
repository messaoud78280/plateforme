/**
 * DF-6C — Paramètres compte prorata sur devis / marché.
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";
import type { ProrataBaseMode } from "@/lib/commercial/prorata-calc";

export async function getQuoteProrataSummary(orgId: string, quoteId: string) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: {
      id: true,
      totalSellHt: true,
      prorataEnabled: true,
      prorataPercent: true,
      prorataBaseMode: true,
      prorataLabel: true,
    },
  });
  if (!quote) return null;

  const closed = await prisma.commercialProgressStatement.findMany({
    where: {
      organizationId: orgId,
      quoteId,
      status: { in: ["VALIDATED", "INVOICED"] },
      prorataPeriodHt: { gt: 0 },
    },
    select: { id: true, prorataPeriodHt: true },
  });
  const provisionedHt = roundMoney(
    closed.reduce((s, st) => s + d(st.prorataPeriodHt), 0),
    2,
  );
  const rateLocked = closed.length > 0;

  return {
    enabled: quote.prorataEnabled,
    ratePercent: d(quote.prorataPercent),
    baseMode: quote.prorataBaseMode as ProrataBaseMode,
    label: quote.prorataLabel,
    marketSellHt: d(quote.totalSellHt),
    provisionedHt,
    rateLocked,
  };
}

export async function updateQuoteProrataSettings(input: {
  orgId: string;
  userId: string;
  quoteId: string;
  prorataEnabled?: boolean;
  prorataPercent?: number;
  prorataBaseMode?: ProrataBaseMode | string;
  prorataLabel?: string | null;
}) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: input.quoteId, organizationId: input.orgId },
    select: {
      id: true,
      prorataEnabled: true,
      prorataPercent: true,
      prorataBaseMode: true,
      prorataLabel: true,
    },
  });
  if (!quote) throw new Error("Devis introuvable");

  const nextEnabled =
    input.prorataEnabled != null ? Boolean(input.prorataEnabled) : quote.prorataEnabled;
  const nextRate =
    input.prorataPercent != null
      ? roundMoney(Math.min(100, Math.max(0, input.prorataPercent)), 4)
      : d(quote.prorataPercent);
  const nextMode =
    (input.prorataBaseMode as string | undefined) ?? quote.prorataBaseMode;
  const nextLabel =
    input.prorataLabel !== undefined
      ? input.prorataLabel?.trim() || null
      : quote.prorataLabel;

  const lockedCount = await prisma.commercialProgressStatement.count({
    where: {
      organizationId: input.orgId,
      quoteId: input.quoteId,
      status: { in: ["VALIDATED", "INVOICED"] },
      OR: [{ prorataPeriodHt: { gt: 0 } }, { prorataEnabledSnapshot: true }],
    },
  });

  // Taux / activation figés pour l’historique déjà provisionné — nouvelles situations
  // utilisent la nouvelle valeur ; pas de recalcul rétroactif.
  const rateChanged = Math.abs(nextRate - d(quote.prorataPercent)) > 1e-6;
  const enabledChanged = nextEnabled !== quote.prorataEnabled;
  const modeChanged = nextMode !== quote.prorataBaseMode;

  await prisma.$transaction(async (tx) => {
    await tx.commercialQuote.update({
      where: { id: quote.id },
      data: {
        prorataEnabled: nextEnabled,
        prorataPercent: nextEnabled ? nextRate : 0,
        prorataBaseMode: nextMode as "PERIOD_WORK_HT",
        prorataLabel: nextLabel,
      },
    });

    if (lockedCount > 0 && (rateChanged || enabledChanged || modeChanged)) {
      await tx.commercialStatusEvent.create({
        data: {
          organizationId: input.orgId,
          entityType: "QUOTE",
          entityId: quote.id,
          fromStatus: quote.prorataEnabled
            ? `PRORATA_${d(quote.prorataPercent)}`
            : "PRORATA_OFF",
          toStatus: nextEnabled ? `PRORATA_${nextRate}` : "PRORATA_OFF",
          label: `Compte prorata modifié (effet situations futures) : ${
            quote.prorataEnabled ? `${d(quote.prorataPercent)} %` : "Non"
          } → ${nextEnabled ? `${nextRate} %` : "Non"}`,
          actorUserId: input.userId,
        },
      });
    } else if (rateChanged || enabledChanged || modeChanged) {
      await tx.commercialStatusEvent.create({
        data: {
          organizationId: input.orgId,
          entityType: "QUOTE",
          entityId: quote.id,
          fromStatus: null,
          toStatus: nextEnabled ? `PRORATA_${nextRate}` : "PRORATA_OFF",
          label: nextEnabled
            ? `Compte prorata activé — ${nextRate} %`
            : "Compte prorata désactivé",
          actorUserId: input.userId,
        },
      });
    }
  });

  return getQuoteProrataSummary(input.orgId, input.quoteId);
}
