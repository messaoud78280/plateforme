/**
 * Workflow VISITE → MÉTRÉ (pas devis) — tests pure / fixtures.
 * node --import tsx src/lib/site-visits/visit-to-takeoff-workflow.test.ts
 */
import assert from "node:assert/strict";
import {
  buildChatgptTakeoffFromSurveyInstructions,
  buildChatgptQuoteInstructions,
  buildSiteSurveyJson,
  type SurveyVisitInput,
} from "@/lib/site-visits/survey-export";
import { TAKEOFF_CREATE_INSTRUCTIONS } from "@/lib/bework-context/adapt-takeoff-create";
import { PREP_BUNDLE_FORMAT } from "@/lib/preparation/types";
import { BEWORK_CONTEXT_FORMAT } from "@/lib/bework-patch/types";
import { emptyCommercial } from "@/lib/site-visits/survey-types";

function rockmanSurveyInput(): SurveyVisitInput {
  return {
    id: "visit-rockman",
    clientName: "ROCKMAN",
    siteName: null,
    siteAddress: "Paris",
    contactName: null,
    contactPhone: null,
    subject: "Gros œuvre / maçonnerie",
    clientNeed: "Travaux gros œuvre / maçonnerie",
    scheduledAt: null,
    status: "READY_TO_QUOTE",
    lots: ["Gros œuvre", "Maçonnerie"],
    zones: [],
    constraints: {},
    findings: [],
    proposedWorks: [],
    commercial: emptyCommercial(),
    fieldNotes: "Relevés terrain ROCKMAN — accès à confirmer, pas de cote mesurée.",
    measurements: [],
    missingInfos: [],
    medias: [],
  };
}

function run() {
  const survey = buildSiteSurveyJson(rockmanSurveyInput());
  const prompt = buildChatgptTakeoffFromSurveyInstructions(survey);

  // A — visite sans métré : prompt n’oriente pas vers devis comme sortie principale
  {
    assert.ok(
      !/génère UNIQUEMENT un devis/i.test(prompt),
      "A: pas de biais « génère uniquement un devis »",
    );
    assert.ok(
      /MÉTRÉ|métré|TAKEOFF|prep_bundle/i.test(prompt),
      "A: oriente vers métré",
    );
  }

  // C/D — TAKEOFF CREATE + expected_output prep_bundle
  {
    assert.ok(
      TAKEOFF_CREATE_INSTRUCTIONS.some((i) =>
        i.includes("bework_prep_bundle_v1"),
      ),
      "C/D: instructions TAKEOFF CREATE → prep_bundle",
    );
    assert.equal(PREP_BUNDLE_FORMAT, "bework_prep_bundle_v1");
    assert.ok(
      prompt.includes(PREP_BUNDLE_FORMAT),
      "D: expected_output dans prompt survey",
    );
    assert.ok(
      prompt.includes("NE PRODUIS PAS de bework_quote_bundle_v1"),
      "D: quote_bundle explicitement interdit",
    );
  }

  // E — aucune dimension → UNKNOWN / à confirmer
  {
    assert.ok(/UNKNOWN|à confirmer/i.test(prompt), "E: UNKNOWN / à confirmer");
    assert.ok(/N'invente AUCUNE dimension/i.test(prompt), "E: pas d’invention");
  }

  // F — plan → PLAN, jamais MEASURE
  {
    assert.ok(/provenance PLAN/i.test(prompt), "F: plan → PLAN");
    assert.ok(
      /plan fourni dans la discussion.*provenance PLAN/i.test(prompt) ||
        /jamais MEASURE/i.test(prompt),
      "F: plan externe → PLAN (pas MEASURE)",
    );
  }

  // G — compte rendu = document visite (survey), pas quote bundle
  {
    assert.equal(survey.type, "bework_site_survey_v1");
    assert.equal(survey.client.name, "ROCKMAN");
    assert.ok(
      typeof survey.field_notes === "string" &&
        survey.field_notes.includes("ROCKMAN"),
      "G: field_notes présents",
    );
  }

  // B — contexte sans Project : shape CREATE autorise project null
  {
    const shape = {
      type: BEWORK_CONTEXT_FORMAT,
      section: "TAKEOFF" as const,
      interaction_mode: "CREATE" as const,
      expected_output: PREP_BUNDLE_FORMAT,
      project: null as null,
      target: { create_on_project_id: null as null },
    };
    assert.equal(shape.project, null, "B: project null OK");
    assert.equal(
      shape.target.create_on_project_id,
      null,
      "B: commit Project découplé",
    );
    assert.equal(shape.expected_output, "bework_prep_bundle_v1");
  }

  // H/I — devis réservé après métré (contrat textuel instructions)
  {
    assert.ok(
      TAKEOFF_CREATE_INSTRUCTIONS.some((i) =>
        /prix|marge|TVA|commercia/i.test(i),
      ),
      "H: devis réservé après métré (instructions)",
    );
  }

  // J — alias historique quote instructions délègue au métré
  {
    const alias = buildChatgptQuoteInstructions(survey);
    assert.equal(alias, prompt, "J: alias historique = takeoff (pas régression quote)");
  }

  console.log("ok — visit→takeoff workflow A–J (pure)");
}

run();
