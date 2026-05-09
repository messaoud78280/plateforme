/**
 * Contenu des articles blog — source unique (liste, pages, sitemap, SEO).
 */

export type BlogBodyBlock = { type: "h2" | "p"; content: string };

export type BlogArticle = {
  title: string;
  description: string;
  /** Résumé carte sur /blog ; par défaut = description */
  excerpt?: string;
  keywords: string[];
  /** ISO 8601 — Open Graph & JSON-LD */
  publishedTime: string;
  modifiedTime?: string;
  /** Thème pour schema.org articleSection */
  articleSection?: string;
  body: BlogBodyBlock[];
};

/** Aucun article publié pour l’instant — ajouter des entrées `slug: { ... }` pour alimenter /blog et le sitemap. */
export const BLOG_ARTICLES: Record<string, BlogArticle> = {};

export type BlogSlug = string;

export const BLOG_SLUGS: BlogSlug[] = Object.keys(BLOG_ARTICLES);
