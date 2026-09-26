/**
 * Tests phase 3C — Gantt layout, indicateurs, demi-journées, dates C-01.
 * Exécuter : npx tsx scripts/test-prep-schedule-gantt.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { computeStudy } from "../src/lib/preparation/engine/compute";
import { parsePrepJsonText } from "../src/lib/preparation/bundle/parse";
import {
  parsePrepResources,
  parsePrepSchedule,
  parsePrepWorkflowSteps,
} from "../src/lib/preparation/schedule/parse";
import { computeSchedule } from "../src/lib/preparation/schedule/compute";
import {
  barGeometry,
  buildGanttBars,
  calendarDaysInclusive,
  computePlanIndicators,
  dayWidthForZoom,
  enumerateCalendarDays,
  halfIndexOnAxis,
  holdPointBlocksSuccessor,
  normalizeHoldPointStatus,
} from "../src/lib/preparation/schedule/gantt-layout";

const ROOT = path.resolve(__dirname, "..");
const RAW = readFileSync(
  path.join(ROOT, "docs/preparation/exemples/c01-fondations.prep.json"),
  "utf8",
);

function section(name: string) {
  console.log(`\n▸ ${name}`);
}

section("Moteur C-01 (régression 3A/3B)");
{
  const parsed = parsePrepJsonText(RAW);
  assert.ok(parsed.ok);
  const b = parsed.bundle;
  const engine = computeStudy({ params: b.parameters, lines: b.lines });
  const resources = parsePrepResources(b.resources);
  const workflow = parsePrepWorkflowSteps(b.workflow);
  const schedule = parsePrepSchedule(b.schedule)!;
  const result = computeSchedule({
    workflowSteps: workflow,
    schedule,
    resources,
    qtyOf: (c) => engine.nodes.get(c)?.value ?? null,
  });
  assert.equal(result.errors.length, 0);
  const byId = Object.fromEntries(result.placed.map((t) => [t.stepId, t]));

  assert.equal(byId.P03.duration.durationDays, 2);
  assert.ok(Math.abs((byId.P03.duration.quantity ?? 0) - 45.184) < 0.01);
  assert.equal(byId.P03.duration.rateValue, 24);

  assert.equal(byId.P06.duration.durationDays, 2);
  assert.ok(Math.abs((byId.P06.duration.quantity ?? 0) - 740) < 0.01);
  assert.equal(byId.P06.duration.rateValue, 370);

  assert.equal(byId.P07.duration.durationDays, 0.5);
  assert.equal(byId.P07.holdPoint, true);
  assert.equal(byId.P07.start.half, 0);
  assert.equal(byId.P07.end.half, 0);

  assert.equal(byId.P08.duration.durationDays, 1);
  assert.ok(Math.abs((byId.P08.duration.quantity ?? 0) - 11.38) < 0.01);
  assert.equal(byId.P08.duration.rateValue, 12);

  assert.equal(byId.P09.duration.durationDays, 3);
  assert.equal(byId.P09.duration.calendar, "calendar");
  assert.equal(byId.P09.startDate, "2026-10-17");
  assert.equal(byId.P09.endDate, "2026-10-19");

  assert.equal(byId.P11.duration.durationDays, 0.5);
  assert.equal(byId.P11.startDate, "2026-10-19");
  assert.equal(byId.P11.start.half, 0);
  assert.equal(byId.P11.end.half, 0);

  assert.equal(byId.P10.conditional, true);
  assert.equal(byId.P10.includeInBase, false);
  assert.equal(byId.P10.startDate, "2026-10-20");

  assert.ok(Math.abs((result.baseDurationWorkingDays ?? 0) - 10.5) < 0.01);
  console.log("  OK dates / durées C-01");
}

section("Axe temporel + positionnement barres");
{
  const days = enumerateCalendarDays("2026-10-05", "2026-10-20");
  assert.equal(days.length, 16);
  const sat = days.find((d) => d.iso === "2026-10-17");
  const sun = days.find((d) => d.iso === "2026-10-18");
  assert.ok(sat?.isWeekend);
  assert.ok(sun?.isWeekend);
  assert.equal(days.find((d) => d.iso === "2026-10-16")?.isWeekend, false);

  const dayW = dayWidthForZoom("day");
  assert.equal(dayW, 56);

  // P03 : 07-08 octobre, jour plein
  const p03 = barGeometry(
    "2026-10-05",
    { startDate: "2026-10-07", endDate: "2026-10-08", startHalf: 0, endHalf: 1 },
    dayW,
  )!;
  assert.equal(p03.leftPx, halfIndexOnAxis("2026-10-05", "2026-10-07", 0) * (dayW / 2));
  assert.equal(p03.widthPx, 2 * dayW);

  // P07 : demi-journée matin
  const p07 = barGeometry(
    "2026-10-05",
    { startDate: "2026-10-15", endDate: "2026-10-15", startHalf: 0, endHalf: 0 },
    dayW,
  )!;
  assert.equal(p07.widthPx, dayW / 2);

  // P09 traverse le week-end
  const p09 = barGeometry(
    "2026-10-05",
    { startDate: "2026-10-17", endDate: "2026-10-19", startHalf: 0, endHalf: 1 },
    dayW,
  )!;
  assert.equal(p09.widthPx, 3 * dayW);

  // P11 parallèle fin P09 (même jour, demi-journée)
  const p11 = barGeometry(
    "2026-10-05",
    { startDate: "2026-10-19", endDate: "2026-10-19", startHalf: 0, endHalf: 0 },
    dayW,
  )!;
  assert.equal(p11.leftPx, p09.leftPx + 2 * dayW);
  assert.equal(p11.widthPx, dayW / 2);

  const bars = buildGanttBars(
    [
      {
        id: "1",
        stepCode: "P09",
        startDate: "2026-10-17",
        endDate: "2026-10-19",
        startHalf: 0,
        endHalf: 1,
        durationDays: 3,
        durationCalendar: "calendar",
        kind: "wait",
        includeInBase: true,
        holdPoint: false,
        conditional: false,
      },
      {
        id: "2",
        stepCode: "P11",
        startDate: "2026-10-19",
        endDate: "2026-10-19",
        startHalf: 0,
        endHalf: 0,
        durationDays: 0.5,
        durationCalendar: "working",
        kind: "work",
        includeInBase: true,
        holdPoint: false,
        conditional: false,
      },
    ],
    "2026-10-05",
    dayW,
  );
  assert.equal(bars.length, 2);
  console.log("  OK Gantt demi-journées / week-end / parallèle P09-P11");
}

section("Indicateurs A/B/C/D");
{
  const tasks = [
    {
      id: "a",
      stepCode: "P01",
      startDate: "2026-10-05",
      endDate: "2026-10-05",
      startHalf: 0,
      endHalf: 1,
      durationDays: 1,
      durationCalendar: "working",
      kind: "work",
      includeInBase: true,
      holdPoint: false,
      conditional: false,
    },
    {
      id: "b",
      stepCode: "P07",
      startDate: "2026-10-15",
      endDate: "2026-10-15",
      startHalf: 0,
      endHalf: 0,
      durationDays: 0.5,
      durationCalendar: "working",
      kind: "control",
      includeInBase: true,
      holdPoint: true,
      conditional: false,
    },
    {
      id: "c",
      stepCode: "P09",
      startDate: "2026-10-17",
      endDate: "2026-10-19",
      startHalf: 0,
      endHalf: 1,
      durationDays: 3,
      durationCalendar: "calendar",
      kind: "wait",
      includeInBase: true,
      holdPoint: false,
      conditional: false,
    },
    {
      id: "d",
      stepCode: "P10",
      startDate: "2026-10-20",
      endDate: "2026-10-20",
      startHalf: 0,
      endHalf: 1,
      durationDays: 1,
      durationCalendar: "working",
      kind: "work",
      includeInBase: false,
      holdPoint: false,
      conditional: true,
    },
  ];
  const ind = computePlanIndicators({
    tasks,
    startDate: "2026-10-05",
    endDateBase: "2026-10-19",
    baseDurationWorkingDays: 10.5,
  });
  assert.equal(ind.workloadDays, 1.5); // P01 + P07, hors P10 et hors wait
  assert.equal(ind.workingSpanDays, 10.5);
  assert.equal(ind.calendarSpanDays, calendarDaysInclusive("2026-10-05", "2026-10-19"));
  assert.equal(ind.calendarSpanDays, 15);
  assert.equal(ind.waitDays, 3);
  console.log("  OK indicateurs distincts (charge ≠ span ouvré ≠ calendaire)");
}

section("Point d'arrêt — états");
{
  assert.equal(normalizeHoldPointStatus(null, true), "A_CONTROLER");
  assert.equal(normalizeHoldPointStatus("VALIDE", true), "VALIDE");
  assert.equal(normalizeHoldPointStatus(null, false), null);
  assert.equal(holdPointBlocksSuccessor(true, "A_CONTROLER"), true);
  assert.equal(holdPointBlocksSuccessor(true, "RESERVES"), true);
  assert.equal(holdPointBlocksSuccessor(true, "VALIDE"), false);
  assert.equal(holdPointBlocksSuccessor(false, null), false);
  console.log("  OK hold point");
}

section("Anti double-comptage logique devis (unitaire)");
{
  // Simulation : même quoteLineId sur deux tâches → total unique
  const links = [
    { quoteLineId: "L1", sellHt: 100 },
    { quoteLineId: "L1", sellHt: 100 },
    { quoteLineId: "L2", sellHt: 50 },
  ];
  const seen = new Set<string>();
  let total = 0;
  for (const l of links) {
    if (seen.has(l.quoteLineId)) continue;
    seen.add(l.quoteLineId);
    total += l.sellHt;
  }
  assert.equal(total, 150);
  console.log("  OK total HT unique par ligne devis");
}

console.log("\n✅ test-prep-schedule-gantt PASS");
