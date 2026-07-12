/** Scénarios de test utilisateurs métier (mesure clics / temps / erreurs). */

export type UxScenario = {
  id: string;
  actor: string;
  goal: string;
  success: string;
  maxClicksHint: string;
};

export const UX_SCENARIOS: UxScenario[] = [
  {
    id: "doc-30s",
    actor: "Assistant BeWork",
    goal: "Retrouver un document en moins de 30 secondes",
    success: "Ouverture du bon fichier depuis recherche ou GED chantier",
    maxClicksHint: "≤ 4 clics depuis le dashboard",
  },
  {
    id: "urgent-actions",
    actor: "Conducteur de travaux",
    goal: "Identifier les actions urgentes sans multiplier les pages",
    success: "Liste « À traiter » / KPI urgences visibles en ≤ 10 s",
    maxClicksHint: "≤ 2 clics",
  },
  {
    id: "client-upload",
    actor: "Utilisateur client",
    goal: "Déposer et classer un fichier sans assistance",
    success: "Fichier visible dans la bonne rubrique",
    maxClicksHint: "≤ 5 clics",
  },
  {
    id: "risk-chantier",
    actor: "Responsable / gérant",
    goal: "Identifier le chantier le plus risqué",
    success: "Santé / score risque lisible sur la liste Pilotage",
    maxClicksHint: "≤ 2 clics",
  },
  {
    id: "plan-version",
    actor: "Conducteur / assistant",
    goal: "Retrouver la version en vigueur d’un plan",
    success: "Indice / version actuelle clairement marquée",
    maxClicksHint: "≤ 4 clics",
  },
  {
    id: "confidential",
    actor: "Tout rôle",
    goal: "Comprendre qu’un document est confidentiel",
    success: "Badge / bandeau confidentiel visible avant ouverture",
    maxClicksHint: "0 clic — visible en liste",
  },
  {
    id: "mobile-pdf-action",
    actor: "Utilisateur mobile",
    goal: "Ouvrir un PDF et créer une action",
    success: "Aperçu + création action sans panneau desktop-only bloquant",
    maxClicksHint: "≤ 6 tap",
  },
  {
    id: "novice-status",
    actor: "Novice",
    goal: "Comprendre les statuts sans formation",
    success: "Libellés UX_STATUS + couleurs tone cohérentes",
    maxClicksHint: "Lecture seule",
  },
];

export const FINAL_VALIDATION_CRITERIA = [
  "Composants cohérents (catalogue /design-system à jour)",
  "Pages prioritaires modernisées (Phases 1–6)",
  "Parcours utilisables au clavier (SkipLink, focus visible)",
  "Mobile fonctionnel sur listes et fiches clés",
  "Grands volumes supportés (pagination)",
  "Budgets perf acceptables (pas de régression critique documentée)",
  "Libellés cohérents (vocabulary.ts)",
  "Environnements identifiables (bandeau)",
  "Aucun bouton purement décoratif",
  "Aucune donnée métier perdue",
  "Anciennes fonctions encore opérationnelles",
  "Priorités visibles en < 10 secondes (urgent / manquant / bloquant)",
] as const;
