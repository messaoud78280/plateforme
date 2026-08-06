/** Arguments de différenciation BeWork — accueil, crédibilité, SEO/AEO. */
export type BeWorkValuePillar = {
  label: string;
  detail: string;
};

export const BEWORK_VALUE_PILLARS: readonly BeWorkValuePillar[] = [
  {
    label: "Socle plateforme configurable",
    detail:
      "Un socle technologique commun, adapté à l’organisation du client : modules, workflows, rôles et droits selon vos métiers BTP.",
  },
  {
    label: "Expertise métier marchés et chantiers",
    detail:
      "Candidatures, DCE, pièces marché, situations, réserves et DOE : la plateforme est conçue pour le réel administratif chantier — pas un outil générique.",
  },
  {
    label: "IA spécialisée + validation humaine",
    detail:
      "L’IA structure et accélère dans votre environnement. Vos collaborateurs restent responsables des analyses finales et des engagements contractuels.",
  },
  {
    label: "Confidentialité et isolation multi-entreprises",
    detail:
      "Accès contrôlés, traçabilité, hébergement principal en Europe selon engagements contractuels — données métier isolées par entreprise.",
  },
  {
    label: "Mise en place puis évolution continue",
    detail:
      "Diagnostic, configuration, formation, puis abonnement : maintenance, sécurité et évolutions selon votre formule — sans inventer de prix hors étude.",
  },
  {
    label: "Partenaire, pas exécutant",
    detail:
      "BeWork équipe et fait évoluer la plateforme. Les opérations quotidiennes restent chez vos équipes — BeWork n’est ni secrétariat exécutant ni bureau d’études.",
  },
] as const;

/** Libellés courts pour badges hero / listes à puces. */
export const BEWORK_VALUE_PILLAR_LABELS: readonly string[] = BEWORK_VALUE_PILLARS.map((p) => p.label);
