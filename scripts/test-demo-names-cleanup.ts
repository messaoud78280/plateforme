/**
 * DEMO-NAMES-CLEANUP — assertions locales.
 * npx tsx scripts/test-demo-names-cleanup.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEMO_PERSONA_CANONICAL_NAMES,
  DEMO_STAFF_CONTACTS,
  isDemoStaffHiddenFromMessaging,
  isDemoStaffVisibleInMessaging,
} from "../src/lib/demo-environment/demo-staff-names";
import { DEMO_PERSONAS } from "../src/lib/demo-environment/personas";

function testPersonasUnchanged() {
  assert.equal(DEMO_PERSONAS.direction.name, "Marc Dupont");
  assert.equal(DEMO_PERSONAS.conducteur.name, "Karim Benali");
  assert.equal(DEMO_PERSONAS.administratif.name, "Julie Martin");
  assert.equal(DEMO_PERSONAS.client.name, "Sophie Martin");
  assert.equal(DEMO_PERSONAS.fournisseur.name, "Thomas Bernard");
  assert.deepEqual([...DEMO_PERSONA_CANONICAL_NAMES], [
    "Marc Dupont",
    "Karim Benali",
    "Julie Martin",
    "Sophie Martin",
    "Thomas Bernard",
  ]);
  console.log("ok personas inchangées");
}

function testStaffNamesDistinct() {
  const sophie = DEMO_STAFF_CONTACTS.find((c) => c.key === "sophie")!;
  const karim = DEMO_STAFF_CONTACTS.find((c) => c.key === "karim")!;
  const laura = DEMO_STAFF_CONTACTS.find((c) => c.key === "laura")!;
  assert.equal(sophie.name, "Sophie Lefèvre");
  assert.equal(karim.name, "Karim Adjaili");
  assert.equal(laura.name, "Laura Bernard");
  assert.notEqual(sophie.name, DEMO_PERSONAS.client.name);
  assert.notEqual(karim.name, DEMO_PERSONAS.conducteur.name);
  assert.ok(isDemoStaffVisibleInMessaging(sophie.email));
  assert.ok(isDemoStaffVisibleInMessaging(karim.email));
  assert.ok(isDemoStaffHiddenFromMessaging(laura.email));
  console.log("ok staff Lefèvre / Adjaili / Laura masquée");
}

function testSeedWiring() {
  const seed = readFileSync(join(process.cwd(), "src/lib/demo-environment/seed.ts"), "utf8");
  assert.ok(seed.includes("ensureDemoStaffDisplayNames"));
  assert.ok(seed.includes("Sophie Lefèvre"));
  assert.ok(seed.includes("Karim Adjaili"));
  assert.ok(!seed.includes('name: "Sophie Martin"')); // pas de staff nommé ainsi
  const service = readFileSync(join(process.cwd(), "src/lib/demo-environment/service.ts"), "utf8");
  assert.ok(service.includes("ensureDemoStaffDisplayNames"));
  const page = readFileSync(join(process.cwd(), "src/app/dashboard/messagerie/page.tsx"), "utf8");
  assert.ok(page.includes("showInDemoMessaging"));
  assert.ok(page.includes("isDemoStaffHiddenFromMessaging"));
  console.log("ok seed / enrich / messagerie branchés");
}

function main() {
  testPersonasUnchanged();
  testStaffNamesDistinct();
  testSeedWiring();
  console.log("\nDEMO-NAMES-CLEANUP — ALL PASS");
}

main();
