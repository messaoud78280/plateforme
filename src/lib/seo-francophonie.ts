/**
 * SEO & localisation — marchés francophones (France, Belgique, Suisse, Luxembourg).
 * Hreflang, Open Graph locales, meta descriptions calibrées SERP (~150–160 car.).
 */
import { EXTERNALISATION_ADMIN_BT_PATHS } from "@/lib/externalisation-administrative-btp-geo";
import { absoluteUrl } from "@/lib/site";

/** Locale Open Graph principale (contenu rédigé en français). */
export const SEO_OG_LOCALE_PRIMARY = "fr_FR" as const;

/** Locales Open Graph secondaires (ciblage francophonie sans URLs dédiées). */
export const SEO_OG_ALTERNATE_LOCALES = ["fr_BE", "fr_CH", "fr_LU"] as const;

/** Mention courte pour meta descriptions et extraits. */
export const SEO_GEO_SCOPE_SHORT = "France, Belgique, Suisse, Luxembourg";

export const SEO_GEO_SCOPE_TAG = "FR · BE · CH · LU";

/** Longueur cible Google (desktop/mobile snippets). */
export const SEO_META_DESCRIPTION_MAX = 160;
export const SEO_META_DESCRIPTION_MIN = 140;

/**
 * Tronque une meta description sans couper un mot (ellipsis si nécessaire).
 */
export function clampMetaDescription(text: string, max = SEO_META_DESCRIPTION_MAX): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const cut = normalized.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const body = lastSpace >= SEO_META_DESCRIPTION_MIN - 20 ? cut.slice(0, lastSpace) : cut;
  return `${body.trimEnd()}…`;
}

/**
 * Description meta avec périmètre géographique (une URL canonique, plusieurs marchés).
 */
export function metaDescriptionFrancophonie(
  core: string,
  options?: { withGeoTag?: boolean; max?: number },
): string {
  const withTag = options?.withGeoTag !== false;
  const base = core.replace(/\s*\.\s*$/, "").trim();
  const suffix = withTag ? ` ${SEO_GEO_SCOPE_TAG}.` : ".";
  return clampMetaDescription(`${base}${suffix}`, options?.max);
}

/**
 * Hreflang pour une page unique (même URL pour tous les marchés francophones).
 * Signal : contenu FR pertinent pour FR, BE, CH, LU ; x-default = France.
 */
export function hreflangFrancophonieLanguages(canonicalPath: string): Record<string, string> {
  const url = absoluteUrl(canonicalPath);
  return {
    "fr-FR": url,
    "fr-BE": url,
    "fr-CH": url,
    "fr-LU": url,
    fr: url,
    "x-default": url,
  };
}

/**
 * Hreflang du cluster « externalisation administrative BTP » (4 URLs pays).
 */
export function hreflangExternalisationAdministrativeBtpCluster(): Record<string, string> {
  const p = EXTERNALISATION_ADMIN_BT_PATHS;
  const fr = absoluteUrl(p.france);
  return {
    "fr-FR": fr,
    "fr-BE": absoluteUrl(p.belgique),
    "fr-CH": absoluteUrl(p.suisse),
    "fr-LU": absoluteUrl(p.luxembourg),
    fr,
    "x-default": fr,
  };
}

/** Mots-clés géo réutilisables (signal secondaire). */
export const SEO_KEYWORDS_FRANCOPHONIE = [
  "assistant travaux France",
  "assistant travaux Belgique",
  "assistant travaux Suisse romande",
  "assistant travaux Luxembourg",
  "externalisation administrative BTP francophone",
  "BTP France Belgique Suisse",
  "conducteur de travaux Wallonie",
  "artisan bâtiment Suisse romande",
  "PME construction Luxembourg",
] as const;
