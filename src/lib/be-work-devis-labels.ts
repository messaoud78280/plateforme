import type {
  BeWorkPriceDocSourceType,
  WorkItemQualityLevel,
  WorkItemStatus,
} from "@prisma/client";

export { WORK_ITEM_UNITS, normalizeUnit, unitComparisonKey, isWorkItemUnit } from "./be-work-devis-units";

export const SOURCE_TYPE_LABELS: Record<BeWorkPriceDocSourceType, string> = {
  devis: "Devis",
  bpu: "BPU",
  dpgf: "DPGF",
  marche_public: "Marché public",
  estimation_interne: "Estimation interne",
  autre: "Autre",
};

export const QUALITY_LEVEL_LABELS: Record<WorkItemQualityLevel, string> = {
  standard: "Standard",
  confort: "Confort",
  premium: "Premium",
};

export const WORK_ITEM_STATUS_LABELS: Record<WorkItemStatus, string> = {
  brouillon: "Brouillon",
  a_completer: "À compléter",
  a_verifier: "À vérifier",
  valide: "Validé",
  archive: "Archivé",
};

export function isWorkItemStatus(v: string): v is WorkItemStatus {
  return ["brouillon", "a_completer", "a_verifier", "valide", "archive"].includes(v);
}

export function isWorkItemQualityLevel(v: string): v is WorkItemQualityLevel {
  return ["standard", "confort", "premium"].includes(v);
}

export function isBeWorkPriceDocSourceType(v: string): v is BeWorkPriceDocSourceType {
  return ["devis", "bpu", "dpgf", "marche_public", "estimation_interne", "autre"].includes(v);
}
