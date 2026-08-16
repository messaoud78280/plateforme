/**
 * GED-UI-3 — Catégories métier BTP (affichage uniquement).
 * Une catégorie principale par document ; pas de second stockage.
 */

export type HubCategoryId =
  | "devis_avenants"
  | "factures_situations"
  | "plans_techniques"
  | "fiches_techniques"
  | "commandes_bl"
  | "fournisseurs"
  | "comptes_rendus"
  | "photos"
  | "doe"
  | "marche_dce"
  | "securite_methodes"
  | "qualite_controles"
  | "autres";

export type HubGroup = "all" | HubCategoryId;

export const HUB_CATEGORY_DEFS: { id: HubCategoryId; label: string }[] = [
  { id: "devis_avenants", label: "Devis & avenants" },
  { id: "factures_situations", label: "Factures & situations" },
  { id: "plans_techniques", label: "Plans & pièces techniques" },
  { id: "fiches_techniques", label: "Fiches techniques" },
  { id: "commandes_bl", label: "Commandes & bons de livraison" },
  { id: "fournisseurs", label: "Fournisseurs" },
  { id: "comptes_rendus", label: "Comptes rendus" },
  { id: "photos", label: "Photos chantier" },
  { id: "doe", label: "DOE / fin de chantier" },
  { id: "marche_dce", label: "Marché / DCE" },
  { id: "securite_methodes", label: "Sécurité / méthodes" },
  { id: "qualite_controles", label: "Qualité / contrôles" },
  { id: "autres", label: "Autres" },
];

/** documentType stocké quand l’utilisateur change manuellement la catégorie. */
export const CATEGORY_TO_DOCUMENT_TYPE: Record<HubCategoryId, string> = {
  devis_avenants: "DEVIS",
  factures_situations: "FACTURE",
  plans_techniques: "PLAN",
  fiches_techniques: "FICHE_TECHNIQUE",
  commandes_bl: "BON_COMMANDE",
  fournisseurs: "FOURNISSEUR",
  comptes_rendus: "COMPTE_RENDU",
  photos: "PHOTO",
  doe: "DOE",
  marche_dce: "MARCHE",
  securite_methodes: "SECURITE",
  qualite_controles: "QUALITE",
  autres: "AUTRE",
};

const DOCUMENT_TYPE_TO_CATEGORY: Record<string, HubCategoryId> = {
  DEVIS: "devis_avenants",
  DEVIS_FOURNISSEUR: "devis_avenants",
  FACTURE: "factures_situations",
  SITUATION: "factures_situations",
  AVOIR: "factures_situations",
  PLAN: "plans_techniques",
  FICHE_TECHNIQUE: "fiches_techniques",
  BON_COMMANDE: "commandes_bl",
  BON_LIVRAISON: "commandes_bl",
  BC: "commandes_bl",
  BL: "commandes_bl",
  CONFIRMATION: "commandes_bl",
  FOURNISSEUR: "fournisseurs",
  ATTESTATION: "fournisseurs",
  COMPTE_RENDU: "comptes_rendus",
  PHOTO: "photos",
  DOE: "doe",
  CONTRAT: "marche_dce",
  MARCHE: "marche_dce",
  "MARCHÉ": "marche_dce",
  SECURITE: "securite_methodes",
  QUALITE: "qualite_controles",
  AUTRE: "autres",
  DOCUMENT: "autres",
};

const FOLDER_TO_CATEGORY: Record<string, HubCategoryId> = {
  "01": "devis_avenants",
  "02": "commandes_bl",
  "03": "plans_techniques",
  "04": "fournisseurs",
  "05": "fournisseurs",
  "06": "comptes_rendus",
  "07": "photos",
  "09": "factures_situations",
  "10": "doe",
  "11": "doe",
  "12": "marche_dce",
  "13": "securite_methodes",
  "14": "qualite_controles",
};

const ENTITY_TO_CATEGORY: Record<string, HubCategoryId> = {
  commercial_quote: "devis_avenants",
  commercial_quote_snapshot: "devis_avenants",
  commercial_invoice: "factures_situations",
  commercial_progress: "factures_situations",
  doe_item: "doe",
  pilotage_photo: "photos",
  purchase_order: "commandes_bl",
  purchase_order_document: "commandes_bl",
};

export function hubCategoryLabel(id: HubGroup): string {
  if (id === "all") return "Tous";
  return HUB_CATEGORY_DEFS.find((c) => c.id === id)?.label ?? id;
}

export function isHubCategoryId(v: string): v is HubCategoryId {
  return HUB_CATEGORY_DEFS.some((c) => c.id === v);
}

/**
 * Classification déterministe — priorité :
 * entityType → poKind → documentType → folder → category → nom (dernier recours).
 */
