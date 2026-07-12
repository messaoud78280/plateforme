/**
 * Migration progressive vers le design system Command Center.
 * Ne jamais supprimer un ancien composant encore référencé.
 */

export type MigrationItem = {
  legacy: string;
  replacement: string;
  status: "obsolete" | "migrate" | "keep-bridge";
  guidance: string;
};

export const DESIGN_SYSTEM_MIGRATION: MigrationItem[] = [
  {
    legacy: "surface-metallic-light",
    replacement: "cc-card / Card",
    status: "migrate",
    guidance: "Remplacer page par page ; conserver la classe CSS tant que des écrans l’utilisent.",
  },
  {
    legacy: "bg-[#1e3a5f] / bg-[#1d4ed8] hardcodés",
    replacement: "btn-cc-primary / bg-bework-navy",
    status: "migrate",
    guidance: "Priorité dashboard et devis ; marketing peut garder accent #1d4ed8 si charte distincte.",
  },
  {
    legacy: "Modales ad hoc (fixed inset-0)",
    replacement: "Modal / Drawer",
    status: "migrate",
    guidance: "Migrer à l’occasion d’un chantier UI ; ne pas tout réécrire d’un coup.",
  },
  {
    legacy: "Tableaux HTML bruts dashboard",
    replacement: "DataTable",
    status: "migrate",
    guidance: "Listes Clients / Documents / Démos déjà migrées — poursuivre missions / agents.",
  },
  {
    legacy: "pilotage-card",
    replacement: "cc-card (bridge)",
    status: "keep-bridge",
    guidance: "Aligné sur tokens --cc-* ; conserver le nom métier Pilotage.",
  },
  {
    legacy: "EmptyState sans actionHref",
    replacement: "EmptyState + actionHref",
    status: "obsolete",
    guidance: "API étendue ; anciens appels onAction restent valides.",
  },
];

export const MIGRATION_STRATEGY = [
  "1. Nouveaux écrans : uniquement composants ui/ + tokens bework-*.",
  "2. Écrans touchés : migrer le header + actions + empty/error dans le même PR.",
  "3. Ne pas supprimer une classe legacy tant que ripgrep trouve des usages.",
  "4. Feature flag commandCenterUi pour bascules ciblées si besoin.",
  "5. Revue visuelle des 10 pages prioritaires avant retrait d’un legacy.",
] as const;
