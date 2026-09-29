/**
 * Analyse patch universel — lecture seule (Phase C).
 * Direct changes + impacts potentiels (sans propagation).
 */
import { parseBeworkPatch } from "@/lib/bework-patch/parse";
import {
  validatePatchAgainstChatgptContext,
  validatePatchContext,
  type PatchContextSnapshot,
} from "@/lib/bework-patch/validate-context";
import type {
  BeworkChatgptContextV1,
  BeworkPatchOperation,
  BeworkPatchV1,
} from "@/lib/bework-patch/types";
import type { BeworkPatchIssue } from "@/lib/bework-patch/errors";
import {
  canDelegateToPrepPatch,
  toLegacyPrepPatch,
} from "@/lib/bework-patch/adapters/prep";
import {
  canDelegateToQuotePatch,
  toLegacyQuotePatch,
} from "@/lib/bework-patch/adapters/quote";
import { getSectionCapability } from "@/lib/bework-patch/capability";

export type DirectChangePreview = {
  op: string;
  targetSummary: string;
  changesSummary: string;
};

export type PotentialImpact = {
  kind: "TAKEOFF" | "QUOTE" | "PLANNING" | "FOLLOW_UP" | "OTHER";
  label: string;
  detail: string;
};

export type BeworkPatchAnalyzeResult = {
  ok: boolean;
  capability: ReturnType<typeof getSectionCapability>;
  patch: BeworkPatchV1 | null;
  errors: BeworkPatchIssue[];
  warnings: BeworkPatchIssue[];
  infos: string[];
  directChanges: DirectChangePreview[];
  potentialImpacts: PotentialImpact[];
  /** Si délégable vers moteur legacy. */
  legacyDelegate: "quote" | "prep" | null;
  canCommit: boolean;
};

function summarizeTarget(op: BeworkPatchOperation): string {
  const t = op.target;
  const parts = [
    t.entity_type,
    t.parameter_key ?? t.parameter_id,
    t.line_code ?? t.code,
    t.item_id ?? t.id,
    t.step_code,
    t.task_id,
  ].filter(Boolean);
  return parts.join(" · ");
}

