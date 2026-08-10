/**
 * SETRIM-DEMO — identité commerciale du *template* de démonstration SETRIM.
 *
 * PLATFORM-ISOLATION-V1 :
 * - DEMO_BRAND / SETRIM_DEMO_BRAND = template de création / reset pour platformKey « setrim »
 * - JAMAIS un fallback runtime dans le CORE (messagerie, documents, sidebar BeWork interne)
 * - Runtime : getPlatformConfigForOrganization({ organizationId, isDemo, companyName, logoUrl })
 *
 * SETRIM = entreprise utilisatrice démo · BeWork = plateforme éditeur.
 */

export type DemoBrandConfig = {
  companyName: string;
  companyDisplayName: string;
  /** Sous-titre co-branding (jamais le nom de la plateforme remplacé). */
  productSecondaryLabel: string;
  contactFirstName: string;
  contactLastName: string;
  contactRoleLabel: string;
  /** Chemin public local — jamais hotlink setrim.fr. */
  logoPath: string | null;
  /** Ancien libellé — migration douce au reset / enrich SETRIM uniquement. */
  legacyCompanyNames: readonly string[];
  logoSourceUrl: string | null;
  logoSourceNote: string;
};

/** Template SETRIM — ne pas importer dans un composant CORE multi-tenant. */
export const SETRIM_DEMO_BRAND: DemoBrandConfig = {
  companyName: "SETRIM",
  companyDisplayName: "SETRIM",
  productSecondaryLabel: "Démonstration BeWork",
  contactFirstName: "Denis",
  contactLastName: "Buret",
  contactRoleLabel: "Direction",
  logoPath: "/brands/setrim/logo.jpg",
  legacyCompanyNames: ["ABC Étanchéité", "ABC Étanchéité (Démo BeWork)"],
  logoSourceUrl: "http://www.setrim.fr/images/logo-setrim.jpg",
  logoSourceNote:
    "Logo officiel header setrim.fr (logo-setrim.jpg, JPEG 1104×167, Adobe Photoshop CC 2015). Copie locale /public/brands/setrim/logo.jpg.",
};

/**
 * @deprecated Prefer SETRIM_DEMO_BRAND — alias conservé pour scripts SETRIM existants.
 * Ne pas utiliser comme fallback hors contexte SETRIM.
 */
export const DEMO_BRAND: DemoBrandConfig = SETRIM_DEMO_BRAND;

export function demoBrandContactFullName(): string {
  return [DEMO_BRAND.contactFirstName, DEMO_BRAND.contactLastName].filter(Boolean).join(" ");
}

export function demoBrandContactFirstName(): string {
  return DEMO_BRAND.contactFirstName;
}

/** Libellé bannière : company session ou affichage template SETRIM si absente (création SETRIM). */
export function demoBrandBannerCompanyLabel(companyName?: string | null): string {
  const name = (companyName?.trim() || DEMO_BRAND.companyDisplayName).replace(
    /\s*\(Démo BeWork\)\s*$/i,
    "",
  );
  return name;
}

export function isLegacyDemoCompanyName(name: string | null | undefined): boolean {
  if (!name) return false;
  const n = name.trim();
  return DEMO_BRAND.legacyCompanyNames.some((legacy) => legacy === n);
}

/**
 * Résout le nom d’entreprise à persister pour une démo SETRIM (migre ABC → SETRIM).
 * Ne pas appeler pour une démo Client B : passer le nom tel quel.
 */
export function resolveDemoCompanyName(stored: string | null | undefined): string {
  if (!stored?.trim() || isLegacyDemoCompanyName(stored)) {
    return DEMO_BRAND.companyName;
  }
  return stored.trim();
}

/**
 * Logo par défaut : logo stocké, sinon logo SETRIM uniquement si org SETRIM / legacy / vide (création SETRIM).
 * Autre prospect → null (pas de contamination logo SETRIM).
 */
export function demoBrandDefaultLogoUrl(
  storedLogoUrl?: string | null,
  companyName?: string | null,
): string | null {
  if (storedLogoUrl?.trim()) return storedLogoUrl.trim();
  const name = companyName?.trim();
  if (
    !name ||
    name === DEMO_BRAND.companyName ||
    name === DEMO_BRAND.companyDisplayName ||
    isLegacyDemoCompanyName(name)
  ) {
    return DEMO_BRAND.logoPath;
  }
  return null;
}
