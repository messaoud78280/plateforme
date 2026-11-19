/**
 * Chemins publics legacy — confidentialité / migration SEO vers le site BTP.
 * Utilisé par proxy + robots — le contenu ne doit plus être servi comme offre commerciale.
 */

/** Ressources qui exposent outils, prompts, méthode ou stack. */
export const BEWORK_V3_CONFIDENTIAL_PREFIXES = [
  "/ressources/tuto-skill-",
  "/ressources/tuto-dispatch",
  "/ressources/tuto-tri-dce",
  "/ressources/guide-",
  "/ressources/bework-maitrise-doeuvre",
  "/ressources/compte-rendu-chantier-guide-btp",
  "/ressources/pdf/",
] as const;

/** Hubs ressources encore indexés — retirer du public indexable. */
export const BEWORK_V3_LEGACY_RESOURCE_HUBS = [
  "/ressources",
  "/ressources/guides",
  "/ressources/tutos",
] as const;

/**
 * Anciennes landings SaaS / BTP / formation commerciale.
 * Redirigées vers les nouvelles pages de prestations (ou l’accueil).
 */
export const BEWORK_V3_LEGACY_BTP_PREFIXES = [
  "/services",
  "/assistant-travaux-",
  "/assistant-administratif-",
  "/assistants-administratifs-taches",
  "/externaliser-administratif",
  "/externalisation-administrative-btp-",
  "/reponse-appel-offres-btp",
  "/facturation-chorus-pro-btp",
  "/gestion-marche-public-btp",
  "/promoteurs-immobiliers",
  "/admin-btp-sans-recruter",
  "/comparatif-assistance-travaux-btp",
  "/checklist-depot-appel-offres-btp",
  "/relance-devis-btp",
  "/impayes-btp-relances",
  "/situation-travaux-btp",
  "/dict-dt-travaux",
  "/avenant-chantier",
  "/suivi-fournisseurs-chantier",
  "/devis-retard-btp",
  "/chantier-mal-suivi",
  "/facture-impayee-btp",
  "/artisan-deborde-administratif",
  "/cas-clients",
  "/pilotage-travaux",
  "/blog",
] as const;

/**
 * Ancien funnel formation « créer avec l’IA » (hors silo BTP).
 * Les nouvelles pages `/formation-*` métier BTP restent indexables.
 */
export const BEWORK_FORMATION_COMMERCIAL_EXACT = [
  "/formation",
  "/pour-qui",
  "/tarifs",
  "/faq",
] as const;

export const BEWORK_FORMATION_COMMERCIAL_PREFIXES = [
  "/demonstrations",
] as const;

/** Nouveau silo formation BTP — ne pas rediriger. */
export const BEWORK_FORMATION_BTP_ALLOWLIST = [
  "/formation-professionnelle-btp",
  "/formation-conducteur-de-travaux",
  "/formation-chef-de-chantier",
  "/formation-chef-equipe-tp-vrd",
  "/formation-compagnons-chantier",
  "/formation-modes-operatoires-chantier",
] as const;

/** Destinations 301/308 pour chemins legacy connus. */
export const BEWORK_LEGACY_REDIRECT_MAP: Record<string, string> = {
  "/pilotage-travaux": "/pilotage-chantier",
  "/reponse-appel-offres-btp": "/marches-publics-prives",
  "/gestion-marche-public-btp": "/marches-publics-prives",
  "/checklist-depot-appel-offres-btp": "/marches-publics-prives",
  "/situation-travaux-btp": "/pilotage-chantier",
  "/chantier-mal-suivi": "/conduite-de-travaux",
  "/services": "/conduite-de-travaux",
  "/formation": "/formation-professionnelle-btp",
  "/pour-qui": "/a-propos",
  "/tarifs": "/demande-de-devis",
  "/demonstrations": "/plateforme-ia",
  "/faq": "/contact",
};

export function isBeworkV3ConfidentialPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (p.startsWith("/ressources/pdf/")) return true;
  return BEWORK_V3_CONFIDENTIAL_PREFIXES.some((prefix) =>
    p.startsWith(prefix.toLowerCase()),
  );
}

export function isBeworkV3LegacyBtpPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (BEWORK_V3_LEGACY_RESOURCE_HUBS.some((h) => p === h || p === `${h}/`)) {
    return true;
  }
  if (p.startsWith("/ressources/")) return true;
  return BEWORK_V3_LEGACY_BTP_PREFIXES.some((prefix) => {
    const pre = prefix.toLowerCase();
    return p === pre || p === `${pre}/` || p.startsWith(pre);
  });
}

export function isBeworkFormationBtpAllowlisted(pathname: string): boolean {
  const p = pathname.toLowerCase().replace(/\/$/, "") || "/";
  return BEWORK_FORMATION_BTP_ALLOWLIST.some((path) => p === path.toLowerCase());
}

export function isBeworkFormationCommercialPath(pathname: string): boolean {
  if (isBeworkFormationBtpAllowlisted(pathname)) return false;
  const p = pathname.toLowerCase().replace(/\/$/, "") || "/";
  if (BEWORK_FORMATION_COMMERCIAL_EXACT.some((path) => p === path.toLowerCase())) {
    return true;
  }
  return BEWORK_FORMATION_COMMERCIAL_PREFIXES.some((prefix) => {
    const pre = prefix.toLowerCase();
    return p === pre || p.startsWith(`${pre}/`);
  });
}

/** Résout la destination de redirection pour un chemin legacy. */
export function resolveLegacyMarketingRedirect(pathname: string): string {
  const p = pathname.toLowerCase().replace(/\/$/, "") || "/";
  if (isBeworkFormationBtpAllowlisted(p)) return p;
  if (BEWORK_LEGACY_REDIRECT_MAP[p]) return BEWORK_LEGACY_REDIRECT_MAP[p];

  if (p.startsWith("/demonstrations")) return "/plateforme-ia";
  if (p === "/formation" || p.startsWith("/formation/")) {
    return "/formation-professionnelle-btp";
  }
  if (p.startsWith("/assistant-travaux") || p.startsWith("/pilotage")) {
    return "/pilotage-chantier";
  }
  if (
    p.includes("appel-offres") ||
    p.includes("marche-public") ||
    p.includes("chorus")
  ) {
    return "/marches-publics-prives";
  }
  if (isBeworkV3LegacyBtpPath(pathname)) return "/conduite-de-travaux";
  if (isBeworkFormationCommercialPath(pathname)) return "/";
  return "/";
}
