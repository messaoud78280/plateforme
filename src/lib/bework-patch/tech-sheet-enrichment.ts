/**
 * Enrichissement fiche technique PrepTakeoffLine — détection + consignes ChatGPT.
 * Aucune écriture DB.
 *
 * Profil métier futur (non développé) : GROS_OEUVRE_MAISON pourra fournir
 * prestations / références / exécution / contrôles / réserves types ;
 * ChatGPT n’adaptera alors que au chantier.
 */
import type { BeworkChatgptContextV1 } from "@/lib/bework-patch/types";
import type { PrepTechnicalReference } from "@/lib/preparation/types";
import { UPDATE_LINE_CONTRACT } from "@/lib/bework-patch/operation-contracts";

export type TechSheetLineSnapshot = {
  id: string;
  code: string;
  lot: string;
  designation: string;
  description?: string | null;
  unit: string;
  formula?: string | null;
  declaredQuantity?: number | null;
  computedQuantity?: number | null;
  validatedQuantity?: number | null;
  nature?: string | null;
  provenance?: string | null;
  role: string;
  notes?: string | null;
  includedServices?: string[];
  technicalReferences?: PrepTechnicalReference[] | Array<{
    label: string;
    kind: string;
    note: string | null;
  }>;
  executionNotes?: string | null;
  qualityControls?: string[];
  technicalReservations?: string[];
};

/** Ligne telle qu’exposée dans bework_chatgpt_context_v1 TAKEOFF (snake_case). */
export type ChatgptTakeoffLine = {
  id?: string;
  code?: string;
  lot?: string;
  designation?: string;
  description?: string | null;
  unit?: string;
  formula?: string | null;
  declared_quantity?: number | null;
  computed_quantity?: number | null;
  validated_quantity?: number | null;
  nature?: string | null;
  provenance?: string | null;
  role?: string;
  notes?: string | null;
  included_services?: string[];
  technical_references?: Array<{
    label: string;
    kind: string;
    note: string | null;
  }>;
  execution_notes?: string | null;
  quality_controls?: string[];
  technical_reservations?: string[];
};

export function isEmptyStringList(v: unknown): boolean {
  if (v == null) return true;
  if (!Array.isArray(v)) return true;
  return v.filter((x) => typeof x === "string" && x.trim()).length === 0;
}

export function isEmptyTechRefs(v: unknown): boolean {
  if (v == null) return true;
  if (!Array.isArray(v)) return true;
  return v.every((item) => {
    if (!item || typeof item !== "object") return true;
    const label = (item as { label?: unknown }).label;
    return typeof label !== "string" || !label.trim();
  });
}

export function isEmptyExecutionNotes(v: unknown): boolean {
  return typeof v !== "string" || !v.trim();
}

/** Fiche incomplète si au moins un des 5 blocs structurés est vide. */
export function isTechSheetIncomplete(line: {
  includedServices?: unknown;
  includedServicesJson?: unknown;
  technicalReferences?: unknown;
  technicalReferencesJson?: unknown;
  executionNotes?: unknown;
  qualityControls?: unknown;
  qualityControlsJson?: unknown;
  technicalReservations?: unknown;
  technicalReservationsJson?: unknown;
}): boolean {
  const services = line.includedServices ?? line.includedServicesJson;
  const refs = line.technicalReferences ?? line.technicalReferencesJson;
  const exec = line.executionNotes;
  const qc = line.qualityControls ?? line.qualityControlsJson;
  const res = line.technicalReservations ?? line.technicalReservationsJson;
  return (
    isEmptyStringList(services) ||
    isEmptyTechRefs(refs) ||
    isEmptyExecutionNotes(exec) ||
    isEmptyStringList(qc) ||
    isEmptyStringList(res)
  );
}

/**
 * Lignes à enrichir :
 * - fiche incomplète
 * - role quote (priorité) ou logistics
 * - indicator exclu par défaut
 */
export function selectLinesForTechSheetEnrichment<
  T extends {
    role: string;
    includedServices?: unknown;
    includedServicesJson?: unknown;
    technicalReferences?: unknown;
    technicalReferencesJson?: unknown;
    executionNotes?: unknown;
    qualityControls?: unknown;
    qualityControlsJson?: unknown;
    technicalReservations?: unknown;
    technicalReservationsJson?: unknown;
  },
