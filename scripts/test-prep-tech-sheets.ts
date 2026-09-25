/**
 * Test ciblé : fiches techniques indépendantes du calcul + compat anciens JSON.
 *   node --import tsx scripts/test-prep-tech-sheets.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parsePrepJsonText } from "../src/lib/preparation/bundle/parse";
import { computeStudy } from "../src/lib/preparation/engine/compute";
import { C01_LINE_TEXT_ENRICHMENTS } from "../src/lib/preparation/enrichment/c01-fondations-texts";

const ROOT = path.resolve(__dirname, "..");
const RAW = readFileSync(path.join(ROOT, "docs/preparation/exemples/c01-fondations.prep.json"), "utf8");

const parsed = parsePrepJsonText(RAW);
assert.ok(parsed.ok, "C-01 enrichi doit parser");
assert.equal(parsed.issues.filter((i) => i.severity === "error").length, 0);

const te01 = parsed.bundle.lines.find((l) => l.code === "TE-01");
assert.ok(te01);
assert.match(te01.designation, /Terrassement mécanique en rigoles/i);
assert.ok(te01.description && te01.description.length > 80);
assert.ok(te01.includedServices.length >= 3);
assert.ok(te01.technicalReferences.some((r) => r.label.includes("DTU 13.1")));
assert.ok(te01.technicalReferences.every((r) => ["INDICATIVE", "DOSSIER", "TO_VERIFY"].includes(r.kind)));

const before = computeStudy({ params: parsed.bundle.parameters, lines: parsed.bundle.lines });
assert.ok(Math.abs((before.nodes.get("TE-01")?.value ?? 0) - 36.48) < 1e-9);

// Modifier uniquement les textes ne doit rien changer au moteur.
const mutated = parsed.bundle.lines.map((l) =>
  l.code === "TE-01"
    ? { ...l, designation: "XXX", description: "YYY", includedServices: ["a"], technicalReferences: [] }
    : l,
);
const after = computeStudy({ params: parsed.bundle.parameters, lines: mutated });
assert.equal(after.nodes.get("TE-01")?.value, before.nodes.get("TE-01")?.value);
assert.equal(after.nodes.get("BE-01")?.value, before.nodes.get("BE-01")?.value);

// Ancien JSON minimal sans nouveaux champs.
const minimal = {
  format: "bework_prep_bundle_v1",
  mode: "demonstration",
  study: { title: "Mini" },
  parameters: [{ key: "a", label: "A", value: 2, unit: "m", provenance: "HYPOTHESE" }],
  takeoff: {
    lots: [{ code: "T", label: "Test" }],
    items: [
      {
        id: "L-01",
        lot: "T",
        designation: "Poste simple",
        unit: "m",
        formula: "a",
        declared_quantity: 2,
        role: "quote",
      },
    ],
  },
  disclaimers: ["DÉMONSTRATION — NON CONTRACTUEL"],
};
const old = parsePrepJsonText(JSON.stringify(minimal));
assert.ok(old.ok, "ancien JSON sans fiches doit rester accepté");
assert.equal(old.bundle.lines[0].includedServices.length, 0);
assert.equal(old.bundle.lines[0].technicalReferences.length, 0);
assert.equal(computeStudy({ params: old.bundle.parameters, lines: old.bundle.lines }).nodes.get("L-01")?.value, 2);

assert.ok(Object.keys(C01_LINE_TEXT_ENRICHMENTS).length >= 24);
console.log("OK — fiches techniques / compatibilité / indépendance du calcul");
