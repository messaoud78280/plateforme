/**
 * DESIGN-SYSTEM-V3 — câblage tokens / primitives (pas de DB).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BEWORK_LAYOUT, BEWORK_RADIUS } from "../src/lib/design-tokens";

const root = process.cwd();
const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
const main = readFileSync(join(root, "src/components/dashboard/DashboardMain.tsx"), "utf8");
const header = readFileSync(join(root, "src/components/ui/PageHeader.tsx"), "utf8");
const btn = readFileSync(join(root, "src/components/ui/Button.tsx"), "utf8");

assert.match(css, /DESIGN-SYSTEM-V3/);
assert.match(css, /--dashboard-max-width:\s*1520px/);
assert.match(css, /--cc-radius-panel/);
assert.match(css, /\.bw-search/);
assert.match(css, /\.cc-list-surface/);
assert.match(css, /-apple-system/);
assert.match(css, /--cc-btn-h/);

assert.equal(BEWORK_LAYOUT.dashboardMaxWidth, "1520px");
assert.ok(BEWORK_RADIUS.control);
assert.ok(BEWORK_RADIUS.panel);

assert.match(main, /max-w-dashboard/);
assert.doesNotMatch(header, /cc-card/);
assert.match(btn, /btn-cc-link/);

console.log("ok tokens V3 + largeur dashboard");
console.log("ok PageHeader sans card décorative");
console.log("ok primitives boutons");
console.log("\nDESIGN-SYSTEM-V3 — ALL PASS");
