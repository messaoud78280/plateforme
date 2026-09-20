/**
 * Enrichissement survey visite — constats, prestations, commercial, photos.
 * Distinct de bework_site_report_v1 (CR chantier documents).
 */

export const BEWORK_SITE_SURVEY_FORMAT = "bework_site_survey_v1" as const;

export type QuantitySource =
  | "measured"
  | "calculated"
  | "declared"
  | "estimated"
  | "proposed"
  | "to_confirm";

export type SiteVisitFinding = {
  id: string;
  zone?: string | null;
  lot?: string | null;
  /** Observation factuelle */
  fact: string;
  /** Hypothèse technique à confirmer — jamais présentée comme certitude */
  hypothesis?: string | null;
  /** À vérifier */
  toVerify?: string | null;
  severity?: "info" | "watch" | "critical" | null;
  photoIds?: string[];
};

export type SiteVisitProposedWork = {
  id: string;
  lot: string;
  zone?: string | null;
  designation: string;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  quantitySource?: QuantitySource | null;
  material?: string | null;
  method?: string | null;
  preparation?: string | null;
  demolition?: string | null;
  evacuation?: string | null;
  finish?: string | null;
  reserve?: string | null;
  /** Checklist prestations annexes (non auto-ajoutées) */
  relatedChecklist?: string[];
};

export type SiteVisitCommercialInfo = {
  budgetAnnounced?: string | null;
  budgetMax?: string | null;
  desiredDelay?: string | null;
  desiredStart?: string | null;
  urgency?: string | null;
  variants?: string | null;
  optionals?: string | null;
  supplyByClient?: string | null;
  supplyByCompany?: string | null;
  specialExpectations?: string | null;
};

export type SurveyStage = "PREP" | "ON_SITE" | "SYNTHESIS" | "QUOTE_READY" | "EXPORTED";

export const SURVEY_STAGE_LABELS: Record<SurveyStage, string> = {
  PREP: "Préparation",
  ON_SITE: "Relevé sur place",
  SYNTHESIS: "Compte rendu & chiffrage",
  QUOTE_READY: "Prêt à chiffrer",
  EXPORTED: "Exporté pour ChatGPT",
};

export const PHOTO_CATEGORIES = [
  { id: "VUE_GENERALE", label: "Vue générale" },
  { id: "ETAT_EXISTANT", label: "État existant" },
  { id: "DEFAUT", label: "Défaut constaté" },
  { id: "MESURE", label: "Mesure" },
  { id: "ACCES", label: "Accès" },
  { id: "RESEAUX", label: "Réseaux" },
  { id: "SUPPORT", label: "Support" },
  { id: "DETAIL", label: "Détail technique" },
  { id: "CONTRAINTE", label: "Contrainte" },
  { id: "AUTRE", label: "Autre" },
] as const;

export const MISSING_CHECK_STATUSES = [
  { id: "A_VERIFIER", label: "À vérifier" },
  { id: "CONFIRME", label: "Confirmé" },
  { id: "NON_APPLICABLE", label: "Non applicable" },
] as const;

/** Champs techniques configurables par lot (moteur extensible). */
export type LotFieldDef = {
  key: string;
  label: string;
  hint?: string;
};