>(lines: T[]): T[] {
  return lines.filter((l) => {
    if (l.role === "indicator") return false;
    if (l.role !== "quote" && l.role !== "logistics") return false;
    return isTechSheetIncomplete(l);
  });
}

export const TECH_SHEET_ENRICH_INSTRUCTIONS = [
  "Enrichis toutes les lignes de métré techniques listées dans data.lines_to_enrich (fiche incomplète).",
  "Pour chaque ligne concernée, complète UNIQUEMENT les champs structurés manquants : included_services, technical_references, execution_notes, quality_controls, technical_reservations.",
  "Ne modifie pas les quantités, formules, unités, codes ou désignations sauf nécessité explicitement demandée dans ce contexte.",
  "Ne transforme pas le champ notes en fiche structurée : remplis les 5 blocs séparément.",
  "technical_references[].kind doit être exactement INDICATIVE | DOSSIER | TO_VERIFY | PHOTO.",
  "Utilise pour chaque opération le target fourni dans line.patch_target (entity_type PREP_LINE, study_id, line_id, line_code).",
  "study_id est obligatoire sur chaque target — ne jamais l’omettre.",
  "Retourne UN SEUL bework_patch_v1 contenant toutes les opérations update_line nécessaires.",
  "change_intent recommandé : DOCUMENT_EDIT ou TECHNICAL_CORRECTION.",
  "base_version du patch = target.base_version (= study.version).",
  "Ne propose pas d’add_line ni de delete_line pour cet enrichissement.",
] as const;

export function missingTechSheetFields(line: {
  includedServices?: unknown;
  technicalReferences?: unknown;
  executionNotes?: unknown;
  qualityControls?: unknown;
  technicalReservations?: unknown;
}): string[] {
  const missing: string[] = [];
  if (isEmptyStringList(line.includedServices)) missing.push("included_services");
  if (isEmptyTechRefs(line.technicalReferences)) missing.push("technical_references");
  if (isEmptyExecutionNotes(line.executionNotes)) missing.push("execution_notes");
  if (isEmptyStringList(line.qualityControls)) missing.push("quality_controls");
  if (isEmptyStringList(line.technicalReservations)) {
    missing.push("technical_reservations");
  }
  return missing;
}

