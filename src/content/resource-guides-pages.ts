/** Guides hors blog (pages /ressources/…) — listés comme « Guides » avec les articles du blog. */
export type ResourceGuideBadge = "Guide PDF" | "Tuto PDF";

export type ResourceGuidePageItem = {
  href: string;
  title: string;
  excerpt: string;
  /** ISO pour le tri commun avec les articles blog */
  publishedTime: string;
  badge?: ResourceGuideBadge;
};

export const RESOURCE_GUIDE_PAGE_ITEMS: readonly ResourceGuidePageItem[] = [
  {
    href: "/ressources/analyse-dce-chiffrage-btp",
    title: "Analyse DCE et appui chiffrage BTP",
    excerpt:
      "Comment BeWork aide les entreprises à analyser un DCE, structurer les postes, préparer une base de chiffrage et repérer les points d’alerte avant validation.",
    publishedTime: "2026-05-29T10:00:00+02:00",
  },
  {
    href: "/ressources/guide-assistants-travaux-bework",
    title: "Le Guide des Assistants Travaux — 12 missions d’un marché de travaux",
    excerpt:
      "PDF 21 pages : les 12 missions administratives d’un marché de travaux (prise en main, situations, TS, DOE…), classées IA / mixte / humain — prompts Claude, checklist avant signature, ~112 h d’encadrement récupérées par mois.",
    publishedTime: "2026-07-15T08:00:00+02:00",
    badge: "Guide PDF",
  },
  {
    href: "/ressources/guide-moe-bework",
    title: "Guide Maîtrise d’œuvre × IA — 12 missions MOE (Claude)",
    excerpt:
      "PDF 22 pages : tâches IA / mixte / humain pour MOE, BET, architectes et économistes — limites, checklist de relecture et méthode pour récupérer du temps (week-ends).",
    publishedTime: "2026-05-28T08:00:00+02:00",
    badge: "Guide PDF",
  },
  {
    href: "/ressources/guide-cdt-bework",
    title: "Le guide du conducteur de travaux — 6 outils Claude",
    excerpt:
      "PDF 52 pages : DCE, PPSPS, CR, constat de retard, PV de levée, DOE — méthode skills Claude, prompts à copier, 30 à 50 h gagnées par chantier.",
    publishedTime: "2026-05-12T08:00:00+02:00",
    badge: "Guide PDF",
  },
  {
    href: "/ressources/guide-conducteur-de-travaux-ia-bework",
    title: "Guide du conducteur de travaux — 6 outils IA (CR, PPSPS, DCE, DOE)",
    excerpt:
      "PDF gratuit : automatiser les livrables administratifs de chantier avec Claude AI — gains de 30 à 50 h par chantier, 6 tutoriels skills.",
    publishedTime: "2026-05-11T10:00:00+02:00",
    badge: "Guide PDF",
  },
];
