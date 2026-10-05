/**
 * Preview CREATE — provenance_kind PLAN / CALCULATION préservés.
 * node --import tsx src/lib/preparation/import-provenance.test.ts
 */
import assert from "node:assert/strict";
import { parsePrepJsonText } from "@/lib/preparation/bundle/parse";
import {
  resolveImportProvenancePair,
  summarizeCreateProvenance,
} from "@/lib/preparation/import-provenance";

function rockman14Bundle() {
  const rooms = [
    ["SUR-01", "Séjour / Cuisine", 30.87],
    ["SUR-02", "Chambre 1", 11.07],
    ["SUR-03", "Chambre 2", 13.55],
    ["SUR-04", "Dressing", 6.12],
    ["SUR-05", "Salle d’eau", 3.91],
    ["SUR-06", "Entrée", 9.36],
    ["SUR-07", "Dégagement", 10.19],
    ["SUR-08", "Buanderie", 4.18],
    ["SUR-09", "Cellier", 5.11],
    ["SUR-10", "Wc", 1.79],
    ["SUR-11", "Terrasse", 21.89],
    ["SUR-12", "Porche", 4.88],
  ] as const;

  return {
    format: "bework_prep_bundle_v1",
    schema_version: "1.0",
    bundle_id: "rockman-surfaces-14-v1",
    mode: "professional",
    study: {
      title: "Surfaces plan — ROCKMAN",
      trade: "gros_oeuvre",
    },
    sources: [
      {
        id: "SRC-PLAN",
        filename: "plan maison rockman.jpg",
        is_raster: true,
        legibility: "partielle",
      },
    ],
    parameters: [],
    takeoff: {
      lots: [{ code: "SUR", label: "Surfaces plan" }],
      items: [
        ...rooms.map(([id, name, qty]) => ({
          id,
          lot: "SUR",
          designation: `${name} — surface lue sur plan`,
          unit: "m2",
          declared_quantity: qty,
          provenance: "RELEVE_A_VERIFIER",
          provenance_kind: "PLAN",
          source_ref: "SRC-PLAN",
          role: "indicator",
        })),
        {
          id: "TOT-01",
          lot: "SUR",
          designation: "Total intérieur",
          unit: "m2",
          declared_quantity: 96.15,
          provenance: "RELEVE_A_VERIFIER",
          provenance_kind: "CALCULATION",
          role: "indicator",
          notes: "Somme des 10 surfaces intérieures",
        },
        {
          id: "TOT-02",
          lot: "SUR",
          designation: "Total terrasse + porche",
          unit: "m2",
          declared_quantity: 26.77,
          provenance: "RELEVE_A_VERIFIER",
          provenance_kind: "CALCULATION",
          role: "indicator",
        },
      ],
    },
  };
}

function run() {
  // Mapping unitaire
  {
    const plan = resolveImportProvenancePair({
      provenance: "RELEVE_A_VERIFIER",
      provenanceKind: "PLAN",
    });
    assert.equal(plan.provenance, "RELEVE_A_VERIFIER");
    assert.equal(plan.provenanceKind, "PLAN");

    const calc = resolveImportProvenancePair({
      provenance: "RELEVE_A_VERIFIER",
      provenanceKind: "CALCULATION",
    });
    assert.equal(calc.provenance, "RELEVE_A_VERIFIER");
    assert.equal(calc.provenanceKind, "CALCULATION");

    const planOnly = resolveImportProvenancePair({ provenance: "PLAN" });
    assert.equal(planOnly.provenance, "RELEVE_A_VERIFIER");
    assert.equal(planOnly.provenanceKind, "PLAN");

    const hyp = resolveImportProvenancePair({ provenance: "HYPOTHESE" });
    assert.equal(hyp.provenance, "HYPOTHESE");
    assert.equal(hyp.provenanceKind, "HYPOTHESIS");
  }

  // ROCKMAN 14 lignes
  {
    const parsed = parsePrepJsonText(JSON.stringify(rockman14Bundle()));
    assert.equal(parsed.ok, true, JSON.stringify(parsed.ok ? [] : parsed.issues));
    if (!parsed.ok) return;

    assert.equal(parsed.bundle.parameters.length, 0, "parameters facultatifs");
    assert.equal(parsed.bundle.lines.length, 14);
    assert.equal(
      parsed.bundle.lines.filter((l) => l.provenanceKind === "PLAN").length,
      12,
    );
    assert.equal(
      parsed.bundle.lines.filter((l) => l.provenanceKind === "CALCULATION").length,
      2,
    );
    assert.ok(parsed.bundle.lines.every((l) => l.role === "indicator"));
    assert.ok(
      parsed.bundle.lines.every(
        (l) =>
          l.provenance === "RELEVE_A_VERIFIER" ||
          (l.provenanceKind === "CALCULATION" && l.provenance === "RELEVE_A_VERIFIER"),
      ),
    );

    const counts = summarizeCreateProvenance(
      parsed.bundle.lines.map((l) => ({
        provenanceKind: l.provenanceKind,
        provenance: l.provenance,
        formula: l.formula,
        missingValue: false,
      })),
    );
    assert.equal(counts.measure, 0);
    assert.equal(counts.plan, 12);
    assert.equal(counts.manual, 0);
    assert.equal(counts.calculation, 2);
    assert.equal(counts.hypothesis, 0);
    assert.equal(counts.unknown, 0);
    assert.equal(counts.toConfirm, 0);
  }

  // Compat : RELEVE / HYPOTHESE seuls
  {
    const r = resolveImportProvenancePair({ provenance: "RELEVE" });
    assert.equal(r.provenance, "RELEVE");
    assert.equal(r.provenanceKind, "MEASURE");
  }

  console.log("ok — import-provenance PLAN/CALCULATION + ROCKMAN 12+2");
}

run();
