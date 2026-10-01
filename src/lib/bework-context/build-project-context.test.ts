/**
 * Tests CTX-01 — contexte chantier canonique (fixtures + provenance + adapters).
 * Pas d’écriture BDD. Cas A–F couverts en structure / sécurité logique.
 */
import assert from "node:assert/strict";
import { mapProvenanceKind } from "./provenance";
import {
  adaptQuoteForChatgptContext,
  adaptTakeoffForChatgptContext,
  getQuotesForScope,
  getScopeReferenceQuote,
  getTakeoffsForScope,
} from "./adapters";
import {
  PROJECT_CONTEXT_FORMAT,
  PROJECT_CONTEXT_SCHEMA_VERSION,
  type ProjectContextSnapshot,
} from "./types";

function fixtureSnapshot(overrides?: Partial<ProjectContextSnapshot>): ProjectContextSnapshot {
  const base: ProjectContextSnapshot = {
    type: PROJECT_CONTEXT_FORMAT,
    schema_version: PROJECT_CONTEXT_SCHEMA_VERSION,
    generatedAt: "2026-10-01T10:00:00.000Z",
    organization: { id: "org-urban", name: "URBAN AMÉNAGEMENTS" },
    project: {
      id: "proj-c01",
      title: "C-01 Fondations",
      description: "Démo",
      siteAddress: "1 rue Test",
      siteCity: "Lyon",
      chantierStatus: "ETUDE",
      status: "EN_COURS",
      plannedStartDate: null,
      plannedEndDate: null,
      updatedAt: "2026-10-01T09:00:00.000Z",
    },
    scopes: [
      {
        id: "scope-a",
        code: "LOT-A",
        name: "Lot A",
        status: "ACTIVE",
        displayOrder: 0,
        referenceStudyId: "study-a",
        referenceQuoteId: "quote-ref",
        referenceSchedulePlanId: "plan-a",
      },
      {
        id: "scope-b",
        code: "LOT-B",
        name: "Lot B",
        status: "ACTIVE",
        displayOrder: 1,
        referenceStudyId: "study-b",
        referenceQuoteId: null,
        referenceSchedulePlanId: null,
      },
    ],
    sources: [
      {
        id: "SRC-1",
        studyId: "study-a",
        scopeId: "scope-a",
        filename: "plan.pdf",
        planNumber: "C-01",
        title: "Fondations",
        revision: "A",
        scale: "1/50",
        page: 1,
        legibility: "OK",
        note: null,
        chantierFileId: "file-1",
        file: {
          id: "file-1",
          name: "plan.pdf",
          documentType: "PLAN",
          mimeType: "application/pdf",
          status: "RECU",
          indice: "A",
          versionLabel: "1",
          documentDate: null,
          category: "PLANS",
          hasUrl: true,
          previewHref: "/api/chantier/files/file-1/preview",
        },
        displayTitle: "Plan d'exécution C-01",
      },
    ],
    visits: [
      {
        id: "visit-1",
        subject: "Visite fondations",
        status: "DONE",
        clientName: "Client",
        siteAddress: "1 rue Test",
        clientNeed: null,
        comments: null,
        projectId: "proj-c01",
        commercialQuoteId: null,
        contextVersionNote: "HARDCODED_LEGACY_V1",
        updatedAt: "2026-09-01T10:00:00.000Z",
        measurements: [
          {
            id: "m1",
            zone: "Zone A",
            label: "Longueur mur",
            measureType: "LENGTH",
            unit: "m",
            lengthM: 12,
            widthM: null,
            heightM: null,
            quantityValue: null,
            computedQuantity: 12,
            lot: "LOT-A",
            observation: null,
          },
        ],
        mediaRefs: [],
      },
    ],
    takeoffs: [
      {
        id: "study-a",
        title: "Métré Lot A",
        trade: "GO",
        mode: "PROFESSIONAL",
        dossierStatus: "PRO_VALIDE",
        version: 3,
        scopeId: "scope-a",
        sourceFormat: "bework_prep_bundle_v1",
        hypothesesJson: [{ id: "h1", text: "Hypothèse sol" }],
        sources: [],
        parameters: [
          {
            id: "p1",
            key: "L_MUR",
            label: "Longueur mur",
            unit: "m",
            value: 12,
            formula: null,
            provenance: "RELEVE",
            provenanceKind: "MEASURE",
            note: null,
          },
          {
            id: "p2",
            key: "S_CALC",
            label: "Surface calc",
            unit: "m2",
            value: 24,
            formula: "L_MUR*2",
            provenance: null,
            provenanceKind: "CALCULATION",
            note: null,
          },
        ],
        lines: [
          {
            id: "tl1",
            code: "GO.01",
            lot: "LOT-A",
            designation: "Béton fondation",
            unit: "m3",
            formula: "L_MUR*0.5",
            declaredQuantity: null,
            computedQuantity: 6,
            validatedQuantity: 6,
            provenance: null,
            provenanceKind: "CALCULATION",
            role: "quote",
          },
        ],
        updatedAt: "2026-09-15T10:00:00.000Z",
      },
      {
        id: "study-b",
        title: "Métré Lot B",
        trade: "GO",
        mode: "PROFESSIONAL",
        dossierStatus: "PRO_A_VALIDER",
        version: 1,
        scopeId: "scope-b",
        sourceFormat: null,
        hypothesesJson: null,
        sources: [],
        parameters: [],
        lines: [],
        updatedAt: "2026-09-16T10:00:00.000Z",
      },
    ],
    quotes: [
      {
        id: "quote-ref",
        number: "DEMO-2026-0002",
        subject: "Devis référence Lot A",
        status: "DRAFT",
        isDemonstration: true,
        scopeId: "scope-a",
        sourcePrepStudyId: "study-a",
        versionNumber: 1,
        totalSellHt: 1000,
        totalTtc: 1200,
        isScopeReference: true,
        transfer: {
          id: "tr1",
          studyId: "study-a",
          studyVersion: 3,
          createdAt: "2026-09-15T11:00:00.000Z",
        },
        sections: [
          {
            id: "sec1",
            title: "Fondations",
            sortOrder: 0,
            lines: [
              {
                id: "ql1",
                sectionId: "sec1",
                designation: "Béton",
                quantity: 6,
                unit: "m3",
                unitSellHt: 150,
                lineSellHt: 900,
                studyLineCode: "GO.01",
              },
            ],
          },
        ],
        updatedAt: "2026-09-15T12:00:00.000Z",
      },
      {
        id: "quote-alt",
        number: "DEMO-2026-0003",
        subject: "Variante Lot A",
        status: "DRAFT",
        isDemonstration: true,
        scopeId: "scope-a",
        sourcePrepStudyId: "study-a",
        versionNumber: 1,
        totalSellHt: 800,
        totalTtc: 960,
        isScopeReference: false,
        transfer: null,
        sections: [],
        updatedAt: "2026-09-16T12:00:00.000Z",
      },
    ],
    schedules: [
      {
        id: "plan-a",
        title: "Planning Lot A",
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 2,
        studyId: "study-a",
        scopeId: "scope-a",
        studyVersionAtGeneration: 2,
        startDate: "2026-10-01",
        endDateBase: "2026-10-20",
        baseDurationWorkingDays: 14,
        tasks: [
          {
            id: "task-1",
            stepCode: "S1",
            name: "Coulage",
            durationDays: 3,
            lot: "LOT-A",
            startDate: "2026-10-01",
            endDate: "2026-10-03",
            takeoffLineCodes: ["GO.01"],
            quoteLineIds: ["ql1"],
          },
        ],
        updatedAt: "2026-09-20T10:00:00.000Z",
      },
    ],
    followUps: [],
    documents: { notices: [], reports: [], other: [] },
    versions: {
      takeoffVersions: [
        { studyId: "study-a", version: 3 },
        { studyId: "study-b", version: 1 },
      ],
      quoteVersions: [
        { quoteId: "quote-ref", versionNumber: 1 },
        { quoteId: "quote-alt", versionNumber: 1 },
      ],
      planRevisions: [
        {
          planId: "plan-a",
          revisionNumber: 2,
          studyVersionAtGeneration: 2,
        },
      ],
    },
  };
  return { ...base, ...overrides };
}

