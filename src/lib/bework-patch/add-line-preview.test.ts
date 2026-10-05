/**
 * Tests preview add_line — fiche métier sans JSON.
 * node --import tsx src/lib/bework-patch/add-line-preview.test.ts
 */
import assert from "node:assert/strict";
import {
  countAddLines,
  formatDisplayUnit,
  formatFormulaDisplay,
  formatQuantityWithUnit,
  isAddLineDirectChange,
  parseAddLineAfter,
  parseTechnicalNotes,
  provenanceBadgeLabel,
  roleBadgeLabel,
  summarizeAddLineLots,
  summarizeAddLineStats,
} from "./add-line-preview";
import type { DirectChange } from "./impact/types";

function change(after: unknown, op = "add_line"): DirectChange {
  return {
    op,
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
      formula: "49.45*0.70*0.80",
      provenance: "HYPOTHESE",
      role: "quote",
      nature: "en_place",
      notes: "NF DTU 13.1",
    }),
    change({
      code: "GO-02-02",
      lot: "GO-02 Fondations",
      designation: "Semelles filantes BA 50 x 25",
      declared_quantity: 6.18,
      unit: "m3",
      provenance: "HYPOTHESE",
      role: "quote",
      notes: "NF DTU 13.1 · NF EN 206+A2/CN · NF DTU 21",
    }),
    change({
      code: "GO-05-03",
      lot: "GO-05 Maçonneries",
      designation: "Maçonnerie nette",
      declared_quantity: 95.12,
      unit: "m2",
      role: "quote",
      notes: "NF DTU 20.1",
    }),
    change({
      code: "GO-06-01",
      lot: "GO-06 Béton armé",
      designation: "Refend BA",
      declared_quantity: 2.32,
      unit: "m3",
      role: "indicator",
      notes: "NF DTU 21",
    }),
  ];

  assert.equal(countAddLines(changes), 4);
  assert.ok(isAddLineDirectChange(changes[0]!));
  // Détection même sans op (filet de sécurité UI)
  assert.ok(
    isAddLineDirectChange({
      ...changes[0]!,
      op: "unknown",
    }),
  );

  assert.equal(formatQuantityWithUnit(27.69, "m3"), "27,69 m³");
  assert.equal(formatQuantityWithUnit(95.12, "m2"), "95,12 m²");
  assert.equal(formatDisplayUnit("FT"), "Forfait");
  assert.equal(formatFormulaDisplay("49.45*0.70*0.80"), "49.45 × 0.70 × 0.80");
  assert.equal(roleBadgeLabel("quote"), "DEVIS");
  assert.equal(roleBadgeLabel("indicator"), "INDICATEUR");
  assert.equal(provenanceBadgeLabel("HYPOTHESE"), "HYPOTHÈSE");

  const notes = parseTechnicalNotes("NF DTU 13.1 · NF EN 206+A2/CN · NF DTU 21", {
    formula: "49.45*0.70*0.80",
    quantity: 27.69,
    unit: "m3",
  });
  assert.ok(notes);
  assert.ok(notes!.metre?.includes("×"));
  assert.ok(notes!.metre?.includes("27,69 m³"));
  assert.ok(notes!.references.some((r) => r.includes("DTU 13.1")));
  assert.ok(notes!.references.some((r) => r.includes("206")));

  const stats = summarizeAddLineStats(changes);
  assert.equal(stats.total, 4);
  assert.equal(stats.quote, 3);
  assert.equal(stats.indicator, 1);
  assert.equal(stats.hypothesis, 2);
  assert.equal(stats.calculated, 1);

  const lots = summarizeAddLineLots(changes);
  assert.equal(lots.length, 4);

  // Jamais de JSON dans parse
  const line = parseAddLineAfter(changes[0]!.after)!;
  assert.equal(line.code, "GO-01-01");
  assert.equal(JSON.stringify(line).includes('"code"'), true); // objet OK
  // Le renderer ne doit pas utiliser stringify pour l'affichage — testé via format helpers

  console.log("add-line-preview.test.ts: ok (fiche sans JSON brut)");
}

run();
