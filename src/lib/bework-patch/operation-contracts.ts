/**
 * Contrats de champs patch — source unique pour ChatGPT + documentation parser.
 * Doit rester aligné avec parse.ts (case update_dependency) et types OpUpdateDependency.
 */
import type { BeworkPatchOpName } from "@/lib/bework-patch/types";

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

export type OperationFieldContract = {
  field: string;
  required?: boolean;
  type: string;
  item?: Record<string, unknown>;
  example?: unknown;
  target?: Record<string, unknown>;
  minimal_operation_example?: unknown;
  meaning?: string;
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
