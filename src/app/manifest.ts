import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BeWork — Assistant administratif externalisé",
    short_name: "BeWork",
    description:
      "Assistant administratif externalisé et assistant virtuel pour PME. Secrétariat à distance, devis, factures, relances.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fb",
    theme_color: "#1d4ed8",
    lang: "fr",
    scope: "/",
    id: SITE_URL,
  };
}
