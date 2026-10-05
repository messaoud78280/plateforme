/**
 * Contrats de champs patch — source unique pour ChatGPT + documentation parser.
 * Doit rester aligné avec parse.ts et types Op*.
 */
import type { BeworkPatchOpName } from "@/lib/bework-patch/types";
import type { BeworkPatchIssue } from "@/lib/bework-patch/errors";
import { err } from "@/lib/bework-patch/errors";
import {
  LINE_NATURES,
  LINE_ROLES,
  type LineNature,
  type LineRole,
  type StoredProvenance,
} from "@/lib/preparation/types";

/** Contrat réel du champ changes.depends_on (update_dependency). */
export const UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT = {
  field: "depends_on",
  required: true,
  type: "array",
  item: {
    step_id: {
      type: "string",
      required: true,
      meaning:
        "step_code de la tâche prédécesseur sur le même planning (jamais un id technique opaque si step_code connu)",
    },
    type: {
      type: "string",
      enum: ["FS", "SS", "FF"] as const,
      default: "FS",
      meaning: "FS = Finish-to-Start (défaut), SS = Start-to-Start, FF = Finish-to-Finish",
    },
    lag_days: {
      type: "number",
      default: 0,
      meaning: "Décalage en jours ouvrés après le prédécesseur",
    },
  },
  example: [
    { step_id: "ELEC-CTRL-01", type: "FS", lag_days: 0 },
  ],
  target: {
    entity_type: "PREP_SCHEDULE_TASK",
    required: ["plan_id"],
    identify_task_by: ["task_id", "step_code", "id", "code"],
  },
  minimal_operation_example: {
    op: "update_dependency",
    target: {
      entity_type: "PREP_SCHEDULE_TASK",
      plan_id: "<PLAN_ID>",
      task_id: "<TASK_ID>",
      step_code: "ELEC-REMISE-01",
    },
    changes: {
      depends_on: [{ step_id: "ELEC-CTRL-01", type: "FS", lag_days: 0 }],
    },
  },
} as const;

/**
 * Contrat exact add_line — source unique parse + supported_operations.
 * Payload = `line` (pas `changes`). Target = PREP_STUDY + study_id.
 */
export const ADD_LINE_CONTRACT = {
  field: "line",
  required: true,
  type: "object",
  payload_key: "line",
  meaning:
    "Nouvelle ligne de métré. Ne pas utiliser changes — le parser lit operations[].line.",
  target: {
    entity_type: "PREP_STUDY",
    required: ["study_id"],
  },
  line: {
    code: {
      required: true,
      type: "string",
      max: 40,
      meaning: "Code métier unique dans l’étude (ex. GO.01, TE-12)",
    },
    lot: {
      required: true,
      type: "string",
      max: 120,
      meaning: "Lot / corps d’état court",
    },
    designation: {
      required: true,
      type: "string",
      max: 300,
      meaning: "Désignation prestation (claire pour chiffrage et exécution)",
    },
    unit: {
      required: true,
      type: "string",
      max: 40,
      meaning: "Unité (m2, m3, ml, u…)",
    },
    description: {
      required: false,
      type: "string|null",
      max: 5000,
      meaning: "Description technique optionnelle",
    },
    formula: {
      required: false,
      type: "string|null",
      max: 500,
      meaning: "Formule engine (sinon declared_quantity)",
    },
    declared_quantity: {
      required: false,
      type: "number|null",
      aliases: ["declaredQuantity"],
      meaning: "Quantité déclarée — jamais le champ quantity",
    },
    provenance: {
      required: false,
      type: "enum",
      enum: ["RELEVE", "RELEVE_A_VERIFIER", "HYPOTHESE", "SAISIE_MANUELLE"] as const,
      meaning: "Provenance legacy stockée sur la ligne",
    },
    role: {
      required: false,
      type: "enum",
      enum: ["quote", "indicator", "logistics"] as const,
      default: "quote",
      meaning: "quote = part au devis ; indicator = documentaire",
    },
    nature: {
      required: false,
      type: "enum|null",
      enum: ["en_place", "foisonne", "compacte", "theorique"] as const,
      meaning: "Nature volumétrique éventuelle",
    },
    notes: {
      required: false,
      type: "string|null",
      max: 2000,
      meaning: "Note métier libre",
    },
    provenance_kind: {
      accepted: false,
      meaning:
        "Non accepté sur add_line bework_patch_v1 — réservé au CREATE bework_prep_bundle_v1",
    },
    source_ref: {
      accepted: false,
      meaning: "Non accepté sur add_line bework_patch_v1",
    },
  },
  insert_after_code: {
    required: false,
    type: "string",
    max: 40,
    aliases: ["insertAfterCode"],
    meaning: "Insérer après ce code de ligne existant",
  },
  minimal_valid_example: {
    op: "add_line",
    target: {
      entity_type: "PREP_STUDY",
      study_id: "<STUDY_ID>",
    },
    line: {
      code: "GO.NEW-01",
      lot: "GO",
      designation: "Fourniture et pose — à préciser avec le professionnel",
      unit: "m2",
      declared_quantity: 1,
      provenance: "HYPOTHESE",
      role: "quote",
    },
  },
} as const;

