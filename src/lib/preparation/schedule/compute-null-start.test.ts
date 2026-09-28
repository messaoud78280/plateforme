import assert from "node:assert/strict";
import { normalizeCivilStartDate } from "@/lib/preparation/schedule/calendar";
import { computeSchedule } from "@/lib/preparation/schedule/compute";
import type {
  PrepResourcesDTO,
  PrepScheduleDTO,
  PrepWorkflowStepDTO,
} from "@/lib/preparation/schedule/types";

assert.equal(normalizeCivilStartDate(null), null);
assert.equal(normalizeCivilStartDate(""), null);
assert.equal(normalizeCivilStartDate("1970-01-01"), null);
assert.equal(normalizeCivilStartDate(new Date(0)), null);
assert.equal(normalizeCivilStartDate("2026-10-05"), "2026-10-05");
assert.equal(normalizeCivilStartDate("1985-01-01"), null);

const workflow: PrepWorkflowStepDTO[] = [
  {
    id: "P01",
    name: "Décapage",
    kind: "work",
    order: 1,
    lot: "TERR",
    description: null,
    takeoff_ids: ["TER-01"],
    crew: [],
    equipment: [],
    supplies: [],
    preconditions: [],
    controls_before_next: [],
    constraints: [],
    safety: [],
    proofs: [],
    hold_point: false,
    conditional: null,
    duration: { mode: "fixed", days: 2, calendar: "working" },
  },
  {
    id: "P02",
    name: "Fouilles",
    kind: "work",
    order: 2,
    lot: "TERR",
    description: null,
    takeoff_ids: ["TER-03"],
    crew: [],
    equipment: [],
    supplies: [],
    preconditions: [],
    controls_before_next: [],
    constraints: [],
    safety: [],
    proofs: [],
    hold_point: false,
    conditional: null,
    duration: { mode: "fixed", days: 3, calendar: "working" },
  },
];

const schedule: PrepScheduleDTO = {
  start_date: null,
  start_date_provenance: null,
  calendar: {
    working_days: [1, 2, 3, 4, 5],
    holidays: "FR_METROPOLE",
    granularity_days: 0.5,
  },
  tasks: [
    { step_id: "P01", depends_on: [], include_in_base: true },
    {
      step_id: "P02",
      depends_on: [{ step_id: "P01", type: "FS", lag_days: 0 }],
      include_in_base: true,
    },
  ],
};

const resources: PrepResourcesDTO = {
  labor: [],
  equipment: [],
  supplies: [],
  rates: [],
};

const result = computeSchedule({
  workflowSteps: workflow,
  schedule,
  resources,
  qtyOf: () => null,
});

assert.equal(result.startDate, null);
assert.equal(result.errors.length, 0);
assert.equal(result.placed.length, 2);
for (const t of result.placed) {
  assert.equal(t.startDate, null, `date civile attendue null pour ${t.stepId}`);
  assert.equal(t.endDate, null, `date civile attendue null pour ${t.stepId}`);
}
assert.ok(
  result.baseDurationWorkingDays != null && result.baseDurationWorkingDays > 0,
  "durée relative calculable sans start_date",
);

const withStart = computeSchedule({
  workflowSteps: workflow,
  schedule: { ...schedule, start_date: "2026-10-05" },
  resources,
  qtyOf: () => null,
});
assert.equal(withStart.startDate, "2026-10-05");
assert.ok(withStart.placed[0]!.startDate);
assert.notEqual(withStart.placed[0]!.startDate, "1970-01-01");

const epochRejected = computeSchedule({
  workflowSteps: workflow,
  schedule: { ...schedule, start_date: "1970-01-01" },
  resources,
  qtyOf: () => null,
});
assert.equal(epochRejected.startDate, null);
assert.equal(epochRejected.placed[0]!.startDate, null);

console.log("ok — schedule null start_date (pas de 1970)");
