/**
 * TACHES-V2A — tests de câblage (pas de DB).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

const page = read("src/app/dashboard/taches/page.tsx");
const listView = read("src/lib/tasks/list-view.ts");
const legacy = read("src/lib/tasks/legacy-purchase-order.ts");
const ui = read("src/components/tasks/TasksOperationalList.tsx");
const seed = read("src/lib/demo-environment/seed.ts");

assert.match(page, /TasksOperationalList/);
assert.match(page, /isOperationalInternalUser/);
assert.doesNotMatch(page, /Espace client/);
assert.doesNotMatch(page, /Mes missions/);
assert.match(page, /Mes demandes/);

assert.match(legacy, /purchaseOrderAsLegacy/);
assert.match(legacy, /Bon de commande/);
assert.match(listView, /excludeLegacyPurchaseOrderTasksWhere/);
assert.match(listView, /displayUserRoleLabel/);
assert.match(listView, /totalOpen/);

assert.match(ui, /Nouvelle tâche/);
assert.match(ui, /Mes tâches/);
assert.match(ui, /Équipe/);
assert.match(ui, /max-w-\[1400px\]/);
assert.doesNotMatch(ui, /Mes missions/);
assert.doesNotMatch(ui, /assistant/);

assert.match(seed, /TACHES-V2A/);
assert.match(seed, /ne plus lui/);
assert.match(seed, /Karim Benali/);
assert.doesNotMatch(
  seed.slice(seed.indexOf("enrichDemoTaskThreads"), seed.indexOf("enrichDemoTaskThreads") + 1200),
  /assignee = lauraId/,
);

console.log("ok page interne + exclusion PO legacy");
console.log("ok UI opérationnelle");
console.log("ok seed Laura / BC");
console.log("\nTACHES-V2A — ALL PASS");
