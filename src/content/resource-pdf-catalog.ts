/**
 * Inventaire des PDF canoniques dans /public/ressources/pdf/
 * — source de vérité pour la répartition Guides vs Tutos.
 * Les fichiers avec espaces ou noms legacy (Tuto_Skill_*, Guide_CDT_*) sont des doublons à ignorer.
 */
export type ResourcePdfKind = "guide" | "tuto";

export type ResourcePdfCatalogEntry = {
  /** Fichier dans public/ressources/pdf/ */
  pdfFile: string;
  kind: ResourcePdfKind;
  /** Route de la page ressource */
  href: string;
};

/** Guides PDF (compilation / article long) */
export const RESOURCE_PDF_GUIDES: readonly ResourcePdfCatalogEntry[] = [
  {
    pdfFile: "guide-claude-btp-bework.pdf",
    kind: "guide",
    href: "/ressources/guide-claude-btp-bework",
  },
  {
    pdfFile: "guide-assistants-travaux-bework.pdf",
    kind: "guide",
    href: "/ressources/guide-assistants-travaux-bework",
  },
  {
    pdfFile: "guide-moe-bework.pdf",
    kind: "guide",
    href: "/ressources/guide-moe-bework",
  },
  {
    pdfFile: "guide-cdt-bework.pdf",
    kind: "guide",
    href: "/ressources/guide-cdt-bework",
  },
  {
    pdfFile: "guide-conducteur-de-travaux-ia-bework.pdf",
    kind: "guide",
    href: "/ressources/guide-conducteur-de-travaux-ia-bework",
  },
] as const;

/** Tutoriels PDF (skills Claude + plaquettes métier, 1 page = 1 tuto) */
export const RESOURCE_PDF_TUTOS: readonly ResourcePdfCatalogEntry[] = [
  { pdfFile: "tuto-skill-analyse-ccap-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-analyse-ccap-bework" },
  { pdfFile: "tuto-skill-planning-chantier-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-planning-chantier-bework" },
  { pdfFile: "tuto-skill-recouvrement-rg-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-recouvrement-rg-bework" },
  { pdfFile: "bework-maitrise-doeuvre.pdf", kind: "tuto", href: "/ressources/bework-maitrise-doeuvre" },
  { pdfFile: "tuto-skill-rdv-client-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-rdv-client-bework" },
  { pdfFile: "tuto-skill-analyse-dce-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-analyse-dce-bework" },
  { pdfFile: "tuto-skill-ppsps-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-ppsps-bework" },
  { pdfFile: "tuto-skill-cr-chantier-bework.pdf", kind: "tuto", href: "/ressources/compte-rendu-chantier-guide-btp" },
  { pdfFile: "tuto-skill-constat-retard-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-constat-retard-bework" },
  { pdfFile: "tuto-skill-pv-levee-reserves-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-pv-levee-reserves-bework" },
  { pdfFile: "tuto-skill-doe-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-doe-bework" },
  { pdfFile: "tuto-skill-pic-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-pic-bework" },
  { pdfFile: "tuto-skill-ordre-de-service-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-ordre-de-service-bework" },
  { pdfFile: "tuto-skill-dc4-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-dc4-bework" },
  { pdfFile: "tuto-skill-soged-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-soged-bework" },
  { pdfFile: "tuto-dispatch-bework.pdf", kind: "tuto", href: "/ressources/tuto-dispatch-bework" },
  { pdfFile: "tuto-tri-dce-claude-chrome-bework.pdf", kind: "tuto", href: "/ressources/tuto-tri-dce-claude-chrome-bework" },
  { pdfFile: "tuto-skill-chiffrage-devis-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-chiffrage-devis-bework" },
  { pdfFile: "tuto-skill-analyse-express-cctp-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-analyse-express-cctp-bework" },
  { pdfFile: "tuto-skill-metre-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-metre-bework" },
  { pdfFile: "tuto-skill-duerp-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-duerp-bework" },
  { pdfFile: "tuto-skill-memoire-technique-bework.pdf", kind: "tuto", href: "/ressources/tuto-skill-memoire-technique-bework" },
] as const;

export const RESOURCE_PDF_CATALOG: readonly ResourcePdfCatalogEntry[] = [
  ...RESOURCE_PDF_GUIDES,
  ...RESOURCE_PDF_TUTOS,
];

const PDF_PUBLIC_PATH_BY_HREF: Readonly<Record<string, string>> = Object.fromEntries(
  RESOURCE_PDF_CATALOG.map((e) => [e.href, `/ressources/pdf/${e.pdfFile}`]),
);

/** Chemin public du PDF associé à une page ressource, ou `undefined` si aucun PDF catalogué. */
export function getResourcePdfPublicPath(href: string): string | undefined {
  return PDF_PUBLIC_PATH_BY_HREF[href];
}

/** Slug analytics / dataLayer à partir de la route ressource. */
export function resourceSlugFromHref(href: string): string {
  const normalized = href.startsWith("/") ? href.slice(1) : href;
  return normalized.replace(/^ressources\//, "") || "resource";
}
