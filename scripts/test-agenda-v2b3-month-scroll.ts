/**
 * AGENDA-V2B.3 — scroll vertical vue Mois au zoom (câblage, pas de DOM).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { agendaMonthRowMinPx } from "../src/lib/agenda/zoom";

const root = process.cwd();
const month = readFileSync(join(root, "src/components/agenda/AgendaMonthView.tsx"), "utf8");
const app = readFileSync(join(root, "src/components/agenda/AgendaApp.tsx"), "utf8");
const day = readFileSync(join(root, "src/components/agenda/AgendaDayWeekView.tsx"), "utf8");

assert.equal(agendaMonthRowMinPx(100), 100);
assert.equal(agendaMonthRowMinPx(130), 130);
assert.equal(agendaMonthRowMinPx(80), 80);

assert.match(month, /data-agenda-month-scroll/);
assert.match(month, /overflow-y-auto/);
assert.match(month, /minmax\(\$\{rowMinPx\}px, 1fr\)/);
assert.match(month, /scrollTop = 0/);
assert.doesNotMatch(month, /grid-rows-6/);

assert.match(app, /overflow-hidden/);
assert.match(app, /min-h-0 flex-1 overflow-hidden/);
assert.match(app, /h-\[calc\(100dvh-4\.5rem\)\]/);

/** Jour/Semaine conserve son scroll temporel dédié */
assert.match(day, /overflow-y-auto/);
assert.match(day, /scrollRef/);

console.log("ok rowMinPx zoom 80/100/130");
console.log("ok Mois : scroll interne + minmax (plus grid-rows-6)");
console.log("ok App : hauteur viewport + overflow-hidden (pas de double scroll Jour)");
console.log("\nAGENDA-V2B.3 — ALL PASS");
