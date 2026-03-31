import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/connexion/gerante",
          "/connexion/agents",
          "/connexion/clients",
          "/invitation/",
          "/communication-digitale",
        ],
      },
    ],
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
