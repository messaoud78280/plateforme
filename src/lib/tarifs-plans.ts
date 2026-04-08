/**
 * Formules tarifaires BeWork (partagées entre page Tarifs et Abonnement).
 * Les planKey restent stables pour l’API / abonnement.
 */

export const TARIFS_PLANS = [
  {
    planKey: "DECOUVERTE" as const,
    name: "Structure",
    price: "290",
    billing: "monthly" as const,
    detail: "",
    tagline: "Pour démarrer proprement : devis + factures + organisation de base.",
    highlights: [
      "Devis et factures",
      "Organisation de base (à plat, clair)",
      "Suivi simple des demandes",
      "Moins d’oublis, moins de retards",
    ],
    idealFor: "si votre administratif est irrégulier et que vous voulez démarrer sans complexifier.",
    /** Repère temps indicatif — affichage discret, hors logique horaire contractuelle */
    equivalentNote: {
      line1: "Idéal si l’administratif est irrégulier",
      line2: "",
    },
    badge: null as string | null,
  },
  {
    planKey: "STANDARD" as const,
    name: "Suivi",
    price: "490",
    billing: "monthly" as const,
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
  {
    planKey: "PREMIUM" as const,
    name: "Pilotage",
    price: "1190",
    billing: "monthly" as const,
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
] as const;
