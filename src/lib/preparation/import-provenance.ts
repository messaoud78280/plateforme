/**
 * Normalisation CREATE métré : provenance legacy + provenance_kind métier.
 * Pure — aucune I/O.
 */
import type { ProjectContextProvenanceKind } from "@/lib/bework-context/types";
import { mapProvenanceKind } from "@/lib/bework-context/provenance";
import {
  IMPORT_PROVENANCES,
  type ImportProvenance,
  type StoredProvenance,
} from "@/lib/preparation/types";

export const CREATE_PROVENANCE_KINDS = [
  "MEASURE",
  "PLAN",
  "CALCULATION",
  "HYPOTHESIS",
  "MANUAL",
  "UNKNOWN",
] as const;

export type CreateProvenanceKind = (typeof CREATE_PROVENANCE_KINDS)[number];

const KIND_SET = new Set<string>(CREATE_PROVENANCE_KINDS);

/** legacy stocké pour le moteur / DB — kind porte la sémantique UI. */
export function legacyFromProvenanceKind(
  kind: CreateProvenanceKind,
): StoredProvenance {
  switch (kind) {
    case "MEASURE":
      return "RELEVE";
    case "MANUAL":
      return "SAISIE_MANUELLE";
    case "HYPOTHESIS":
      return "HYPOTHESE";
    case "PLAN":
    case "CALCULATION":
    case "UNKNOWN":
      return "RELEVE_A_VERIFIER";
  }
}

export function parseProvenanceKindRaw(
  raw: unknown,
): CreateProvenanceKind | null {
  if (typeof raw !== "string") return null;
  const k = raw.trim().toUpperCase().replace(/-/g, "_");
  if (KIND_SET.has(k)) return k as CreateProvenanceKind;
  // alias métier fréquents
  if (k === "HYPOTHESE") return "HYPOTHESIS";
  if (k === "CALCULE" || k === "COMPUTED") return "CALCULATION";
  if (k === "SAISIE_MANUELLE") return "MANUAL";
  if (k === "PLAN_SOURCE" || k === "DOCUMENT") return "PLAN";
  if (k === "RELEVE" || k === "RELEVE_A_VERIFIER") return "MEASURE";
  return null;
}

/**
 * Résout la paire (legacy, kind) depuis le JSON d'import.
 * - provenance_kind explicite prioritaire
 * - sinon mapping depuis provenance / formula
 * - PLAN / CALCULATION ne deviennent JAMAIS HYPOTHESE
 */
export function resolveImportProvenancePair(input: {
  provenance?: unknown;
  provenanceKind?: unknown;
  formula?: string | null;
}): {
  provenance: StoredProvenance | null;
  provenanceKind: CreateProvenanceKind | null;
  note?: string;
} {
  const formula =
    typeof input.formula === "string" && input.formula.trim()
      ? input.formula.trim()
      : null;

  const explicitKind = parseProvenanceKindRaw(input.provenanceKind);
  if (explicitKind) {
    // Formule : kind CALCULATION prioritaire sauf override explicite
    if (formula && explicitKind !== "CALCULATION" && explicitKind !== "HYPOTHESIS") {
      return {
        provenance: null,
        provenanceKind: "CALCULATION",
        note: "Paramètre/ligne à formule : provenance_kind forcé CALCULATION",
      };
    }
    if (formula) {
      return {
        provenance: null,
        provenanceKind: explicitKind === "HYPOTHESIS" ? "HYPOTHESIS" : "CALCULATION",
      };
    }
    return {
      provenance: legacyFromProvenanceKind(explicitKind),
      provenanceKind: explicitKind,
    };
  }

  // provenance string peut déjà être un kind (PLAN, MEASURE…)
  const asKind = parseProvenanceKindRaw(input.provenance);
  if (asKind && !IMPORT_PROVENANCES.includes(input.provenance as ImportProvenance)) {
    if (formula) {
      return { provenance: null, provenanceKind: "CALCULATION" };
    }
    return {
      provenance: legacyFromProvenanceKind(asKind),
      provenanceKind: asKind,
    };
  }

  if (formula) {
    return { provenance: null, provenanceKind: "CALCULATION" };
  }

  const rawProv =
    typeof input.provenance === "string" ? input.provenance.trim() : "";
  if (rawProv && (IMPORT_PROVENANCES as readonly string[]).includes(rawProv)) {
    const legacy = rawProv as ImportProvenance;
    // Sans provenance_kind : mapping historique RELEVE* → MEASURE
    return {
      provenance: legacy,
      provenanceKind: mapProvenanceKind({ provenance: legacy }),
    };
  }

  if (rawProv === "SAISIE_MANUELLE" || rawProv === "CALCULE") {
    const kind = mapProvenanceKind({ provenance: rawProv });
    return {
      provenance: legacyFromProvenanceKind(kind),
      provenanceKind: kind,
    };
  }

  if (!rawProv) {
    return { provenance: "HYPOTHESE", provenanceKind: "HYPOTHESIS" };
  }

  // Inconnu → HYPOTHESIS (comportement historique)
  return {
    provenance: "HYPOTHESE",
    provenanceKind: "HYPOTHESIS",
    note: `provenance « ${rawProv} » inconnue — classée hypothèse`,
  };
}

export function resolveCreateProvenanceKind(input: {
  provenanceKind?: string | null;
  provenance?: string | null;
  formula?: string | null;
}): ProjectContextProvenanceKind {
  const explicit = parseProvenanceKindRaw(input.provenanceKind);
  if (explicit) return explicit;
  return mapProvenanceKind({
    provenance: input.provenance,
    formula: input.formula,
  });
}

/** Compteurs preview CREATE — basés sur provenance_kind (lignes + paramètres). */
export function summarizeCreateProvenance(items: Array<{
  provenanceKind: ProjectContextProvenanceKind | null | undefined;
  provenance?: string | null;
  formula?: string | null;
  /** Valeur absente = vraiment à confirmer. */
  missingValue?: boolean;
}>): {
  measure: number;
  plan: number;
  manual: number;
  calculation: number;
  hypothesis: number;
  unknown: number;
  toConfirm: number;
} {
  let measure = 0;
  let plan = 0;
  let manual = 0;
  let calculation = 0;
  let hypothesis = 0;
  let unknown = 0;
  let toConfirm = 0;

  for (const it of items) {
    const kind = resolveCreateProvenanceKind({
      provenanceKind: it.provenanceKind,
      provenance: it.provenance,
      formula: it.formula,
    });
    switch (kind) {
      case "MEASURE":
        measure += 1;
        break;
      case "PLAN":
        plan += 1;
        break;
      case "MANUAL":
        manual += 1;
        break;
      case "CALCULATION":
        calculation += 1;
        break;
      case "HYPOTHESIS":
        hypothesis += 1;
        break;
      case "UNKNOWN":
        unknown += 1;
        break;
    }
    // À confirmer = UNKNOWN ou valeur absente — PAS les PLAN documentaires
    if (kind === "UNKNOWN" || it.missingValue === true) {
      toConfirm += 1;
    }
  }

  return { measure, plan, manual, calculation, hypothesis, unknown, toConfirm };
}
