/**
 * Configuration des formules BeWork (alignée sur la grille tarifaire).
 * planKey utilisé en base : DECOUVERTE | STANDARD | STANDARD_PLUS | PREMIUM
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
    actionsIncluded: 200,
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
    actionsIncluded: 520,
    actionsLabel: "Capacité renforcée — niveau Pilotage",
  },
} as const;

export type PlanKey = keyof typeof SUBSCRIPTION_PLANS;

export const PLAN_KEYS: PlanKey[] = ["DECOUVERTE", "STANDARD", "STANDARD_PLUS", "PREMIUM"];

export function getPlan(planKey: string) {
  const key = planKey as PlanKey;
  return SUBSCRIPTION_PLANS[key] ?? null;
}
