/**
 * Tests CREATE / MODIFY métré — pure / fixtures (aucune DB, aucune écriture).
 * node --import tsx src/lib/bework-context/adapt-takeoff-create.test.ts
 */
import assert from "node:assert/strict";
import {
  TAKEOFF_CREATE_INSTRUCTIONS,
  computeTakeoffCreateSourcesFingerprint,
  buildTakeoffVersionsBlock,
} from "./adapt-takeoff-create";
import { PREP_BUNDLE_FORMAT } from "@/lib/preparation/types";
import { mapProvenanceKind, evaluateSourceProtection } from "./provenance";
import type { ProjectContextSnapshot } from "./types";
import {
  PROJECT_CONTEXT_FORMAT,
  PROJECT_CONTEXT_SCHEMA_VERSION,
} from "./types";

function minimalSnap(overrides?: Partial<ProjectContextSnapshot>): ProjectContextSnapshot {
  const base: ProjectContextSnapshot = {
    type: PROJECT_CONTEXT_FORMAT,
    schema_version: PROJECT_CONTEXT_SCHEMA_VERSION,
    generatedAt: "2026-10-05T00:00:00.000Z",
    organization: { id: "org", name: "Org" },
    project: {
      id: "p1",
      title: "Chantier",
      description: null,
      siteAddress: null,
      siteCity: null,
      status: "EN_COURS",
      chantierStatus: "ETUDE",
      plannedStartDate: null,
      plannedEndDate: null,
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
    scopes: [],
    visits: [],
    sources: [],
    takeoffs: [
      {
        id: "study-cur",
        title: "Métré",
        trade: null,
        mode: "PROFESSIONAL",
        dossierStatus: "PRO_A_VALIDER",
        version: 3,
        scopeId: null,
        sourceFormat: null,
        hypothesesJson: null,
        sources: [],
        parameters: [],
        lines: [],
        updatedAt: "2026-10-01T00:00:00.000Z",
      },
    ],
    quotes: [
      {
        id: "q1",
        number: "DEV-1",
        subject: "Devis",
        status: "DRAFT",
        isDemonstration: false,
        scopeId: null,
        sourcePrepStudyId: "study-cur",
        versionNumber: 2,
        totalSellHt: 0,
        totalTtc: 0,
        isScopeReference: false,
        transfer: {
          id: "tr1",
          studyId: "study-cur",
          studyVersion: 2,
          createdAt: "2026-09-01T00:00:00.000Z",
        },
        sections: [],
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    ],
    schedules: [
      {
        id: "plan1",
        title: "Planning",
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 4,
        studyId: "study-cur",
        scopeId: null,
        studyVersionAtGeneration: 2,
        startDate: null,
        endDateBase: null,
        baseDurationWorkingDays: null,
        tasks: [],
        updatedAt: "2026-09-15T00:00:00.000Z",
      },
    ],
    followUps: [],
    documents: { notices: [], reports: [], other: [] },
    versions: {
      takeoffVersions: [{ studyId: "study-cur", version: 3 }],
      quoteVersions: [{ quoteId: "q1", versionNumber: 2 }],
      planRevisions: [
        {
          planId: "plan1",
          revisionNumber: 4,
          studyVersionAtGeneration: 2,
        },
      ],
      currentSchedulePlanIds: [{ studyId: "study-cur", planId: "plan1" }],
    },
  };
  return { ...base, ...overrides };
}

function run() {
  // TEST A/B/C — fingerprint déterministe visit seule / + plan / sans visit
  {
    const visit = {
      id: "v1",
      updatedAt: "2026-10-03T10:00:00.000Z",
      contextVersion: 42,
      measurementCount: 3,
      mediaCount: 2,
    };
    const a = computeTakeoffCreateSourcesFingerprint({
      projectId: "p1",
      visit,
      planFileIds: [],
    });
    const b = computeTakeoffCreateSourcesFingerprint({
      projectId: "p1",
      visit,
      planFileIds: [],
    });
    assert.equal(a, b, "TEST A fingerprint stable");

    const withPlan = computeTakeoffCreateSourcesFingerprint({
      projectId: "p1",
      visit,
      planFileIds: ["file-b", "file-a"],
    });
    const withPlanSorted = computeTakeoffCreateSourcesFingerprint({
      projectId: "p1",
      visit,
      planFileIds: ["file-a", "file-b"],
    });
    assert.equal(withPlan, withPlanSorted, "TEST B ordre plans ignoré");
    assert.notEqual(a, withPlan, "TEST B plan change l’empreinte");

    const noVisit = computeTakeoffCreateSourcesFingerprint({
      projectId: "p1",
      visit: null,
      planFileIds: [],
    });
    assert.notEqual(a, noVisit, "TEST C visit absente ≠ visit présente");
  }

  // TEST D/E — MEASURE / MANUAL protégés vs HYPOTHESIS
  {
    assert.equal(mapProvenanceKind({ provenance: "RELEVE" }), "MEASURE");
    assert.equal(mapProvenanceKind({ provenance: "SAISIE_MANUELLE" }), "MANUAL");
    const blocked = evaluateSourceProtection({
      currentKind: "MEASURE",
      proposalKind: "HYPOTHESIS",
      currentValue: 0.5,
      proposalValue: 0.8,
      intent: "TECHNICAL_CORRECTION",
    });
    assert.equal(blocked.status, "BLOCKED", "TEST E hypothèse ne gagne pas");

    const allowManual = evaluateSourceProtection({
      currentKind: "HYPOTHESIS",
      proposalKind: "MANUAL",
      currentValue: 0.5,
      proposalValue: 0.6,
      intent: "FIELD_UPDATE",
    });
    assert.equal(allowManual.status, "ALLOW", "TEST D MANUAL peut remplacer hypothèse");
  }

  // TEST F — instructions : ne pas inventer
  {
    const blob = TAKEOFF_CREATE_INSTRUCTIONS.join("\n").toLowerCase();
    assert.ok(blob.includes("ne jamais inventer") || blob.includes("jamais inventer"));
    assert.ok(blob.includes("à confirmer") || blob.includes("null"));
    assert.ok(blob.includes("hypothesis"));
    assert.ok(!blob.includes("cuisine"));
    assert.ok(!blob.includes("c-01"));
    assert.ok(!blob.includes("salle de bain"));
    assert.ok(!blob.includes("morel"));
  }

  // TEST générique métiers — pas de branche métier dans instructions
  {
    for (const trade of [
      "terrassement",
      "maconnerie",
      "electricite",
      "plomberie",
      "vrd",
      "couverture",
    ]) {
      assert.ok(
        !TAKEOFF_CREATE_INSTRUCTIONS.some((i) =>
          i.toLowerCase().includes(`if ${trade}`),
        ),
        `pas de if ${trade}`,
      );
    }
  }

  // Contrat output CREATE
  assert.equal(PREP_BUNDLE_FORMAT, "bework_prep_bundle_v1");

  // TEST J — fingerprint change si mesures changent (count)
  {
    const base = computeTakeoffCreateSourcesFingerprint({
      projectId: "p",
      visit: {
        id: "v",
        updatedAt: "2026-10-01T00:00:00.000Z",
        contextVersion: 1,
        measurementCount: 1,
        mediaCount: 0,
      },
      planFileIds: [],
    });
    const changed = computeTakeoffCreateSourcesFingerprint({
      projectId: "p",
      visit: {
        id: "v",
        updatedAt: "2026-10-01T00:00:00.000Z",
        contextVersion: 1,
        measurementCount: 2,
        mediaCount: 0,
      },
      planFileIds: [],
    });
    assert.notEqual(base, changed, "TEST J stale si mesures +1");
  }

  // TEST E/F — versions : devis/planning basés v2 vs métré CURRENT v3
  {
    const block = buildTakeoffVersionsBlock(
      minimalSnap(),
      "study-cur",
      { status: "CURRENT", isCurrent: true },
    );
    assert.equal(block.current_takeoff?.version, 3);
    assert.equal(block.current_takeoff?.status, "CURRENT");
    assert.equal(block.quote?.version, 2);
    assert.equal(block.quote?.study_version_at_generation, 2);
    assert.equal(block.planning?.revision, 4);
    assert.equal(block.planning?.study_version_at_generation, 2);
    assert.ok(
      (block.quote?.study_version_at_generation ?? 0) <
        (block.current_takeoff?.version ?? 0),
      "E écart devis vs métré",
    );
    assert.ok(
      (block.planning?.study_version_at_generation ?? 0) <
        (block.current_takeoff?.version ?? 0),
      "F écart planning vs métré",
    );
  }

  // TEST G — ARCHIVED deep-link dans versions
  {
    const block = buildTakeoffVersionsBlock(
      minimalSnap(),
      "study-cur",
      { status: "ARCHIVED", isCurrent: false },
    );
    assert.equal(block.current_takeoff?.status, "ARCHIVED");
    assert.equal(block.current_takeoff?.is_current, false);
  }

  console.log("adapt-takeoff-create.test.ts: ok (A–F, J, versions E/F/G, généricité)");
}

run();
