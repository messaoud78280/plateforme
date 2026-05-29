/**
 * Source de vérité des formules BeWork — alignée sur PostgreSQL / Supabase
 * (`User.subscriptionPlan`, `Subscription.planKey`, `Payment.amount`, `User.monthlyActionsTotal`).
 *
 * Toujours mettre à jour ici puis laisser l’UI marketing dériver depuis ce module ou `tarifs-plans`.
 * Les montants affichés sur `/tarifs` doivent correspondre aux `priceLabel` ci-dessous (les lignes
 * historiques `Payment` peuvent différer : promo, prorata, ancien grille, paiement personnalisé).
 *
 * planKey en base : DECOUVERTE | STANDARD | STANDARD_PLUS | PREMIUM
 * STANDARD_PLUS (Renfort) n’est plus proposé à la souscription ; conservé pour l’historique et les comptes existants.
 */

/** 1 crédit = CREDIT_MINUTES min — même règle que quotas et débit par tâche. */
export const CREDIT_MINUTES = 12;

/** Heures affichées (repère) dérivées des crédits inclus. */
export function creditsToDisplayHours(actionsIncluded: number): number {
  return Math.round((actionsIncluded * CREDIT_MINUTES) / 60);
}

export function formatPriceLabelFr(priceLabel: string): string {
  const n = Number(priceLabel.replace(/\s/g, ""));
  return Number.isFinite(n) ? n.toLocaleString("fr-FR") : priceLabel;
}

/** Libellé fiscal des forfaits publics (`priceLabel` = montant HT). */
export const SUBSCRIPTION_PRICE_TAX_LABEL = "HT" as const;

/** Durée de validité des crédits après achat ou créditation (tous forfaits). */
export const CREDITS_VALIDITY_DAYS = 30;
export const CREDITS_VALIDITY_LABEL = "30 jours";

export const CREDITS_VALIDITY_NOTICE =
  "Les crédits achetés ou crédités sont valables 30 jours à compter de la date d'achat ou de créditation, quel que soit le forfait. Les crédits non utilisés à l'issue de ce délai sont perdus sans remboursement ni report.";

export const SUBSCRIPTION_PRICE_DISCLAIMER =
  "Tous nos tarifs sont exprimés HT / mois, sans frais supplémentaires. " +
  "Les crédits inclus sont utilisables pendant 30 jours à compter de chaque achat ou renouvellement ; les crédits non consommés expirent à l'issue de ce délai.";

/** Ex. « 490 € HT / mois » */
export function formatPlanPriceMonthlyHt(priceLabel: string): string {
  return `${formatPriceLabelFr(priceLabel)} € ${SUBSCRIPTION_PRICE_TAX_LABEL} / mois`;
}

export const SUBSCRIPTION_PLANS = {
  DECOUVERTE: {
    planKey: "DECOUVERTE",
    name: "Structure",
    priceCents: 29000, // 290 €
    priceLabel: "290",
    billing: "monthly" as const,
    actionsIncluded: 100,
    actionsLabel: "Charge adaptée — niveau Structure",
  },
  STANDARD: {
    planKey: "STANDARD",
    name: "Suivi",
    priceCents: 49000,
    priceLabel: "490",
    billing: "monthly" as const,
    actionsIncluded: 185,
    actionsLabel: "Charge adaptée — niveau Suivi",
  },
  STANDARD_PLUS: {
    planKey: "STANDARD_PLUS",
    name: "Renfort",
    priceCents: 79000,
    priceLabel: "790",
    billing: "monthly" as const,
    actionsIncluded: 340,
    actionsLabel: "Volume maîtrisé — niveau Renfort",
  },
  PREMIUM: {
    planKey: "PREMIUM",
    name: "Pilotage",
    priceCents: 119000,
    priceLabel: "1190",
    billing: "monthly" as const,
    actionsIncluded: 500,
    actionsLabel: "Capacité renforcée — niveau Pilotage",
  },
} as const;

export type PlanKey = keyof typeof SUBSCRIPTION_PLANS;

/** Formules proposées à la souscription et au checkout (3 offres publiques). */
export const PLAN_KEYS = ["DECOUVERTE", "STANDARD", "PREMIUM"] as const;

/** Sous-ensemble des planKey exposés au site et au checkout (hors Renfort historique). */
export type PublicPlanKey = (typeof PLAN_KEYS)[number];

/** Borne basse / haute des trois offres publiques (JSON-LD, meta, phrases). */
export function getPublicPriceBoundsLabels(): { low: string; high: string } {
  let low: number = SUBSCRIPTION_PLANS[PLAN_KEYS[0]].priceCents;
  let high: number = low;
  for (const k of PLAN_KEYS) {
    const c = SUBSCRIPTION_PLANS[k].priceCents;
    low = Math.min(low, c);
    high = Math.max(high, c);
  }
  const lowPlan = PLAN_KEYS.find((k) => SUBSCRIPTION_PLANS[k].priceCents === low)!;
  const highPlan = PLAN_KEYS.find((k) => SUBSCRIPTION_PLANS[k].priceCents === high)!;
  return {
    low: SUBSCRIPTION_PLANS[lowPlan].priceLabel,
    high: SUBSCRIPTION_PLANS[highPlan].priceLabel,
  };
}

/** Borne basse publique, ex. « dès 290 € HT/mois » */
export function formatPublicPriceFromHt(): string {
  const { low } = getPublicPriceBoundsLabels();
  return `dès ${formatPriceLabelFr(low)} € ${SUBSCRIPTION_PRICE_TAX_LABEL}/mois`;
}

/** Phrase AggregateOffer (offre Suivi = STANDARD). */
export function getAggregateOfferDescription(): string {
  const suivi = SUBSCRIPTION_PLANS.STANDARD;
  return `Trois forfaits HT mensuels BTP : Structure, Suivi (${formatPlanPriceMonthlyHt(suivi.priceLabel)} — le plus adapté pour une activité régulière), Pilotage.`;
}

export function getPlan(planKey: string) {
  const key = planKey as PlanKey;
  return SUBSCRIPTION_PLANS[key] ?? null;
}
