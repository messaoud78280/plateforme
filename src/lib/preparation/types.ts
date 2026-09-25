/**
 * Métré & Préparation de chantier — types partagés serveur / navigateur.
 */

export const PREP_BUNDLE_FORMAT = "bework_prep_bundle_v1" as const;
export const LEGACY_FOUNDATIONS_FORMAT = "bework_foundations_demo_bundle_v1" as const;

export const DEMO_WATERMARK = "DÉMONSTRATION — NON CONTRACTUEL";

/** Provenances autorisées dans un JSON importé. */
export const IMPORT_PROVENANCES = ["RELEVE", "RELEVE_A_VERIFIER", "HYPOTHESE"] as const;
export type ImportProvenance = (typeof IMPORT_PROVENANCES)[number];

/** Provenances stockées (SAISIE_MANUELLE attribuée par BeWork uniquement). */
export type StoredProvenance = ImportProvenance | "SAISIE_MANUELLE";

/** Provenances de base propagées par le moteur. */
export type BaseProvenance = StoredProvenance | "CONSTANTE";

export const PROVENANCE_LABELS: Record<BaseProvenance | "CALCULE", string> = {
  RELEVE: "Relevé sur document",
  RELEVE_A_VERIFIER: "Relevé à vérifier",
  HYPOTHESE: "Hypothèse technique",
  SAISIE_MANUELLE: "Saisie manuelle",
  CONSTANTE: "Constante dans la formule",
  CALCULE: "Calculé",
};

export type LineRole = "quote" | "indicator" | "logistics";
export const LINE_ROLES: LineRole[] = ["quote", "indicator", "logistics"];
export const ROLE_LABELS: Record<LineRole, string> = {
  quote: "Quantité devis",
  indicator: "Indicateur technique",
  logistics: "Logistique",
};

export type LineNature = "en_place" | "foisonne" | "compacte" | "theorique";
export const LINE_NATURES: LineNature[] = ["en_place", "foisonne", "compacte", "theorique"];
export const NATURE_LABELS: Record<LineNature, string> = {
  en_place: "En place",
  foisonne: "Foisonné",
  compacte: "Compacté",
  theorique: "Théorique",
};

export type StudyMode = "DEMONSTRATION" | "PROFESSIONAL";
export type DossierStatus = "DEMONSTRATION" | "PRO_A_VALIDER" | "PRO_VALIDE";
export const DOSSIER_STATUS_LABELS: Record<DossierStatus, string> = {
  DEMONSTRATION: "Dossier de démonstration",
  PRO_A_VALIDER: "Dossier professionnel à valider",
  PRO_VALIDE: "Dossier professionnel validé",
};

export type PrepIssue = {
  path: string;
  message: string;
  severity: "error" | "warn";
};

/** Paramètre tel que consommé par le moteur et l'interface. */
export type PrepParamDTO = {
  key: string;
  label: string;
  unit: string;
  value: number | null;
  formula: string | null;
  provenance: StoredProvenance | null;
  sourceRef: string | null;
  evidence: { kind?: string; location?: string; quote?: string } | null;
  hypothesisId: string | null;
  note: string | null;
  sortOrder: number;
  originalValue: number | null;
  originalProvenance: StoredProvenance | null;
  modifiedAt: string | null;
};

/** Ligne de métré telle que consommée par le moteur et l'interface. */
export type PrepLineDTO = {
  code: string;
  lot: string;
  subLot: string | null;
  designation: string;
  description: string | null;
  unit: string;
  elementIds: string[];
  formula: string | null;
  declaredQuantity: number | null;
  provenance: StoredProvenance | null;
  literalProvenance: StoredProvenance | null;
  justification: string | null;
  role: LineRole;
  nature: LineNature | null;
  dependsOnDecisions: string[];
  notes: string | null;
  sortOrder: number;
  originalDeclared: number | null;
  originalProvenance: StoredProvenance | null;
  validatedQuantity: number | null;
  validatedAt: string | null;
};

export type PrepLot = { code: string; label: string };
export type PrepElement = {
  id: string;
  code: string;
  kind: string | null;
  label: string;
  parameterPrefix: string | null;
  sourceRef: string | null;
};
export type PrepHypothesis = {
  id: string;
  statement: string;
  reason: string | null;
  toConfirmWith: string | null;
};
export type PrepCheck = {
  id: string;
  label: string;
  target: string | null;
  expected: number;
};
export type PrepDecision = {
  id: string;
  question: string;
  affects: string[];
  blockingFor: string[];
};
export type PrepSource = {
  id: string;
  filename: string | null;
  planNumber: string | null;
  title: string | null;
  revision: string | null;
  scale: string | null;
  page: number | null;
  isRaster: boolean | null;
  legibility: string | null;
  note: string | null;
};
