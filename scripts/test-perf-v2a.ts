/**
 * PERF-V2A — garde-fous (sans timing inventé).
 * npx tsx scripts/test-perf-v2a.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

const tour = read("src/components/demo-environment/DemoCommercialTour.tsx");
assert.doesNotMatch(
  tour,
  /router\.push\(href\);\s*\n\s*router\.refresh\(\)/,
  "tour: pas de push+refresh",
);

const switcher = read("src/components/demo-environment/DemoViewAsSwitcher.tsx");
assert.match(switcher, /pathname === \"\/dashboard\"/);
assert.doesNotMatch(
  switcher,
  /router\.replace\(\"\/dashboard\"\);\s*\n\s*router\.refresh\(\)/,
);

const missions = read("src/components/messagerie/MessagerieMissionsView.tsx");
assert.match(missions, /30_000/);
assert.match(missions, /45_000/);
assert.match(missions, /document\.hidden/);
assert.doesNotMatch(missions, /}, 7000\)/);
assert.doesNotMatch(missions, /}, 10000\)/);

const layout = read("src/app/dashboard/layout.tsx");
assert.match(layout, /dynamic\(/);
assert.match(layout, /DemoCommercialTour/);
assert.match(layout, /ssr:\s*false/);

const main = read("src/components/dashboard/DashboardMain.tsx");
assert.match(main, /pendingNav/);
assert.match(main, /opacity-70/);

console.log("✓ PERF-V2A garde-fous");
console.log("\nPERF-V2A — ALL PASS");
