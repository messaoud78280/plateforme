/**
 * Budgets de performance BeWork Command Center.
 * Objectif : ne pas dégrader les Core Web Vitals.
 */

export type PerfBudget = {
  id: string;
  label: string;
  target: string;
  warnAt: string;
  notes: string;
};

export const PERFORMANCE_BUDGETS: PerfBudget[] = [
  {
    id: "lcp",
    label: "Largest Contentful Paint (LCP)",
    target: "≤ 2,5 s",
    warnAt: "> 4 s",
    notes: "Prioriser le contenu visible (header + premier KPI / tableau).",
  },
  {
    id: "inp",
    label: "Interaction to Next Paint (INP)",
    target: "≤ 200 ms",
    warnAt: "> 500 ms",
    notes: "Éviter les handlers lourds sur clic filtre / ouverture modale.",
  },
  {
    id: "cls",
    label: "Cumulative Layout Shift (CLS)",
    target: "≤ 0,1",
    warnAt: "> 0,25",
    notes: "Réserver la hauteur des images, skeletons et bannières.",
  },
  {
    id: "js-initial",
    label: "JS initial (route dashboard)",
    target: "≤ 350 Ko gzip",
    warnAt: "> 500 Ko gzip",
    notes: "Charger Recharts, PDF, éditeurs en dynamic import.",
  },
  {
    id: "css",
    label: "CSS critique",
    target: "≤ 80 Ko gzip",
    warnAt: "> 120 Ko gzip",
    notes: "Pas de lib décorative ; tokens CSS + Tailwind v4.",
  },
  {
    id: "fonts",
    label: "Polices",
    target: "2 familles max (Inter + Rajdhani)",
    warnAt: "3+ familles",
    notes: "font-display: swap ; pas de polices marketing dans le dashboard.",
  },
  {
    id: "ttfb",
    label: "Temps d’affichage initial (TTFB)",
    target: "≤ 800 ms (prod EU)",
    warnAt: "> 1,5 s",
    notes: "Requêtes Prisma ciblées ; pagination systématique.",
  },
];

export const HEAVY_MODULES_LAZY = [
  "recharts (rapports)",
  "aperçu PDF / DocumentPreviewModal",
  "générateurs PDF devis",
  "éditeurs riches / wizards longs",
] as const;

export const PERF_REGRESSION_LOG: {
  date: string;
  route: string;
  metric: string;
  before: string;
  after: string;
  note: string;
}[] = [
  // Exemple de journal — compléter après mesures terrain
];
