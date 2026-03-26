/**
 * Slugs des articles blog — source unique pour le sitemap et le typage des pages.
 * Les clés de `ARTICLES` dans `app/blog/[slug]/page.tsx` doivent correspondre exactement.
 */
export const BLOG_SLUGS = [
  "10-taches-administratives-deleguer-dirigeant",
  "combien-coute-assistant-administratif",
  "assistant-virtuel-vs-assistant-salarie",
  "gagner-5-heures-semaine-deleguer-administratif",
  "externaliser-assistant-administratif-avantages",
  "organiser-journee-dirigeant-avec-assistant",
  "erreurs-a-eviter-deleguer-administratif",
] as const;

export type BlogSlug = (typeof BLOG_SLUGS)[number];
