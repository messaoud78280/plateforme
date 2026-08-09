/**
 * SETRIM-DEMO-V2 — assertions scénario métier (sans DB).
 * npx tsx scripts/test-demo-scenario-setrim-v2.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEMO_SCENARIO,
  DEMO_SCENARIO_ORDER_NUMBER,
  matchesDemoProjectTitle,
  demoOrderSubjectLine,
  demoPrimarySheetTitle,
} from "../src/lib/demo-environment/scenario";
import { DEMO_PERSONAS } from "../src/lib/demo-environment/personas";
import { DEMO_BRAND } from "../src/lib/demo-environment/brand";
import { COMPLETE_TOUR_STEPS, EXPRESS_TOUR_STEPS } from "../src/lib/demo-environment/commercial-tour";

function testScenarioIdentity() {
  assert.equal(DEMO_BRAND.companyName, "SETRIM");
  assert.equal(DEMO_SCENARIO.version, "setrim-v2");
  assert.equal(DEMO_SCENARIO_ORDER_NUMBER, "BC-2026-043");
  assert.equal(DEMO_SCENARIO.supplierName, "Point.P");
  assert.equal(DEMO_SCENARIO.client.name, "Syndic Horizon Copro");
  assert.equal(DEMO_SCENARIO.projects.primary.title, "Résidence Les Lilas");
  assert.ok(DEMO_SCENARIO.materials.subject.toLowerCase().includes("bitume"));
  assert.ok(!DEMO_SCENARIO.materials.subject.toLowerCase().includes("epdm"));
  assert.equal(DEMO_PERSONAS.client.company, "Syndic Horizon Copro");
  assert.equal(demoPrimarySheetTitle(), "Résidence Les Lilas — OS-4587");
  assert.ok(demoOrderSubjectLine().includes("BC-2026-043"));
  console.log("ok scénario SETRIM V2 / Les Lilas / syndic / bitume");
}

function testMatchers() {
  assert.ok(matchesDemoProjectTitle("Résidence Les Lilas", "primary"));
  assert.ok(matchesDemoProjectTitle("Résidence Victor Hugo", "primary")); // legacy
  assert.ok(matchesDemoProjectTitle("Parking République", "waiting"));
  assert.ok(matchesDemoProjectTitle("Balcons Alpha — Résine", "study"));
  assert.ok(matchesDemoProjectTitle("Les Jardins — Entretien", "calm"));
  console.log("ok matchers + legacy Victor Hugo");
}

function testVerifiedActivities() {
  const blob = DEMO_SCENARIO.verifiedActivities.join(" ").toLowerCase();
  for (const word of ["étanchéité", "bitume", "résine", "parking", "fuite"]) {
    assert.ok(blob.includes(word), `activité manquante: ${word}`);
  }
  assert.ok(DEMO_SCENARIO.verifiedClientTypes.some((c) => c.includes("syndic")));
  console.log("ok activités vérifiées setrim.fr");
}

function testSeedWiring() {
  const seed = readFileSync(join(process.cwd(), "src/lib/demo-environment/seed.ts"), "utf8");
  assert.ok(seed.includes("DEMO_SCENARIO") || seed.includes("demoScenarioProject"));
  assert.ok(seed.includes("Résidence Les Lilas") || seed.includes("primary.title"));
  assert.ok(!seed.includes("Résidence Victor Hugo"));
  assert.ok(!seed.includes("ABC Promotion"));
  assert.ok(!seed.includes("membrane EPDM"));
  const coh = readFileSync(
    join(process.cwd(), "src/lib/demo-environment/coherence-victor-hugo.ts"),
    "utf8",
  );
  assert.ok(coh.includes("demoProjectTitleWhere"));
  assert.ok(coh.includes("DEMO_SCENARIO"));
  assert.ok(!coh.includes("Membrane EPDM"));
  console.log("ok seed / cohérence câblés scénario");
}

function testTourCopy() {
  const all = [...EXPRESS_TOUR_STEPS, ...COMPLETE_TOUR_STEPS];
  for (const step of all) {
    assert.ok(!/Victor Hugo/.test(step.body + (step.tip ?? "")), step.id);
    assert.ok(!/EPDM/i.test(step.body + (step.tip ?? "")), step.id);
  }
  console.log("ok parcours commercial sans Victor Hugo / EPDM");
}

function main() {
  testScenarioIdentity();
  testMatchers();
  testVerifiedActivities();
  testSeedWiring();
  testTourCopy();
  console.log("\nSETRIM-DEMO-V2 — ALL PASS");
}

main();
