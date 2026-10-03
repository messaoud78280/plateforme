/**
 * Échelle visuelle Gantt — proportions durées, 10/30/50/100 tâches.
 * Aucun computeSchedule.
 */
import assert from "node:assert/strict";
import {
  barGeometry,
  buildGanttBars,
  dayWidthForZoom,
  enumerateCalendarDays,
  groupDaysByIsoWeek,
  type GanttTaskInput,
} from "./gantt-layout";

const w = dayWidthForZoom("3weeks");
const half = barGeometry(
  "2026-10-12",
  { startDate: "2026-10-12", endDate: "2026-10-12", startHalf: 0, endHalf: 0 },
  w,
)!;
const one = barGeometry(
  "2026-10-12",
  { startDate: "2026-10-12", endDate: "2026-10-12", startHalf: 0, endHalf: 1 },
  w,
)!;
const two = barGeometry(
  "2026-10-12",
  { startDate: "2026-10-12", endDate: "2026-10-13", startHalf: 0, endHalf: 1 },
  w,
)!;
assert.equal(one.widthPx, w);
assert.equal(two.widthPx, 2 * w);
assert.equal(half.widthPx, w / 2);
assert.ok(two.widthPx === one.widthPx * 2);

function fakeTasks(n: number, spanDays: number): GanttTaskInput[] {
  const out: GanttTaskInput[] = [];
  for (let i = 0; i < n; i++) {
    const offset = i % Math.max(1, spanDays - 1);
    const d = String(12 + (offset % 18)).padStart(2, "0");
    const month = offset > 17 ? "11" : "10";
    const iso = `2026-${month}-${d}`;
    out.push({
      id: `t${i}`,
      stepCode: `S-${i}`,
      startDate: iso,
      endDate: iso,
      startHalf: 0,
      endHalf: i % 2,
      durationDays: i % 2 ? 0.5 : 1,
      durationCalendar: "working",
      kind: "work",
      includeInBase: true,
      holdPoint: false,
      conditional: false,
    });
  }
  return out;
}

for (const n of [10, 30, 50, 100]) {
  const tasks = fakeTasks(n, n === 100 ? 120 : 21);
  const bars = buildGanttBars(tasks, "2026-10-12", w);
  assert.ok(bars.length > 0, `${n} tâches`);
  const days = enumerateCalendarDays("2026-10-12", "2027-01-31");
  assert.ok(days.length > 80);
  assert.ok(groupDaysByIsoWeek(days).length >= 12);
}

console.log("OK gantt-visual-scale 10/30/50/100 + 0,5j/1j/2j");
