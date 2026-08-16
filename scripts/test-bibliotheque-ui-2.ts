/**
 * BIBLIOTHEQUE-UI-2 — smoke (pas d’appel DB).
 * npx tsx scripts/test-bibliotheque-ui-2.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const hub = read("src/components/commercial/LibraryHub.tsx");
const page = read("src/app/dashboard/devis-facturation/bibliotheque/page.tsx");
const stats = read("src/lib/commercial/library.ts");

assert.match(hub, /max-w-\[1320px\]/);
assert.match(hub, /matériaux catalogue/);
assert.match(hub, /formatSaleUnit/);
assert.match(hub, /Ensemble/);
assert.match(hub, /minMarginPercent/);
assert.match(hub, /RecentStrip/);
assert.match(hub, /updatedAtMs/);
assert.match(page, /ensureCommercialOrgSettings/);
assert.match(stats, /commercialMaterial\.count/);
assert.match(stats, /commercialLaborResource\.count/);
assert.doesNotMatch(hub, /Import CSV — prochainement/);

console.log("✓ Compteurs = catalogue (pas composants ouvrage)");
console.log("✓ UI premium + ens→Ensemble + marges settings");
console.log("✓ Page passe min/targetMarginPercent");
console.log("OK — test:bibliotheque-ui-2");
