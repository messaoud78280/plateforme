/**
 * Formules tarifaires BeWork (partagées entre page Tarifs et Abonnement).
 */

export const TARIFS_PLANS = [
  {
    planKey: "DECOUVERTE" as const,
    name: "Offre Découverte",
    price: "109",
    billing: "one_shot" as const,
    detail: "Tous services administratifs inclus",
    highlights: ["Jusqu'à 60 actions", "Tous services administratifs inclus", "Sans abonnement", "Sans engagement"],
    idealFor: "Tester BeWork sur un besoin ciblé",
    badge: null as string | null,
  },
  {
    planKey: "STANDARD" as const,
    name: "Standard",
    price: "215",
    billing: "monthly" as const,
    detail: "Tous services inclus",
    highlights: ["120 actions / mois", "Tous services inclus"],
    idealFor: "TPE, charge administrative régulière",
    badge: null as string | null,
  },
  {
    planKey: "STANDARD_PLUS" as const,
    name: "Business",
    price: "415",
    billing: "monthly" as const,
    detail: "Tous services inclus",
    highlights: ["240 actions / mois", "Tous services inclus", "Priorité de traitement", "Assistant administratif dédié"],
    idealFor: "PME, flux soutenu et réactivité",
    badge: "Le plus choisi" as string | null,
  },
  {
    planKey: "PREMIUM" as const,
    name: "Premium",
    price: "630",
    billing: "monthly" as const,
    detail: "Tous services inclus",
    highlights: ["360 actions / mois", "Tous services inclus", "Priorité élevée", "Assistant administratif dédié"],
    idealFor: "Dirigeants, dossiers multiples, suivi exigeant",
    badge: null as string | null,
  },
] as const;
