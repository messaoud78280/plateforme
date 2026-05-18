import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BeWork — Administratif externalisé BTP (artisans & conducteurs travaux)",
    short_name: "BeWork",
    description:
      "Administratif externalisé France, Belgique, Suisse, Luxembourg : artisans, conducteurs de travaux, devis et dossiers chantier — forfaits TTC.",
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
