/**
 * Smoke moteur planning C-01 (fichier JSON local, sans BDD).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { computeStudy } from "../src/lib/preparation/engine/compute";
import { parsePrepJsonText } from "../src/lib/preparation/bundle/parse";
import { parsePrepResources, parsePrepSchedule, parsePrepWorkflowSteps } from "../src/lib/preparation/schedule/parse";
import { computeSchedule, computeStepDuration } from "../src/lib/preparation/schedule/compute";

const RAW = readFileSync(
  path.resolve(__dirname, "../docs/preparation/exemples/c01-fondations.prep.json"),
  "utf8",
);

const parsed = parsePrepJsonText(RAW);
assert.ok(parsed.ok, "JSON C-01 invalide");
const b = parsed.bundle;
const engine = computeStudy({ params: b.parameters, lines: b.lines });
const resources = parsePrepResources(b.resources);
const workflow = parsePrepWorkflowSteps(b.workflow);
const schedule = parsePrepSchedule(b.schedule);
assert.ok(schedule);

const qtyOf = (code: string) => {
  const n = engine.nodes.get(code);
  return n?.value ?? null;
};

const ev01 = qtyOf("EV-01");
assert.ok(ev01 != null && Math.abs(ev01 - 45.184) < 0.01, `EV-01=${ev01}`);
const p03 = workflow.find((s) => s.id === "P03")!;
const d03 = computeStepDuration(p03, resources, qtyOf);
assert.equal(d03.durationDays, 2, `P03 durée ${d03.durationDays}`);
assert.equal(d03.driverItem, "EV-01");
console.log("OK P03", d03.quantity, "m³ /", d03.rateValue, "→", d03.durationDays, "j");

const result = computeSchedule({
  workflowSteps: workflow,
  schedule,
  resources,
  qtyOf,
});
assert.equal(result.errors.length, 0, result.errors.join("; "));
assert.ok(result.baseDurationWorkingDays != null);
console.log(
  "OK planning",
  "base=",
  result.baseDurationWorkingDays,
  "j",
  "fin base=",
  result.baseEnd,
);

const byId = Object.fromEntries(result.placed.map((t) => [t.stepId, t]));
assert.equal(byId.P03.duration.durationDays, 2);
assert.equal(byId.P07.holdPoint, true);
assert.equal(byId.P10.conditional, true);
assert.equal(byId.P10.includeInBase, false);
assert.equal(byId.P09.kind, "wait");
assert.equal(byId.P09.duration.calendar, "calendar");
assert.equal(byId.P09.duration.durationDays, 3);

// Dates scénario
assert.equal(byId.P01.startDate, "2026-10-05");
assert.equal(byId.P03.startDate, "2026-10-07");
assert.equal(byId.P03.endDate, "2026-10-08");
assert.equal(byId.P08.startDate, "2026-10-16");
assert.equal(byId.P09.startDate, "2026-10-17");
assert.equal(byId.P09.endDate, "2026-10-19");
assert.equal(byId.P11.startDate, "2026-10-19");
assert.ok(Math.abs((result.baseDurationWorkingDays ?? 0) - 10.5) < 0.01, `base ${result.baseDurationWorkingDays}`);

console.log("PASS moteur planning C-01");
for (const t of result.placed) {
  console.log(
    `  ${t.stepId} ${t.kind.padEnd(7)} ${String(t.duration.durationDays).padStart(4)}j ${t.startDate} → ${t.endDate}${t.conditional ? " COND" : ""}${t.holdPoint ? " HOLD" : ""}`,
  );
}
