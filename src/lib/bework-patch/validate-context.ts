/**
 * Validation contextuelle (lecture seule) — aucune écriture.
 * Compare un patch parsé à un snapshot de contexte / versions fourni.
 */
import { err, warn, type BeworkPatchIssue } from "@/lib/bework-patch/errors";
import type {
  BeworkChatgptContextV1,
  BeworkPatchV1,
} from "@/lib/bework-patch/types";

export type PatchContextSnapshot = {
  organizationId: string;
  projectId: string;
  /** Version actuelle de l’entité d’origine. */
  currentVersion: number;
  /** IDs déjà appliqués (idempotence). */
  appliedPatchIds?: string[];
  /** Paires id↔code connues pour détection mismatch. */
  idCodePairs?: Array<{ id: string; code: string; kind: string }>;
  /** Entités contractuelles (devis ACCEPTED, etc.). */
  protectedEntityIds?: string[];
};

export type ValidatePatchContextResult = {
  ok: boolean;
  errors: BeworkPatchIssue[];
  warnings: BeworkPatchIssue[];
  code?: "VERSION_CONFLICT" | "DUPLICATE_PATCH" | "PROJECT_MISMATCH" | "INVALID";
};

/**
 * Valide un patch contre un snapshot (pas d’accès DB obligatoire).
 * VERSION : strict — mismatch = BLOCKED (pas de force V1).
 */
export function validatePatchContext(
  patch: BeworkPatchV1,
  snapshot: PatchContextSnapshot,
): ValidatePatchContextResult {
  const errors: BeworkPatchIssue[] = [];
  const warnings: BeworkPatchIssue[] = [];

  if (patch.origin.project_id !== snapshot.projectId) {
    errors.push(
      err(
        "PROJECT_MISMATCH",
        "origin.project_id",
        `project_id du patch (${patch.origin.project_id}) ≠ projet ouvert (${snapshot.projectId})`,
      ),
    );
    return { ok: false, errors, warnings, code: "PROJECT_MISMATCH" };
  }

  if (patch.origin.base_version !== snapshot.currentVersion) {
    errors.push(
      err(
        "VERSION_CONFLICT",
        "origin.base_version",
        `Cette section a été modifiée depuis la création du bloc JSON (version actuelle ${snapshot.currentVersion}, patch basé sur v${patch.origin.base_version}). Copiez à nouveau le contexte ChatGPT.`,
      ),
    );
    return { ok: false, errors, warnings, code: "VERSION_CONFLICT" };
  }

  if (snapshot.appliedPatchIds?.includes(patch.patch_id)) {
    errors.push(
      err(
        "DUPLICATE_PATCH",
        "patch_id",
        "Cette modification a déjà été appliquée.",
      ),
    );
    return { ok: false, errors, warnings, code: "DUPLICATE_PATCH" };
  }

  // Cohérence ID + code quand les deux sont fournis
  for (let i = 0; i < patch.operations.length; i++) {
    const op = patch.operations[i]!;
    const t = op.target;
    const id =
      t.id ??
      t.item_id ??
      t.line_id ??
      t.task_id ??
      t.parameter_id ??
      t.measurement_id ??
      null;
    const code =
      t.code ?? t.line_code ?? t.step_code ?? t.parameter_key ?? null;
    if (id && code && snapshot.idCodePairs?.length) {
      const pair = snapshot.idCodePairs.find((p) => p.id === id);
      if (pair && pair.code !== code) {
        errors.push(
          err(
            "TARGET_ID_CODE_MISMATCH",
            `operations[${i}].target`,
            `ID « ${id} » ne correspond plus au code « ${code} » (code actuel : ${pair.code}).`,
          ),
        );
      }
    }

    if (
      snapshot.protectedEntityIds?.length &&
      ((t.quote_id && snapshot.protectedEntityIds.includes(t.quote_id)) ||
        (t.id && snapshot.protectedEntityIds.includes(t.id)))
    ) {
      warnings.push(
        warn(
          "CONTRACTUAL_ENTITY_LINKED",
          `operations[${i}].target`,
          "Entité contractuelle liée — la propagation future devra protéger l’original.",
        ),
      );
    }
  }

  if (errors.length) {
    return { ok: false, errors, warnings, code: "INVALID" };
  }
  return { ok: true, errors, warnings };
}

/**
 * Valide qu’un patch est cohérent avec un contexte ChatGPT exporté.
 */
export function validatePatchAgainstChatgptContext(
  patch: BeworkPatchV1,
  context: BeworkChatgptContextV1,
): ValidatePatchContextResult {
  const snapshot: PatchContextSnapshot = {
    organizationId: "",
    projectId: context.project.id,
    currentVersion: context.target.version,
  };
  const base = validatePatchContext(patch, snapshot);
  if (!base.ok) return base;

  const warnings = [...base.warnings];
  for (const item of context.relationships.quote_items ?? []) {
    if (item.canonical_resolution.status === "PARTIAL") {
      warnings.push(
        warn(
          "PARTIAL_CANONICAL_RESOLUTION",
          `relationships.quote_items[${item.quote_item_id}]`,
          "Ligne de métré liée retrouvée, mais la donnée source précise ne peut pas être déterminée automatiquement.",
        ),
      );
    }
    if (item.canonical_resolution.status === "NONE") {
      warnings.push(
        warn(
          "UNLINKED_QUOTE_ITEM",
          `relationships.quote_items[${item.quote_item_id}]`,
          "Aucune relation fiable vers une donnée technique.",
        ),
      );
    }
  }

  const supportedOps = new Set(context.supported_operations.map((s) => s.op));
  const errors: BeworkPatchIssue[] = [];
  for (let i = 0; i < patch.operations.length; i++) {
    const op = patch.operations[i]!;
    if (!supportedOps.has(op.op)) {
      errors.push(
        err(
          "OPERATION_NOT_ALLOWED_FOR_SECTION",
          `operations[${i}].op`,
          `Opération ${op.op} non listée dans le contexte de la section ${context.section}`,
        ),
      );
    }
  }

  if (errors.length) {
    return { ok: false, errors, warnings, code: "INVALID" };
  }
  return { ok: true, errors, warnings };
}
