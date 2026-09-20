/**
 * Tests export survey visite (sans DB).
 * Usage: node --import tsx scripts/test-site-visit-survey.ts
 */
import {
  buildChatgptQuoteInstructions,
  buildSiteSurveyJson,
  generateSiteSurveyPdf,
} from "../src/lib/site-visits/survey-export";
import { buildVisitQuality } from "../src/lib/site-visits/quality";
import { buildMeasurementCoherence } from "../src/lib/site-visits/coherence";
import { BEWORK_QUOTE_BUNDLE_FORMAT } from "../src/lib/commercial/chatgpt-bundle/types";

let failed = 0;
function assert(c: boolean, m: string) {
  if (!c) {
    failed += 1;
    console.error("FAIL:", m);
  } else console.log("OK:", m);
}

const visit = {
  id: "visit_demo",
  clientName: "Client fictif",
  siteName: "Réfection allée",
  siteAddress: "12 rue des Lilas, 75000 Paris",
  contactName: "M. Martin",
  contactPhone: "0600000000",
  subject: "Relevé avant devis",
  clientNeed: "Remplacer le carrelage extérieur existant",
  scheduledAt: "2026-09-20T09:00:00.000Z",
  status: "IN_PROGRESS",
  lots: ["Revêtements", "Terrassement"],
  zones: ["Allée principale"],
  constraints: { accessLevel: "Difficile", access: ["Passage latéral étroit"] },
  findings: [
    {
      id: "f1",
      zone: "Allée principale",
      fact: "Carrelage extérieur détérioré, plusieurs fissures",
      hypothesis: "Mouvement éventuel du support",
      toVerify: "État de la structure sous-jacente",
    },
  ],
  proposedWorks: [
    {
      id: "w1",
      lot: "Revêtements",
      zone: "Allée principale",
      designation: "Dépose et réfection allée",
      description: "Dépose du revêtement, préparation support, nouveau revêtement",
      quantity: 48,
      unit: "m²",
      quantitySource: "calculated" as const,
      relatedChecklist: ["Dépose du revêtement", "Évacuation"],
    },
  ],
  commercial: { budgetAnnounced: "À confirmer", urgency: "Standard" },
  measurements: [
    {
      id: "m1",
      zone: "Allée principale",
      label: "Surface allée",
      measureType: "SURFACE",
      lengthM: 12,
      widthM: 4,
      heightM: null,
      quantityValue: null,
      unit: "m²",
      computedQuantity: 48,
      observation: null,
      lot: "Revêtements",
    },
  ],
  missingInfos: [
    {
      id: "mi1",
      label: "Épaisseur réelle de la dalle inconnue",
      comment: null,
      open: true,
      checkStatus: "A_VERIFIER",
    },
  ],
  medias: [
    {
      id: "ph1",
      zone: "Allée principale",
      kind: "PHOTO",
      name: "vue.jpg",
      caption: "Vue générale allée",
      category: "VUE_GENERALE",
      observation: "Revêtement détérioré",
      hypothesis: null,
      measurementId: "m1",
      fileUrl: null,
    },
  ],
};

{
  const survey = buildSiteSurveyJson({
    ...visit,
    lotSheets: {
      Revêtements: { surface: "48 m²", etat_dalle: "Fissurée" },
    },
  });
  assert(survey.format === "bework_site_survey_v1", "format survey");
  assert(survey.zones[0]?.measurements[0]?.value === 48, "surface 48");
  assert(survey.zones[0]?.measurements[0]?.source === "calculated", "source calculated");
  assert(survey.missing_information.length === 1, "missing info");
  assert(survey.proposed_works[0]?.designation.includes("Dépose"), "proposed work");
  assert(
    (survey as { lot_technical_sheets?: Record<string, Record<string, string>> })
      .lot_technical_sheets?.Revêtements?.surface === "48 m²",
    "fiche technique exportée",
  );
}

{
  const survey = buildSiteSurveyJson(visit);
  const prompt = buildChatgptQuoteInstructions(survey);
  assert(prompt.includes(BEWORK_QUOTE_BUNDLE_FORMAT), "prompt référence bundle v1");
  assert(prompt.includes("N'invente aucune donnée"), "prompt no invent");
  assert(prompt.includes("bework_site_survey_v1"), "prompt survey data");
}

{
  const pdf = generateSiteSurveyPdf(visit);
  assert(pdf.byteLength > 500, "PDF généré");
}

{
  const q = buildVisitQuality({
    clientName: visit.clientName,
    siteAddress: visit.siteAddress,
    subject: visit.subject,
    contactName: visit.contactName,
    zones: visit.zones,
    lots: visit.lots,
    measurementCount: 1,
    photoCount: 1,
    constraints: visit.constraints,
    findings: visit.findings,
    proposedWorks: visit.proposedWorks,
    commercial: visit.commercial,
    missingOpenCount: 1,
    measurements: visit.measurements,
  });
  assert(q.readyForQuote === true, "prêt chiffrage avec métrés");
  assert(q.label.includes("PRÊT") || q.openConfirmCount === 1, "qualité cohérente");
}

{
  const q = buildVisitQuality({
    clientName: "X",
    siteAddress: "Y",
    subject: "Z",
    contactName: null,
    zones: [],
    lots: [],
    measurementCount: 0,
    photoCount: 0,
    constraints: {},
    findings: [],
    proposedWorks: [],
    commercial: {},
    missingOpenCount: 0,
  });
  assert(q.readyForQuote === false, "pas prêt sans métrés");
}

{
  const alerts = buildMeasurementCoherence([
    {
      id: "a",
      zone: null,
      label: "Sans zone",
      measureType: "SURFACE",
      lengthM: 10,
      widthM: 5,
      heightM: null,
      quantityValue: null,
      unit: "m²",
      computedQuantity: 20,
      lot: null,
    },
  ]);
  assert(alerts.some((x) => x.id.startsWith("zone-")), "alerte sans zone");
  assert(alerts.some((x) => x.id.startsWith("surf-")), "alerte écart surface");
}

if (failed) {
  console.error(`\n${failed} échec(s)`);
  process.exit(1);
}
console.log("\nTous les tests survey visite OK");
