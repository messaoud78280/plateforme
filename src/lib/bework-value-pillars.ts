/** Arguments de différenciation BeWork — accueil, crédibilité, SEO/AEO. */
export type BeWorkValuePillar = {
  label: string;
  detail: string;
};

export const BEWORK_VALUE_PILLARS: readonly BeWorkValuePillar[] = [
  {
    label: "Solutions IA autour de votre besoin",
    detail:
      "Nous partons d’un problème, d’une idée ou d’un processus — pas d’un catalogue figé — et étudions la solution utile pour votre entreprise.",
  },
  {
    label: "Expertise métier BTP",
    detail:
      "Documents, marchés, chantiers, validations : la conception s’appuie sur le réel du BTP, pas sur une IA générique.",
  },
  {
    label: "Simple devant, puissante derrière",
    detail:
      "Interfaces conçues pour les utilisateurs métier. La complexité technique reste en arrière-plan — formation et adoption incluses.",
  },
  {
    label: "Plateforme BeWork comme preuve",
    detail:
      "Nous avons déjà construit un environnement métier complet : démonstration concrète de notre capacité à concevoir des systèmes pour le BTP.",
  },
  {
    label: "Confidentialité et isolation",
    detail:
      "Accès contrôlés, traçabilité, hébergement principal en Europe selon engagements contractuels — données métier isolées par entreprise.",
  },
  {
    label: "Accompagnement jusqu’à l’usage réel",
    detail:
      "Concevoir, déployer, former, accompagner l’adoption, puis faire évoluer la solution selon les retours — pas une livraison « jetée ».",
  },
] as const;

/** Libellés courts pour badges hero / listes à puces. */
export const BEWORK_VALUE_PILLAR_LABELS: readonly string[] = BEWORK_VALUE_PILLARS.map((p) => p.label);
