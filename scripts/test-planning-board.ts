/**
 * Tests Planning V2A + V2B (ressources visibles sans affectation).
 * Run: npx tsx scripts/test-planning-board.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AgendaEventDTO } from "../src/components/agenda/agenda-types";
import {
  eventHasConflict,
  eventsForResourceOnDay,
  filterPlanningEvents,
  isDragBlocked,
  isPlanifiableUser,
  isResourceFreeOnDay,
  planningBlockLabel,
  planningPeriodLabel,
  planningRoleLabel,
  planningSummary,
  shiftEventToDay,
  visibleDaysForRange,
  type PlanningResource,
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
assert(!isPlanifiableUser({ accessStatus: "DISABLED" }), "DISABLED exclu");
assert(!isPlanifiableUser({ accessStatus: "SUSPENDED" }), "SUSPENDED exclu");

assert(isDragBlocked(ev({ id: "l", type: "LIVRAISON", purchaseOrderId: "po1" })).blocked, "BL drag bloqué");
assert(!isDragBlocked(a).blocked, "intervention drag OK");

const weekStart = startOfWeek(new Date("2026-08-10T12:00:00.000Z"));
assert(visibleDaysForRange(weekStart, "week", 5, weekStart).length === 5, "5 jours");
assert(visibleDaysForRange(weekStart, "week", 6, weekStart).length === 6, "6 jours lun-sam");
assert(visibleDaysForRange(weekStart, "fortnight", 5, weekStart).length === 10, "2×5 jours");
assert(visibleDaysForRange(weekStart, "day", 5, day).length === 1, "vue jour = 1 jour (ignore 5j)");

const shifted = shiftEventToDay(a, new Date("2026-08-11T00:00:00.000Z"));
assert(new Date(shifted.startAt).getDate() === 11, "shift jour conserve l'heure");

// —— V2B ——
const resources: PlanningResource[] = [
  { id: "u1", name: "Karim Benali", email: "k@x.fr", kind: "person", permissionProfile: "CONDUCTEUR" },
  { id: "u2", name: "Julie Martin", email: "j@x.fr", kind: "person", permissionProfile: "ADMINISTRATIF" },
  { id: "u3", name: "Thomas Leroy", email: "t@x.fr", kind: "person", permissionProfile: "CONDUCTEUR" },
];

const emptySummary = planningSummary([], resources, day, day);
assert(emptySummary.collaborators === 3, "V2B A: 0 events → 3 collaborateurs KPI");
assert(emptySummary.assignments === 0, "V2B A: 0 affectations");
assert(emptySummary.sites === 0, "V2B A: 0 chantiers planifiés");
assert(isResourceFreeOnDay([], "u1", day), "V2B A: Karim sans affectation");
assert(isResourceFreeOnDay([], "u2", day), "V2B A: Julie sans affectation");
assert(isResourceFreeOnDay([], "u3", day), "V2B A: Thomas sans affectation");

const oneEvt = [a];
const withKarim = planningSummary(oneEvt, resources, day, day);
assert(withKarim.collaborators === 3, "V2B B: 1 event → toujours 3 collaborateurs");
assert(withKarim.assignments === 1, "V2B B: 1 affectation Karim");
assert(withKarim.sites === 1, "V2B B: 1 chantier planifié");
assert(!isResourceFreeOnDay(oneEvt, "u1", day), "V2B B: Karim a une affectation");
assert(isResourceFreeOnDay(oneEvt, "u2", day), "V2B B: Julie toujours sans affectation");
assert(eventsForResourceOnDay(oneEvt, "u1", day).length === 1, "V2B B: 1 bloc Karim");

const dayLabel = planningPeriodLabel("day", day, [day]);
assert(dayLabel.title.length > 0, "V2B date title");
assert(dayLabel.rangeLabel === "", "V2B date: pas de doublon rangeLabel en vue jour");

assert(
  planningRoleLabel({ id: "u1", permissionProfile: "CONDUCTEUR" }) === "Conducteur de travaux",
  "rôle conducteur métier",
);

const boardSrc = readFileSync(join(process.cwd(), "src/components/planning/PlanningBoard.tsx"), "utf8");
assert(!/Disponible/.test(boardSrc), "V2B D: aucun wording Disponible");
assert(!/disponible/.test(boardSrc), "V2B D: aucun wording disponible");
assert(boardSrc.includes("Sans affectation") || boardSrc.includes("Aucune affectation planifiée"), "V2B wording sans affectation");
assert(boardSrc.includes("chantiers planifiés") || boardSrc.includes("chantier planifié"), "V2B C: KPI chantier planifié");
assert(boardSrc.includes('view !== "day"'), "V2B E: 5j/6j/7j masqués en vue Jour");
assert(!boardSrc.includes("EmptyPlanningState"), "V2B: gros empty state retiré");
assert(boardSrc.includes("MobileDayPeople"), "V2B G: mobile liste collaborateurs");

const pageSrc = readFileSync(join(process.cwd(), "src/app/dashboard/planning/page.tsx"), "utf8");
assert(pageSrc.includes("isExternalPortalUser"), "V2B H: externes redirigés");
assert(pageSrc.includes("isPlanifiableUser"), "V2B H: filtre planifiables");

if (failed) {
  process.exit(1);
}
console.log("\nPlanning board helpers OK (V2A+V2B)");
