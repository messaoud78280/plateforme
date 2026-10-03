/**
 * Échelle visuelle Gantt — largeurs min, scroll horizontal, proportions.
 * Aucun computeSchedule.
 */
import assert from "node:assert/strict";
import {
  barGeometry,
  buildGanttBars,
  dayWidthForZoom,
  enumerateCalendarDays,
  GANTT_LABEL_PANEL_WIDTH,
  groupDaysByIsoWeek,
  type GanttTaskInput,
  type GanttZoom,
} from "./gantt-layout";

// Largeurs minimums confortables (ne jamais compresser sous ces seuils)
assert.ok(dayWidthForZoom("day") >= 90 && dayWidthForZoom("day") <= 110);
assert.ok(dayWidthForZoom("week") >= 70 && dayWidthForZoom("week") <= 85);
assert.ok(dayWidthForZoom("3weeks") >= 55 && dayWidthForZoom("3weeks") <= 70);
assert.ok(dayWidthForZoom("month") >= 35 && dayWidthForZoom("month") <= 45);
assert.ok(GANTT_LABEL_PANEL_WIDTH >= 570 && GANTT_LABEL_PANEL_WIDTH <= 630);

const w = dayWidthForZoom("3weeks");
assert.equal(w, 64);

// Exemple 21 jours × 64 px = 1344 px (scroll si viewport plus étroit)
assert.equal(21 * w, 1344);

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
const five = barGeometry(
  "2026-10-12",
  { startDate: "2026-10-12", endDate: "2026-10-16", startHalf: 0, endHalf: 1 },
  w,
)!;
assert.equal(one.widthPx, w);
assert.equal(two.widthPx, 2 * w);
assert.equal(half.widthPx, w / 2);
assert.equal(five.widthPx, 5 * w);
assert.ok(two.widthPx === one.widthPx * 2);

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function fakeTasks(n: number, spanDays: number): GanttTaskInput[] {
  const out: GanttTaskInput[] = [];
  const start = "2026-10-12";
  for (let i = 0; i < n; i++) {
    const offset = i % Math.max(1, spanDays - 1);
    const iso = addDays(start, offset);
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

for (const span of [15, 30, 60, 120]) {
  for (const zoom of ["day", "week", "3weeks", "month"] as GanttZoom[]) {
    const dw = dayWidthForZoom(zoom);
    const end = addDays("2026-10-12", span - 1);
    const days = enumerateCalendarDays("2026-10-12", end);
    assert.equal(days.length, span, `${span}j ${zoom}`);
    const chartW = days.length * dw;
    assert.ok(
      chartW >= span * dw,
      `largeur timeline ${span}j ${zoom} = ${chartW}`,
    );
    // Jamais une journée écrasée sous le minimum du zoom
    assert.ok(dw === dayWidthForZoom(zoom));
  }
}

for (const n of [10, 30, 50, 100]) {
  const span = n === 100 ? 120 : 30;
  const tasks = fakeTasks(n, span);
  const bars = buildGanttBars(tasks, "2026-10-12", w);
  assert.ok(bars.length > 0, `${n} tâches`);
  const days = enumerateCalendarDays("2026-10-12", addDays("2026-10-12", span - 1));
  assert.ok(days.length === span);
  assert.ok(groupDaysByIsoWeek(days).length >= 2);
  assert.ok(days.length * w > 800, "timeline assez large pour scroll");
}

console.log(
  "OK gantt-visual-scale: min day widths + 15/30/60/120j + 10/30/50/100 tâches + 0,5/1/2/5j",
);
