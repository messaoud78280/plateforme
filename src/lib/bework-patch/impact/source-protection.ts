/**
 * Garde centrale de provenance — pipeline bework_patch_v1.
 * Délègue la décision à evaluateSourceProtection (bework-context/provenance).
 */
import {
  evaluateSourceProtection,
  mapProvenanceKind,
  provenanceLabelFr,
  type ProjectContextProvenanceKind,
  type SourceProtectionDecision,
} from "@/lib/bework-context/provenance";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import type { BeworkPatchIssue } from "@/lib/bework-patch/errors";
import type {
  DirectChange,
  ImpactLine,
  ImpactParam,
  ImpactStudy,
  ImpactSubgraph,
} from "@/lib/bework-patch/impact/types";

export type SourceProtectionOpResult = {
  opIndex: number;
  field: string;
  label: string;
  currentKind: ProjectContextProvenanceKind;
  proposalKind: ProjectContextProvenanceKind;
  decision: SourceProtectionDecision;
  before: unknown;
  after: unknown;
  unit: string | null;
};

/**
 * Infère la provenance justifiant la proposition ChatGPT.
 * Sans champ explicite → UNKNOWN (source non confirmée).
 * Indices hypothèse dans reason/note → HYPOTHESIS.
 * TECHNICAL_OVERRIDE + motif → MANUAL (validation utilisateur).
 */
export function inferProposalProvenanceKind(input: {
  intent: string;
  reason?: string | null;
  note?: string | null;
  declaredProvenance?: string | null;
}): ProjectContextProvenanceKind {
  if (input.declaredProvenance) {
    return mapProvenanceKind({ provenance: input.declaredProvenance });
  }
  const intent = (input.intent ?? "").toUpperCase();
  if (intent === "TECHNICAL_OVERRIDE") {
    return "MANUAL";
  }
  const blob = `${input.reason ?? ""} ${input.note ?? ""}`.toLowerCase();
  if (
    /\bh-?\d{1,3}\b/.test(blob) ||
    /hypoth[eè]se/.test(blob) ||
    /\bhypothesis\b/.test(blob)
  ) {
    return "HYPOTHESIS";
  }
  return "UNKNOWN";
}

function findParam(
  study: ImpactStudy,
  op: BeworkPatchV1["operations"][number],
): ImpactParam | null {
  if (op.op !== "update_parameter") return null;
  const key = op.target.parameter_key ?? null;
  const id = op.target.parameter_id ?? op.target.id ?? null;
  return (
    study.params.find((p) => (key && p.key === key) || (id && p.id === id)) ??
    null
  );
}

function findLine(
  study: ImpactStudy,
  op: BeworkPatchV1["operations"][number],
): ImpactLine | null {
  if (op.op !== "update_line") return null;
  const code = op.target.line_code ?? op.target.code ?? null;
  const id = op.target.line_id ?? op.target.id ?? null;
  return (
    study.lines.find((l) => (code && l.code === code) || (id && l.id === id)) ??
    null
  );
}

/**
 * Évalue toutes les opérations TAKEOFF sensibles à la provenance.
 * Un seul conflit → status BLOCKED (commit atomique impossible).
 */