export const LOT_TECHNICAL_FIELDS: Record<string, LotFieldDef[]> = {
  Terrassement: [
    { key: "surface_decaisser", label: "Surface à décaisser" },
    { key: "profondeur", label: "Profondeur" },
    { key: "volume_theorique", label: "Volume théorique" },
    { key: "nature_terrain", label: "Nature apparente du terrain" },
    { key: "etat_sol", label: "État du sol" },
    { key: "acces_engins", label: "Accès aux engins" },
    { key: "stockage", label: "Possibilité de stockage" },
    { key: "evacuation_deblais", label: "Évacuation des déblais" },
    { key: "reemploi", label: "Réemploi éventuel des terres" },
    { key: "reseaux_supposes", label: "Présence supposée de réseaux" },
    { key: "compactage", label: "Compactage nécessaire" },
    { key: "niveau_fini", label: "Niveau fini souhaité" },
  ],
  Maçonnerie: [
    { key: "nature_ouvrage", label: "Nature de l’ouvrage" },
    { key: "dimensions", label: "Dimensions" },
    { key: "epaisseur", label: "Épaisseur" },
    { key: "hauteur", label: "Hauteur" },
    { key: "etat_support", label: "État du support" },
    { key: "fondations", label: "Fondations existantes connues" },
    { key: "reprises", label: "Reprises nécessaires" },
    { key: "demolition", label: "Démolition éventuelle" },
    { key: "accessibilite", label: "Accessibilité" },
    { key: "finitions", label: "Finitions souhaitées" },
  ],
  Revêtements: [
    { key: "surface", label: "Surface" },
    { key: "revetement_existant", label: "Revêtement existant" },
    { key: "etat_dalle", label: "État de la dalle" },
    { key: "pentes", label: "Pentes observées" },
    { key: "evacuation_eaux", label: "Évacuation des eaux" },
    { key: "fissures", label: "Fissures" },
    { key: "affaissements", label: "Affaissements" },
    { key: "depose", label: "Dépose éventuelle" },
    { key: "preparation", label: "Préparation du support" },
    { key: "materiau", label: "Matériau souhaité" },
    { key: "epaisseur_souhaitee", label: "Épaisseur souhaitée" },
  ],
  Carrelage: [
    { key: "surface", label: "Surface" },
    { key: "revetement_existant", label: "Revêtement existant" },
    { key: "etat_dalle", label: "État de la dalle" },
    { key: "pentes", label: "Pentes observées" },
    { key: "evacuation_eaux", label: "Évacuation des eaux" },
    { key: "fissures", label: "Fissures" },
    { key: "depose", label: "Dépose éventuelle" },
    { key: "preparation", label: "Préparation du support" },
    { key: "materiau", label: "Matériau souhaité" },
  ],
  VRD: [
    { key: "type_reseau", label: "Type de réseau" },
    { key: "longueur", label: "Longueur" },
    { key: "profondeur", label: "Profondeur connue" },
    { key: "diametre", label: "Diamètre envisagé" },
    { key: "nature_terrain", label: "Nature du terrain" },
    { key: "regard", label: "Regard existant" },
    { key: "raccordement", label: "Point de raccordement" },
    { key: "altimetrie", label: "Altimétrie" },
    { key: "passage", label: "Contraintes de passage" },
    { key: "reseaux_existants", label: "Réseaux existants" },
    { key: "refection", label: "Réfection après tranchée" },
  ],
  Étanchéité: [
    { key: "surface", label: "Surface" },
    { key: "support", label: "Support existant" },
    { key: "etat", label: "État apparent" },
    { key: "releves", label: "Relevés d’étanchéité" },
    { key: "evacuations", label: "Évacuations" },
    { key: "acroteres", label: "Acrotères" },
    { key: "traversants", label: "Équipements traversants" },
    { key: "accessibilite", label: "Accessibilité" },
    { key: "finitions", label: "Finitions" },
  ],
};

/** Prestations annexes suggérées (à confirmer, jamais auto-ajoutées). */
export const RELATED_WORK_CHECKLIST: Record<string, string[]> = {
  default: [
    "Installation du chantier",
    "Protection des existants",
    "Dépose du revêtement",
    "Décaissement",
    "Chargement des déblais",
    "Évacuation",
    "Géotextile",
    "Couche de fondation",
    "Réglage",
    "Compactage",
    "Lit de pose",
    "Découpes",
    "Bordures",
    "Joints",
    "Finitions",
    "Nettoyage",
  ],
};

export const ZONE_PRESETS = [
  "Façade avant",
  "Façade arrière",
  "Terrasse",
  "Cour",
  "Garage",
  "Entrée",
  "Toiture",
  "Sous-sol",
  "Jardin",
  "RDC",
  "Étage",
  "Zone de terrassement",
  "Réseau enterré",
  "Allée",
] as const;

