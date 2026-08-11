/**
 * Tests Planning V2A + V2B + V2B.1 (filtre terrain, conflits horaires).
 * Run: npx tsx scripts/test-planning-board.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AgendaEventDTO } from "../src/components/agenda/agenda-types";
import {
  eventHasConflict,
  eventsForResourceOnDay,
  filterPlanningEvents,
  filterResourcesByScope,
  hasTerrainPlanifiableUsers,
  isDragBlocked,
  isPlanifiableUser,
  isResourceFreeOnDay,
  isTerrainPlanifiableProfile,
  planningBlockLabel,
  planningPeriodLabel,
  planningRoleLabel,
  planningSummary,
  shiftEventToDay,
  unassignedEventsInRange,
  visibleDaysForRange,
  type PlanningResource,
} from "../src/lib/planning/board";
import {
  evaluatePlanningAssigneeSuggestions,
  PLANNING_SUGGESTION_WEIGHTS,
} from "../src/lib/planning/suggestions";
import {
  computeResourceWorkload,
  formatPlanningDuration,
} from "../src/lib/planning/workload";
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
assert(isPlanifiableUser({ personType: "INTERNAL", permissionProfile: "DIRECTION" }), "Direction planifiable (toute l'équipe)");
assert(isPlanifiableUser({ personType: "INTERNAL", permissionProfile: "ADMINISTRATIF" }), "Administratif planifiable");
assert(!isPlanifiableUser({ personType: "SUPPLIER" }), "Thomas/supplier exclu");
assert(!isPlanifiableUser({ personType: "CLIENT_EXT" }), "Sophie/client exclu");
assert(!isPlanifiableUser({ permissionProfile: "FOURNISSEUR" }), "profil fournisseur exclu");
assert(!isPlanifiableUser({ accessStatus: "DISABLED" }), "DISABLED exclu");
assert(!isPlanifiableUser({ accessStatus: "SUSPENDED" }), "SUSPENDED exclu");

assert(isTerrainPlanifiableProfile("CONDUCTEUR"), "terrain: conducteur");
assert(isTerrainPlanifiableProfile("CHEF_CHANTIER"), "terrain: chef chantier");
assert(!isTerrainPlanifiableProfile("DIRECTION"), "terrain: pas Direction");
assert(!isTerrainPlanifiableProfile("ADMINISTRATIF"), "terrain: pas Administratif");

const teamMix = [
  { id: "d", permissionProfile: "DIRECTION" },
  { id: "j", permissionProfile: "ADMINISTRATIF" },
  { id: "k", permissionProfile: "CONDUCTEUR" },
];
assert(hasTerrainPlanifiableUsers(teamMix), "équipe mixte a du terrain");
assert(filterResourcesByScope(teamMix, "terrain").length === 1, "filtre terrain → 1 conducteur");
assert(filterResourcesByScope(teamMix, "all").length === 3, "filtre all → 3");
assert(
  filterResourcesByScope([{ permissionProfile: "DIRECTION" }], "terrain").length === 1,
  "fallback terrain vide → conserve la liste",
);

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

// —— V2B.1 conflits horaires ——
const overlapA = ev({
  id: "oa",
  startAt: "2026-08-10T09:00:00.000Z",
  endAt: "2026-08-10T12:00:00.000Z",
  projectId: "p1",
});
const overlapB = ev({
  id: "ob",
  startAt: "2026-08-10T11:00:00.000Z",
  endAt: "2026-08-10T13:00:00.000Z",
  projectId: "p2",
  project: { id: "p2", title: "République", siteCity: null, siteAddress: null },
});
assert(eventHasConflict(overlapA, [overlapA, overlapB]), "V2B.1: conflit 09–12 vs 11–13");
const summaryConflict = planningSummary([overlapA, overlapB], resources, day, day);
assert(summaryConflict.conflicts > 0, "V2B.1: KPI conflits > 0");

const freeA = ev({
  id: "fa",
  startAt: "2026-08-10T09:45:00.000Z",
  endAt: "2026-08-10T10:45:00.000Z",
});
const freeB = ev({
  id: "fb",
  startAt: "2026-08-10T12:00:00.000Z",
  endAt: "2026-08-10T13:15:00.000Z",
  projectId: "p2",
  project: { id: "p2", title: "République", siteCity: null, siteAddress: null },
});
assert(!eventHasConflict(freeA, [freeA, freeB]), "V2B.1: non-conflit 09:45–10:45 vs 12:00–13:15");
assert(planningSummary([freeA, freeB], resources, day, day).conflicts === 0, "V2B.1: KPI conflits = 0");

const many = Array.from({ length: 25 }, (_, i) => ({
  id: `u${i}`,
  name: `User ${i}`,
  email: `u${i}@x.fr`,
  kind: "person" as const,
  permissionProfile: i % 5 === 0 ? "DIRECTION" : "CONDUCTEUR",
}));
assert(filterResourcesByScope(many, "terrain").length === 20, "V2B.1: 25 users → 20 terrain");
assert(filterResourcesByScope(many, "all").length === 25, "V2B.1: 25 users → all");

const boardSrc = readFileSync(join(process.cwd(), "src/components/planning/PlanningBoard.tsx"), "utf8");
assert(!/Disponible/.test(boardSrc), "V2B D: aucun wording Disponible");
assert(!/disponible/.test(boardSrc), "V2B D: aucun wording disponible");
assert(boardSrc.includes("Sans affectation") || boardSrc.includes("Aucune affectation planifiée"), "V2B wording sans affectation");
assert(boardSrc.includes("chantiers planifiés") || boardSrc.includes("chantier planifié"), "V2B C: KPI chantier planifié");
assert(boardSrc.includes('view !== "day"'), "V2B E: 5j/6j/7j masqués en vue Jour");
assert(!boardSrc.includes("EmptyPlanningState"), "V2B: gros empty state retiré");
assert(boardSrc.includes("MobileDayPeople"), "V2B G: mobile liste collaborateurs");
assert(boardSrc.includes("EmptyAssignCell"), "V2B.1: cellule vide allégée");
assert(boardSrc.includes("Équipe terrain"), "V2B.1: filtre équipe terrain");
assert(boardSrc.includes("Toute l'équipe") || boardSrc.includes("Toute l&apos;équipe"), "V2B.1: toute l'équipe");
assert(boardSrc.includes("max-h-[min(70vh,52rem)]"), "V2B.1: scroll vertical board");
assert(!boardSrc.includes("isoWeekLabel"), "V2B.1: badge S33 doublon retiré");

// —— V2C ——
const unassignedEvt = ev({
  id: "ua",
  responsibleId: null,
  responsible: null,
  startAt: "2026-08-11T07:00:00.000Z",
  endAt: "2026-08-11T11:00:00.000Z",
});
const rangeFrom = new Date("2026-08-10T00:00:00.000Z");
const rangeTo = new Date("2026-08-16T23:59:59.000Z");
assert(
  unassignedEventsInRange([unassignedEvt, a], rangeFrom, rangeTo).some((e) => e.id === "ua"),
  "V2C: À organiser contient event sans responsable",
);

const suggestions = evaluatePlanningAssigneeSuggestions({
  event: unassignedEvt,
  candidates: [
    { id: "u1", name: "Karim Benali", email: "k@x.fr", permissionProfile: "CONDUCTEUR" },
    { id: "u2", name: "Julie Martin", email: "j@x.fr", permissionProfile: "ADMINISTRATIF" },
  ],
  allEvents: [a],
  projectHint: {
    id: "p1",
    title: "Victor Hugo",
    assignedToId: "u1",
    accessUserIds: ["u1"],
    conducteurId: "u1",
  },
});
assert(suggestions[0]?.userId === "u1", "V2C scénario 1: Karim suggéré en tête");
assert(suggestions[0]?.suggested === true, "V2C: flag Suggéré sur meilleur sans conflit");
assert(
  suggestions[0]!.reasons.includes("conducteur_pilotage") ||
    suggestions[0]!.reasons.includes("assigne_projet"),
  "V2C: raison factuelle chantier",
);
assert(suggestions[0]!.reasons.includes("aucun_conflit"), "V2C: aucun conflit Karim mardi");
assert(
  suggestions.find((s) => s.userId === "u2")!.reasons.includes("role_moins_adapte"),
  "V2C: Julie rôle moins adapté",
);
assert(PLANNING_SUGGESTION_WEIGHTS.conducteur_pilotage === 40, "V2C: poids centralisés");

const wl = computeResourceWorkload([a], "u1", [day]);
assert(wl.assignments === 1, "V2C: 1 affectation charge");
assert(wl.minutes === 240, "V2C: 4h = 240 min");
assert(formatPlanningDuration(450) === "7 h 30", "V2C: format 7 h 30");
assert(formatPlanningDuration(null) === null, "V2C: pas de durée fictive");

assert(boardSrc.includes("À organiser"), "V2C: zone À organiser");
assert(boardSrc.includes("Affecter →") || boardSrc.includes("Affecter"), "V2C: action Affecter");
assert(boardSrc.includes("evaluatePlanningAssigneeSuggestions"), "V2C: moteur suggestions");
assert(boardSrc.includes("patchEventOptimistic"), "V2C: optimistic UI");
assert(boardSrc.includes("Affecter quand même"), "V2C: conflit confirmé");
assert(boardSrc.includes("CollaboratorPanel"), "V2C: panneau collaborateur");
assert(boardSrc.includes("computeResourceWorkload"), "V2C: charge planifiée");
assert(
  !boardSrc.includes("router.refresh(") && !boardSrc.includes("router.refresh()"),
  "V2C: pas d'appel router.refresh",
);
assert(!/openai|anthropic|gemini|OpenAI/i.test(boardSrc), "V2C: aucune IA externe dans board");
const sugSrc = readFileSync(join(process.cwd(), "src/lib/planning/suggestions.ts"), "utf8");
assert(!/openai|anthropic|gemini|OpenAI|@ai-sdk/i.test(sugSrc), "V2C: suggestions sans SDK IA");
assert(sugSrc.includes("PLANNING_SUGGESTION_WEIGHTS"), "V2C: poids explicables");
assert(sugSrc.includes("déterministes") || sugSrc.includes("determinist"), "V2C: moteur déterministe");

const pageSrc = readFileSync(join(process.cwd(), "src/app/dashboard/planning/page.tsx"), "utf8");
assert(pageSrc.includes("isExternalPortalUser"), "V2B H: externes redirigés");
assert(pageSrc.includes("isPlanifiableUser"), "V2B H: filtre planifiables");
assert(pageSrc.includes("projectHints"), "V2C: projectHints pour suggestions");

if (failed) {
  process.exit(1);
}
console.log("\nPlanning board helpers OK (V2A+V2B+V2B.1+V2C)");
