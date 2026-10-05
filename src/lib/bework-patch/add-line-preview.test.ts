/**
 * Tests preview add_line — purs.
 * node --import tsx src/lib/bework-patch/add-line-preview.test.ts
 */
import assert from "node:assert/strict";
import {
  countAddLines,
  parseAddLineAfter,
  summarizeAddLineLots,
  provenanceBadgeLabel,
} from "./add-line-preview";
import type { DirectChange } from "./impact/types";

function change(after: unknown): DirectChange {
  return {
    op: "add_line",
    section: "TAKEOFF",
    entityType: "PREP_LINE",
    entityId: "x",
    label: "x",
    field: "line",
    before: null,
    after,
    unit: "m3",
  };
}

function run() {
  const changes = [
    change({
      code: "GO-01-01",
      lot: "GO-01 Terrassements",
      designation: "Fouilles en rigoles",
      declared_quantity: 27.69,
      unit: "m3",
      formula: "L*l*h",
      provenance: "HYPOTHESE",
      role: "quote",
      notes: "NF DTU 13.1",
    }),
    change({
      code: "GO-02-02",
      lot: "GO-02 Fondations",
      designation: "Semelles filantes",
      declared_quantity: 6.18,
      unit: "m3",
      provenance: "HYPOTHESE",
      role: "quote",
      notes: "NF DTU 13.1 · NF EN 206",
    }),
    change({
      code: "GO-01-02",
      lot: "GO-01 Terrassements",
      designation: "Autre",
      declared_quantity: 1,
      unit: "m3",
      role: "quote",
    }),
  ];

  assert.equal(countAddLines(changes), 3);
  const lots = summarizeAddLineLots(changes);
  assert.equal(lots.find((l) => l.lot === "GO-01 Terrassements")?.count, 2);
  assert.equal(lots.find((l) => l.lot === "GO-02 Fondations")?.count, 1);

  const line = parseAddLineAfter(changes[0]!.after);
  assert.equal(line?.code, "GO-01-01");
  assert.equal(line?.declared_quantity, 27.69);
  assert.equal(provenanceBadgeLabel("HYPOTHESE"), "HYPOTHÈSE");

  // Pas de — → — : after est un objet line
  assert.notEqual(line, null);
  assert.ok(line!.designation.includes("Fouilles"));

  console.log("add-line-preview.test.ts: ok");
}

run();
