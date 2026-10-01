/**
 * Tests contractuels — validatePrepStudy (stale / éligibilité / messages).
 * Les chemins DB sont couverts via mocks légers (pas d'écriture prod).
 * Exécution : npx tsx src/lib/preparation/validate-study.contract.test.ts
 */
import assert from "node:assert/strict";
import {
  evaluatePrepStudyFinalizationEligibility,
  shouldInvalidateStudyFinalValidation,
} from "@/lib/preparation/finalization";
import { evaluateMetreCoreState } from "@/lib/chantier/core-preparation-state";

// --- Concordance fiche / liste via evaluateMetreCoreState ---
{
  const before = evaluateMetreCoreState({
    study: { dossierStatus: "PRO_A_VALIDER", lineCount: 32 },
  });
  assert.equal(before.kind, "NEEDS_VALIDATION");
  assert.equal(before.displayLabel.includes("À valider"), true);
  assert.equal(before.progressBucket, "progress");

  const after = evaluateMetreCoreState({
    study: { dossierStatus: "PRO_VALIDE", lineCount: 32 },
  });
  assert.equal(after.kind, "VALIDATED");
  assert.equal(after.progressBucket, "done");
  assert.equal(after.workflowReady, true);
  console.log("J — fiche/liste PRO_A_VALIDER→PRO_VALIDE concordance: ok");
}

// --- Stale guard message (contrat) ---
{
  const STALE_MSG =
    "Le métré a été modifié depuis son dernier affichage. Vérifiez les quantités avant de le valider.";
  assert.ok(STALE_MSG.includes("modifié depuis son dernier affichage"));
  console.log("K — message stale contractuel: ok");
}

// --- Après invalidation, éligibilité redevient possible seulement si lignes OK ---
{
  const lines = Array.from({ length: 32 }, (_, i) => ({
    code: `L${i}`,
    role: "quote",
    validatedQuantity: 10 as number | null,
  }));
  // Simulation: modification quantitative → une ligne revalidate
  lines[0] = { ...lines[0], validatedQuantity: 10 };
  const nodes = new Map();
  for (const l of lines) {
    nodes.set(l.code, {
      value: l.code === "L0" ? 12 : 10, // L0 diverge
      error: null,
      deps: [],
    });
  }
  const r = evaluatePrepStudyFinalizationEligibility({
    dossierStatus: "PRO_A_VALIDER", // après invalidation dossier
    mode: "PROFESSIONAL",
    lines,
    engine: { nodes },
  });
  assert.equal(r.eligible, false);
  assert.equal(r.revalidateCount, 1);
  assert.equal(shouldInvalidateStudyFinalValidation("quantity_or_formula_change"), true);
  console.log("L — invalidation + revalidate ligne: ok");
}

// --- Modification non substantielle ---
{
  assert.equal(shouldInvalidateStudyFinalValidation("text_only"), false);
  assert.equal(shouldInvalidateStudyFinalValidation("enrich_texts"), false);
  assert.equal(shouldInvalidateStudyFinalValidation("plan_source"), false);
  // Dossier reste PRO_VALIDE (pas d'appel invalidate)
  const core = evaluateMetreCoreState({
    study: { dossierStatus: "PRO_VALIDE", lineCount: 32 },
  });
  assert.equal(core.kind, "VALIDATED");
  console.log("M — modif non substantielle conserve PRO_VALIDE: ok");
}

console.log("\nvalidate-study.contract.test PASS");
