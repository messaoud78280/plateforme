/**
 * GESTION-COMMERCIALE-V1B — agrégats dashboard (une formule, pas dans React).
 */
import type { CommercialQuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { roundMoney } from "@/lib/commercial/money";

const PREP: CommercialQuoteStatus[] = ["DRAFT", "TO_VALIDATE", "VALIDATED"];
const SENT_LIKE: CommercialQuoteStatus[] = ["SENT", "VIEWED"];
/** Pipeline devis HT = montants encore non contractualisés (préparation + envoyés). */
const PIPELINE: CommercialQuoteStatus[] = [
  "DRAFT",
  "TO_VALIDATE",
  "VALIDATED",
  "SENT",
  "VIEWED",
];

export type CommercialDashboardKpis = {
  quoteCount: number;
  enPreparation: number;
  envoyes: number;
  acceptes: number;
  refuses: number;
  expires: number;
  /** HT des devis non encore acceptés (préparation + envoyés). */
  pipelineDevisHt: number;
  /** Devis ACCEPTED HT (sans avenants) — base. */
  devisAcceptesHt: number;
  /** Avenants ACCEPTED HT (tous devis org). */
  avenantsAcceptesHt: number;
  /** Contrat = devis acceptés + avenants acceptés. */
  contratAccepteHt: number;
  /** Reste dû factures émises non échues (TTC). */
  aEncaisserTtc: number;
  /** Reste dû factures en retard (TTC). */
  enRetardTtc: number;
  /** Paiements valides du mois calendaire. */
  encaisseMoisTtc: number;
};

export function aggregateQuoteStatusCounts(
  rows: { status: CommercialQuoteStatus; _count: number; _sum: { totalSellHt: unknown } }[],
): Pick<
  CommercialDashboardKpis,
  | "enPreparation"
  | "envoyes"
  | "acceptes"
  | "refuses"
  | "expires"
  | "pipelineDevisHt"
  | "devisAcceptesHt"
> {
  let enPreparation = 0;
  let envoyes = 0;
  let acceptes = 0;
  let refuses = 0;
  let expires = 0;
  let pipelineDevisHt = 0;
  let devisAcceptesHt = 0;

  for (const row of rows) {
    const n = row._count;
    const ht = d(row._sum.totalSellHt);
    if (PREP.includes(row.status)) {
      enPreparation += n;
      pipelineDevisHt += ht;
    }
    if (SENT_LIKE.includes(row.status)) {
      envoyes += n;
      pipelineDevisHt += ht;
    }
    if (row.status === "ACCEPTED") {
      acceptes = n;
      devisAcceptesHt = ht;
    }
    if (row.status === "REFUSED") refuses = n;
    if (row.status === "EXPIRED") expires = n;
  }

  return {
    enPreparation,
    envoyes,
    acceptes,
    refuses,
    expires,
    pipelineDevisHt: roundMoney(pipelineDevisHt, 2),
    devisAcceptesHt: roundMoney(devisAcceptesHt, 2),
  };
}

export async function loadCommercialDashboardKpis(
  orgId: string,
): Promise<CommercialDashboardKpis> {
  const { loadCollectionsKpis } = await import("@/lib/commercial/collections");
  const [quoteCount, grouped, avenantsSum, collections] = await Promise.all([
    prisma.commercialQuote.count({ where: { organizationId: orgId } }),
    prisma.commercialQuote.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: true,
      _sum: { totalSellHt: true },
    }),
    prisma.commercialAmendment.aggregate({
      where: { organizationId: orgId, status: "ACCEPTED" },
      _sum: { totalSellHt: true },
    }),
    loadCollectionsKpis(orgId),
  ]);

  const counts = aggregateQuoteStatusCounts(grouped);
  const avenantsAcceptesHt = roundMoney(d(avenantsSum._sum.totalSellHt), 2);
  const contratAccepteHt = roundMoney(counts.devisAcceptesHt + avenantsAcceptesHt, 2);

  return {
    quoteCount,
    ...counts,
    avenantsAcceptesHt,
    contratAccepteHt,
    aEncaisserTtc: collections.aEncaisserTtc,
    enRetardTtc: collections.enRetardTtc,
    encaisseMoisTtc: collections.encaisseMoisTtc,
  };
}

export function quoteNextActionLabel(input: {
  status: string;
  projectId?: string | null;
  validityDate?: Date | string | null;
}): string {
  const { status, projectId } = input;
  if (status === "DRAFT") return "Continuer le devis";
  if (status === "TO_VALIDATE") return "Valider";
  if (status === "VALIDATED") return "Envoyer";
  if (status === "SENT" || status === "VIEWED") {
    const valid = input.validityDate ? new Date(input.validityDate) : null;
    if (valid && !Number.isNaN(valid.getTime()) && valid.getTime() < Date.now()) {
      return "Validité dépassée";
    }
    return "En attente client";
  }
  if (status === "ACCEPTED" && !projectId) return "Créer / rattacher chantier";
  if (status === "ACCEPTED" && projectId) return "Ouvrir le chantier";
  if (status === "REFUSED") return "Clôturé (refusé)";
  if (status === "EXPIRED") return "Expiré";
  if (status === "CANCELLED") return "Annulé";
  return "Voir";
}

/** Export pour tests — listes de statuts. */
export const COMMERCIAL_KPI_STATUS_GROUPS = { PREP, SENT_LIKE, PIPELINE };