export type AddLineParsed = {
  line: {
    code: string;
    lot: string;
    designation: string;
    unit: string;
    formula?: string | null;
    declared_quantity?: number | null;
    description?: string | null;
    provenance?: StoredProvenance | null;
    role?: LineRole;
    nature?: LineNature | null;
    notes?: string | null;
  };
  insert_after_code?: string | null;
};

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

const PROVENANCES = new Set<string>([
  "RELEVE",
  "RELEVE_A_VERIFIER",
  "HYPOTHESE",
  "SAISIE_MANUELLE",
]);

/**
 * Parse operations[].line pour add_line — utilisé par parse.ts (bework_patch_v1).
 * Source unique avec ADD_LINE_CONTRACT.
 */
export function parseAddLinePayload(
  rawOp: Record<string, unknown>,
  path: string,
  issues: BeworkPatchIssue[],
): AddLineParsed | null {
  if (!isObj(rawOp.line)) {
    issues.push(err("INVALID_FIELD", `${path}.line`, "line obligatoire"));
    return null;
  }
  const lineRaw = rawOp.line;
  const code = str(lineRaw.code, ADD_LINE_CONTRACT.line.code.max);
  const lot = str(lineRaw.lot, ADD_LINE_CONTRACT.line.lot.max);
  const designation = str(lineRaw.designation, ADD_LINE_CONTRACT.line.designation.max);
  const unit = str(lineRaw.unit, ADD_LINE_CONTRACT.line.unit.max);
  if (!code || !lot || !designation || !unit) {
    issues.push(
      err("INVALID_FIELD", `${path}.line`, "code, lot, designation, unit requis"),
    );
    return null;
  }

  let provenance: StoredProvenance | null | undefined;
  if ("provenance" in lineRaw) {
    if (lineRaw.provenance === null) {
      provenance = null;
    } else if (
      typeof lineRaw.provenance === "string" &&
      PROVENANCES.has(lineRaw.provenance)
    ) {
      provenance = lineRaw.provenance as StoredProvenance;
    } else {
      issues.push(
        err(
          "INVALID_FIELD",
          `${path}.line.provenance`,
          `provenance invalide (attendu ${[...PROVENANCES].join(" | ")})`,
        ),
      );
      return null;
    }
  }

  let role: LineRole | undefined;
  if ("role" in lineRaw && lineRaw.role != null) {
    const r = String(lineRaw.role);
    if ((LINE_ROLES as string[]).includes(r)) role = r as LineRole;
    else {
      issues.push(err("INVALID_FIELD", `${path}.line.role`, `rôle inconnu « ${r} »`));
      return null;
    }
  }

  let nature: LineNature | null | undefined;
  if ("nature" in lineRaw) {
    if (lineRaw.nature === null) nature = null;
    else {
      const n = String(lineRaw.nature);
      if ((LINE_NATURES as string[]).includes(n)) nature = n as LineNature;
      else {
        issues.push(
          err("INVALID_FIELD", `${path}.line.nature`, `nature inconnue « ${n} »`),
        );
        return null;
      }
    }
  }

  return {
    line: {
      code,
      lot,
      designation,
      unit,
      formula: str(lineRaw.formula, ADD_LINE_CONTRACT.line.formula.max),
      declared_quantity: num(
        lineRaw.declared_quantity ?? lineRaw.declaredQuantity,
      ),
      description: str(lineRaw.description, ADD_LINE_CONTRACT.line.description.max),
      provenance,
      role,
      nature,
      notes: str(lineRaw.notes, ADD_LINE_CONTRACT.line.notes.max),
    },
    insert_after_code: str(
      rawOp.insert_after_code ?? rawOp.insertAfterCode,
      ADD_LINE_CONTRACT.insert_after_code.max,
    ),
  };
}

