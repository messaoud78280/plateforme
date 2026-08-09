/**
 * Tests helpers Planning opérationnel V2A.
 * Run: npx tsx scripts/test-planning-board.ts
 */
import type { AgendaEventDTO } from "../src/components/agenda/agenda-types";
import {
  eventHasConflict,
  eventsForResourceOnDay,
  filterPlanningEvents,
  isDragBlocked,
  isPlanifiableUser,
  planningBlockLabel,
  shiftEventToDay,
  visibleDaysForRange,
} from "../src/lib/planning/board";
import { startOfWeek } from "../src/lib/agenda/dates";

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

assert(isPlanifiableUser({ personType: "INTERNAL" }), "internal planifiable");
assert(!isPlanifiableUser({ personType: "SUPPLIER" }), "Thomas/supplier exclu");
assert(!isPlanifiableUser({ personType: "CLIENT_EXT" }), "Sophie/client exclu");
assert(!isPlanifiableUser({ permissionProfile: "FOURNISSEUR" }), "profil fournisseur exclu");

assert(isDragBlocked(ev({ id: "l", type: "LIVRAISON", purchaseOrderId: "po1" })).blocked, "BL drag bloqué");
assert(!isDragBlocked(a).blocked, "intervention drag OK");

const weekStart = startOfWeek(new Date("2026-08-10T12:00:00.000Z"));
assert(visibleDaysForRange(weekStart, "week", 5, weekStart).length === 5, "5 jours");
assert(visibleDaysForRange(weekStart, "week", 6, weekStart).length === 6, "6 jours lun-sam");
assert(visibleDaysForRange(weekStart, "fortnight", 5, weekStart).length === 10, "2×5 jours");

const shifted = shiftEventToDay(a, new Date("2026-08-11T00:00:00.000Z"));
assert(new Date(shifted.startAt).getDate() === 11, "shift jour conserve l'heure");

if (failed) {
  process.exit(1);
}
console.log("\nPlanning board helpers OK");
