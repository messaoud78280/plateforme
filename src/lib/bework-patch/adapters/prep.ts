/**
 * Adapter : bework_patch_v1 → bework_prep_patch_v1 (délégation sûre).
 * Aucune écriture — conversion pure pour le moteur métré existant.
 */
import { PREP_PATCH_FORMAT } from "@/lib/preparation/chatgpt-patch/types";
import type {
  BeworkPrepPatchV1,
  PrepPatchOperation,
} from "@/lib/preparation/chatgpt-patch/types";
import { err, warn, type BeworkPatchIssue } from "@/lib/bework-patch/errors";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";

export type PrepDelegateResult =
  | { ok: true; prepPatch: BeworkPrepPatchV1; warnings: BeworkPatchIssue[] }
  | { ok: false; errors: BeworkPatchIssue[]; warnings: BeworkPatchIssue[] };

const PREP_OPS = new Set([
  "update_parameter",
  "update_line",
  "add_line",
  "delete_line",
  "update_hypothesis",
]);

export function canDelegateToPrepPatch(patch: BeworkPatchV1): boolean {
  return patch.operations.every((op) => PREP_OPS.has(op.op));
}

export function toLegacyPrepPatch(patch: BeworkPatchV1): PrepDelegateResult {
  const warnings: BeworkPatchIssue[] = [
    warn(
      "LEGACY_PATCH_DELEGATED",
      "$",
      "Délégation vers le moteur bework_prep_patch_v1 existant",
    ),
  ];
  const errors: BeworkPatchIssue[] = [];

  if (!canDelegateToPrepPatch(patch)) {
    errors.push(
      err(
        "UNKNOWN_OPERATION",
        "operations",
        "Le patch contient des opérations hors métré — délégation prep impossible",
      ),
    );
    return { ok: false, errors, warnings };
  }

  const operations: PrepPatchOperation[] = [];
  let studyId: string | null = null;

  for (const op of patch.operations) {
    if (op.op === "update_parameter") {
      studyId = op.target.study_id;
      const key = op.target.parameter_key ?? op.target.parameter_id ?? op.target.id;
      if (!key) {
        errors.push(err("INVALID_TARGET", "target", "parameter_key manquant"));
        continue;
      }
      operations.push({
        op: "update_parameter",
        key,
        changes: {
          value: op.changes.value,
          label: op.changes.label,
          note: op.changes.note,
        },
      });
    } else if (op.op === "update_line") {
      studyId = op.target.study_id;
      const code = op.target.line_code ?? op.target.code ?? "";
      if (!code) {
        errors.push(err("INVALID_TARGET", "target", "line_code manquant"));
        continue;
      }
      operations.push({
        op: "update_line",
        code,
        changes: {
          designation: op.changes.designation,
          description: op.changes.description,
          declaredQuantity: op.changes.declared_quantity,
          lot: op.changes.lot,
          notes: op.changes.notes,
        },
      });
    } else if (op.op === "add_line") {
      studyId = op.target.study_id;
      operations.push({
        op: "add_line",
        line: {
          code: op.line.code,
          lot: op.line.lot,
          designation: op.line.designation,
          unit: op.line.unit,
          formula: op.line.formula,
          declaredQuantity: op.line.declared_quantity,
          description: op.line.description,
          provenance: op.line.provenance ?? undefined,
          role: op.line.role,
          nature: op.line.nature,
          notes: op.line.notes,
        },
        insertAfterCode: op.insert_after_code,
      });
    } else if (op.op === "delete_line") {
      studyId = op.target.study_id;
      const code = op.target.line_code ?? op.target.code ?? "";
      operations.push({ op: "delete_line", code });
    } else if (op.op === "update_hypothesis") {
      studyId = op.target.study_id;
      operations.push({
        op: "update_hypothesis",
        id: op.target.id,
        changes: {
          statement: op.changes.statement,
          reason: op.changes.reason,
        },
      });
    }
  }

  if (errors.length || !operations.length) {
    return { ok: false, errors, warnings };
  }

  const prepPatch: BeworkPrepPatchV1 = {
    format: PREP_PATCH_FORMAT,
    patchId: patch.patch_id,
    target: {
      studyId: studyId ?? patch.origin.entity_id,
      baseVersion: patch.origin.base_version,
    },
    operations,
  };

  return { ok: true, prepPatch, warnings };
}
