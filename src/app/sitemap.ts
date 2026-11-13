import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const SITEMAP_STATIC_LASTMOD = new Date("2026-11-13T00:00:00.000Z");

function entry(
  path: string,
  priority: number,
  changeFrequency: ChangeFreq = "monthly",
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: SITEMAP_STATIC_LASTMOD,
    changeFrequency,
    priority,
  };
}

/** Sitemap commercial BeWork — prestations BTP. */
const BTP_CORE = [
  "/",
  "/conduite-de-travaux",
  "/equipes-tp-vrd",
  "/accompagnement-technique-chantier",
  "/expertises-tce",
  "/pilotage-chantier",
  "/marches-publics-prives",
  "/plateforme-ia",
  "/notre-methode",
  "/a-propos",
  "/demande-de-devis",
  "/contact",
  "/mentions-legales",
  "/politique-confidentialite",
  "/conditions-generales-vente",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return BTP_CORE.map((path) => {
    if (path === "/") return entry(path, 1, "weekly");
    if (
      path === "/conduite-de-travaux" ||
      path === "/equipes-tp-vrd" ||
      path === "/accompagnement-technique-chantier" ||
      path === "/demande-de-devis"
    ) {
      return entry(path, 0.98, "weekly");
    }
    if (
      path === "/mentions-legales" ||
      path === "/politique-confidentialite" ||
      path === "/conditions-generales-vente"
    ) {
      return entry(path, 0.35, "yearly");
    }
    return entry(path, 0.9, "weekly");
  });
}
