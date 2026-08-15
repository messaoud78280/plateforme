/**
 * COMMERCIAL-WORKSPACE-1 — shell plein écran, pas de 2e moteur.
 * Run: npx tsx scripts/test-commercial-workspace-1.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isCommercialWorkspacePath } from "../src/lib/commercial/workspace";
import { canAccessCommercialModule } from "../src/lib/commercial/access";
import { canAccessDashboardHref } from "../src/lib/equipe-acces/dashboard-policy";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function testPathHelper() {
  assert.equal(isCommercialWorkspacePath("/dashboard/devis-facturation"), true);
  assert.equal(isCommercialWorkspacePath("/dashboard/devis-facturation/devis/x"), true);
  assert.equal(isCommercialWorkspacePath("/dashboard"), false);
  assert.equal(isCommercialWorkspacePath("/dashboard/facturation"), false);
  assert.equal(isCommercialWorkspacePath(null), false);
  console.log("✓ détection workspace Commercial");
}

function testLayoutBranch() {
  const layout = read("src/app/dashboard/layout.tsx");
  assert.match(layout, /isCommercialWorkspacePath/);
  assert.match(layout, /CommercialWorkspaceHeader/);
  assert.match(layout, /CommercialLaunchLink/);
  const nested = read("src/app/dashboard/devis-facturation/layout.tsx");
  assert.match(nested, /requireCommercialSession/);
  assert.doesNotMatch(nested, /CommercialSubNav/);
  assert.match(nested, /Devis & Facturation — BeWork/);
  console.log("✓ layout : shell Commercial sans dupliquer les routes");
}

function testLaunchLink() {
  const src = read("src/components/dashboard/CommercialLaunchLink.tsx");
  assert.match(src, /target="_blank"/);
  assert.match(src, /rel="noopener noreferrer"/);
  assert.match(src, /nouvel onglet/);
  assert.match(src, /canAccessCommercialModule/);
  assert.match(src, /canAccessDashboardHref/);
  console.log("✓ header BeWork : nouvel onglet + permissions");
}

function testWorkspaceHeader() {
  const header = read("src/components/commercial/CommercialWorkspaceHeader.tsx");
  assert.match(header, /Retour à la plateforme/);
  assert.match(header, /href="\/dashboard"/);
  assert.doesNotMatch(header, /window\.close/);
  assert.match(header, /CommercialSubNav/);
  const nav = read("src/components/commercial/CommercialSubNav.tsx");
  assert.match(nav, /Vue d’ensemble/);
  assert.match(nav, /Devis/);
  assert.match(nav, /Factures/);
  assert.match(nav, /Encaissements/);
  assert.match(nav, /Bibliothèque/);
  assert.doesNotMatch(nav, /Situations/);
  assert.doesNotMatch(nav, /Avoirs/);
  assert.doesNotMatch(nav, /À facturer/);
  console.log("✓ header Commercial : nav réelle, pas de lien mort");
}

function testNavPagesExist() {
  const pages = [
    "src/app/dashboard/devis-facturation/page.tsx",
    "src/app/dashboard/devis-facturation/devis/page.tsx",
    "src/app/dashboard/devis-facturation/factures/page.tsx",
    "src/app/dashboard/devis-facturation/encaissements/page.tsx",
    "src/app/dashboard/devis-facturation/bibliotheque/page.tsx",
    "src/app/dashboard/devis-facturation/prix/page.tsx",
    "src/app/dashboard/devis-facturation/parametres/page.tsx",
  ];
  for (const p of pages) {
    assert.ok(existsSync(join(root, p)), p);
  }
  assert.equal(
    existsSync(join(root, "src/app/dashboard/devis-facturation/situations/page.tsx")),
    false,
  );
  console.log("✓ chaque onglet visible a une page");
}

function testPermissions() {
  assert.equal(
    canAccessCommercialModule({ personType: "CLIENT_EXT", permissionProfile: "CLIENT" }),
    false,
  );
  assert.equal(
    canAccessCommercialModule({ personType: "SUPPLIER", permissionProfile: "FOURNISSEUR" }),
    false,
  );
  assert.equal(
    canAccessDashboardHref("/dashboard/devis-facturation", "CLIENT_EXT", "CLIENT"),
    false,
  );
  assert.equal(
    canAccessDashboardHref("/dashboard/devis-facturation", "INTERNAL", "DIRECTION"),
    true,
  );
  assert.equal(
    canAccessDashboardHref("/dashboard/devis-facturation", "INTERNAL", "CONDUCTEUR"),
    true,
  );
  assert.equal(
    canAccessDashboardHref("/dashboard/rentabilite", "INTERNAL", "CONDUCTEUR"),
    false,
  );
  console.log("✓ SEC-1 : Client/Fournisseur refusés, Conducteur sans rentabilité");
}

function testNoSecondEngine() {
  assert.equal(existsSync(join(root, "src/app/commercial-v2")), false);
  const editor = read("src/components/commercial/QuoteEditor.tsx");
  assert.match(editor, /max-w-\[1500px\]/);
  console.log("✓ pas de 2e arborescence, éditeur plus large");
}

testPathHelper();
testLayoutBranch();
testLaunchLink();
testWorkspaceHeader();
testNavPagesExist();
testPermissions();
testNoSecondEngine();
console.log("OK — test:commercial-workspace-1");
