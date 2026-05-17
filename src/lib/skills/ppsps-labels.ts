import type { PpspsCoactivity, PpspsDetailLevel, PpspsOperationType } from "@/lib/skills/ppsps-types";

export const PPSPS_OPERATION_TYPES: { value: PpspsOperationType; label: string }[] = [
  { value: "construction_neuve", label: "Construction neuve" },
  { value: "renovation", label: "Rénovation" },
  { value: "extension", label: "Extension" },
  { value: "rehabilitation", label: "Réhabilitation" },
  { value: "demolition_partielle", label: "Démolition partielle" },
  { value: "travaux_exterieurs", label: "Travaux extérieurs / VRD" },
  { value: "autre", label: "Autre" },
];

export const PPSPS_COACTIVITY_OPTIONS: { value: PpspsCoactivity; label: string }[] = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
  { value: "a_confirmer", label: "À confirmer" },
];

export const PPSPS_DETAIL_LEVELS: { value: PpspsDetailLevel; label: string }[] = [
  { value: "synthetique", label: "Synthétique" },
  { value: "standard", label: "Standard" },
  { value: "detaille", label: "Détaillé" },
  { value: "tres_detaille", label: "Très détaillé pour dossier PPSPS" },
];

export const PPSPS_TRADES: readonly string[] = [
  "Gros œuvre",
  "Maçonnerie",
  "VRD",
  "Terrassement",
  "Charpente",
  "Couverture",
  "Étanchéité",
  "Menuiseries extérieures",
  "Menuiseries intérieures",
  "Plâtrerie / isolation",
  "Électricité",
  "Plomberie / CVC",
  "Peinture / finitions",
  "Démolition",
  "Espaces verts",
  "Autre",
] as const;

export function operationTypeLabel(v: PpspsOperationType, other?: string): string {
  if (v === "autre" && other?.trim()) return other.trim();
  return PPSPS_OPERATION_TYPES.find((o) => o.value === v)?.label ?? v;
}

export function coactivityLabel(v: PpspsCoactivity): string {
  return PPSPS_COACTIVITY_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

export function detailLevelLabel(v: PpspsDetailLevel): string {
  return PPSPS_DETAIL_LEVELS.find((o) => o.value === v)?.label ?? v;
}
