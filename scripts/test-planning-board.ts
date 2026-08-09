/**
 * Tests helpers Planning opérationnel.
 * Run: npx tsx scripts/test-planning-board.ts
 */
import type { AgendaEventDTO } from "../src/components/agenda/agenda-types";
import {
  eventHasConflict,
  eventsForResourceOnDay,
  filterPlanningEvents,
  planningBlockLabel,
} from "../src/lib/planning/board";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

function ev(partial: Partial<AgendaEventDTO> & { id: string }): AgendaEventDTO {
  return {
    title: partial.title ?? "Evt",
    description: null,
    location: null,
    type: partial.type ?? "INTERVENTION",
    status: partial.status ?? "PLANIFIE",
    startAt: partial.startAt ?? "2026-08-10T08:00:00.000Z",
    endAt: partial.endAt ?? "2026-08-10T12:00:00.000Z",
    allDay: false,
    projectId: partial.projectId ?? "p1",
    responsibleId: partial.responsibleId ?? "u1",
    reminderMinutes: null,
    recurrence: null,
    project: partial.project ?? { id: "p1", title: "Victor Hugo", siteCity: null, siteAddress: null },
    responsible: partial.responsible ?? { id: "u1", name: "Karim Benali", email: "k@x.fr" },
    createdBy: { id: "u1", name: "Karim Benali", email: "k@x.fr" },
    attendees: [],
    ...partial,
  };
}

const day = new Date("2026-08-10T12:00:00.000Z");

const a = ev({
  id: "a",
  startAt: "2026-08-10T08:00:00.000Z",
  endAt: "2026-08-10T12:00:00.000Z",
  project: { id: "p1", title: "Victor Hugo", siteCity: null, siteAddress: null },
});
const b = ev({
  id: "b",
  startAt: "2026-08-10T10:00:00.000Z",
  endAt: "2026-08-10T14:00:00.000Z",
  projectId: "p2",
  project: { id: "p2", title: "République", siteCity: null, siteAddress: null },
});
const admin = ev({ id: "c", type: "FACTURATION", responsibleId: null });

assert(filterPlanningEvents([a, admin]).some((e) => e.id === "a"), "filtre garde intervention");
assert(eventsForResourceOnDay([a, b], "u1", day).length === 2, "2 blocs Karim le même jour");
assert(eventHasConflict(a, [a, b]), "conflit responsable détecté");
assert(planningBlockLabel(a).site.toUpperCase().includes("VICTOR"), "libellé chantier");

if (failed) {
  process.exit(1);
}
console.log("\nPlanning board helpers OK");
