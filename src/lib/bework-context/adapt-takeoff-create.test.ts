/**
 * Tests CREATE métré — pure / fixtures (aucune DB, aucune écriture).
 * node --import tsx src/lib/bework-context/adapt-takeoff-create.test.ts
 */
import assert from "node:assert/strict";
import {
  TAKEOFF_CREATE_INSTRUCTIONS,
  computeTakeoffCreateSourcesFingerprint,
} from "./adapt-takeoff-create";
import { PREP_BUNDLE_FORMAT } from "@/lib/preparation/types";
import { mapProvenanceKind, evaluateSourceProtection } from "./provenance";

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

  console.log("adapt-takeoff-create.test.ts: ok (A–F, J, généricité)");
}

run();
