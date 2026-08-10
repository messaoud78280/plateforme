/**
 * AGENDA-V2A.2 — garde-fous scroll TimeGrid 06:00–22:00.
 * npx tsx scripts/test-agenda-v2a2-time-scroll.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EXTENDED_HOUR_END,
  EXTENDED_HOUR_START,
  WORK_HOUR_END,
  WORK_HOUR_START,
  hoursList,
} from "../src/lib/agenda/dates";
import { agendaHourPx } from "../src/lib/agenda/zoom";

const root = process.cwd();

function testHourRange() {
  assert.equal(EXTENDED_HOUR_START, 6);
  assert.equal(EXTENDED_HOUR_END, 22);
  assert.equal(WORK_HOUR_START, 7);
  assert.equal(WORK_HOUR_END, 19);
  const hours = hoursList(EXTENDED_HOUR_START, EXTENDED_HOUR_END);
  assert.equal(hours[0], 6);
  assert.equal(hours[hours.length - 1], 22);
  assert.equal(hours.length, 17);
  const totalH = EXTENDED_HOUR_END - EXTENDED_HOUR_START + 1;
  assert.equal(totalH * agendaHourPx(100), 17 * 64);
  assert.ok(totalH * agendaHourPx(130) > totalH * agendaHourPx(100));
}

function testDayWeekScrollStructure() {
  const src = readFileSync(
    join(root, "src/components/agenda/AgendaDayWeekView.tsx"),
    "utf8",
  );
  assert.ok(src.includes("absolute inset-0 flex min-h-0 flex-col"));
  assert.ok(src.includes("data-agenda-time-scroll"));
  assert.ok(src.includes("min-h-0 flex-1"));
  assert.ok(src.includes("overflow-y-auto"));
  assert.ok(src.includes("GRID_EDGE_PAD_TOP"));
  assert.ok(src.includes("GRID_EDGE_PAD_BOTTOM"));
  assert.ok(src.includes('useState(true)')); // extended défaut 06–22
  assert.ok(src.includes("initialScrollKeyRef"));
  assert.ok(!src.includes("h-[900px]") && !src.includes("max-h-[700px]"));
  // Y drag sans double scrollTop
  assert.ok(src.includes("ne pas re-ajouter scrollTop") || src.includes("clientY - rect.top"));
  assert.ok(!/clientY - rect\.top \+ \(scrollRef\.current\?\.scrollTop/.test(src));
}

function testAgendaAppViewport() {
  const app = readFileSync(join(root, "src/components/agenda/AgendaApp.tsx"), "utf8");
  assert.ok(app.includes("100dvh"));
  assert.ok(app.includes("min-h-0 flex-1 overflow-hidden"));
}

function main() {
  testHourRange();
  testDayWeekScrollStructure();
  testAgendaAppViewport();
  console.log("OK — agenda v2a.2 time scroll");
}

main();
