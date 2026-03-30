import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BeWork — Partenaire administratif BTP",
    short_name: "BeWork",
    description:
      "Administratif structuré pour le bâtiment : devis, relances, dossiers chantier, forfaits TTC.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fb",
    theme_color: "#1d4ed8",
    lang: "fr",
    scope: "/",
    id: SITE_URL,
  };
}
