/**
 * Tests — données démo Pilotage (aucune DB métier).
 * npx tsx scripts/test-demo-pilotage.ts
 */
import assert from "node:assert/strict";
import { DEMO_SCENARIO_LIST, getDemoScenario, SCENARIO_GO_LOGEMENTS } from "../src/lib/demo-pilotage/scenarios";
import { generateDemoToken, hashAccessCode, verifyAccessCode } from "../src/lib/demo-pilotage/token";

function run() {
  assert.equal(DEMO_SCENARIO_LIST.length, 7);
  const main = SCENARIO_GO_LOGEMENTS;
  assert.ok(main.obligations.length >= 18);
  assert.ok(main.documents.length >= 14);
  assert.ok(main.actions.length >= 9);
  assert.ok(main.actions.filter((a) => a.overdue).length >= 3);
  assert.ok(main.plans.length >= 6);
  assert.ok(main.plans.some((p) => p.overdue));
  assert.ok(main.milestones.length >= 5);
  assert.ok(main.blockers.length >= 2);
  assert.ok(main.subcontractors.length >= 2);
  assert.ok(main.situations.length >= 3);
  assert.ok(main.extraWorks.length >= 2);
  assert.equal(main.doeProgressPct, 45);
  assert.ok(main.clientName.includes("Démo"));
  assert.ok(main.documents.every((d) => d.name.includes("FICTIF") || d.fictionMark));

  const token = generateDemoToken();
  assert.ok(token.length >= 32);
  const hash = hashAccessCode("secret-demo", token);
  assert.equal(verifyAccessCode("secret-demo", token, hash), true);
  assert.equal(verifyAccessCode("wrong", token, hash), false);
  assert.equal(verifyAccessCode("x", token, null), true);

  assert.equal(getDemoScenario("inconnu").id, "go-logements-public");
  assert.equal(getDemoScenario("en-difficulte").healthLabel, "CRITIQUE");

  console.log("OK — tests démo pilotage");
}

run();