function summarizeChanges(op: BeworkPatchOperation): string {
  if ("changes" in op && op.changes && typeof op.changes === "object") {
    return Object.entries(op.changes as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(", ");
  }
  if (op.op === "add_line") return `+ ${op.line.code} ${op.line.designation}`;
  if (op.op === "add_quote_item") return `+ ${op.item.designation}`;
  if (op.op === "add_task") return `+ ${op.task.step_code} ${op.task.name}`;
  if (op.op === "delete_line" || op.op === "delete_quote_item" || op.op === "remove_task") {
    return "Suppression";
  }
  return "—";
}

function collectPotentialImpacts(
  patch: BeworkPatchV1,
  context: BeworkChatgptContextV1 | null,
): PotentialImpact[] {
  const out: PotentialImpact[] = [];
  const seen = new Set<string>();
  const push = (p: PotentialImpact) => {
    const k = `${p.kind}:${p.label}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(p);
  };

  for (const item of context?.relationships.quote_items ?? []) {
    if (item.takeoff_link) {
      push({
        kind: "TAKEOFF",
        label: `Métré ${item.takeoff_link.study_line_code}`,
        detail: `Lien devis → ${item.takeoff_link.study_line_code} (${item.canonical_resolution.status})`,
      });
    }
    for (const s of item.schedule_links ?? []) {
      push({
        kind: "PLANNING",
        label: `Tâche planning`,
        detail: `Plan ${s.plan_id.slice(0, 8)}… · ${s.step_code ?? s.task_id}`,
      });
    }
  }
  for (const line of context?.relationships.takeoff_lines ?? []) {
    push({
      kind: "TAKEOFF",
      label: line.line_code,
      detail: `Ligne métré liée`,
    });
  }
  for (const task of context?.relationships.schedule_tasks ?? []) {
    push({
      kind: "PLANNING",
      label: task.step_code,
      detail: `Tâche planning liée`,
    });
  }

  // Heuristique légère depuis les ops (sans inventer de liens)
  for (const op of patch.operations) {
    if (op.op.startsWith("update_parameter") || op.op.includes("line")) {
      push({
        kind: "QUOTE",
        label: "Devis lié éventuel",
        detail: "Propagation non activée dans cette phase.",
      });
      push({
        kind: "PLANNING",
        label: "Planning lié éventuel",
        detail: "Propagation non activée dans cette phase.",
      });
    }
  }

  return out;
}

export function analyzeBeworkPatchInput(input: {
  raw: unknown;
  snapshot?: PatchContextSnapshot | null;
  context?: BeworkChatgptContextV1 | null;
}): BeworkPatchAnalyzeResult {
  const parsed = parseBeworkPatch(input.raw);
  if (!parsed.ok) {
    return {
      ok: false,
      capability: { mode: "UNAVAILABLE", label: null },
      patch: null,
      errors: parsed.errors,
      warnings: parsed.warnings,
      infos: [],
      directChanges: [],
      potentialImpacts: [],
      legacyDelegate: null,
      canCommit: false,
    };
  }

  const patch = parsed.patch;
  const capability = getSectionCapability(patch.origin.section);
  let errors: BeworkPatchIssue[] = [];
  let warnings = [...parsed.warnings];

  if (input.snapshot) {
    const v = validatePatchContext(patch, input.snapshot);
    errors = [...errors, ...v.errors];
    warnings = [...warnings, ...v.warnings];
  }
  if (input.context) {
    const v = validatePatchAgainstChatgptContext(patch, input.context);
    errors = [...errors, ...v.errors];
    warnings = [...warnings, ...v.warnings];
  }

  const infos: string[] = [];
  const quoteLinks = input.context?.relationships.quote_items?.filter(
    (i) => i.takeoff_link,
  ).length;
  if (quoteLinks) {
    infos.push(`${quoteLinks} ligne(s) devis liée(s) au métré`);
  }
  const partial = warnings.filter((w) => w.code === "PARTIAL_CANONICAL_RESOLUTION");
  if (partial.length) {
    infos.push(`${partial.length} résolution(s) canonique(s) partielle(s)`);
  }

  const directChanges = patch.operations.map((op) => ({
    op: op.op,
    targetSummary: summarizeTarget(op),
    changesSummary: summarizeChanges(op),
  }));

  const potentialImpacts = collectPotentialImpacts(patch, input.context ?? null);

  let legacyDelegate: "quote" | "prep" | null = null;
  if (canDelegateToQuotePatch(patch)) legacyDelegate = "quote";
  else if (canDelegateToPrepPatch(patch)) legacyDelegate = "prep";

  const canCommit =
    capability.mode === "AVAILABLE" &&
    errors.length === 0 &&
    legacyDelegate != null;

  // Vérifier que la conversion legacy fonctionne
  if (canCommit && legacyDelegate === "quote") {
    const d = toLegacyQuotePatch(patch);
    if (!d.ok) {
      errors = [...errors, ...d.errors];
    } else {
      warnings = [...warnings, ...d.warnings];
    }
  }
  if (canCommit && legacyDelegate === "prep") {
    const d = toLegacyPrepPatch(patch);
    if (!d.ok) {
      errors = [...errors, ...d.errors];
    } else {
      warnings = [...warnings, ...d.warnings];
    }
  }

  return {
    ok: errors.length === 0,
    capability,
    patch,
    errors,
    warnings,
    infos,
    directChanges,
    potentialImpacts,
    legacyDelegate: errors.length ? null : legacyDelegate,
    canCommit: capability.mode === "AVAILABLE" && errors.length === 0 && legacyDelegate != null,
  };
}
