import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BeWork — Partenaire administratif externalisé BTP & PME",
    short_name: "BeWork",
    description:
      "Partenaire administratif externalisé : pilotage administratif pour le bâtiment — devis, relances, dossiers chantier, forfaits TTC.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fb",
    theme_color: "#1d4ed8",
    lang: "fr",
    scope: "/",
    id: SITE_URL,
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
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
