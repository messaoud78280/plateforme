/**
 * COMMERCIAL-WORKSPACE-2 — sidebar réelle, pas de liens morts.
 * npx tsx scripts/test-commercial-workspace-2.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildCommercialNav,
  canShowCommercialPurchases,
} from "../src/lib/commercial/workspace-nav";
import { canAccessCommercialModule } from "../src/lib/commercial/access";
import { canAccessDashboardHref } from "../src/lib/equipe-acces/dashboard-policy";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function testNavRealOnly() {
  const nav = buildCommercialNav({
    personType: "INTERNAL",
    permissionProfile: "DIRECTION",
  });
  const labels = nav.flatMap((g) => g.links.map((l) => l.label)).join(" | ");
  assert.match(labels, /Créer un devis/);
  assert.match(labels, /Devis/);
  assert.match(labels, /Factures/);
  assert.match(labels, /Situations/);
  assert.match(labels, /Journal des ventes/);
  assert.match(labels, /Clients/);
  assert.match(labels, /Factures fournisseurs/);
  assert.doesNotMatch(labels, /Avoir/);
  assert.doesNotMatch(labels, /Facture électronique/);
  assert.doesNotMatch(labels, /Bientôt/);
  console.log("✓ menu Direction : fonctions réelles uniquement");
}

function testConducteurNoPurchases() {
  assert.equal(
    canShowCommercialPurchases({
      personType: "INTERNAL",
      permissionProfile: "CONDUCTEUR",
    }),
    false,
  );
  const nav = buildCommercialNav({
    personType: "INTERNAL",
    permissionProfile: "CONDUCTEUR",
  });
  assert.ok(!nav.some((g) => g.id === "achats"));
  console.log("✓ Conducteur : pas de groupe Achats (SEC-1)");
}

function testPagesExist() {
  const pages = [
    "src/app/dashboard/devis-facturation/page.tsx",
    "src/app/dashboard/devis-facturation/situations/page.tsx",
    "src/app/dashboard/devis-facturation/suivi/devis-a-relancer/page.tsx",
    "src/app/dashboard/devis-facturation/suivi/impayes/page.tsx",
    "src/app/dashboard/devis-facturation/journal/page.tsx",
    "src/app/dashboard/devis-facturation/clients/page.tsx",
    "src/components/commercial/CommercialSidebar.tsx",
    "src/components/commercial/CommercialWorkspaceShell.tsx",
  ];
  for (const p of pages) assert.ok(existsSync(join(root, p)), p);
  console.log("✓ pages WORKSPACE-2 présentes");
}

function testShell() {
  const layout = read("src/app/dashboard/layout.tsx");
  assert.match(layout, /CommercialWorkspaceShell/);
  assert.doesNotMatch(layout, /CommercialWorkspaceHeader \/>/);
  const header = read("src/components/commercial/CommercialWorkspaceHeader.tsx");
  assert.doesNotMatch(header, /CommercialSubNav/);
  assert.match(header, /Nouveau devis/);
  const sidebar = read("src/components/commercial/CommercialSidebar.tsx");
  assert.match(sidebar, /Retour à la plateforme/);
  console.log("✓ shell sidebar + header fin");
}

function testPermissions() {
  assert.equal(
    canAccessCommercialModule({
      personType: "CLIENT_EXT",
      permissionProfile: "CLIENT",
    }),
    false,
  );
  assert.equal(
    canAccessDashboardHref(
      "/dashboard/devis-facturation",
      "INTERNAL",
      "CONDUCTEUR",
    ),
    true,
  );
  console.log("✓ SEC-1 module Commercial");
}

testNavRealOnly();
testConducteurNoPurchases();
testPagesExist();
testShell();
testPermissions();
console.log("✅ test-commercial-workspace-2 OK");
