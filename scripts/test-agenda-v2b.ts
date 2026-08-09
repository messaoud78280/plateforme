/**
 * Tests AGENDA-V2B — semaines ISO, résumé période, marqueurs activité.
 * Exécuter : npx tsx scripts/test-agenda-v2b.ts
 */
import assert from "node:assert/strict";
import {
  isoWeekLabel,
  isoWeekNumber,
  startOfWeek,
  eventOverlapsDay,
  isWeekend,
} from "../src/lib/agenda/dates";
import {
  summarizePeriod,
  pickKeyEvents,
  dayActivityIndex,
  dayKey,
  eventsForDay,
} from "../src/lib/agenda/period-summary";
import type { AgendaEventDTO } from "../src/components/agenda/agenda-types";

function ev(partial: Partial<AgendaEventDTO> & { id: string; title: string }): AgendaEventDTO {
  return {
    description: null,
    location: null,
    type: "INTERVENTION",
    status: "CONFIRME",
    startAt: "2026-08-11T07:00:00.000Z",
    endAt: "2026-08-11T08:00:00.000Z",
    allDay: false,
    projectId: "p1",
    responsibleId: "karim",
    reminderMinutes: null,
    recurrence: null,
    project: { id: "p1", title: "Victor Hugo", siteCity: "Lyon", siteAddress: null },
    responsible: { id: "karim", name: "Karim", email: "k@x.fr" },
    createdBy: { id: "u1", name: "Sophie", email: "s@x.fr" },
    attendees: [],
    ...partial,
  };
}

function testIsoWeek() {
  // 11 août 2026 = mardi → semaine ISO 33
  const d = new Date(2026, 7, 11);
  assert.equal(isoWeekNumber(d), 33);
  assert.equal(isoWeekLabel(d), "S33");
  const mon = startOfWeek(d);
  assert.equal(mon.getDay(), 1);
  assert.equal(mon.getDate(), 10);
}

function testWeekendSoft() {
  assert.equal(isWeekend(new Date(2026, 7, 8)), true); // samedi
  assert.equal(isWeekend(new Date(2026, 7, 9)), true); // dimanche
  assert.equal(isWeekend(new Date(2026, 7, 11)), false); // mardi
}

function testPeriodSummary() {
  const events = [
    ev({ id: "1", title: "Intervention", type: "INTERVENTION" }),
    ev({
      id: "2",
      title: "Livraison Point.P",
      type: "LIVRAISON",
      status: "PLANIFIE",
      deliveryVisual: "A_CONFIRMER",
    }),
    ev({
      id: "3",
      title: "Livraison confirmée",
      type: "LIVRAISON",
      status: "CONFIRME",
      deliveryVisual: "CONFIRMEE",
    }),
    ev({ id: "4", title: "Échéance", type: "ECHEANCE" }),
    ev({ id: "5", title: "Réunion", type: "REUNION_CHANTIER" }),
    ev({ id: "6", title: "Planifié générique", type: "AUTRE", status: "PLANIFIE" }),
  ];
  const s = summarizePeriod(events);
  assert.equal(s.total, 6);
  assert.equal(s.interventions, 1);
  assert.equal(s.livraisons, 2);
  assert.equal(s.echeances, 1);
  assert.equal(s.reunions, 1);
  // uniquement livraisons à confirmer — pas tous les PLANIFIE
  assert.equal(s.aConfirmer, 1);
}

function testPickKeyEvents() {
  const events = [
    ev({
      id: "u",
      title: "Urgent",
      type: "ECHEANCE",
      urgency: "URGENT",
      startAt: "2026-08-20T08:00:00.000Z",
      endAt: "2026-08-20T09:00:00.000Z",
    }),
    ev({
      id: "l",
      title: "Livraison",
      type: "LIVRAISON",
      deliveryVisual: "A_CONFIRMER",
      startAt: "2026-08-18T07:00:00.000Z",
      endAt: "2026-08-18T08:00:00.000Z",
    }),
    ev({
      id: "done",
      title: "Terminé",
      type: "INTERVENTION",
      status: "TERMINE",
      startAt: "2026-08-12T07:00:00.000Z",
      endAt: "2026-08-12T08:00:00.000Z",
    }),
  ];
  const key = pickKeyEvents(events, 2);
  assert.equal(key.length, 2);
  assert.equal(key[0]!.id, "u");
}

function testDayActivity() {
  const events = [
    ev({ id: "a", title: "A", startAt: "2026-08-11T07:00:00.000Z", endAt: "2026-08-11T08:00:00.000Z" }),
    ev({
      id: "b",
      title: "B",
      type: "LIVRAISON",
      startAt: "2026-08-11T09:00:00.000Z",
      endAt: "2026-08-11T10:00:00.000Z",
    }),
    ev({
      id: "c",
      title: "C",
      type: "ECHEANCE",
      startAt: "2026-08-11T14:00:00.000Z",
      endAt: "2026-08-11T15:00:00.000Z",
    }),
  ];
  const day = new Date(2026, 7, 11);
  assert.equal(eventsForDay(events, day).length, 3);
  assert.ok(eventOverlapsDay(events[0]!.startAt, events[0]!.endAt, day));
  const idx = dayActivityIndex(events);
  const info = idx.get(dayKey(day));
  assert.ok(info);
  assert.equal(info!.count, 3);
  assert.ok(info!.types.has("LIVRAISON"));
}

function main() {
  testIsoWeek();
  testWeekendSoft();
  testPeriodSummary();
  testPickKeyEvents();
  testDayActivity();
  console.log("OK — AGENDA-V2B tests passed");
}

main();
