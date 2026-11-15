import type { MetadataRoute } from "next";
import { SEO_AI_CRAWLER_USER_AGENTS } from "@/lib/seo-ai-discovery";
import {
  SEO_CLASSIC_CRAWLER_USER_AGENTS,
  SEO_DISALLOW_PATHS,
} from "@/lib/seo-search-engines";
import { SITE_URL } from "@/lib/site";

const disallow = [...SEO_DISALLOW_PATHS];

function hostFromSiteUrl(): string {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return SITE_URL.replace(/^https?:\/\//, "").split("/")[0] ?? SITE_URL;
  }
}

export default function robots(): MetadataRoute.Robots {
  const classicRules = SEO_CLASSIC_CRAWLER_USER_AGENTS.map((userAgent) => ({
    userAgent,
    allow: "/" as const,
    disallow,
  }));

  const aiRules = SEO_AI_CRAWLER_USER_AGENTS.map((userAgent) => ({
    userAgent,
    allow: "/" as const,
    disallow,
  }));

  return {
    rules: [...classicRules, ...aiRules],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: hostFromSiteUrl(),
  };
}
