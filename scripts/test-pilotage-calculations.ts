/**
 * Tests unitaires légers — calculs Pilotage travaux
 * Exécution : npx tsx scripts/test-pilotage-calculations.ts
 */
import assert from "node:assert/strict";
import {
  computeAdminProgress,
  computeDoeProgress,
  isOverdue,
  startOfDay,
} from "../src/lib/pilotage/calculations";

const yesterday = new Date(startOfDay().getTime() - 86400000);
assert.equal(isOverdue(yesterday, "À faire"), true);
assert.equal(isOverdue(yesterday, "Terminée"), false);

const doe = computeDoeProgress([
  { status: "Conforme" },
  { status: "Manquant" },
  { status: "Non applicable" },
  { status: "À corriger" },
]);
assert.equal(doe.applicable, 3);
assert.equal(doe.conforme, 1);
assert.equal(doe.pct, 33);

const admin = computeAdminProgress({
  obligationsTotal: 2,
  obligationsDone: 1,
  docsTotal: 2,
  docsDone: 2,
  plansTotal: 0,
  plansDone: 0,
  doePct: 50,
});
assert.ok(admin >= 50 && admin <= 100);

console.log("test-pilotage-calculations : OK");
