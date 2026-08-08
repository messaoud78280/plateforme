import type { MetadataRoute } from "next";
import { BEWORK_BRAND_SIGNATURE, SEO_VALUE_PROPOSITION } from "@/lib/seo-keywords";
import { SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `BeWork — ${BEWORK_BRAND_SIGNATURE}`,
    short_name: "BeWork",
    description: SEO_VALUE_PROPOSITION,
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fb",
    theme_color: "#1d4ed8",
    lang: "fr",
    scope: "/",
    id: SITE_URL,
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
