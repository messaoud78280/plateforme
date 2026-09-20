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
import { parseBeworkQuoteBundle } from "../src/lib/commercial/chatgpt-bundle/parse";
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
  const survey = buildSiteSurveyJson({
    ...visit,
    fieldNotes:
      "Terrasse de 8 mètres sur 5 mètres.\nSurface totale de 40 m².\nCarrelage existant fissuré.",
  });
  assert(
    (survey as { field_notes?: string | null }).field_notes?.includes("40 m²"),
    "field_notes exporté",
  );
  const prompt = buildChatgptQuoteInstructions(survey);
  assert(prompt.includes("field_notes"), "prompt mentionne field_notes");
  assert(prompt.includes("N'invente aucune dimension") || prompt.includes("N'invente aucune"), "prompt no invent dims");
}

{
  const morelNotes =
    "Terrasse 8 × 5 m, soit 40 m². Carrelage fissuré. Accès 95 cm.";
  const morelVisit = {
    ...visit,
    clientName: "Monsieur Marc MOREL",
    contactPhone: "06 11 21 22 45",
    contactEmail: "marc.morel@example.com",
    contactName: null as string | null,
    siteName: "Réfection terrasse Morel",
    siteAddress: "3 rue de la Liberté",
    zipCode: "78190",
    city: "Montigny-le-Bretonneux",
    clientCivility: "M.",
    clientFirstName: "Marc",
    clientLastName: "MOREL",
    clientPhone: "06 11 21 22 45",
    clientEmail: "marc.morel@example.com",
    billingSameAsSite: true,
    siteCountry: "France",
    clientCountry: "France",
    fieldNotes: morelNotes,
    measurements: [] as typeof visit.measurements,
  };
  const morelSurvey = buildSiteSurveyJson(morelVisit);
  const client = morelSurvey.client as Record<string, unknown>;
  assert(client.civilite === "M.", "Morel civilité");
  assert(client.prenom === "Marc", "Morel prénom");
  assert(client.nom === "MOREL", "Morel nom");
  assert(client.telephone === "06 11 21 22 45", "Morel téléphone");
  assert(client.email === "marc.morel@example.com", "Morel email");
  const addr = client.adresse as Record<string, unknown>;
  assert(addr.ligne1 === "3 rue de la Liberté", "Morel adresse");
  assert(addr.code_postal === "78190", "Morel CP");
  assert(addr.ville === "Montigny-le-Bretonneux", "Morel ville");
  assert(addr.pays === "France", "Morel pays");
  assert(client.adresse_identique_chantier === true, "Morel même adresse");
  const chantier = (morelSurvey as { chantier?: Record<string, unknown> }).chantier;
  assert(chantier?.nom === "Réfection terrasse Morel", "Morel chantier nom");
  const cAddr = chantier?.adresse as Record<string, unknown>;
  assert(cAddr?.ligne1 === "3 rue de la Liberté", "Morel chantier adresse");
  assert(cAddr?.code_postal === "78190", "Morel chantier CP");

  const morelPrompt = buildChatgptQuoteInstructions(morelSurvey);
  assert(morelPrompt.includes("marc.morel@example.com"), "prompt email Morel");
  assert(morelPrompt.includes("78190"), "prompt CP Morel");
  assert(morelPrompt.includes("COORDONNÉES CLIENT"), "prompt insiste coords");

  const morelBundle = {
    format: BEWORK_QUOTE_BUNDLE_FORMAT,
    client: {
      civilite: "M.",
      prenom: "Marc",
      nom: "MOREL",
      nom_complet: "Marc MOREL",
      telephone: "06 11 21 22 45",
      email: "marc.morel@example.com",
      adresse: {
        ligne1: "3 rue de la Liberté",
        code_postal: "78190",
        ville: "Montigny-le-Bretonneux",
        pays: "France",
      },
    },
    chantier: {
      nom: "Réfection terrasse Morel",
      adresse: {
        ligne1: "3 rue de la Liberté",
        code_postal: "78190",
        ville: "Montigny-le-Bretonneux",
        pays: "France",
      },
    },
    devis: { objet: "Réfection terrasse", tva: { taux: 20 } },
    sections: [
      {
        title: "Terrasse",
        items: [
          {
            designation: "Réfection terrasse",
            quantity: 40,
            unit: "m²",
            unit_price_ht: 85,
            vat_rate: 20,
          },
        ],
      },
    ],
  };
  const parsedMorel = parseBeworkQuoteBundle(JSON.stringify(morelBundle));
  assert(parsedMorel.ok, "parse bundle Morel");
  if (parsedMorel.ok) {
    assert(parsedMorel.bundle.client.civility === "M.", "bundle civilité");
    assert(parsedMorel.bundle.client.firstName === "Marc", "bundle prénom");
    assert(parsedMorel.bundle.client.lastName === "MOREL", "bundle nom");
    assert(parsedMorel.bundle.client.phone === "06 11 21 22 45", "bundle tél");
    assert(
      parsedMorel.bundle.client.emails[0]?.email === "marc.morel@example.com",
      "bundle email",
    );
    assert(
      parsedMorel.bundle.client.address.line1 === "3 rue de la Liberté",
      "bundle adresse",
    );
    assert(parsedMorel.bundle.client.address.postalCode === "78190", "bundle CP");
    assert(
      parsedMorel.bundle.client.address.city === "Montigny-le-Bretonneux",
      "bundle ville",
    );
  }
}

