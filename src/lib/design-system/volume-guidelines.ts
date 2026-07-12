/**
 * Volumes réalistes — exigences UI (pagination / virtualisation).
 */

export const VOLUME_TARGETS = {
  clients: 50,
  chantiers: 100,
  documents: 10_000,
  actions: 1_000,
  notifications: 300,
} as const;

export const VOLUME_UI_RULES = [
  {
    surface: "Listes (clients, chantiers, missions, documents)",
    rule: "Pagination serveur (ou curseur) — jamais tout charger d’un coup.",
    threshold: "≥ 50 lignes → pagination obligatoire",
  },
  {
    surface: "Tableaux larges",
    rule: "overflow-x-auto + colonnes prioritaires ; préférences colonnes visibles.",
    threshold: "≥ 8 colonnes → scroll horizontal + sticky première colonne recommandé",
  },
  {
    surface: "Notifications",
    rule: "Chargement progressif / limite 50 + « Voir plus ».",
    threshold: "≥ 100 → virtualisation ou pages",
  },
  {
    surface: "GED / fichiers",
    rule: "Noms longs : truncate + title attribut ; miniatures lazy.",
    threshold: "≥ 200 fichiers / dossier → pagination",
  },
  {
    surface: "Recherche / filtres",
    rule: "Filtres côté serveur ; debounce 300 ms sur champ texte.",
    threshold: "Toujours pour volumes > 100",
  },
] as const;

export const VOLUME_TEST_CHECKLIST = [
  "50 clients — liste Clients fluide",
  "100 chantiers — KPIs + filtres sans freeze",
  "1 000 actions Pilotage — pagination / filtres",
  "Références et noms de fichiers > 80 caractères — pas de débordement destructeur",
  "Plusieurs rôles (MANAGER, AGENT, CLIENT) — mêmes volumes, droits respectés",
] as const;
