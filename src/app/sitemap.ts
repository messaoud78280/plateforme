import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

/** Date de contenu vitrine V3. */
const SITEMAP_STATIC_LASTMOD = new Date("2026-09-10T00:00:00.000Z");

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

/** Sitemap BeWork V3 — uniquement le cœur formation (pas de cluster BTP / prompts). */
const FORMATION_CORE = [
  "/",
  "/formation",
  "/pour-qui",
  "/tarifs",
  "/faq",
  "/contact",
  "/demonstrations",
  "/demonstrations/messagerie",
  "/demonstrations/agenda",
  "/demonstrations/reservation",
  "/demonstrations/crm",
  "/demonstrations/dashboard",
  "/demonstrations/espace-client",
  "/demonstrations/documents",
  "/demonstrations/site",
  "/mentions-legales",
  "/politique-confidentialite",
  "/conditions-generales-vente",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return FORMATION_CORE.map((path) => {
    if (path === "/") return entry(path, 1, "weekly");
    if (path === "/formation" || path === "/demonstrations" || path === "/contact") {
      return entry(path, 0.95, "weekly");
    }
    if (path.startsWith("/demonstrations/")) return entry(path, 0.88);
    if (
      path === "/mentions-legales" ||
      path === "/politique-confidentialite" ||
      path === "/conditions-generales-vente"
    ) {
      return entry(path, 0.35, "yearly");
    }
    return entry(path, 0.9);
  });
}
