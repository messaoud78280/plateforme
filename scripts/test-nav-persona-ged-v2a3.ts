/**
 * GED-V2A.3 — navigation persona + préfixe /dashboard.
 * npx tsx scripts/test-nav-persona-ged-v2a3.ts
 */
import assert from "node:assert/strict";
import { isHrefAllowedForPersona } from "../src/lib/equipe-acces/nav-by-persona";
import { hubGroupsForPersona } from "../src/lib/ged/document-hub-ui";

function testSupplierNav() {
  const pt = "SUPPLIER";
  const pp = "FOURNISSEUR";
  assert.equal(isHrefAllowedForPersona("/dashboard", pt, pp), true);
  assert.equal(isHrefAllowedForPersona("/dashboard/commandes", pt, pp), true);
  assert.equal(isHrefAllowedForPersona("/dashboard/livraisons", pt, pp), true);
  assert.equal(isHrefAllowedForPersona("/dashboard/documents", pt, pp), true);
  assert.equal(isHrefAllowedForPersona("/dashboard/messagerie", pt, pp), true);
  assert.equal(isHrefAllowedForPersona("/dashboard/parametres", pt, pp), true);

  assert.equal(isHrefAllowedForPersona("/dashboard/planning", pt, pp), false);
  assert.equal(isHrefAllowedForPersona("/dashboard/a-traiter", pt, pp), false);
  assert.equal(isHrefAllowedForPersona("/dashboard/pilotage-travaux", pt, pp), false);
  assert.equal(isHrefAllowedForPersona("/dashboard/fournisseurs", pt, pp), false);
  assert.equal(isHrefAllowedForPersona("/dashboard/rapports", pt, pp), false);
  assert.equal(isHrefAllowedForPersona("/dashboard/skills", pt, pp), false);
  assert.equal(isHrefAllowedForPersona("/dashboard/fiches-suivi", pt, pp), false);
  assert.equal(isHrefAllowedForPersona("/dashboard/projets", pt, pp), false);
  console.log("ok supplier nav");
}

function testClientNav() {
  const pt = "CLIENT_EXT";
  const pp = "CLIENT";
  assert.equal(isHrefAllowedForPersona("/dashboard/projets", pt, pp), true);
  assert.equal(isHrefAllowedForPersona("/dashboard/documents", pt, pp), true);
  assert.equal(isHrefAllowedForPersona("/dashboard/planning", pt, pp), false);
  assert.equal(isHrefAllowedForPersona("/dashboard/fournisseurs", pt, pp), false);
  assert.equal(isHrefAllowedForPersona("/dashboard/commandes", pt, pp), false);
  console.log("ok client nav");
}

function testDashboardPrefixBug() {
  // Régression : /dashboard ne doit pas ouvrir /dashboard/*
  assert.equal(
    isHrefAllowedForPersona("/dashboard/planning", "SUPPLIER", "FOURNISSEUR"),
    false,
  );
  console.log("ok /dashboard prefix");
}

function testHubGroups() {
  const supplier = hubGroupsForPersona("SUPPLIER", "FOURNISSEUR");
  assert.deepEqual(
    supplier.map((g) => g.id),
    ["all", "commandes", "fournisseurs"],
  );
  const client = hubGroupsForPersona("CLIENT_EXT", "CLIENT");
  assert.ok(!client.some((g) => g.id === "doe" || g.id === "administratif"));
  const internal = hubGroupsForPersona("INTERNAL", "DIRECTION");
  assert.ok(internal.some((g) => g.id === "doe"));
  console.log("ok hub groups");
}

testSupplierNav();
testClientNav();
testDashboardPrefixBug();
testHubGroups();
console.log("ALL PASS");
