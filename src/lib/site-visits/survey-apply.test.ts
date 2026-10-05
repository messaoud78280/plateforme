import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSurveyApplyPreview,
  parseSurveyJsonRaw,
} from "@/lib/site-visits/survey-apply";
import { BEWORK_SITE_SURVEY_FORMAT } from "@/lib/site-visits/survey-types";
import { VISIT_CREATE_INSTRUCTIONS } from "@/lib/bework-context/adapt-visit-create";

describe("survey-apply générique", () => {
  it("refuse un format non survey", () => {
    const r = parseSurveyJsonRaw(JSON.stringify({ type: "bework_quote_bundle_v1" }));
    assert.equal(r.ok, false);
  });

  it("accepte bework_site_survey_v1", () => {
    const r = parseSurveyJsonRaw(
      JSON.stringify({
        type: BEWORK_SITE_SURVEY_FORMAT,
        visit: { purpose: "Maçonnerie" },
        findings: [],
        proposed_works: [],
      }),
    );
    assert.equal(r.ok, true);
  });

  it("distingue PLAN / MEASURE / HYPOTHESIS et n’invente pas depuis PHOTO", () => {
    const survey = {
      type: BEWORK_SITE_SURVEY_FORMAT,
      visit: { purpose: "Gros œuvre", client_need: "Fondations" },
      zones: [
        {
          name: "RDC",
          measurements: [
            {
              name: "Longueur mur",
              unit: "m",
              length_m: 12,
              provenance_kind: "PLAN",
              source_ref: "plan-A",
            },
            {
              name: "Hauteur relevée",
              unit: "m",
              height_m: 2.5,
              source: "measured",
            },
            {
              name: "Épaisseur estimée",
              unit: "m",
              length_m: 0.2,
              source: "estimated",
            },
            {
              name: "Depuis photo",
              unit: "m",
              length_m: 3,
              source: "photo",
            },
            {
              name: "Cote illisible",
              unit: "m",
              provenance_kind: "PLAN",
              length_m: null,
            },
          ],
        },
      ],
    };
    const preview = buildSurveyApplyPreview({
      survey,
      current: {
        subject: "",
        clientNeed: null,
        comments: null,
        lots: [],
        zones: [],
        findings: [],
        proposedWorks: [],
        commercial: null,
        constraints: null,
        prep: {},
        measurements: [],
      },
    });
    assert.equal(preview.sourcesUsed.plan >= 1, true);
    assert.equal(preview.sourcesUsed.measure >= 1, true);
    assert.equal(preview.sourcesUsed.hypothesis >= 1, true);
    assert.ok(preview.toConfirm.some((t) => /illisible|à confirmer/i.test(t)));
    assert.ok(
      preview.measurements.every((m) => m.label !== "Depuis photo"),
      "PHOTO ne doit pas créer de mesure",
    );
  });

  it("protège une mesure manuelle existante", () => {
    const survey = {
      type: BEWORK_SITE_SURVEY_FORMAT,
      visit: { purpose: "Électricité" },
      orphan_measurements: [
        {
          name: "Longueur gaine",
          unit: "m",
          length_m: 8,
          source: "estimated",
        },
      ],
    };
    const preview = buildSurveyApplyPreview({
      survey,
      current: {
        subject: "Électricité",
        clientNeed: "Tableau",
        comments: null,
        lots: [],
        zones: [],
        findings: [],
        proposedWorks: [],
        commercial: null,
        constraints: null,
        prep: {},
        measurements: [
          {
            id: "m1",
            zone: null,
            label: "Longueur gaine",
            unit: "m",
            lengthM: 10,
            widthM: null,
            heightM: null,
            quantityValue: 10,
            computedQuantity: 10,
            observation: null,
            lot: null,
          },
        ],
      },
    });
    assert.ok(
      preview.measurements.some((m) => m.action === "skip_protected"),
      "HYPOTHESIS ne remplace pas MEASURE existante",
    );
  });

  it("instructions CREATE sans métier hardcodé", () => {
    const joined = VISIT_CREATE_INSTRUCTIONS.join(" ");
    assert.equal(/cuisine|salle de bains|fondations/i.test(joined), false);
    assert.match(joined, /PLAN/);
    assert.match(joined, /MEASURE/);
    assert.match(joined, /bework_site_survey_v1/);
  });
});
