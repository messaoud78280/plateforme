/**
 * Configuration des formules BeWork (alignée sur la grille tarifaire).
 * planKey utilisé en base : DECOUVERTE | STANDARD | STANDARD_PLUS | PREMIUM
 */

export const SUBSCRIPTION_PLANS = {
  DECOUVERTE: {
    planKey: "DECOUVERTE",
    name: "Offre Découverte",
    priceCents: 10900, // 109 €
    priceLabel: "109",
    billing: "one_shot" as const,
    actionsIncluded: 60,
    actionsLabel: "60 actions",
  },
  STANDARD: {
    planKey: "STANDARD",
    name: "Standard",
    priceCents: 21500,
    priceLabel: "215",
    billing: "monthly" as const,
    actionsIncluded: 120,
    actionsLabel: "120 actions / mois",
  },
  STANDARD_PLUS: {
    planKey: "STANDARD_PLUS",
    name: "Business",
    priceCents: 41500,
    priceLabel: "415",
    billing: "monthly" as const,
    actionsIncluded: 240,
    actionsLabel: "240 actions / mois",
  },
  PREMIUM: {
    planKey: "PREMIUM",
    name: "Premium",
    priceCents: 63000,
    priceLabel: "630",
    billing: "monthly" as const,
    actionsIncluded: 360,
    actionsLabel: "360 actions / mois",
  },
} as const;

export type PlanKey = keyof typeof SUBSCRIPTION_PLANS;

export const PLAN_KEYS: PlanKey[] = ["DECOUVERTE", "STANDARD", "STANDARD_PLUS", "PREMIUM"];

export function getPlan(planKey: string) {
  const key = planKey as PlanKey;
  return SUBSCRIPTION_PLANS[key] ?? null;
}

