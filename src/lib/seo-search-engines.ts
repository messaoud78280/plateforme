import type { Metadata } from "next";

/**
 * Configuration SEO partagée — Google, Bing, Apple (Safari/Siri), DuckDuckGo (via Bing),
 * Yandex, Yahoo, Meta, et crawlers IA (AEO).
 */

/** Chemins exclus de l’indexation (tous user-agents). */
export const SEO_DISALLOW_PATHS = [
  "/dashboard/",
  "/api/",
  "/connexion",
  "/inscription",
  "/connexion/gerente",
  "/connexion/agents",
  "/connexion/clients",
  "/invitation/",
  "/communication-digitale",
] as const;

/**
 * User-agents explicitement autorisés (allow / + disallow privé).
 * DuckDuckGo indexe via Bing ; Safari Spotlight via Applebot + Google pour la recherche web.
 */
export const SEO_CRAWLER_USER_AGENTS = [
  "*",
  // Moteurs classiques
  "Googlebot",
  "Googlebot-Image",
  "Googlebot-News",
  "Google-Extended",
  "Bingbot",
  "BingPreview",
  "Applebot",
  "DuckDuckBot",
  "Slurp",
  "YandexBot",
  "Baiduspider",
  "Sogou",
  "PetalBot",
  "SeznamBot",
  // Réseaux / preview
  "facebookexternalhit",
  "Facebot",
  "Meta-ExternalAgent",
  "FacebookBot",
  "Twitterbot",
  "LinkedInBot",
  // IA / AEO
  "OAI-SearchBot",
  "GPTBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "cohere-ai",
] as const;

/** Directives robots pour pages publiques indexables. */
export const SEO_PUBLIC_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

/** Pages privées ou hors index. */
export const SEO_NOINDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false, noimageindex: true },
};

export type SearchEngineVerificationEnv = {
  google?: string;
  bing?: string;
  yandex?: string;
  yahoo?: string;
  pinterest?: string;
  facebook?: string;
};

/** Balises de vérification propriétaires (Search Console, Bing, Yandex, etc.). */
export function buildSearchEngineVerification(
  env: SearchEngineVerificationEnv = {},
): Metadata["verification"] | undefined {
  const google = env.google?.trim() || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  const bing = env.bing?.trim() || process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();
  const yandex = env.yandex?.trim() || process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION?.trim();
  const yahoo = env.yahoo?.trim() || process.env.NEXT_PUBLIC_YAHOO_SITE_VERIFICATION?.trim();
  const pinterest = env.pinterest?.trim() || process.env.NEXT_PUBLIC_PINTEREST_SITE_VERIFICATION?.trim();
  const facebook = env.facebook?.trim() || process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION?.trim();

  const other: Record<string, string> = {};
  if (bing) other["msvalidate.01"] = bing;
  if (pinterest) other["p:domain_verify"] = pinterest;
  if (facebook) other["facebook-domain-verification"] = facebook;

  if (!google && !yandex && !yahoo && Object.keys(other).length === 0) return undefined;

  return {
    ...(google ? { google } : {}),
    ...(yandex ? { yandex } : {}),
    ...(yahoo ? { yahoo } : {}),
    ...(Object.keys(other).length ? { other } : {}),
  };
}