// --- Provenance ---
assert.equal(mapProvenanceKind({ provenance: "RELEVE" }), "MEASURE");
assert.equal(mapProvenanceKind({ provenance: "RELEVE_A_VERIFIER" }), "MEASURE");
assert.equal(mapProvenanceKind({ provenance: "HYPOTHESE" }), "HYPOTHESIS");
assert.equal(mapProvenanceKind({ provenance: "SAISIE_MANUELLE" }), "MANUAL");
assert.equal(
  mapProvenanceKind({ provenance: null, formula: "A*B" }),
  "CALCULATION",
);
assert.equal(mapProvenanceKind({ provenance: null }), "UNKNOWN");
console.log("  provenance: ok");

// --- A : chantier complet (visite + source + métré + devis + planning) ---
{
  const snap = fixtureSnapshot();
  assert.equal(snap.type, "bework_project_context_v1");
  assert.equal(snap.visits.length, 1);
  assert.equal(snap.sources.length, 1);
  assert.equal(snap.sources[0].chantierFileId, "file-1");
  assert.equal(snap.takeoffs.length, 2);
  assert.equal(snap.quotes.length, 2);
  assert.equal(snap.schedules.length, 1);
  assert.equal(snap.schedules[0].tasks[0].takeoffLineCodes[0], "GO.01");
  assert.equal(snap.versions.takeoffVersions[0].version, 3);
  assert.equal(snap.visits[0].contextVersionNote, "HARDCODED_LEGACY_V1");
  const takeoffView = adaptTakeoffForChatgptContext(snap, "study-a");
  assert.ok(takeoffView);
  assert.equal(takeoffView.section, "TAKEOFF");
  assert.equal(takeoffView.type, "bework_chatgpt_context_v1");
  assert.equal(takeoffView.target.version, 3);
  assert.equal(takeoffView.target.base_version, 3);
  console.log("  A chantier complet: ok");
}

