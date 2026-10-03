/**
 * Tests protection des données sources — A→I (aucune écriture DB).
 * node --import tsx src/lib/bework-patch/impact/source-protection.test.ts
 */
import assert from "node:assert/strict";
import {
  evaluateSourceProtection,
  mapProvenanceKind,
} from "@/lib/bework-context/provenance";
import { analyzePatchImpact } from "@/lib/bework-patch/impact/analyze-impact";
import { evaluateCommitEligibility } from "@/lib/bework-patch/commit/eligibility";
import {
  evaluatePatchSourceProtection,
  inferProposalProvenanceKind,
} from "@/lib/bework-patch/impact/source-protection";
import { emptySubgraph, type ImpactSubgraph } from "@/lib/bework-patch/impact/types";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import { resolveCanonicalTakeoffQuantity } from "@/lib/preparation/schedule/resolve-planning-source";
import { simulateTakeoffFromParamChange } from "@/lib/bework-patch/impact/simulate-takeoff";

const STUDY_ID = "study_src_prot";
const PROJECT_ID = "proj_src_prot";

function baseStudy(params: ImpactSubgraph["study"]): ImpactSubgraph {
  const g = emptySubgraph(PROJECT_ID);
  g.study = params;
  return g;
}

function patchParam(input: {
  key: string;
  value: number | null;
  intent?: BeworkPatchV1["change_intent"];
  reason?: string | null;
  note?: string;
  extraOps?: BeworkPatchV1["operations"];
}): BeworkPatchV1 {
  return {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: `patch_${input.key}_${input.value}`,
    origin: {
      section: "TAKEOFF",
      project_id: PROJECT_ID,
      entity_id: STUDY_ID,
      base_version: 1,
    },
    change_intent: input.intent ?? "TECHNICAL_CORRECTION",
    reason: input.reason ?? "Proposition ChatGPT",
    operations: [
      {
        op: "update_parameter",
        target: {
          entity_type: "PREP_PARAMETER",
          study_id: STUDY_ID,
          parameter_key: input.key,
        },
        changes: {
          value: input.value,
          ...(input.note ? { note: input.note } : {}),
        },
      },
      ...(input.extraOps ?? []),
    ],
  };
}

// --- TEST A — MANUAL 0.25 ← HYPOTHESIS 0.80 → BLOCKED ---
{
  const decision = evaluateSourceProtection({
    currentKind: "MANUAL",
    proposalKind: "HYPOTHESIS",
    currentValue: 0.25,
    proposalValue: 0.8,
    intent: "TECHNICAL_CORRECTION",
    reason: "Hypothèse H-04 profondeur 0,80",
  });
  assert.equal(decision.status, "BLOCKED");
  if (decision.status === "BLOCKED") {
    assert.equal(decision.code, "PROTECTED_SOURCE_CONFLICT");
  }
  console.log("ok — TEST A MANUAL←HYPOTHESIS BLOCKED");
}

// --- TEST B — MEASURE 0.50 ← HYPOTHESIS 0.70 → BLOCKED ---
{
  const decision = evaluateSourceProtection({
    currentKind: "MEASURE",
    proposalKind: "HYPOTHESIS",
    currentValue: 0.5,
    proposalValue: 0.7,
    intent: "FIELD_UPDATE",
  });
  assert.equal(decision.status, "BLOCKED");
  console.log("ok — TEST B MEASURE←HYPOTHESIS BLOCKED");
}

// --- TEST C — PLAN 0.50 ← UNKNOWN 0.70 → BLOCKED ---
{
  const decision = evaluateSourceProtection({
    currentKind: "PLAN",
    proposalKind: "UNKNOWN",
    currentValue: 0.5,
    proposalValue: 0.7,
    intent: "TECHNICAL_CORRECTION",
  });
  assert.equal(decision.status, "BLOCKED");
  console.log("ok — TEST C PLAN←UNKNOWN BLOCKED");
}

// --- TEST D — validated_quantity ≠ computed → pas de remplacement auto ---
{
  const subgraph = baseStudy({
    id: STUDY_ID,
    title: "Métré",
    version: 1,
    params: [],
    lines: [
      {
        id: "line1",
        code: "TE-01",
        designation: "Fouille",
        unit: "m³",
        formula: null,
        declaredQuantity: 11.4,
        computedQuantity: 11.4,
        validatedQuantity: 36.48,
        provenance: "SAISIE_MANUELLE",
        role: "quote",
      },
    ],
  });
  const patch: BeworkPatchV1 = {
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_validated",
    origin: {
      section: "TAKEOFF",
      project_id: PROJECT_ID,
      entity_id: STUDY_ID,
      base_version: 1,
    },
    change_intent: "TECHNICAL_CORRECTION",
    reason: "Recalcul",
    operations: [
      {
        op: "update_line",
        target: {
          entity_type: "PREP_LINE",
          study_id: STUDY_ID,
          line_code: "TE-01",
        },
        changes: { declared_quantity: 11.4 },
      },
    ],
  };
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.ok(
    impact.errors.some((e) => e.code === "PROTECTED_SOURCE_CONFLICT"),
    "validated_quantity protégée",
  );
  assert.ok(
    impact.warnings.some((w) => w.code === "VALIDATED_QUANTITY_DIVERGENCE"),
    "divergence signalée",
  );
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, false);
  console.log("ok — TEST D validated_quantity protégée + divergence");
}

