/**
 * DEMO-TOUR-UX-V1.1 — smoke tests.
 * npx tsx scripts/test-demo-tour-ux-v1.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

const tour = read("src/components/demo-environment/DemoCommercialTour.tsx");
const switcher = read("src/components/demo-environment/DemoViewAsSwitcher.tsx");
const layout = read("src/app/dashboard/layout.tsx");

assert.match(layout, /DemoCommercialTour/);
assert.match(tour, /isAccueilPath/);
assert.match(tour, /showFloatingLauncher/);
assert.match(tour, /OPEN_DEMO_TOUR_EVENT/);
assert.match(tour, /pathname === \"\/dashboard\"/);
assert.match(tour, /z-30/);
assert.doesNotMatch(tour, /bottom-20/);

assert.match(switcher, /OPEN_DEMO_TOUR_EVENT/);
assert.match(switcher, /demo-tour-menu-launch/);
assert.match(switcher, /▶ Présenter/);

console.log("✓ launcher Accueil-only + menu Démo + z-index");
console.log("\nDEMO-TOUR-UX-V1.1 — ALL PASS");
