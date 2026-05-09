/** Guides hors blog (pages /ressources/…) — listés comme « Guides » avec les articles du blog. */
export type ResourceGuidePageItem = {
  href: string;
  title: string;
  excerpt: string;
  /** ISO pour le tri commun avec les articles blog */
  publishedTime: string;
};

export const RESOURCE_GUIDE_PAGE_ITEMS: readonly ResourceGuidePageItem[] = [
  {
    href: "/ressources/compte-rendu-chantier-guide-btp",
    title: "Tuto PDF : créer un compte rendu de chantier avec l’IA",
    excerpt:
      "Guide BeWork : mise en page PDF, transcription depuis notes brut ou vocal, prompts prêts à coller (Claude & skills).",
    publishedTime: "2026-04-01T12:00:00+02:00",
  },
];
