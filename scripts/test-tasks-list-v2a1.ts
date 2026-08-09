/**
 * TACHES-V2A.1 — ergonomie + personas (câblage).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { displayUserRoleLabel } from "../src/lib/equipe-acces/display-role";

const root = process.cwd();
const ui = readFileSync(join(root, "src/components/tasks/TasksOperationalList.tsx"), "utf8");
const list = readFileSync(join(root, "src/lib/tasks/list-view.ts"), "utf8");
const seed = readFileSync(join(root, "src/lib/demo-environment/seed.ts"), "utf8");
const role = readFileSync(join(root, "src/lib/equipe-acces/display-role.ts"), "utf8");

assert.equal(
  displayUserRoleLabel({
    role: "CLIENT",
    personType: "INTERNAL",
    permissionProfile: "CONDUCTEUR",
  }),
  "Conducteur de travaux",
);
assert.equal(
  displayUserRoleLabel({ role: "AGENT", personType: "INTERNAL", permissionProfile: null }),
  "Conducteur de travaux",
);
assert.equal(
  displayUserRoleLabel({
    role: "CLIENT",
    personType: "CLIENT_EXT",
    permissionProfile: "CLIENT",
  }),
  "Client",
);
assert.doesNotMatch(
  displayUserRoleLabel({ role: "AGENT", personType: "INTERNAL" }),
  /^Agent$/,
);

assert.match(list, /totalOpen/);
assert.match(list, /jobTitle/);
assert.match(ui, /totalOpen/);
assert.match(ui, /Trier :/);
assert.match(ui, /lg:flex-\[0_1_55%\]/);
assert.match(ui, /grid-cols-\[minmax/);
assert.match(ui, /group-hover:opacity-100/);
assert.doesNotMatch(ui, /btn-cc-primary !min-h-8.*Ouvrir/);

assert.match(seed, /TACHES-V2A\.1/);
assert.match(seed, /réaligner nom \+ profil/);
assert.match(role, /jobTitle/);

console.log("ok displayUserRoleLabel (pas Agent générique)");
console.log("ok résumé totalOpen + échéance séparée");
console.log("ok toolbar / grille / chevron");
console.log("\nTACHES-V2A.1 — ALL PASS");
