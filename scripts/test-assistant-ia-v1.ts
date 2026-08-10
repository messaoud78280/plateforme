/**
 * ASSISTANT-IA-V1 — garde-fous catalogue (sans API).
 * npx tsx scripts/test-assistant-ia-v1.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  ASSISTANT_IA_TOOLS,
  ASSISTANT_IA_FAMILIES,
  getAssistantIaTool,
  toolsByFamily,
} from "../src/lib/assistant-ia/tools";
import { canAccessAssistantIa } from "../src/lib/assistant-ia/access";
import {
  getAIProviderStatus,
  canExecuteAssistantIaTools,
} from "../src/lib/assistant-ia/status";
import { isFeatureEnabled } from "../src/lib/feature-flags";

const root = process.cwd();

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx|md)$/.test(name)) acc.push(p);
  }
  return acc;
}

function testCatalog() {
  assert.equal(ASSISTANT_IA_FAMILIES.length, 2);
  assert.equal(toolsByFamily("marches").length, 4);
  assert.equal(toolsByFamily("chantier").length, 4);
  assert.equal(ASSISTANT_IA_TOOLS.length, 8);
  assert.ok(getAssistantIaTool("analyser-marche-prive"));
  assert.equal(getAssistantIaTool("inconnu"), undefined);
  console.log("✓ catalogue 2 familles × 4 outils");
}

function testAccess() {
  assert.equal(
    canAccessAssistantIa({
      role: "CLIENT",
      personType: "INTERNAL",
      permissionProfile: "DIRECTION",
    }),
    true,
    "Denis Direction",
  );
  assert.equal(
    canAccessAssistantIa({
      role: "CLIENT",
      personType: "INTERNAL",
      permissionProfile: "ADMINISTRATIF",
    }),
    true,
    "Julie",
  );
  assert.equal(
    canAccessAssistantIa({
      role: "CLIENT",
      personType: "INTERNAL",
      permissionProfile: "CONDUCTEUR",
    }),
    true,
    "Karim",
  );
  assert.equal(
    canAccessAssistantIa({
      role: "CLIENT",
      personType: "CLIENT_EXT",
      permissionProfile: "CLIENT",
    }),
    false,
    "Sophie",
  );
  assert.equal(
    canAccessAssistantIa({
      role: "CLIENT",
      personType: "SUPPLIER",
      permissionProfile: "FOURNISSEUR",
    }),
    false,
    "Thomas",
  );
  console.log("✓ accès personas internes / externes");
}

function testStatusNoExecution() {
  assert.equal(isFeatureEnabled("aiFeaturesEnabled"), false);
  const s = getAIProviderStatus();
  assert.equal(s.configured, false);
  assert.equal(canExecuteAssistantIaTools(), false);
  assert.match(s.statusLabel, /activation|activées/i);
  console.log("✓ statut IA non configuré, pas d’exécution");
}

function testNoProviderSdkInAssistantModule() {
  const files = walk(join(root, "src/lib/assistant-ia")).concat(
    walk(join(root, "src/components/assistant-ia")),
    walk(join(root, "src/app/dashboard/assistant-ia")),
  );
  const banned =
    /openai|anthropic|@ai-sdk|google-generative|OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_AI_KEY/i;
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    assert.doesNotMatch(text, banned, `pas de provider dans ${f}`);
  }
  console.log("✓ aucun SDK / clé provider dans Assistant IA V1");
}

function testNoFakeAnalysis() {
  const hub = readFileSync(
    join(root, "src/components/assistant-ia/AssistantIaHub.tsx"),
    "utf8",
  );
  const detail = readFileSync(
    join(root, "src/components/assistant-ia/AssistantIaToolDetail.tsx"),
    "utf8",
  );
  assert.doesNotMatch(hub + detail, /setTimeout/);
  assert.doesNotMatch(hub + detail, /ANALYSE TERMINÉE/);
  assert.match(detail, /IA disponible sur activation/);
  console.log("✓ pas de fausse analyse");
}

function testNavPointsToAssistant() {
  const sidebar = readFileSync(
    join(root, "src/components/dashboard/AppSidebar.tsx"),
    "utf8",
  );
  assert.match(sidebar, /\/dashboard\/assistant-ia/);
  assert.match(sidebar, /Assistant IA/);
  console.log("✓ nav → /dashboard/assistant-ia");
}

function testRoadmap() {
  const md = readFileSync(join(root, "docs/ASSISTANT-IA-BTP-ROADMAP.md"), "utf8");
  assert.match(md, /PHASE 1/);
  assert.match(md, /PHASE 4/);
  assert.match(md, /AIProvider/);
  console.log("✓ roadmap documentée");
}

const tests = [
  testCatalog,
  testAccess,
  testStatusNoExecution,
  testNoProviderSdkInAssistantModule,
  testNoFakeAnalysis,
  testNavPointsToAssistant,
  testRoadmap,
];

let failed = 0;
for (const t of tests) {
  try {
    t();
  } catch (e) {
    failed += 1;
    console.error(e);
  }
}
if (failed) process.exit(1);
console.log("\nASSISTANT-IA-V1 — ALL PASS");