export function summarizeEnrichLots(
  lines: Array<{ lot: string }>,
): Array<{ lot: string; count: number }> {
  const map = new Map<string, number>();
  for (const l of lines) {
    const lot = l.lot?.trim() || "Sans lot";
    map.set(lot, (map.get(lot) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([lot, count]) => ({ lot, count }))
    .sort((a, b) => a.lot.localeCompare(b.lot, "fr"));
}

export function toEnrichContextLine(
  line: TechSheetLineSnapshot,
  studyId: string,
): Record<string, unknown> {
  const missing = missingTechSheetFields({
    includedServices: line.includedServices,
    technicalReferences: line.technicalReferences,
    executionNotes: line.executionNotes,
    qualityControls: line.qualityControls,
    technicalReservations: line.technicalReservations,
  });
  const qty =
    line.validatedQuantity ?? line.computedQuantity ?? line.declaredQuantity ?? null;
  return {
    id: line.id,
    code: line.code,
    lot: line.lot,
    designation: line.designation,
    description: line.description ?? null,
    unit: line.unit,
    formula: line.formula ?? null,
    quantity: qty,
    declared_quantity: line.declaredQuantity ?? null,
    nature: line.nature ?? null,
    provenance: line.provenance ?? null,
    role: line.role,
    notes: line.notes ?? null,
    current_tech_sheet: {
      included_services: line.includedServices ?? [],
      technical_references: line.technicalReferences ?? [],
      execution_notes: line.executionNotes ?? null,
      quality_controls: line.qualityControls ?? [],
      technical_reservations: line.technicalReservations ?? [],
    },
    missing_fields: missing,
    patch_target: {
      entity_type: "PREP_LINE",
      study_id: studyId,
      line_id: line.id,
      line_code: line.code,
    },
  };
}

export function chatgptLineToSnapshot(line: ChatgptTakeoffLine): TechSheetLineSnapshot {
  return {
    id: typeof line.id === "string" ? line.id : "",
    code: typeof line.code === "string" ? line.code : "",
    lot: typeof line.lot === "string" ? line.lot : "Sans lot",
    designation: typeof line.designation === "string" ? line.designation : "",
    description: line.description ?? null,
    unit: typeof line.unit === "string" ? line.unit : "u",
    formula: line.formula ?? null,
    declaredQuantity: line.declared_quantity ?? null,
    computedQuantity: line.computed_quantity ?? null,
    validatedQuantity: line.validated_quantity ?? null,
    nature: line.nature ?? null,
    provenance: line.provenance ?? null,
    role: typeof line.role === "string" ? line.role : "quote",
    notes: line.notes ?? null,
    includedServices: line.included_services ?? [],
    technicalReferences: line.technical_references ?? [],
    executionNotes: line.execution_notes ?? null,
    qualityControls: line.quality_controls ?? [],
    technicalReservations: line.technical_reservations ?? [],
  };
}

/**
 * Transforme un contexte MODIFY TAKEOFF en contexte d’enrichissement fiches.
 * Conserve project / study / base_version ; n’envoie que les lignes incomplètes.
 */
export function applyEnrichTechSheetsToTakeoffContext(
  ctx: BeworkChatgptContextV1,
): BeworkChatgptContextV1 {
  const studyId = ctx.target?.id ?? "";
  const data = isObj(ctx.data) ? { ...ctx.data } : {};
  const rawLines = Array.isArray(data.lines) ? data.lines : [];
  const snapshots = rawLines
    .filter((l): l is ChatgptTakeoffLine => !!l && typeof l === "object")
    .map((l) => chatgptLineToSnapshot(l as ChatgptTakeoffLine))
    .filter((l) => l.id && l.code);

  const toEnrich = selectLinesForTechSheetEnrichment(snapshots);
  const skippedComplete = snapshots.filter(
    (l) =>
      (l.role === "quote" || l.role === "logistics") &&
      !isTechSheetIncomplete(l),
  ).length;
  const skippedIndicator = snapshots.filter((l) => l.role === "indicator").length;
  const lots = summarizeEnrichLots(toEnrich);

  const linesToEnrich = toEnrich.map((l) => toEnrichContextLine(l, studyId));

  // Contexte allégé : pas de répétition inutile des lignes déjà complètes.
  delete data.lines;
  data.lines_to_enrich = linesToEnrich;
  data.enrichment_task = {
    purpose: "ENRICH_TECH_SHEETS",
    lines_total: snapshots.length,
    lines_to_enrich: toEnrich.length,
    skipped_complete: skippedComplete,
    skipped_indicator: skippedIndicator,
    lots,
    /** Réservé : profil métier type GROS_OEUVRE_MAISON (non branché). */
    trade_profile: null,
    note:
      "Enrichir uniquement lines_to_enrich. Un seul bework_patch_v1 multi update_line.",
  };
  data.instructions = [...TECH_SHEET_ENRICH_INSTRUCTIONS];
  data.operation_contracts = {
    ...(isObj(data.operation_contracts) ? data.operation_contracts : {}),
    update_line: {
      ...UPDATE_LINE_CONTRACT,
      meaning:
        "Pour chaque ligne de lines_to_enrich, une opération update_line avec target = line.patch_target.",
    },
  };
  data.counts = {
    ...(isObj(data.counts) ? data.counts : {}),
    lines: snapshots.length,
    lines_to_enrich: toEnrich.length,
  };
  // Paramètres : garder clés utiles, pas le détail complet si volumineux.
  if (Array.isArray(data.parameters) && data.parameters.length > 40) {
    data.parameters = (data.parameters as unknown[]).slice(0, 40);
    data.parameters_truncated = true;
  }

  return {
    ...ctx,
    data,
    supported_operations: (ctx.supported_operations ?? []).filter(
      (op) => op.op === "update_line",
    ),
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
