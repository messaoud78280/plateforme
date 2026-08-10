/**
 * DEMO-SETRIM-CLEANUP-V2 — assertions (sans DB pour la plupart).
 * npx tsx scripts/test-demo-setrim-cleanup-v2.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildProjectPresentation } from "../src/lib/chantier/party-labels";
import { DEMO_PERSONAS } from "../src/lib/demo-environment/personas";
import { DEMO_SCENARIO } from "../src/lib/demo-environment/scenario";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function testPresentationSkipsAbc() {
  const p = buildProjectPresentation({
    title: "Résidence Les Jardins",
    chantierStatusLabel: "Étude",
    client: {
      name: "Denis Buret",
      company: "SETRIM",
      personType: "INTERNAL",
      role: "MANAGER",
    },
    assignedTo: null,
    hostOrganizationName: "SETRIM",
    clientOrganizationName: DEMO_SCENARIO.client.name,
    followUpClientName: "ABC Promotion",
  });
  assert.notEqual(p.clientLabel, "ABC Promotion");
  assert.equal(p.clientLabel, DEMO_SCENARIO.client.name);
  console.log("✓ présentation ignore ABC Promotion (client = syndic)");
}

function testPurgeWired() {
  const brand = read("src/lib/demo-environment/apply-brand.ts");
  assert.match(brand, /purgeAbcPromotionClientLabelsForOrg/);
  assert.match(brand, /FollowUpSheet/);
  assert.match(brand, /DEMO_PERSONAS\.client\.company/);

  const service = read("src/lib/demo-environment/service.ts");
  assert.match(service, /purgeAbcPromotionClientLabelsForOrg|applyDemoBrand/);
  assert.match(service, /enrichDemoPersonas\(demoId\)/);

  const kanban = read("src/lib/demo-environment/kanban-readability.ts");
  assert.match(kanban, /ensureJardinsDemoTasks/);
  assert.match(kanban, /Préparer le dossier de démarrage/);
  assert.match(kanban, /DEMO_SCENARIO\.client\.name/);
  assert.ok(!kanban.includes('clientName: "ABC Promotion"'));
  console.log("✓ purge + tâches Jardins câblés reset/enrich");
}

function testTachesEmptyState() {
  const panel = read("src/components/projects/ProjectMissionsSection.tsx");
  assert.match(panel, /Aucune tâche pour ce chantier/);
  assert.match(panel, /\+ Nouvelle tâche/);
  assert.match(panel, /Voir toutes les tâches/);
  assert.doesNotMatch(panel, /if \(!isAgence\) \{\s*if \(missions\.length === 0\) return null/);
  assert.match(panel, /canCreate/);
  console.log("✓ onglet Tâches : empty state + CTA (plus de panel null)");
}

function testClientPersonaNotSetrim() {
  assert.equal(DEMO_PERSONAS.client.company, "Syndic Horizon Copro");
  assert.notEqual(DEMO_PERSONAS.client.company, "SETRIM");
  assert.equal(DEMO_SCENARIO.client.name, "Syndic Horizon Copro");
  console.log("✓ client externe ≠ SETRIM (pas de confusion ACL)");
}

function testNoAbcInActiveDemoSeed() {
  for (const rel of [
    "src/lib/demo-environment/seed.ts",
    "src/lib/demo-environment/scenario.ts",
    "src/lib/demo-environment/personas.ts",
    "src/lib/demo-environment/kanban-readability.ts",
    "src/lib/demo-environment/coherence-victor-hugo.ts",
  ]) {
    const src = read(rel);
    assert.ok(!src.includes("ABC Promotion"), `${rel} contient ABC Promotion`);
  }
  console.log("✓ seed / scénario / personas sans ABC Promotion");
}

testPresentationSkipsAbc();
testPurgeWired();
testTachesEmptyState();
testClientPersonaNotSetrim();
testNoAbcInActiveDemoSeed();
console.log("\nDEMO-SETRIM-CLEANUP-V2 — ALL PASS");
