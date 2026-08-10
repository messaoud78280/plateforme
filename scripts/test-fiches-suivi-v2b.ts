/**
 * FICHES-SUIVI-V2B / V2B.1 — tests unitaires KPI + phases + garde-fous API (sans DB).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isFollowUpUrgentLevel, sheetEffectiveUrgency } from "../src/lib/follow-up/kpi";
import { isPhaseStart, phaseForStatus } from "../src/lib/follow-up/phases";

function testUrgencySource() {
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
  assert.equal(isFollowUpUrgentLevel("IMPORTANT"), false);
  assert.equal(isFollowUpUrgentLevel("URGENT"), true);

  const all = [sheetA, sheetB, { urgency: "URGENT", attention: { effectiveUrgency: "URGENT" } }];
  assert.equal(all.filter((s) => isFollowUpUrgentLevel(sheetEffectiveUrgency(s))).length, 2);
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
}

/** Recette V2B.1 — pas de régression IMPORTANT dans le filtre API. */
function testApiUrgentFilterAligned() {
  const route = readFileSync(join(process.cwd(), "src/app/api/follow-up/route.ts"), "utf8");
  assert.ok(route.includes("isFollowUpUrgentLevel"));
  assert.ok(!route.includes('["IMPORTANT", "URGENT", "CRITIQUE"]'));
}

function testCreateFormNoSetrimHardcode() {
  const form = readFileSync(
    join(process.cwd(), "src/components/follow-up/FollowUpCreateForm.tsx"),
    "utf8",
  );
  const kanban = readFileSync(
    join(process.cwd(), "src/components/follow-up/FollowUpKanban.tsx"),
    "utf8",
  );
  assert.ok(!/SETRIM/i.test(form));
  assert.ok(!/SETRIM/i.test(kanban));
  assert.ok(form.includes("Pas encore de chantier"));
  assert.ok(form.includes("Échéance"));
  assert.ok(form.includes("nextActionAt"));
  assert.ok(kanban.includes("hideEmpty"));
  assert.ok(kanban.includes("Masquer les étapes vides"));
}

function testPageKpiUsesW3() {
  const page = readFileSync(
    join(process.cwd(), "src/app/dashboard/fiches-suivi/page.tsx"),
    "utf8",
  );
  assert.ok(page.includes("loadAttentionForSheets"));
  assert.ok(page.includes("isFollowUpUrgentLevel"));
  assert.ok(page.includes("sheetEffectiveUrgency"));
  assert.ok(page.includes("effectiveUrgency"));
}

testUrgencySource();
testPhases();
testApiUrgentFilterAligned();
testCreateFormNoSetrimHardcode();
testPageKpiUsesW3();
console.log("ok — fiches-suivi-v2b.1");