{
  const jeanNotes = `Terrasse de 8 mètres sur 5 mètres.
Surface totale de 40 m².

Carrelage existant fissuré.
Présence de flaques d'eau.

Le client souhaite un revêtement extérieur
en grès cérame.

Prévoir la dépose du carrelage, la vérification
du support et la réalisation du nouveau revêtement.

Accès latéral de 95 cm.

Évacuation des gravats à prévoir.`;

  const jeanVisit = {
    ...visit,
    clientName: "Jean Dupont",
    siteName: "Réfection d'une terrasse",
    siteAddress: "5 rue des Jardins, 69000 Lyon",
    subject: "Réfection d'une terrasse",
    clientNeed: "Réfection d'une terrasse",
    fieldNotes: jeanNotes,
    measurements: [] as typeof visit.measurements,
    medias: [
      {
        id: "ph1",
        kind: "PHOTO" as const,
        name: "terrasse-vue-generale.jpg",
        caption: "Vue générale terrasse",
        category: "EXISTANT",
        observation: "Carrelage fissuré",
        hypothesis: null,
        zone: "Terrasse",
        measurementId: null,
        fileUrl: "/tmp/test-photo-1.jpg",
      },
      {
        id: "ph2",
        kind: "PHOTO" as const,
        name: "terrasse-fissures.jpg",
        caption: "Détail fissures",
        category: "DEFAUT",
        observation: "Flaques d'eau",
        hypothesis: null,
        zone: "Terrasse",
        measurementId: null,
        fileUrl: "/tmp/test-photo-2.jpg",
      },
      {
        id: "ph3",
        kind: "PHOTO" as const,
        name: "acces-lateral.jpg",
        caption: "Accès 95 cm",
        category: "ACCES",
        observation: null,
        hypothesis: null,
        zone: "Accès",
        measurementId: null,
        fileUrl: "/tmp/test-photo-3.jpg",
      },
    ],
  };

  const jeanSurvey = buildSiteSurveyJson(jeanVisit);
  assert(jeanSurvey.client.name === "Jean Dupont", "client Jean Dupont");
  assert(
    (jeanSurvey as { field_notes?: string | null }).field_notes === jeanNotes,
    "texte libre intégral JSON",
  );
  assert(
    (jeanSurvey as { field_notes_verbatim?: boolean }).field_notes_verbatim === true,
    "verbatim flag",
  );
  assert(jeanSurvey.photos.length === 3, "3 photos associées");
  assert(
    jeanSurvey.photos.every((p) => p.caption || p.observation),
    "photos avec légendes",
  );

  const jeanPrompt = buildChatgptQuoteInstructions(jeanSurvey);
  assert(jeanPrompt.includes("Terrasse de 8 mètres"), "prompt contient relevés");
  assert(jeanPrompt.includes("95 cm"), "prompt contient accès");
  assert(jeanPrompt.includes(BEWORK_QUOTE_BUNDLE_FORMAT), "prompt bundle v1 Jean");

  const jeanPdf = generateSiteSurveyPdf(jeanVisit);
  const pdfText = Buffer.from(jeanPdf).toString("latin1");
  assert(jeanPdf.byteLength > 500, "PDF Jean généré");
  assert(pdfText.includes("Jean Dupont") || pdfText.includes("Dupont"), "PDF client");
  assert(
    pdfText.includes("40 m") || pdfText.includes("Terrasse"),
    "PDF contient relevés",
  );
  assert(
    pdfText.includes("Relev") || pdfText.includes("m"),
    "PDF section relevés",
  );

  const qJean = buildVisitQuality({
    clientName: jeanVisit.clientName,
    siteAddress: jeanVisit.siteAddress,
    subject: jeanVisit.subject,
    contactName: jeanVisit.contactName,
    zones: jeanVisit.zones,
    lots: jeanVisit.lots,
    measurementCount: 0,
    hasFieldNotes: true,
    photoCount: 3,
    constraints: jeanVisit.constraints,
    findings: jeanVisit.findings,
    proposedWorks: jeanVisit.proposedWorks,
    commercial: jeanVisit.commercial,
    missingOpenCount: 0,
  });
  assert(qJean.readyForQuote === true, "prêt chiffrage avec texte libre seul");
}

{
  const survey = buildSiteSurveyJson(visit);
  const prompt = buildChatgptQuoteInstructions(survey);
  assert(prompt.includes(BEWORK_QUOTE_BUNDLE_FORMAT), "prompt référence bundle v1");
  assert(
    prompt.includes("N'invente aucune dimension") || prompt.includes("N'invente aucune donnée"),
    "prompt no invent",
  );
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
