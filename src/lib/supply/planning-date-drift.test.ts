/**
 * Écart de date planning → besoin. Aucune écriture.
 */
import assert from "node:assert/strict";
import { evaluatePlanningSupplyDateDrift } from "./planning-date-drift";

const need = {
  id: "need-1",
  label: "Carrelage",
  status: "VALIDATED",
  neededAt: "2026-10-10T00:00:00.000Z",
  scheduleTaskIds: ["task-1"],
};

const task = {
  id: "task-1",
  name: "Pose carrelage",
  startDate: "2026-10-10",
};

const aligned = evaluatePlanningSupplyDateDrift({
  needs: [need],
  tasks: [task],
});
assert.equal(aligned.length, 0);

const moved = evaluatePlanningSupplyDateDrift({
  needs: [need],
  tasks: [{ ...task, startDate: "2026-10-18" }],
});
assert.equal(moved.length, 1);
assert.equal(moved[0]?.deltaDays, 8);
assert.match(moved[0]?.detail ?? "", /Pose carrelage/);
assert.match(moved[0]?.detail ?? "", /\+8 j/);
assert.match(moved[0]?.detail ?? "", /10 oct/);
assert.match(moved[0]?.detail ?? "", /18 oct/);

const earlier = evaluatePlanningSupplyDateDrift({
  needs: [need],
  tasks: [{ ...task, startDate: "2026-10-07" }],
});
assert.equal(earlier[0]?.deltaDays, -3);

const unlinked = evaluatePlanningSupplyDateDrift({
  needs: [{ ...need, scheduleTaskIds: [] }],
  tasks: [{ ...task, startDate: "2026-10-20" }],
});
assert.equal(unlinked.length, 0);

const cancelled = evaluatePlanningSupplyDateDrift({
  needs: [{ ...need, status: "CANCELLED" }],
  tasks: [{ ...task, startDate: "2026-10-20" }],
});
assert.equal(cancelled.length, 0);

const noNeedDate = evaluatePlanningSupplyDateDrift({
  needs: [{ ...need, neededAt: null }],
  tasks: [{ ...task, startDate: "2026-10-20" }],
});
assert.equal(noNeedDate.length, 0);

const noTaskDate = evaluatePlanningSupplyDateDrift({
  needs: [need],
  tasks: [{ ...task, startDate: null }],
});
assert.equal(noTaskDate.length, 0);

const sameInstant = evaluatePlanningSupplyDateDrift({
  needs: [{ ...need, neededAt: "2026-10-10T18:30:00.000Z" }],
  tasks: [task],
});
assert.equal(sameInstant.length, 0);

const earliestMatches = evaluatePlanningSupplyDateDrift({
  needs: [{ ...need, scheduleTaskIds: ["task-late", "task-1"] }],
  tasks: [
    { id: "task-late", name: "Finition", startDate: "2026-10-25" },
    task,
  ],
});
assert.equal(earliestMatches.length, 0);

const earliestMoved = evaluatePlanningSupplyDateDrift({
  needs: [{ ...need, scheduleTaskIds: ["task-late", "task-1"] }],
  tasks: [
    { id: "task-late", name: "Finition", startDate: "2026-10-12" },
    { ...task, startDate: "2026-10-18" },
  ],
});
assert.equal(earliestMoved[0]?.taskName, "Finition");
assert.equal(earliestMoved[0]?.deltaDays, 2);

console.log("planning-date-drift OK");
