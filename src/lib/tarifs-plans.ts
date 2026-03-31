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
    tagline: "Pour cadrer un administratif encore instable, avec un besoin de base structuré.",
    highlights: [
      "Gestion des devis et facturation",
      "Suivi simple des demandes",
      "Organisation administrative de base",
      "Cadre clair pour éviter les retards et oublis",
    ],
    idealFor: "artisans souhaitant structurer leur organisation sans complexifier leur fonctionnement.",
    /** Repère temps indicatif — affichage discret, hors logique horaire contractuelle */
    equivalentNote: {
      line1: "Charge adaptée à un besoin ponctuel ou irrégulier",
      line2: "(équivalent d’environ 10 à 15h / mois selon les demandes)",
    },
    badge: null as string | null,
  },
  {
    planKey: "STANDARD" as const,
    name: "Suivi",
    price: "490",
    billing: "monthly" as const,
    detail: "",
    tagline: "Pour les entreprises du bâtiment avec une activité régulière nécessitant un suivi fiable.",
    highlights: [
      "Suivi des dossiers en cours",
      "Relances clients structurées",
      "Coordination administrative",
      "Priorisation des demandes",
    ],
    idealFor: "dirigeants avec un flux administratif continu à organiser et sécuriser.",
    equivalentNote: {
      line1: "Charge adaptée à une activité administrative régulière",
      line2: "(équivalent d’environ 20 à 30h / mois)",
    },
    badge: "Le plus adapté" as string | null,
  },
  {
    planKey: "PREMIUM" as const,
    name: "Pilotage",
    price: "1190",
    billing: "monthly" as const,
    detail: "",
    tagline: "Externalisation administrative structurée, intégrée comme un véritable support à votre activité.",
    highlights: [
      "Gestion prioritaire des demandes",
      "Suivi complet des dossiers",
      "Organisation globale de l’administratif",
      "Accompagnement dans la structuration",
    ],
    idealFor: "dirigeants souhaitant déléguer sans perdre le contrôle et structurer durablement leur organisation.",
    equivalentNote: {
      line1: "Capacité étendue avec suivi prioritaire",
      line2: "(équivalent d’un mi-temps administratif dédié)",
    },
    badge: null as string | null,
  },
] as const;