export type OperationFieldContract = {
  field: string;
  required?: boolean;
  type: string;
  item?: Record<string, unknown>;
  example?: unknown;
  target?: Record<string, unknown>;
  minimal_operation_example?: unknown;
  /** Alias demandé métier : même objet que minimal_operation_example. */
  minimal_valid_example?: unknown;
  meaning?: string;
  payload_key?: string;
  line?: Record<string, unknown>;
  insert_after_code?: Record<string, unknown>;
};

/** Contrats exportés dans supported_operations (ChatGPT). */
export function fieldContractsForOp(
  op: BeworkPatchOpName,
): OperationFieldContract[] {
  if (op === "update_dependency") {
    return [
      {
        field: UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT.field,
        required: UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT.required,
        type: UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT.type,
        item: UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT.item as unknown as Record<
          string,
          unknown
        >,
        example: UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT.example,
        target: UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT.target as unknown as Record<
          string,
          unknown
        >,
        minimal_operation_example:
          UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT.minimal_operation_example,
      },
    ];
  }
  if (op === "add_line") {
    return [
      {
        field: ADD_LINE_CONTRACT.field,
        required: ADD_LINE_CONTRACT.required,
        type: ADD_LINE_CONTRACT.type,
        payload_key: ADD_LINE_CONTRACT.payload_key,
        meaning: ADD_LINE_CONTRACT.meaning,
        target: ADD_LINE_CONTRACT.target as unknown as Record<string, unknown>,
        line: ADD_LINE_CONTRACT.line as unknown as Record<string, unknown>,
        insert_after_code: ADD_LINE_CONTRACT.insert_after_code as unknown as Record<
          string,
          unknown
        >,
        minimal_operation_example: ADD_LINE_CONTRACT.minimal_valid_example,
        minimal_valid_example: ADD_LINE_CONTRACT.minimal_valid_example,
        example: ADD_LINE_CONTRACT.minimal_valid_example,
      },
    ];
  }
  return [];
}

/** Normalise dependsOnJson persisté (camelCase ou snake_case). */
export function normalizeDependsOnJson(
  raw: unknown,
): Array<{ step_id: string; type: "FS" | "SS" | "FF"; lag_days: number }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ step_id: string; type: "FS" | "SS" | "FF"; lag_days: number }> =
    [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as {
      stepId?: unknown;
      step_id?: unknown;
      type?: unknown;
      lagDays?: unknown;
      lag_days?: unknown;
    };
    const step_id =
      typeof o.step_id === "string" && o.step_id.trim()
        ? o.step_id.trim()
        : typeof o.stepId === "string" && o.stepId.trim()
          ? o.stepId.trim()
          : null;
    if (!step_id) continue;
    const type =
      o.type === "SS" || o.type === "FF" || o.type === "FS" ? o.type : "FS";
    const lagRaw = o.lag_days ?? o.lagDays;
    const lag_days =
      typeof lagRaw === "number" && Number.isFinite(lagRaw) ? lagRaw : 0;
    out.push({ step_id, type, lag_days });
  }
  return out;
}

export function asStringListJson(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && !!x.trim());
}

export function asEquipmentJson(
  raw: unknown,
): Array<{ equipment_id: string; count?: number }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ equipment_id: string; count?: number }> = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as { equipment_id?: string; equipmentId?: string; count?: number };
    const id = o.equipment_id ?? o.equipmentId;
    if (!id || typeof id !== "string") continue;
    out.push({
      equipment_id: id,
      count: typeof o.count === "number" ? o.count : 1,
    });
  }
  return out;
}

export function asSuppliesJson(
  raw: unknown,
): Array<{ supply_id: string; count?: number }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ supply_id: string; count?: number }> = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as { supply_id?: string; supplyId?: string; count?: number };
    const id = o.supply_id ?? o.supplyId;
    if (!id || typeof id !== "string") continue;
    out.push({
      supply_id: id,
      count: typeof o.count === "number" ? o.count : 1,
    });
  }
  return out;
}
