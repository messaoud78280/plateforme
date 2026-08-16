/**
 * GED-UI-5 — harmonisation premium (UI only, déterministe).
 * npx tsx scripts/test-ged-ui5-harmonisation.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hubEmptyCopy } from "../src/lib/ged/document-hub-ui";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function testSharedComponents() {
  const ui = read("src/components/ged/GedUi.tsx");
  assert.match(ui, /GedBackLink/);
  assert.match(ui, /GedBreadcrumb/);
  assert.match(ui, /GedViewTabs/);
  assert.match(ui, /GedCategoryGrid/);
  assert.match(ui, /GedEmptyState/);
  assert.match(ui, /max-w-\[1200px\]/);
  console.log("✓ composants GED partagés");
}

function testHubNavigation() {
  const hub = read("src/app/dashboard/documents/DocumentsHubClient.tsx");
  assert.match(hub, /GedBackLink/);
  assert.match(hub, /Toutes les catégories/);
  assert.match(hub, /GedViewTabs/);
  assert.match(hub, /GedCategoryGrid/);
  assert.match(hub, /Documents à récupérer/);
  assert.match(hub, /Documents à classer/);
  assert.doesNotMatch(hub, /Bientôt/);
  assert.doesNotMatch(hub, /history\.back/);
  console.log("✓ hub : retours + titres + tabs");
}

function testRowsAndViewer() {
  const row = read("src/components/ged/GedDocumentRow.tsx");
  assert.match(row, /À récupérer/);
  assert.match(row, /Ajouter le document/);
  assert.match(row, /Star/);
  assert.doesNotMatch(row, /text-amber-500/);
  const viewer = read("src/components/documents/DocumentPreviewModal.tsx");
  assert.match(viewer, /Impossible d’ouvrir ce document/);
  assert.match(viewer, /Le fichier n’est pas disponible actuellement/);
  assert.match(viewer, /#1e3a5f/);
  console.log("✓ lignes + viewer premium");
}

function testChantier() {
  const c = read("src/components/chantier/ChantierDossierSection.tsx");
  assert.match(c, /GedViewTabs/);
  assert.match(c, /GedCategoryGrid/);
  assert.match(c, /GedBackLink/);
  assert.match(c, /Tous les documents de/);
  console.log("✓ vue chantier harmonisée");
}

function testEmptyCopy() {
  const fav = hubEmptyCopy({ group: "all", view: "favorites" });
  assert.equal(fav.title, "Aucun favori");
  assert.match(fav.body, /étoile/);
  const miss = hubEmptyCopy({ group: "all", view: "missing" });
  assert.equal(miss.title, "Aucun document à récupérer");
  const search = hubEmptyCopy({ group: "all", search: "xyz" });
  assert.match(search.body, /ne correspond/);
  console.log("✓ états vides");
}

function testNoLogicTouch() {
  assert.ok(existsSync(join(root, "src/lib/ged/document-hub.ts")));
  assert.ok(existsSync(join(root, "src/lib/ged/hub-categories.ts")));
  // Pas de migration dans le diff attendu — fichier UI only
  console.log("✓ loaders GED conservés");
}

testSharedComponents();
testHubNavigation();
testRowsAndViewer();
testChantier();
testEmptyCopy();
testNoLogicTouch();
console.log("✅ test-ged-ui5-harmonisation OK");
