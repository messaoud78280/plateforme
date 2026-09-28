/**
 * Relevés terrain vs métré chantier — libellés purs, sans DB.
 * Usage: npx tsx src/lib/site-visits/chantier-metre-status.test.ts
 */
import assert from "node:assert/strict";
import {
  applyVisitMeasurements,
  buildVisitChantierMetreStatus,
  type ChantierMetreStudy,
} from "./chantier-metre-status";

const emptyScopes: never[] = [];

function study(
  partial: Partial<ChantierMetreStudy> & Pick<ChantierMetreStudy, "id">,
): ChantierMetreStudy {
  return {
    scopeId: null,
    sourcesJson: null,
    lineCount: 0,
    validatedLineCount: 0,
    dossierStatus: "PRO_A_VALIDER",
    ...partial,
  };
}

function run() {
  {
    const status = buildVisitChantierMetreStatus({
      measurementLabels: [],
      studies: [],
      scopes: emptyScopes,
    });
    assert.equal(status.releveLabel, "Aucun relevé quantitatif");
    assert.equal(status.metreLabel, "Métré chantier non créé");
    assert.equal(status.metreHref, null);
  }

  {
    const status = buildVisitChantierMetreStatus({
      measurementLabels: [],
      studies: [study({ id: "s-empty", lineCount: 0 })],
      scopes: emptyScopes,
    });
    assert.equal(status.releveLabel, "Aucun relevé terrain");
    assert.equal(status.metreLabel, "Métré chantier disponible");
    assert.equal(status.metreHref, "/dashboard/visites-metres/etudes/s-empty");
  }

  {
    const status = buildVisitChantierMetreStatus({
      measurementLabels: [],
      studies: [
        study({
          id: "cuisine",
          scopeId: null,
          sourcesJson: { kind: "bework_global_metre_v1" },
          lineCount: 17,
        }),
        study({ id: "autre", scopeId: "lot-a", lineCount: 3 }),
      ],
      scopes: [
        {
          id: "lot-a",
          referenceStudyId: "autre",
          referenceQuoteId: null,
          referenceSchedulePlanId: null,
        },
      ],
    });
    assert.equal(status.studyId, "cuisine");
    assert.equal(status.releveLabel, "Aucun relevé terrain");
    assert.equal(status.metreLabel, "Métré — 17 postes");
    assert.equal(status.metreHref, "/dashboard/visites-metres/etudes/cuisine");
  }

  {
    const status = buildVisitChantierMetreStatus({
      measurementLabels: [],
      studies: [
        study({
          id: "c01",
          scopeId: "fondations",
          lineCount: 32,
          validatedLineCount: 32,
          dossierStatus: "PRO_VALIDE",
        }),
      ],
      scopes: [
        {
          id: "fondations",
          referenceStudyId: "c01",
          referenceQuoteId: null,
          referenceSchedulePlanId: null,
        },
      ],
    });
    assert.equal(status.studyId, "c01");
    assert.equal(status.metreLabel, "Métré validé — 32 postes");
  }

  {
    const base = buildVisitChantierMetreStatus({
      measurementLabels: [],
      studies: [study({ id: "cuisine", lineCount: 17 })],
      scopes: emptyScopes,
    });
    const withReleve = applyVisitMeasurements(base, ["18,4 m²", "12 ml"]);
    assert.equal(withReleve.hasMeasurements, true);
    assert.equal(withReleve.releveLabel, "18,4 m² · 12 ml");
    assert.equal(withReleve.metreLabel, "Métré — 17 postes");
    assert.doesNotMatch(withReleve.releveLabel, /métré/i);
    assert.doesNotMatch(withReleve.metreLabel, /Pas encore de métré/);
  }

  {
    const status = buildVisitChantierMetreStatus({
      measurementLabels: ["4 m²"],
      studies: [],
      scopes: emptyScopes,
    });
    assert.equal(status.releveLabel, "4 m²");
    assert.equal(status.metreLabel, "Métré chantier non créé");
  }

  console.log("chantier-metre-status — OK");
}

run();
