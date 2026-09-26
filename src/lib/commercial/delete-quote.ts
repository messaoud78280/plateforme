/**
 * Suppression sécurisée d’un devis commercial.
 * — Ne réutilise jamais le numéro (compteur nextQuoteSeq inchangé).
 * — Refuse si dépendances métier dangereuses.
 */
import type { CommercialQuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DeleteQuoteErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN_STATUS"
  | "HAS_DEPENDENCIES"
  | "ERROR";

export type DeleteQuoteResult =
  | { ok: true; number: string }
  | { ok: false; code: DeleteQuoteErrorCode; error: string };

const BLOCKED_STATUSES: CommercialQuoteStatus[] = ["ACCEPTED"];

export async function assessQuoteDeletion(
  orgId: string,
  quoteId: string,
): Promise<
  | { ok: true; quote: { id: string; number: string; status: CommercialQuoteStatus; clientLabel: string } }
  | { ok: false; code: DeleteQuoteErrorCode; error: string }
> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    select: {
      id: true,
      number: true,
      status: true,
      clientSnapshotJson: true,
      clientExternalOrg: { select: { name: true, tradeName: true } },
      _count: {
        select: {
          invoices: true,
          amendments: true,
          progressStatements: true,
          retentionGuarantees: true,
          projectBudgets: true,
        },
      },
    },
  });

  if (!quote) {
    return { ok: false, code: "NOT_FOUND", error: "Devis introuvable." };
  }

  if (BLOCKED_STATUSES.includes(quote.status)) {
    return {
      ok: false,
      code: "FORBIDDEN_STATUS",
      error:
        "Ce devis a été accepté : sa suppression n’est pas autorisée (risque comptable / suivi chantier).",
    };
  }

  const deps: string[] = [];
  if (quote._count.invoices > 0) {
    deps.push(
      quote._count.invoices === 1
        ? "une facture lui est déjà associée"
        : `${quote._count.invoices} factures lui sont déjà associées`,
    );
  }
  if (quote._count.progressStatements > 0) {
    deps.push(
      quote._count.progressStatements === 1
        ? "une situation de travaux lui est liée"
        : `${quote._count.progressStatements} situations de travaux lui sont liées`,
    );
  }
  if (quote._count.amendments > 0) {
    deps.push(
      quote._count.amendments === 1
        ? "un avenant lui est lié"
        : `${quote._count.amendments} avenants lui sont liés`,
    );
  }
  if (quote._count.retentionGuarantees > 0) {
    deps.push("une retenue de garantie lui est liée");
  }
  if (quote._count.projectBudgets > 0) {
    deps.push("un budget chantier a été figé depuis ce devis");
  }

  if (deps.length > 0) {
    const detail = deps.join(", ");
    return {
      ok: false,
      code: "HAS_DEPENDENCIES",
      error: `Ce devis ne peut pas être supprimé car ${detail}. Supprimez ou détachez d’abord les éléments associés.`,
    };
  }

  const snap = quote.clientSnapshotJson as { name?: string; companyName?: string } | null;
  const clientLabel =
    quote.clientExternalOrg?.tradeName?.trim() ||
    quote.clientExternalOrg?.name?.trim() ||
    snap?.companyName?.trim() ||
    snap?.name?.trim() ||
    "client non renseigné";

  return {
    ok: true,
    quote: {
      id: quote.id,
      number: quote.number,
      status: quote.status,
      clientLabel,
    },
  };
}

/**
 * Supprime définitivement le devis (versions, lignes, snapshots métadonnées).
 * Les fichiers PDF en storage ne sont pas purgés (évite toute suppression dangereuse).
 * Le compteur nextQuoteSeq n’est pas décrémenté → pas de réutilisation du numéro.
 */
export async function deleteQuote(orgId: string, quoteId: string): Promise<DeleteQuoteResult> {
  const assessment = await assessQuoteDeletion(orgId, quoteId);
  if (!assessment.ok) {
    return { ok: false, code: assessment.code, error: assessment.error };
  }

  const { number } = assessment.quote;

  try {
    await prisma.$transaction(async (tx) => {
      /* Couper la FK circulaire currentVersion → version avant cascade. */
      await tx.commercialQuote.update({
        where: { id: quoteId },
        data: { currentVersionId: null, acceptedVersionId: null },
      });
      /* Baseline périmètre : null sans remplacement automatique (FK SET NULL en filet). */
      await tx.projectScope.updateMany({
        where: { referenceQuoteId: quoteId },
        data: { referenceQuoteId: null },
      });
      await tx.commercialQuote.delete({
        where: { id: quoteId },
      });
    });

    return { ok: true, number };
  } catch (e) {
    console.error("[commercial/delete-quote]", e);
    return {
      ok: false,
      code: "ERROR",
      error: "Impossible de supprimer ce devis. Veuillez réessayer.",
    };
  }
}
