/**
 * SETRIM-DEMO-V1 — identité commerciale de la démonstration BeWork.
 *
 * Une seule source de vérité pour nom entreprise, persona Direction et logo.
 * Changer companyName / contact / logo ici suffit pour une prochaine démo prospect
 * (pas de moteur white-label complexe).
 *
 * SETRIM = entreprise utilisatrice · BeWork = plateforme.
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
  /** Ancien libellé — migration douce au reset / enrich. */
  legacyCompanyNames: readonly string[];
  logoSourceUrl: string | null;
  logoSourceNote: string;
};

export const DEMO_BRAND: DemoBrandConfig = {
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

export function demoBrandContactFullName(): string {
  return [DEMO_BRAND.contactFirstName, DEMO_BRAND.contactLastName].filter(Boolean).join(" ");
}

export function demoBrandContactFirstName(): string {
  return DEMO_BRAND.contactFirstName;
}

/** Libellé bannière : « SETRIM · données fictives » (le suffixe données est ajouté par le composant). */
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

/** Résout le nom d’entreprise à persister (migre ABC → SETRIM). */
export function resolveDemoCompanyName(stored: string | null | undefined): string {
  if (!stored?.trim() || isLegacyDemoCompanyName(stored)) {
    return DEMO_BRAND.companyName;
  }
  return stored.trim();
}

export function demoBrandDefaultLogoUrl(storedLogoUrl?: string | null): string | null {
  if (storedLogoUrl?.trim()) return storedLogoUrl.trim();
  return DEMO_BRAND.logoPath;
}
