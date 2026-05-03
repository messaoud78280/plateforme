/**
 * Tarifs marketing (consomme `subscription-plans` = même grille que Postgres / paiements).
 */

import {
  CREDIT_MINUTES,
  PLAN_KEYS,
  SUBSCRIPTION_PLANS,
  type PlanKey,
  type PublicPlanKey,
} from "@/lib/subscription-plans";

type TarifsCopyEntry = {
  detail: string;
  tagline: string;
  highlights: readonly string[];
  idealFor: string;
  equivalentNote: { line1: string; line2: string };
  badge: string | null;
};

const TARIFS_COPY = {
  DECOUVERTE: {
    detail: "",
    tagline: "Pour démarrer proprement : devis + factures + organisation de base.",
    highlights: [
      "Devis et factures",
      "Organisation de base (à plat, clair)",
      "Suivi simple des demandes",
      "Moins d’oublis, moins de retards",
    ],
    idealFor: "si votre administratif est irrégulier et que vous voulez démarrer sans complexifier.",
    equivalentNote: {
      line1: "Idéal si l’administratif est irrégulier",
      line2: "",
    },
    badge: null as string | null,
  },
  STANDARD: {
    detail: "",
    tagline: "Pour une activité régulière : dossiers suivis + relances + coordination.",
    highlights: [
      "Dossiers suivis",
      "Relances structurées",
      "Coordination au quotidien",
      "Priorisation des demandes",
    ],
    idealFor: "si ça tombe toutes les semaines et que vous voulez du fiable.",
    equivalentNote: {
      line1: "Le plus adapté pour une activité régulière",
      line2: "",
    },
    badge: "Le plus adapté" as string | null,
  },
  PREMIUM: {
    detail: "",
    tagline: "Pour déléguer vraiment : priorisation + organisation globale + suivi complet.",
    highlights: [
      "Priorisation et gestion au quotidien",
      "Suivi complet des dossiers",
      "Organisation globale",
      "Relais structuré (sans perdre le contrôle)",
    ],
    idealFor: "si vous voulez un vrai relais au quotidien.",
    equivalentNote: {
      line1: "Capacité étendue, suivi prioritaire",
      line2: "",
    },
    badge: null as string | null,
  },
} satisfies Record<PublicPlanKey, TarifsCopyEntry>;

export const TARIFS_PLANS = PLAN_KEYS.map((key) => {
  const p = SUBSCRIPTION_PLANS[key];
  const c = TARIFS_COPY[key];
  return {
    planKey: key,
    name: p.name,
    price: p.priceLabel,
    billing: p.billing,
    detail: c.detail,
    tagline: c.tagline,
    highlights: [...c.highlights],
    idealFor: c.idealFor,
    equivalentNote: c.equivalentNote,
    badge: c.badge,
    /** Aligné quotas base : crédits / mois après souscription ou paiement. */
    actionsIncluded: p.actionsIncluded,
    creditsMinutes: CREDIT_MINUTES,
  };
});

export type TarifMarketingPlan = (typeof TARIFS_PLANS)[number];

/** Compatibilité typage ancien flux (uniquement clés publiques). */
export type TarifPlanKey = Extract<PlanKey, PublicPlanKey>;
