/**
 * Tests d’isolation / auth démo — exécuter : npx tsx scripts/test-demo-environment.ts
 * Ne touche pas à la base : pure logique + helpers.
 */
import assert from "node:assert/strict";
import {
  DEMO_EMAIL_DOMAIN,
  defaultModulesForTemplate,
  isDemoEmail,
  normalizeLoginIdentifier,
  toDemoEmail,
} from "../src/lib/demo-environment/constants";
import { generateLoginIdentifier, generateSecureDemoPassword } from "../src/lib/demo-environment/credentials";
import { gateAllows, parseTeamLoginGate } from "../src/lib/auth-team-login";
import { isNavHrefAllowedForDemo } from "../src/lib/demo-environment/nav-modules";
import {
  isBonDeCommandeCategory,
  mapTaskStatusToBcStep,
  nextBcStatus,
} from "../src/lib/demo-environment/bon-commande";
import type { TaskStatus } from "../src/types";

function testCredentialsHelpers() {
  const pwd = generateSecureDemoPassword(14);
  assert.equal(pwd.length, 14);
  assert.notEqual(pwd, "demo123");

  const id = generateLoginIdentifier("ABC Etancheite");
  assert.match(id, /^abc-etancheite-/);
  assert.equal(toDemoEmail(id), `${id}@${DEMO_EMAIL_DOMAIN}`);
  assert.ok(isDemoEmail(toDemoEmail(id)));
  assert.ok(!isDemoEmail("client@exemple.com"));

  assert.equal(normalizeLoginIdentifier("Foo Bar!!"), "foo-bar");
}

function testGates() {
  assert.equal(parseTeamLoginGate("demo"), "demo");
  assert.ok(gateAllows("CLIENT", "demo", "x@demo.bework.local"));
  assert.ok(!gateAllows("CLIENT", "clients", "x@demo.bework.local"));
  assert.ok(gateAllows("CLIENT", "clients", "client@exemple.com"));
  assert.ok(!gateAllows("MANAGER", "demo"));
  assert.ok(!gateAllows("MANAGER", "gerante", "mgr@demo.bework.local"));
}

function testModules() {
  const pme = defaultModulesForTemplate("PME_BTP");
  assert.ok(pme.includes("chantiers"));
  assert.ok(!pme.includes("marches"));

  const marches = defaultModulesForTemplate("MARCHES_ETUDES");
  assert.ok(marches.includes("marches"));

  assert.ok(isNavHrefAllowedForDemo("/dashboard/projets", ["chantiers"]));
  assert.ok(!isNavHrefAllowedForDemo("/dashboard/abonnement", ["dashboard"]));
  assert.ok(!isNavHrefAllowedForDemo("/dashboard/documents", ["chantiers"]));
  assert.ok(isNavHrefAllowedForDemo("/dashboard/commandes", ["commandes"]));
}

function testBcWorkflow() {
  assert.ok(isBonDeCommandeCategory("Bon de commande"));
  assert.equal(mapTaskStatusToBcStep("A_VALIDER" as TaskStatus), "a_valider");
  assert.equal(nextBcStatus("A_VALIDER" as TaskStatus), "ASSIGNEE");
  assert.equal(nextBcStatus("COMPLETE" as TaskStatus), null);
}

testCredentialsHelpers();
testGates();
testModules();
testBcWorkflow();
console.log("OK — test-demo-environment");
