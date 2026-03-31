/**
 * URL canonique du site (SEO, Open Graph, JSON-LD, sitemap).
 * Définir NEXT_PUBLIC_SITE_URL en prod (ex. https://bework.fr).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://bework.fr").replace(/\/$/, "");

/** Alias de SITE_URL (compat SEO / anciens extraits) — préférer SITE_URL ou absoluteUrl() dans le nouveau code */
export const BASE_URL = SITE_URL;

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

/**
 * URLs pour JSON-LD Organization.sameAs (LinkedIn, profil Google Business, annuaires…).
 * Définir NEXT_PUBLIC_ORG_SAME_AS en prod, URLs séparées par des virgules ou des retours à la ligne.
 * Ex. NEXT_PUBLIC_ORG_SAME_AS=https://www.linkedin.com/company/votre-page,https://...
 */
export function getOrgSameAs(): string[] {
  const raw = process.env.NEXT_PUBLIC_ORG_SAME_AS?.trim();
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http"));
}
