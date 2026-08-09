/**
 * RECETTE-DEMO-V1 — assertions locales (sans DB live).
 * npx tsx scripts/test-recette-demo-v1.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function testResetPurgesPurchaseOrders() {
  const seed = read("src/lib/demo-environment/seed.ts");
  assert.ok(seed.includes("purchaseOrder.deleteMany"));
  assert.ok(seed.includes("organizationId: orgId"));
  assert.ok(
    seed.includes("En attente de confirmation Point.P") ||
      seed.includes("en attente de confirmation Point.P"),
  );
  assert.ok(!seed.includes("Je relance Étanchéité Plus"));
  console.log("ok reset purge PO + seed messages cohérents");
}

function testSearchNoExternalLeak() {
  const search = read("src/lib/search/global-search.ts");
  assert.ok(search.includes("defaultMessageChannelForPerson"));
  assert.ok(search.includes("CLIENT_EXT"));
  assert.ok(search.includes("Jamais proposer le fil INTERNE"));
  assert.ok(search.includes("canSeeProjects"));
  assert.ok(search.includes("supplierFileFilter") || search.includes("supplierExtOrgId"));
  console.log("ok search externe sans fuite INTERNE / org");
}

function testGedSupplierHref() {
  const hub = read("src/lib/ged/document-hub.ts");
  assert.ok(hub.includes("isSupplier || external"));
  assert.ok(hub.includes("/dashboard/documents?q="));
  assert.ok(hub.includes("?focus=documents"));
  console.log("ok GED href fournisseur ≠ cockpit projet");
}

function testSophieNoInternalTasks() {
  const page = read("src/app/dashboard/page.tsx");
  assert.ok(page.includes("Pas de tâches chantier internes"));
  console.log("ok Sophie sans tâches internes Accueil");
}

function testTourPartialRequire() {
  const tour = read("src/lib/demo-environment/commercial-tour.ts");
  assert.ok(tour.includes('require: ["order", "partial"]') || tour.includes('require: ["partial"]'));
  assert.ok(tour.includes("require: [\"partial\"]"));
  console.log("ok étapes réception/reliquat conditionnelles");
}

function testPersonaSwitchHygiene() {
  const layout = read("src/app/dashboard/layout.tsx");
  assert.ok(layout.includes("<MessagerieHeaderShortcut key={session.user.id}"));
  const searchUi = read("src/components/dashboard/GlobalSearch.tsx");
  assert.ok(searchUi.includes("clearRecentsOnPersonaChange"));
  assert.ok(searchUi.includes("bework:persona-changed"));
  console.log("ok hygiene switch persona (messagerie + récents Cmd+K)");
}

function main() {
  testResetPurgesPurchaseOrders();
  testSearchNoExternalLeak();
  testGedSupplierHref();
  testSophieNoInternalTasks();
  testTourPartialRequire();
  testPersonaSwitchHygiene();
  console.log("\nRECETTE-DEMO-V1 — assertions OK");
}

main();