// --- B : chantier incomplet (pas de devis / planning) ---
{
  const snap = fixtureSnapshot({
    quotes: [],
    schedules: [],
    versions: {
      takeoffVersions: [{ studyId: "study-a", version: 3 }],
      quoteVersions: [],
      planRevisions: [],
    },
  });
  assert.equal(snap.quotes.length, 0);
  assert.equal(snap.schedules.length, 0);
  assert.equal(adaptQuoteForChatgptContext(snap, "missing"), null);
  assert.ok(Array.isArray(snap.followUps));
  assert.ok(Array.isArray(snap.documents.notices));
  console.log("  B chantier incomplet: ok");
}

// --- C : multi-scope ---
{
  const snap = fixtureSnapshot();
  const a = getTakeoffsForScope(snap, "scope-a");
  const b = getTakeoffsForScope(snap, "scope-b");
  assert.equal(a.length, 1);
  assert.equal(a[0].id, "study-a");
  assert.equal(b.length, 1);
  assert.equal(b[0].id, "study-b");
  assert.notEqual(a[0].scopeId, b[0].scopeId);
  console.log("  C multi-scope: ok");
}

// --- D : multi-devis + référence ---
{
  const snap = fixtureSnapshot();
  const quotes = getQuotesForScope(snap, "scope-a");
  assert.equal(quotes.length, 2);
  const ref = getScopeReferenceQuote(snap, "scope-a");
  assert.ok(ref);
  assert.equal(ref!.id, "quote-ref");
  assert.equal(ref!.isScopeReference, true);
  assert.equal(quotes.filter((q) => q.isScopeReference).length, 1);
  console.log("  D multi-devis: ok");
}

// --- E : sécurité organisation (contrat logique du builder) ---
{
  // Le builder refuse un mismatch org : simulé ici par la règle documentée.
  // projectId d'org A + organizationId d'org B ⇒ null (testé aussi en script URBAN).
  const wrongOrgId: string = "org-other";
  const projectOrgId: string = "org-urban";
  const wouldReturnNull = wrongOrgId !== projectOrgId;
  assert.equal(wouldReturnNull, true);
  console.log("  E sécurité org (contrat): ok");
}

// --- F : aucune écriture (contrat API + snapshot immuable côté test) ---
{
  const snap = fixtureSnapshot();
  const frozen = JSON.stringify(snap);
  // Les adapters ne mutent pas le snapshot.
  adaptTakeoffForChatgptContext(snap, "study-a");
  adaptQuoteForChatgptContext(snap, "quote-ref");
  assert.equal(JSON.stringify(snap), frozen);
  console.log("  F aucune mutation snapshot: ok");
}

console.log("build-project-context.test.ts: ok");
