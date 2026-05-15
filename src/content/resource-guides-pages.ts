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