export const EXTRA_CONSTRAINT_GROUPS = [
  {
    id: "reseaux",
    label: "Réseaux existants",
    options: ["Réseaux non localisés", "Regard existant", "Tranchée à prévoir"],
  },
  {
    id: "protection",
    label: "Protection des existants",
    options: ["Façades à protéger", "Végétation", "Sols intérieurs"],
  },
  {
    id: "appro",
    label: "Approvisionnement / stockage",
    options: ["Stockage limité", "Livraison difficile", "Manutention manuelle"],
  },
  {
    id: "niveaux",
    label: "Niveaux / altimétrie",
    options: ["Niveau fini à confirmer", "Pente à vérifier", "Repère altimétrique manquant"],
  },
  {
    id: "eaux",
    label: "Évacuation des eaux",
    options: ["EP à créer", "Regard trop haut/bas", "Exutoire à confirmer"],
  },
  {
    id: "coactivite",
    label: "Coactivité",
    options: ["Autres entreprises", "Site occupé", "Horaires imposés"],
  },
  {
    id: "formalites",
    label: "Autorisations / formalités",
    options: ["Autorisation à vérifier", "Copropriété", "Voirie"],
  },
] as const;

export function emptyFinding(): SiteVisitFinding {
  return {
    id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fact: "",
    hypothesis: null,
    toVerify: null,
  };
}

export function emptyProposedWork(lot = ""): SiteVisitProposedWork {
  return {
    id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    lot,
    designation: "",
    quantitySource: "to_confirm",
    relatedChecklist: [],
  };
}

export function emptyCommercial(): SiteVisitCommercialInfo {
  return {};
}

export function parseFindings(raw: unknown): SiteVisitFinding[] {
  if (!Array.isArray(raw)) return [];
  const out: SiteVisitFinding[] = [];
  raw.forEach((x, i) => {
    if (!x || typeof x !== "object") return;
    const o = x as Record<string, unknown>;
    const fact = typeof o.fact === "string" ? o.fact : String(o.observation ?? "");
    if (!fact.trim()) return;
    let severity: SiteVisitFinding["severity"] = null;
    if (o.severity === "info" || o.severity === "watch" || o.severity === "critical") {
      severity = o.severity;
    }
    out.push({
      id: typeof o.id === "string" ? o.id : `f_${i}`,
      zone: typeof o.zone === "string" ? o.zone : null,
      lot: typeof o.lot === "string" ? o.lot : null,
      fact,
      hypothesis: typeof o.hypothesis === "string" ? o.hypothesis : null,
      toVerify: typeof o.toVerify === "string" ? o.toVerify : null,
      severity,
      photoIds: Array.isArray(o.photoIds)
        ? o.photoIds.filter((p): p is string => typeof p === "string")
        : [],
    });
  });
  return out;
}

export function parseProposedWorks(raw: unknown): SiteVisitProposedWork[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map((o, i) => ({
      id: typeof o.id === "string" ? o.id : `w_${i}`,
      lot: typeof o.lot === "string" ? o.lot : "",
      zone: typeof o.zone === "string" ? o.zone : null,
      designation: typeof o.designation === "string" ? o.designation : "",
      description: typeof o.description === "string" ? o.description : null,
      quantity: typeof o.quantity === "number" ? o.quantity : null,
      unit: typeof o.unit === "string" ? o.unit : null,
      quantitySource:
        typeof o.quantitySource === "string"
          ? (o.quantitySource as QuantitySource)
          : "to_confirm",
      material: typeof o.material === "string" ? o.material : null,
      method: typeof o.method === "string" ? o.method : null,
      preparation: typeof o.preparation === "string" ? o.preparation : null,
      demolition: typeof o.demolition === "string" ? o.demolition : null,
      evacuation: typeof o.evacuation === "string" ? o.evacuation : null,
      finish: typeof o.finish === "string" ? o.finish : null,
      reserve: typeof o.reserve === "string" ? o.reserve : null,
      relatedChecklist: Array.isArray(o.relatedChecklist)
        ? o.relatedChecklist.filter((x): x is string => typeof x === "string")
        : [],
    }))
    .filter((w) => w.designation.trim());
}

export function parseCommercial(raw: unknown): SiteVisitCommercialInfo {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const s = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : null);
  return {
    budgetAnnounced: s("budgetAnnounced"),
    budgetMax: s("budgetMax"),
    desiredDelay: s("desiredDelay"),
    desiredStart: s("desiredStart"),
    urgency: s("urgency"),
    variants: s("variants"),
    optionals: s("optionals"),
    supplyByClient: s("supplyByClient"),
    supplyByCompany: s("supplyByCompany"),
    specialExpectations: s("specialExpectations"),
  };
}
