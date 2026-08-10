/**
 * FICHES-SUIVI-V2B — tests unitaires KPI urgence + phases (sans DB).
 */
import assert from "node:assert/strict";
import { isFollowUpUrgentLevel, sheetEffectiveUrgency } from "../src/lib/follow-up/kpi";
import { isPhaseStart, phaseForStatus } from "../src/lib/follow-up/phases";

function testUrgencySource() {
  // KPI et badges : effectiveUrgency W3 prime sur urgency stockée
  const sheetA = {
    urgency: "NORMAL",
    attention: { effectiveUrgency: "URGENT" },
  };
  const sheetB = {
    urgency: "IMPORTANT",
    attention: { effectiveUrgency: "NORMAL" },
  };
  const sheetC = { urgency: "CRITIQUE", attention: null };

  assert.equal(sheetEffectiveUrgency(sheetA), "URGENT");
  assert.equal(isFollowUpUrgentLevel(sheetEffectiveUrgency(sheetA)), true);

  assert.equal(sheetEffectiveUrgency(sheetB), "NORMAL");
  assert.equal(isFollowUpUrgentLevel(sheetEffectiveUrgency(sheetB)), false);

  assert.equal(sheetEffectiveUrgency(sheetC), "CRITIQUE");
  assert.equal(isFollowUpUrgentLevel(sheetEffectiveUrgency(sheetC)), true);

  // IMPORTANT n’est PAS « urgent » pour le KPI (évite 1 vs 2)
  assert.equal(isFollowUpUrgentLevel("IMPORTANT"), false);
  assert.equal(isFollowUpUrgentLevel("URGENT"), true);

  const all = [sheetA, sheetB, { urgency: "URGENT", attention: { effectiveUrgency: "URGENT" } }];
  const kpi = all.filter((s) => isFollowUpUrgentLevel(sheetEffectiveUrgency(s))).length;
  assert.equal(kpi, 2);
}

function testPhases() {
  assert.equal(phaseForStatus("NOUVEAU")?.id, "demarrage");
  assert.equal(phaseForStatus("COMMANDE_FOURNISSEUR")?.id, "preparation");
  assert.equal(phaseForStatus("EN_COURS")?.id, "execution");
  assert.equal(phaseForStatus("A_FACTURER")?.id, "finalisation");

  const keys = ["NOUVEAU", "A_ANALYSER", "INTERVENTION_PREVUE", "EN_COURS", "A_FACTURER"];
  assert.equal(isPhaseStart("NOUVEAU", keys), true);
  assert.equal(isPhaseStart("A_ANALYSER", keys), false);
  assert.equal(isPhaseStart("INTERVENTION_PREVUE", keys), true);
  assert.equal(isPhaseStart("EN_COURS", keys), true);
  assert.equal(isPhaseStart("A_FACTURER", keys), true);
}

testUrgencySource();
testPhases();
console.log("ok — fiches-suivi-v2b");
