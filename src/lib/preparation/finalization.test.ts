/**
 * Tests — éligibilité validation finale + invalidation + sourceFormat.
 * Exécution : npx tsx src/lib/preparation/finalization.test.ts
 */
import assert from "node:assert/strict";
import {
  evaluatePrepStudyFinalizationEligibility,
  prepSourceFormatLabel,
  shouldInvalidateStudyFinalValidation,
} from "@/lib/preparation/finalization";
import type { EngineResult } from "@/lib/preparation/engine/compute";

function makeEngine(
  entries: Array<{ code: string; value?: number | null; error?: string | null }>,
): Pick<EngineResult, "nodes"> {
  const nodes = new Map();
  for (const e of entries) {
    nodes.set(e.code, {
      value: e.value ?? null,
      error: e.error ?? null,
      deps: [],
    });
  }
  return { nodes };
}

function quoteLine(code: string, validatedQuantity: number | null, role = "quote") {
  return { code, role, validatedQuantity };
}

// --- A. 32/32 validated, PRO_A_VALIDER → eligible ---
{
  const lines = Array.from({ length: 32 }, (_, i) => quoteLine(`L${i}`, 10));
  const engine = makeEngine(lines.map((l) => ({ code: l.code, value: 10 })));
  const r = evaluatePrepStudyFinalizationEligibility({
    dossierStatus: "PRO_A_VALIDER",
    mode: "PROFESSIONAL",
    lines,
    engine,
  });
  assert.equal(r.eligible, true);
  assert.equal(r.validatedCount, 32);
  assert.equal(r.quoteLineCount, 32);
  assert.equal(r.blockers.length, 0);
  console.log("A — 32/32 eligible: ok");
}

// --- B. 31/32 → false ---
{
  const lines = [
    ...Array.from({ length: 31 }, (_, i) => quoteLine(`L${i}`, 10)),
    quoteLine("L31", null),
  ];
  const engine = makeEngine(lines.map((l) => ({ code: l.code, value: 10 })));
  const r = evaluatePrepStudyFinalizationEligibility({
    dossierStatus: "PRO_A_VALIDER",
    mode: "PROFESSIONAL",
    lines,
    engine,
  });
  assert.equal(r.eligible, false);
  assert.equal(r.theoreticalCount, 1);
  assert.ok(r.blockers.some((b) => b.code === "LINES_NOT_VALIDATED"));
  console.log("B — 31/32 non éligible: ok");
}

// --- C. 1 revalidate → false ---
{
  const lines = [quoteLine("L0", 10), quoteLine("L1", 5)];
  const engine = makeEngine([
    { code: "L0", value: 10 },
    { code: "L1", value: 8 }, // diverge → revalidate
  ]);
  const r = evaluatePrepStudyFinalizationEligibility({
    dossierStatus: "PRO_A_VALIDER",
    mode: "PROFESSIONAL",
    lines,
    engine,
  });
  assert.equal(r.eligible, false);
  assert.equal(r.revalidateCount, 1);
  assert.ok(r.blockers.some((b) => b.code === "REVALIDATE_REQUIRED"));
  console.log("C — revalidate: ok");
}

// --- D. erreur moteur → false ---
{
  const lines = [quoteLine("L0", 10), quoteLine("L1", 10)];
  const engine = makeEngine([
    { code: "L0", value: 10 },
    { code: "L1", value: null, error: "Division par zéro" },
  ]);
  const r = evaluatePrepStudyFinalizationEligibility({
    dossierStatus: "PRO_A_VALIDER",
    mode: "PROFESSIONAL",
    lines,
    engine,
  });
  assert.equal(r.eligible, false);
  assert.equal(r.errorCount, 1);
  assert.ok(r.blockers.some((b) => b.code === "ENGINE_ERRORS"));
  console.log("D — erreur moteur: ok");
}

// --- E. PRO_VALIDE → déjà validé ---
{
  const lines = [quoteLine("L0", 10)];
  const engine = makeEngine([{ code: "L0", value: 10 }]);
  const r = evaluatePrepStudyFinalizationEligibility({
    dossierStatus: "PRO_VALIDE",
    mode: "PROFESSIONAL",
    lines,
    engine,
  });
  assert.equal(r.eligible, false);
  assert.ok(r.blockers.some((b) => b.code === "ALREADY_VALIDATED"));
  console.log("E — déjà validé: ok");
}

// --- F. DEMONSTRATION → pas le workflow PRO ---
{
  const lines = [quoteLine("L0", 10)];
  const engine = makeEngine([{ code: "L0", value: 10 }]);
  const r = evaluatePrepStudyFinalizationEligibility({
    dossierStatus: "DEMONSTRATION",
    mode: "DEMONSTRATION",
    lines,
    engine,
  });
  assert.equal(r.eligible, false);
  assert.ok(r.blockers.some((b) => b.code === "NOT_PROFESSIONAL"));
  console.log("F — démonstration: ok");
}

// --- Invalidation rules ---
{
  assert.equal(shouldInvalidateStudyFinalValidation("quantity_or_formula_change"), true);
  assert.equal(shouldInvalidateStudyFinalValidation("parameter_change"), true);
  assert.equal(shouldInvalidateStudyFinalValidation("patch_takeoff"), true);
  assert.equal(shouldInvalidateStudyFinalValidation("import_replace"), true);
  assert.equal(shouldInvalidateStudyFinalValidation("unvalidate_lines"), true);
  assert.equal(shouldInvalidateStudyFinalValidation("text_only"), false);
  assert.equal(shouldInvalidateStudyFinalValidation("plan_source"), false);
  assert.equal(shouldInvalidateStudyFinalValidation("enrich_texts"), false);
  assert.equal(shouldInvalidateStudyFinalValidation("validate_lines"), false);
  assert.equal(shouldInvalidateStudyFinalValidation("metadata"), false);
  console.log("G — règles invalidation: ok");
}

// --- SourceFormat labels ---
{
  assert.equal(prepSourceFormatLabel("bework_prep_bundle_v1"), null);
  assert.equal(prepSourceFormatLabel("bework_global_metre_v1"), "Métré global");
  assert.equal(prepSourceFormatLabel("bework_prep_legacy_v0"), "Importé depuis l'ancien format");
  assert.equal(prepSourceFormatLabel("unknown_xyz"), "Source : format importé");
  assert.equal(prepSourceFormatLabel(null), null);
  console.log("H — sourceFormat labels: ok");
}

// --- Indicateurs exclus du compteur ---
{
  const lines = [quoteLine("Q0", 10), { code: "I0", role: "indicator", validatedQuantity: null }];
  const engine = makeEngine([
    { code: "Q0", value: 10 },
    { code: "I0", value: 42 },
  ]);
  const r = evaluatePrepStudyFinalizationEligibility({
    dossierStatus: "PRO_A_VALIDER",
    mode: "PROFESSIONAL",
    lines,
    engine,
  });
  assert.equal(r.eligible, true);
  assert.equal(r.quoteLineCount, 1);
  console.log("I — indicateurs exclus: ok");
}

console.log("\nTous les tests finalization PASS");