export function inferHubCategory(opts: {
  category?: string | null;
  documentType?: string | null;
  folderCode?: string | null;
  name?: string | null;
  poKind?: string | null;
  entityTypes?: string[] | null;
}): HubCategoryId {
  const entities = (opts.entityTypes ?? []).map((e) => e.toLowerCase());

  // DOE lié explicitement → DOE même si le fichier est une fiche technique
  if (entities.some((e) => e === "doe_item")) return "doe";

  for (const e of entities) {
    const fromEntity = ENTITY_TO_CATEGORY[e];
    if (fromEntity && fromEntity !== "commandes_bl") return fromEntity;
  }

  const po = (opts.poKind ?? "").toUpperCase();
  if (po === "FICHE_TECHNIQUE") return "fiches_techniques";
  if (po === "DEVIS") return "devis_avenants";
  if (po === "FACTURE") return "factures_situations";
  if (po === "BL" || po === "BC" || po === "CONFIRMATION") return "commandes_bl";
  if (entities.some((e) => e === "purchase_order" || e === "purchase_order_document")) {
    return "commandes_bl";
  }

  const dt = (opts.documentType ?? "").trim().toUpperCase();
  if (dt && DOCUMENT_TYPE_TO_CATEGORY[dt]) {
    return DOCUMENT_TYPE_TO_CATEGORY[dt];
  }

  const code = opts.folderCode ?? "";
  if (code && FOLDER_TO_CATEGORY[code]) {
    return FOLDER_TO_CATEGORY[code];
  }

  const cat = (opts.category ?? "").trim().toLowerCase();
  if (cat === "photos") return "photos";
  if (cat === "plans") return "plans_techniques";
  if (cat === "doe") return "doe";
  if (cat === "fournisseurs") return "fournisseurs";
  if (cat === "marché" || cat === "marche") return "marche_dce";
  if (cat === "factures" || cat === "financier" || cat === "situations") {
    return "factures_situations";
  }
  if (cat === "réunions" || cat === "reunions") return "comptes_rendus";
  if (cat === "sécurité" || cat === "securite" || cat === "méthodes" || cat === "methodes") {
    return "securite_methodes";
  }
  if (cat === "qualité" || cat === "qualite" || cat === "contrôles" || cat === "controles") {
    return "qualite_controles";
  }

  const fromName = categoryFromFilename(opts.name ?? "");
  if (fromName) return fromName;

  return "autres";
}

/** Nom de fichier uniquement si aucune source structurée n’a tranché. */
export function categoryFromFilename(filename: string): HubCategoryId | null {
  const n = filename
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!n.trim()) return null;
  // DOE prime sur « fiche technique » (ex. DOE-Fiche-technique-…)
  if (/\bdoe\b/.test(n)) return "doe";
  if (/fiche.?technique/.test(n)) return "fiches_techniques";
  if (/\bavoir\b|\bsituation\b|\bfacture\b|\bfac-\d|\bfact-\d/.test(n)) {
    return "factures_situations";
  }
  if (/\bdevis\b|\bdev-\d|\bavenant\b/.test(n)) return "devis_avenants";
  if (/\bbon de livraison\b|\bbl[-_ ]?\d|\bbon de commande\b|\bbc[-_ ]?\d/.test(n)) {
    return "commandes_bl";
  }
  if (/compte.?rendu|\bcr[-_ ]?\d/.test(n)) return "comptes_rendus";
  if (/\.dwg\b|\.dxf\b|\.ifc\b|\bplan\b/.test(n)) return "plans_techniques";
  if (/\.(jpe?g|png|webp|heic|gif)\b/.test(n)) return "photos";
  if (/ccap|cctp|dpgf|bpu|dqe|dce\b|\bmarche\b|\bcontrat\b/.test(n)) return "marche_dce";
  if (/ppsps|securite|methode|mode operatoire/.test(n)) return "securite_methodes";
  if (/controle|pv de|qualite|reception/.test(n)) return "qualite_controles";
  if (/attestation|decennale|rc pro|fournisseur/.test(n)) return "fournisseurs";
  return null;
}

export type HubCategoryStat = {
  id: HubCategoryId;
  label: string;
  availableCount: number;
  missingCount: number;
  previewTitles: string[];
};

export function buildCategoryStats(
  rows: {
    group: HubCategoryId;
    title: string;
    isExpectedMissing?: boolean;
  }[],
): HubCategoryStat[] {
  const map = new Map<
    HubCategoryId,
    { available: number; missing: number; titles: string[] }
  >();

  for (const row of rows) {
    const cur = map.get(row.group) ?? { available: 0, missing: 0, titles: [] };
    if (row.isExpectedMissing) cur.missing += 1;
    else cur.available += 1;
    if (cur.titles.length < 3) cur.titles.push(row.title);
    map.set(row.group, cur);
  }

  return HUB_CATEGORY_DEFS.map((def) => {
    const cur = map.get(def.id);
    if (!cur) return null;
    if (cur.available === 0 && cur.missing === 0) return null;
    return {
      id: def.id,
      label: def.label,
      availableCount: cur.available,
      missingCount: cur.missing,
      previewTitles: cur.titles,
    };
  }).filter((x): x is HubCategoryStat => Boolean(x));
}

export function formatCategoryCounts(available: number, missing: number): string {
  const parts: string[] = [];
  if (available > 0) {
    parts.push(`${available} document${available > 1 ? "s" : ""}`);
  }
  if (missing > 0) {
    parts.push(`${missing} à récupérer`);
  }
  if (parts.length === 0) return "0 document";
  // Cas uniquement « à récupérer »
  if (available === 0 && missing > 0) {
    return `${missing} à récupérer`;
  }
  return parts.join(" · ");
}