// --- TEST E — MANUAL + TECHNICAL_OVERRIDE + motif → autorisé ---
{
  const decision = evaluateSourceProtection({
    currentKind: "MANUAL",
    proposalKind: "MANUAL",
    currentValue: 0.25,
    proposalValue: 0.3,
    intent: "TECHNICAL_OVERRIDE",
    reason: "Correction lecture plan — profondeur confirmée 0,30 m",
  });
  assert.equal(decision.status, "OVERRIDE_OK");

  const subgraph = baseStudy({
    id: STUDY_ID,
    title: "Métré",
    version: 1,
    params: [
      {
        id: "p1",
        key: "fouille.profondeur_commune",
        label: "Profondeur commune",
        value: 0.25,
        unit: "m",
        formula: null,
        provenance: "SAISIE_MANUELLE",
      },
    ],
    lines: [],
  });
  const patch = patchParam({
    key: "fouille.profondeur_commune",
    value: 0.3,
    intent: "TECHNICAL_OVERRIDE",
    reason: "Correction lecture plan — profondeur confirmée 0,30 m",
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.equal(impact.errors.length, 0);
  assert.ok(
    impact.warnings.some((w) => w.code === "PROTECTED_SOURCE_OVERRIDE"),
  );
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, true);
  console.log("ok — TEST E TECHNICAL_OVERRIDE autorisé");
}

// --- TEST F — null + hypothèse → pas de commit auto ---
{
  const decision = evaluateSourceProtection({
    currentKind: "UNKNOWN",
    proposalKind: "HYPOTHESIS",
    currentValue: null,
    proposalValue: 0.8,
    intent: "TECHNICAL_CORRECTION",
    reason: "Hypothèse H-04",
  });
  assert.equal(decision.status, "BLOCKED");

  const subgraph = baseStudy({
    id: STUDY_ID,
    title: "Métré",
    version: 1,
    params: [
      {
        id: "p1",
        key: "fouille.profondeur_commune",
        label: "Profondeur",
        value: null,
        unit: "m",
        formula: null,
        provenance: null,
      },
    ],
    lines: [],
  });
  const patch = patchParam({
    key: "fouille.profondeur_commune",
    value: 0.8,
    intent: "TECHNICAL_CORRECTION",
    reason: "Selon hypothèse H-04",
    note: "hypothèse H-04",
  });
  assert.equal(
    inferProposalProvenanceKind({
      intent: patch.change_intent,
      reason: patch.reason,
      note: "hypothèse H-04",
    }),
    "HYPOTHESIS",
  );
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.ok(impact.errors.some((e) => e.code === "PROTECTED_SOURCE_CONFLICT"));
  assert.equal(evaluateCommitEligibility({ patch, impact }).ok, false);
  console.log("ok — TEST F null+hypothèse bloqué (à confirmer)");
}

// --- TEST G — calcul dérivé de MANUAL → autorisé, provenance CALCULATION ---
{
  assert.equal(
    mapProvenanceKind({ provenance: null, formula: "L * l * p" }),
    "CALCULATION",
  );
  const study = {
    id: STUDY_ID,
    title: "Métré",
    version: 1,
    params: [
      {
        id: "pL",
        key: "longueur",
        label: "Longueur",
        value: 10,
        unit: "m",
        formula: null,
        provenance: "SAISIE_MANUELLE",
      },
      {
        id: "pl",
        key: "largeur",
        label: "Largeur",
        value: 0.5,
        unit: "m",
        formula: null,
        provenance: "SAISIE_MANUELLE",
      },
      {
        id: "pp",
        key: "profondeur",
        label: "Profondeur",
        value: 0.25,
        unit: "m",
        formula: null,
        provenance: "SAISIE_MANUELLE",
      },
    ],
    lines: [
      {
        id: "lineV",
        code: "VOL-01",
        designation: "Volume",
        unit: "m³",
        formula: "longueur * largeur * profondeur",
        declaredQuantity: null,
        role: "quote",
      },
    ],
  };
  // Recalcul moteur (pas d'écrasement de profondeur par hypothèse)
  const sim = simulateTakeoffFromParamChange({
    study,
    paramUpdates: {},
    lineDeclaredUpdates: {},
  });
  const vol = sim.afterByCode.get("VOL-01");
  assert.ok(vol != null);
  assert.ok(Math.abs((vol as number) - 1.25) < 1e-9);
  // Modifier profondeur MANUAL sans override = bloqué
  const subgraph = baseStudy(study);
  const bad = analyzePatchImpact({
    patch: patchParam({
      key: "profondeur",
      value: 0.8,
      reason: "hypothèse ancienne H-04",
    }),
    subgraph,
  });
  assert.ok(bad.errors.some((e) => e.code === "PROTECTED_SOURCE_CONFLICT"));
  console.log("ok — TEST G calcul MANUAL autorisé ; écrasement hypothèse bloqué");
}

// --- TEST H — 10 ops dont 1 violation → commit entier refusé ---
{
  const params = Array.from({ length: 9 }, (_, i) => ({
    id: `ph${i}`,
    key: `hypo_${i}`,
    label: `Hypo ${i}`,
    value: 1 + i,
    unit: "m",
    formula: null as string | null,
    provenance: "HYPOTHESE" as string | null,
  }));
  params.push({
    id: "p_manual",
    key: "fouille.profondeur_commune",
    label: "Profondeur commune",
    value: 0.25,
    unit: "m",
    formula: null,
    provenance: "SAISIE_MANUELLE",
  });
  const subgraph = baseStudy({
    id: STUDY_ID,
    title: "Métré",
    version: 1,
    params,
    lines: [],
  });
  const extraOps: BeworkPatchV1["operations"] = params.slice(0, 9).map((p) => ({
    op: "update_parameter" as const,
    target: {
      entity_type: "PREP_PARAMETER" as const,
      study_id: STUDY_ID,
      parameter_key: p.key,
    },
    changes: { value: (p.value as number) + 0.01 },
  }));
  const patch = patchParam({
    key: "fouille.profondeur_commune",
    value: 0.8,
    reason: "selon H-04",
    note: "hypothèse H-04",
    extraOps,
  });
  assert.equal(patch.operations.length, 10);
  const impact = analyzePatchImpact({ patch, subgraph });
  assert.ok(impact.errors.some((e) => e.code === "PROTECTED_SOURCE_CONFLICT"));
  const elig = evaluateCommitEligibility({ patch, impact });
  assert.equal(elig.ok, false);
  assert.equal(
    elig.ok === false && elig.code,
    "PROTECTED_SOURCE_CONFLICT",
  );
  console.log("ok — TEST H commit atomique refusé (1 violation / 10)");
}

// --- TEST I — métré→planning : HYPOTHESIS ne devient pas VALIDATED ---
{
  const resolved = resolveCanonicalTakeoffQuantity({
    code: "TE-01",
    unit: "m³",
    validatedQuantity: null,
    computedQuantity: 11.4,
    declaredQuantity: 11.4,
    provenance: "HYPOTHESE",
  });
  assert.equal(resolved.quantity, 11.4);
  assert.equal(resolved.provenance, "HYPOTHESIS");
  assert.notEqual(resolved.provenance, "VALIDATED");

  const withValidated = resolveCanonicalTakeoffQuantity({
    code: "TE-01",
    unit: "m³",
    validatedQuantity: 36.48,
    computedQuantity: 11.4,
    provenance: "HYPOTHESE",
  });
  assert.equal(withValidated.provenance, "VALIDATED");
  assert.equal(withValidated.quantity, 36.48);
  console.log("ok — TEST I hypothèse ≠ validée (propagation planning)");
}

// Pipeline analyze — MANUAL ← H-04
{
  const subgraph = baseStudy({
    id: STUDY_ID,
    title: "C-01 fondations",
    version: 2,
    params: [
      {
        id: "p_prof",
        key: "fouille.profondeur_commune",
        label: "Profondeur de fouille commune",
        value: 0.25,
        unit: "m",
        formula: null,
        provenance: "SAISIE_MANUELLE",
      },
    ],
    lines: [],
  });
  const patch = patchParam({
    key: "fouille.profondeur_commune",
    value: 0.8,
    reason: "Remplacer par hypothèse H-04",
    note: "H-04",
  });
  const guard = evaluatePatchSourceProtection({ patch, subgraph });
  assert.equal(guard.blocked, true);
  assert.equal(guard.errors[0]?.code, "PROTECTED_SOURCE_CONFLICT");
  const direct = analyzePatchImpact({ patch, subgraph }).directChanges[0];
  assert.equal(direct?.protectionStatus, "BLOCKED");
  assert.equal(direct?.currentProvenanceLabel, "SAISIE MANUELLE");
  console.log("ok — pipeline preview PROTECTED_SOURCE_CONFLICT");
}

console.log("\n✅ source-protection tests A–I OK");
