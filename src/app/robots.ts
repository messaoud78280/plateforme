import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Chemins privés, techniques ou non pertinents pour l’indexation (inchangés pour tous les user-agents). */
const DISALLOW: string[] = [
  "/dashboard/",
  "/api/",
  "/connexion/gerante",
  "/connexion/agents",
  "/connexion/clients",
  "/invitation/",
  "/communication-digitale",
];

/** Crawlers recherche IA + moteurs classiques — allow pour visibilité AEO/GEO (ne pas bloquer OAI-SearchBot / PerplexityBot). */
const USER_AGENTS = [
  "*",
  "Googlebot",
  "Google-Extended",
  "Bingbot",
  "Applebot",
  "OAI-SearchBot",
  "GPTBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "cohere-ai",
  "Meta-ExternalAgent",
  "FacebookBot",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: USER_AGENTS.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: DISALLOW,
    })),
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: (() => {
      try {
        return new URL(SITE_URL).host;
      } catch {
        return SITE_URL.replace(/^https?:\/\//, "").split("/")[0] ?? SITE_URL;
      }
    })(),
  };
}
