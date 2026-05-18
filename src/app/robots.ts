import type { MetadataRoute } from "next";
import {
  SEO_CRAWLER_USER_AGENTS,
  SEO_DISALLOW_PATHS,
} from "@/lib/seo-search-engines";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: SEO_CRAWLER_USER_AGENTS.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: [...SEO_DISALLOW_PATHS],
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
