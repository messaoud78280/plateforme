/**
 * FOURNISSEURS-2 — création directe fournisseur.
 * Run: npx tsx scripts/test-fournisseurs-2-create.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function testNoSecondModel() {
  const service = read("src/lib/suppliers/service.ts");
  assert.match(service, /type: "SUPPLIER"/);
  assert.match(service, /externalOrgContact/i);
  assert.match(service, /createSupplier/);
  assert.match(service, /updateSupplier/);
  assert.match(service, /findSupplierDuplicates/);
  assert.doesNotMatch(service, /SupplierV2|model Vendor/);
  console.log("✓ ExternalOrganization + ExternalOrgContact, pas de second modèle");
}

function testApiAndUi() {
  const api = read("src/app/api/suppliers/route.ts");
  assert.match(api, /createSupplier/);
  assert.match(api, /forceCreate/);
  assert.match(api, /409/);
  const patch = read("src/app/api/suppliers/[id]/route.ts");
  assert.match(patch, /updateSupplier/);
  assert.match(patch, /PATCH/);

  const page = read("src/app/dashboard/fournisseurs/page.tsx");
  assert.match(page, /SuppliersWorkspace/);
  assert.doesNotMatch(page, /pas de création isolée/);

  const workspace = read("src/components/suppliers/SuppliersWorkspace.tsx");
  assert.match(workspace, /\+ Nouveau fournisseur/);
  assert.match(workspace, /SupplierFormDrawer/);

  const form = read("src/components/suppliers/SupplierFormDrawer.tsx");
  assert.match(form, /Nouveau fournisseur/);
  assert.match(form, /Créer quand même/);
  assert.match(form, /Ouvrir/);
  assert.doesNotMatch(form, /Caméra/);

  const detail = read("src/app/dashboard/fournisseurs/[id]/page.tsx");
  assert.match(detail, /SupplierEditButton/);
  const editBtn = read("src/components/suppliers/SupplierEditButton.tsx");
  assert.match(editBtn, /Modifier/);
  assert.match(editBtn, /mode="edit"/);
  console.log("✓ API + drawer création/édition + liste sans message obsolète");
}

function testPermissionsGuards() {
  const api = read("src/app/api/suppliers/route.ts");
  assert.match(api, /isInternalPurchaseOrderActor/);
  assert.match(api, /forbiddenUnlessDashboardHref/);
  assert.match(api, /\/dashboard\/fournisseurs/);
  const nav = read("src/lib/equipe-acces/nav-by-persona.ts");
  assert.doesNotMatch(
    nav.slice(nav.indexOf("CONDUCTEUR:"), nav.indexOf("CHEF_CHANTIER:")),
    /\/dashboard\/fournisseurs/,
  );
  console.log("✓ SEC-1 : API gardée ; Conducteur hors module Fournisseurs");
}

function testNoMigration() {
  // Pas de nouveau fichier migration attendu pour cette mission
  const service = read("src/lib/suppliers/service.ts");
  assert.match(service, /siret/);
  assert.match(service, /zipCode/);
  assert.match(service, /website/);
  assert.match(service, /paymentTerms/);
  console.log("✓ champs sur schéma existant — pas de migration");
}

testNoSecondModel();
testApiAndUi();
testPermissionsGuards();
testNoMigration();
console.log("OK — test:fournisseurs-2-create");
