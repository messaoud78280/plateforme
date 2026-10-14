import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertPlanningSuiviPlanWritable } from "./planning-suivi";

assert.doesNotThrow(() => assertPlanningSuiviPlanWritable("CURRENT"));
assert.doesNotThrow(() => assertPlanningSuiviPlanWritable("INITIAL"));
assert.throws(
  () => assertPlanningSuiviPlanWritable("ARCHIVED"),
  /planning est archivé/i,
);
assert.throws(
  () => assertPlanningSuiviPlanWritable("archived"),
  /planning est archivé/i,
);

const source = readFileSync(
  join(process.cwd(), "src/lib/chantier/planning-suivi.ts"),
  "utf8",
);
assert.match(
  source,
  /assertPlanningSuiviPlanWritable\(plan\.status\)/,
  "La création du suivi doit refuser un plan archivé",
);
assert.match(
  source,
  /assertPlanningSuiviPlanWritable\(task\.plan\.status\)/,
  "La mutation d'une tâche doit refuser un plan archivé",
);
assert.match(
  source,
  /prepScheduleTask\.updateMany/,
  "La mutation doit revalider le statut dans la requête d'écriture",
);
assert.match(source, /status: \{ not: "ARCHIVED" \}/);

console.log("planning-suivi-archive.test.ts: OK");
