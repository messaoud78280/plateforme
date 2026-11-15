import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const SITEMAP_STATIC_LASTMOD = new Date("2026-11-15T00:00:00.000Z");

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

/** Piliers commerciaux — priorité SEO maximale. */
const BTP_PILLARS = [
  "/",
  "/conduite-de-travaux",
  "/equipes-tp-vrd",
  "/demande-de-devis",
] as const;

/** Compléments ingénierie / marchés. */
const BTP_COMPLEMENT = [
  "/ingenierie-et-marches-btp",
  "/marches-publics-prives",
  "/expertises-tce",
  "/accompagnement-technique-chantier",
  "/pilotage-chantier",
  "/plateforme-ia",
  "/notre-methode",
  "/a-propos",
  "/contact",
] as const;

/** Silo formation — indexable, priorité moyenne. */
const BTP_FORMATION = [
  "/formation-professionnelle-btp",
  "/formation-conducteur-de-travaux",
  "/formation-chef-de-chantier",
  "/formation-chef-equipe-tp-vrd",
  "/formation-compagnons-chantier",
  "/formation-modes-operatoires-chantier",
  "/organisme-formation",
] as const;

const BTP_LEGAL = [
  "/mentions-legales",
  "/politique-confidentialite",
  "/conditions-generales-vente",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const pillars = BTP_PILLARS.map((path) => {
    if (path === "/") return entry(path, 1, "weekly");
    return entry(path, 0.98, "weekly");
  });

  const complement = BTP_COMPLEMENT.map((path) => {
    if (path === "/ingenierie-et-marches-btp") return entry(path, 0.88, "weekly");
    if (path === "/contact") return entry(path, 0.85, "monthly");
    return entry(path, 0.86, "weekly");
  });

  const formation = BTP_FORMATION.map((path) =>
    entry(path, path === "/formation-professionnelle-btp" ? 0.72 : 0.65, "monthly"),
  );

  const legal = BTP_LEGAL.map((path) => entry(path, 0.35, "yearly"));

  return [...pillars, ...complement, ...formation, ...legal];
}
