/**
 * HEADER-UI — raccourcis header simplifiés.
 * npx tsx scripts/test-header-ui.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

const outils = read("src/components/OutilsCommunication.tsx");
assert.match(outils, /WeTransfer/);
assert.match(outils, /https:\/\/wetransfer\.com/);
assert.doesNotMatch(outils, />\s*Outils\s*</);
assert.doesNotMatch(outils, /hidden sm:inline">WhatsApp/);
assert.doesNotMatch(outils, /Google Meet/);
assert.doesNotMatch(outils, /meet\.google\.com/);
assert.doesNotMatch(outils, /whatsapp:\/\//i);
assert.doesNotMatch(outils, /business\.whatsapp/);

const layout = read("src/app/dashboard/layout.tsx");
assert.match(layout, /OutilsCommunication/);
assert.match(layout, /CommercialLaunchLink/);
assert.match(layout, /GlobalSearchTrigger/);
assert.match(layout, /UserAccountDropdown/);

console.log("✓ header : Outils / WhatsApp / Meet retirés, WeTransfer conservé");
console.log("✅ test-header-ui OK");
