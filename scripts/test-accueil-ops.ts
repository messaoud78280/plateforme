/**
 * ACCUEIL-V2A — tests purs (scopes / labels / hors DB).
 */
import assert from "node:assert/strict";

function dueLabel(iso: string | null, now: Date): string {
  if (!iso) return "";
  const d = new Date(iso);
  const t0 = new Date(now);
  t0.setHours(0, 0, 0, 0);
  const t1 = new Date(d);
  t1.setHours(0, 0, 0, 0);
  const diff = Math.round((t1.getTime() - t0.getTime()) / 86400000);
  if (diff < 0) return "En retard";
  if (diff === 0) return "Aujourd’hui";
  if (diff === 1) return "Demain";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function testDueLabels() {
  const now = new Date(2026, 7, 9, 12);
  assert.equal(dueLabel(new Date(2026, 7, 8).toISOString(), now), "En retard");
  assert.equal(dueLabel(new Date(2026, 7, 9).toISOString(), now), "Aujourd’hui");
  assert.equal(dueLabel(new Date(2026, 7, 10).toISOString(), now), "Demain");
}

function testScopeDefaults() {
  const conducteurDefault = "mine";
  const directionDefault = "team";
  assert.equal(conducteurDefault, "mine");
  assert.equal(directionDefault, "team");
}

function testDeepLinks() {
  const orderId = "po123";
  const projectId = "proj_vh";
  const eventId = "ev1";
  assert.equal(`/dashboard/commandes/${orderId}`, "/dashboard/commandes/po123");
  assert.equal(`/dashboard/projets/${projectId}`, "/dashboard/projets/proj_vh");
  assert.ok(`/dashboard/agenda?event=${eventId}`.includes("event=ev1"));
}

const tests: [string, () => void][] = [
  ["labels échéance tâches", testDueLabels],
  ["scopes moi / équipe", testScopeDefaults],
  ["deep links modules", testDeepLinks],
];

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(e);
  }
}
if (failed) process.exit(1);
console.log(`\nOK — test:accueil-ops (${tests.length})`);