export function evaluatePatchSourceProtection(input: {
  patch: BeworkPatchV1;
  subgraph: ImpactSubgraph;
}): {
  results: SourceProtectionOpResult[];
  errors: BeworkPatchIssue[];
  warnings: BeworkPatchIssue[];
  blocked: boolean;
} {
  const { patch, subgraph } = input;
  const study = subgraph.study;
  const results: SourceProtectionOpResult[] = [];
  const errors: BeworkPatchIssue[] = [];
  const warnings: BeworkPatchIssue[] = [];

  if (!study || patch.origin.section !== "TAKEOFF") {
    return { results, errors, warnings, blocked: false };
  }

  patch.operations.forEach((op, opIndex) => {
    if (op.op === "update_parameter" && op.changes.value !== undefined) {
      const param = findParam(study, op);
      if (!param) return;
      const currentKind = mapProvenanceKind({
        provenance: param.provenance,
        formula: param.formula,
      });
      const proposalKind = inferProposalProvenanceKind({
        intent: patch.change_intent,
        reason: patch.reason,
        note: op.changes.note ?? null,
      });
      const decision = evaluateSourceProtection({
        currentKind,
        proposalKind,
        currentValue: param.value,
        proposalValue: op.changes.value,
        intent: patch.change_intent,
        reason: patch.reason,
        fieldLabel: param.label || param.key,
      });
      results.push({
        opIndex,
        field: "value",
        label: param.label || param.key,
        currentKind,
        proposalKind,
        decision,
        before: param.value,
        after: op.changes.value,
        unit: param.unit,
      });
      if (decision.status === "BLOCKED") {
        errors.push({
          code: decision.code,
          path: `operations[${opIndex}]`,
          message: decision.message,
          severity: "error",
        });
      } else if (decision.status === "OVERRIDE_OK" && decision.warning) {
        warnings.push({
          code: "PROTECTED_SOURCE_OVERRIDE",
          path: `operations[${opIndex}]`,
          message: decision.warning,
          severity: "warn",
        });
      }
      return;
    }

    if (op.op === "update_line" && op.changes.declared_quantity !== undefined) {
      const line = findLine(study, op);
      if (!line) return;
      const hasValidated = line.validatedQuantity != null;
      const currentKind = mapProvenanceKind({
        provenance: line.provenance,
        formula: line.formula,
      });
      const proposalKind = inferProposalProvenanceKind({
        intent: patch.change_intent,
        reason: patch.reason,
      });

      // validated_quantity : jamais remplacée silencieusement par declared/computed.
      if (hasValidated) {
        const currentVal = line.validatedQuantity;
        const proposalVal = op.changes.declared_quantity;
        const decision = evaluateSourceProtection({
          currentKind: currentKind === "UNKNOWN" ? "MANUAL" : currentKind,
          proposalKind,
          currentValue: currentVal,
          proposalValue: proposalVal,
          hasValidatedQuantity: true,
          intent: patch.change_intent,
          reason: patch.reason,
          fieldLabel: `${line.code} · quantité validée`,
        });
        results.push({
          opIndex,
          field: "validated_quantity",
          label: `${line.code} · ${line.designation}`,
          currentKind,
          proposalKind,
          decision,
          before: currentVal,
          after: proposalVal,
          unit: line.unit,
        });
        if (decision.status === "BLOCKED") {
          errors.push({
            code: decision.code,
            path: `operations[${opIndex}]`,
            message: decision.message,
            severity: "error",
          });
          // Divergence informative
          if (
            line.computedQuantity != null &&
            currentVal != null &&
            Math.abs(line.computedQuantity - currentVal) > 1e-6
          ) {
            warnings.push({
              code: "VALIDATED_QUANTITY_DIVERGENCE",
              path: `operations[${opIndex}]`,
              message: `Écart entre quantité validée (${currentVal}) et quantité recalculée (${line.computedQuantity}). Aucun remplacement automatique.`,
              severity: "warn",
            });
          }
        } else if (decision.status === "OVERRIDE_OK" && decision.warning) {
          warnings.push({
            code: "PROTECTED_SOURCE_OVERRIDE",
            path: `operations[${opIndex}]`,
            message: decision.warning,
            severity: "warn",
          });
        }
        return;
      }

      const decision = evaluateSourceProtection({
        currentKind,
        proposalKind,
        currentValue: line.declaredQuantity,
        proposalValue: op.changes.declared_quantity,
        intent: patch.change_intent,
        reason: patch.reason,
        fieldLabel: `${line.code} · ${line.designation}`,
      });
      results.push({
        opIndex,
        field: "declared_quantity",
        label: `${line.code} · ${line.designation}`,
        currentKind,
        proposalKind,
        decision,
        before: line.declaredQuantity,
        after: op.changes.declared_quantity,
        unit: line.unit,
      });
      if (decision.status === "BLOCKED") {
        errors.push({
          code: decision.code,
          path: `operations[${opIndex}]`,
          message: decision.message,
          severity: "error",
        });
      } else if (decision.status === "OVERRIDE_OK" && decision.warning) {
        warnings.push({
          code: "PROTECTED_SOURCE_OVERRIDE",
          path: `operations[${opIndex}]`,
          message: decision.warning,
          severity: "warn",
        });
      }
    }
  });

  return {
    results,
    errors,
    warnings,
    blocked: errors.length > 0,
  };
}

/** Enrichit les DirectChange avec provenance / statut protection (preview). */
export function annotateDirectChangesWithProtection(
  directChanges: DirectChange[],
  protection: SourceProtectionOpResult[],
): DirectChange[] {
  if (!protection.length) return directChanges;
  return directChanges.map((c) => {
    const match = protection.find(
      (p) =>
        p.label === c.label ||
        (c.field === "value" && p.field === "value" && p.before === c.before) ||
        (c.field === "declared_quantity" &&
          (p.field === "declared_quantity" || p.field === "validated_quantity")),
    );
    if (!match) return c;
    return {
      ...c,
      currentProvenanceKind: match.currentKind,
      proposalProvenanceKind: match.proposalKind,
      currentProvenanceLabel: provenanceLabelFr(match.currentKind),
      proposalProvenanceLabel: provenanceLabelFr(match.proposalKind),
      protectionStatus: match.decision.status,
      protectionMessage:
        match.decision.status === "BLOCKED"
          ? match.decision.message
          : match.decision.status === "OVERRIDE_OK"
            ? match.decision.warning
            : undefined,
    };
  });
}

/**
 * Signale un écart validated vs computed sans proposer de remplacement.
 */
export function detectValidatedQuantityDivergences(
  study: ImpactStudy,
): BeworkPatchIssue[] {
  const out: BeworkPatchIssue[] = [];
  for (const line of study.lines) {
    if (line.validatedQuantity == null || line.computedQuantity == null) continue;
    if (Math.abs(line.validatedQuantity - line.computedQuantity) <= 1e-6) continue;
    out.push({
      code: "VALIDATED_QUANTITY_DIVERGENCE",
      path: `lines.${line.code}`,
      message: `Écart entre quantité validée (${line.validatedQuantity}) et quantité recalculée (${line.computedQuantity}) sur ${line.code}. Aucun remplacement automatique — l'utilisateur décide.`,
      severity: "warn",
    });
  }
  return out;
}
