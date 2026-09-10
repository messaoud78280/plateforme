/**
 * Chemins publics legacy à retirer de l’accès (confidentialité / positionnement V3).
 * Utilisé par proxy + robots — le contenu ne doit plus être servi.
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

/** Landings SaaS / BTP — redirigées vers la formation (plus de promesse plateforme). */
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

export function isBeworkV3ConfidentialPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (p.startsWith("/ressources/pdf/")) return true;
  return BEWORK_V3_CONFIDENTIAL_PREFIXES.some((prefix) => p.startsWith(prefix.toLowerCase()));
}

export function isBeworkV3LegacyBtpPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (BEWORK_V3_LEGACY_RESOURCE_HUBS.some((h) => p === h || p === `${h}/`)) return true;
  // Éditoriaux BTP sous /ressources/* non listés comme confidentiels
  if (p.startsWith("/ressources/")) return true;
  return BEWORK_V3_LEGACY_BTP_PREFIXES.some((prefix) => {
    const pre = prefix.toLowerCase();
    return p === pre || p === `${pre}/` || p.startsWith(pre);
  });
}
