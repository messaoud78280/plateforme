/**
 * Configuration des formules BeWork (alignée sur la grille tarifaire).
 * planKey en base : DECOUVERTE | STANDARD | STANDARD_PLUS | PREMIUM
 * STANDARD_PLUS (Renfort) n’est plus proposé à la souscription ; conservé pour l’historique et les comptes existants.
 */

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
export const PLAN_KEYS: PlanKey[] = ["DECOUVERTE", "STANDARD", "PREMIUM"];

export function getPlan(planKey: string) {
  const key = planKey as PlanKey;
  return SUBSCRIPTION_PLANS[key] ?? null;
}
