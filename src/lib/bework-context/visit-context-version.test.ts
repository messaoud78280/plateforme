/**
 * Tests CTX-07 — version dérivée VISIT (déterminisme, stale, PREVIEW_ONLY).
 * Fixtures locales — aucune écriture BDD.
 */
import assert from "node:assert/strict";
import {
  canonicalizeVisitContextPayload,
  computeVisitContextVersion,
  digestToBaseVersion,
  isVisitContextStale,
  type VisitContextVersionInput,
} from "./visit-context-version";
import { adaptVisitForChatgptContext } from "./adapters";
import {
  PROJECT_CONTEXT_FORMAT,
  PROJECT_CONTEXT_SCHEMA_VERSION,
  type ProjectContextSnapshot,
} from "./types";
import { getSectionCapability } from "@/lib/bework-patch/capability";
import { validatePatchContext } from "@/lib/bework-patch/validate-context";
import { BEWORK_PATCH_FORMAT } from "@/lib/bework-patch/types";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import { buildSiteSurveyJson } from "@/lib/site-visits/survey-export";

function baseVisit(
  overrides?: Partial<VisitContextVersionInput>,
): VisitContextVersionInput {
  return {
    id: "visit-1",
    subject: "Relevé fondations",
    status: "IN_PROGRESS",
    clientName: "Client Demo",
    siteAddress: "1 rue Test",
    clientNeed: "Maison neuve",
    comments: "Accès OK",
    measurements: [
      {
        id: "m2",
        zone: "Zone B",
        label: "Largeur",
        measureType: "LENGTH",
        unit: "m",
        lengthM: 5,
        widthM: null,
        heightM: null,
        quantityValue: null,
        computedQuantity: 5,
        lot: "FOND",
        observation: null,
      },
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
        lot: "FOND",
        observation: "Mesure terrain",
      },
    ],
    mediaRefs: [
      {
        id: "media-1",
        name: "photo-1.jpg",
        kind: "PHOTO",
        category: "RELEVE",
        observation: null,
        hasUrl: true,
      },
    ],
    ...overrides,
  };
}

function fixtureSnapshot(
  visitOverrides?: Partial<VisitContextVersionInput>,
): ProjectContextSnapshot {
  const v = baseVisit(visitOverrides);
  const contextVersion = computeVisitContextVersion(v);
  return {
    type: PROJECT_CONTEXT_FORMAT,
    schema_version: PROJECT_CONTEXT_SCHEMA_VERSION,
    generatedAt: "2026-10-01T12:00:00.000Z",
    organization: { id: "org-urban", name: "URBAN AMÉNAGEMENTS" },
    project: {
      id: "proj-1",
      title: "Chantier demo",
      description: null,
      siteAddress: "1 rue Test",
      siteCity: "Lyon",
      chantierStatus: "ETUDE",
      status: "EN_COURS",
      plannedStartDate: null,
      plannedEndDate: null,
      updatedAt: "2026-10-01T09:00:00.000Z",
    },
    scopes: [],
    sources: [],
    visits: [
      {
        id: v.id,
        subject: v.subject,
        status: v.status,
        clientName: v.clientName,
        siteAddress: v.siteAddress,
        clientNeed: v.clientNeed,
        comments: v.comments,
        projectId: "proj-1",
        commercialQuoteId: null,
        contextVersion,
        updatedAt: "2026-10-01T10:00:00.000Z",
        measurements: v.measurements,
        mediaRefs: v.mediaRefs,
      },
    ],
    takeoffs: [],
    quotes: [],
    schedules: [],
    followUps: [],
    documents: { notices: [], reports: [], other: [] },
    versions: {
      takeoffVersions: [],
      quoteVersions: [],
      planRevisions: [],
      currentSchedulePlanIds: [],
    },
  };
}

// --- A déterminisme ---
{
  const v = baseVisit();
  const a = computeVisitContextVersion(v);
  const b = computeVisitContextVersion(v);
  assert.equal(a, b);
  assert.ok(Number.isInteger(a) && a >= 1);
  console.log("  A déterminisme: ok", a);
}

// --- B champ visite exposé ---
{
  const v1 = computeVisitContextVersion(baseVisit());
  const v2 = computeVisitContextVersion(baseVisit({ subject: "Autre objet" }));
  assert.notEqual(v1, v2);
  console.log("  B champ visite: ok");
}

// --- C mesure modifiée ---
{
  const v1 = computeVisitContextVersion(baseVisit());
  const v2 = computeVisitContextVersion(
    baseVisit({
      measurements: baseVisit().measurements.map((m) =>
        m.id === "m1" ? { ...m, lengthM: 13, computedQuantity: 13 } : m,
      ),
    }),
  );
  assert.notEqual(v1, v2);
  console.log("  C mesure modifiée: ok");
}

// --- D mesure ajoutée ---
{
  const v1 = computeVisitContextVersion(baseVisit());
  const v2 = computeVisitContextVersion(
    baseVisit({
      measurements: [
        ...baseVisit().measurements,
        {
          id: "m3",
          zone: null,
          label: "Hauteur",
          measureType: "LENGTH",
          unit: "m",
          lengthM: 2.5,
          widthM: null,
          heightM: null,
          quantityValue: null,
          computedQuantity: 2.5,
          lot: null,
          observation: null,
        },
      ],
    }),
  );
  assert.notEqual(v1, v2);
  console.log("  D mesure ajoutée: ok");
}

// --- E observation ---
{
  const v1 = computeVisitContextVersion(baseVisit());
  const v2 = computeVisitContextVersion(
    baseVisit({
      measurements: baseVisit().measurements.map((m) =>
        m.id === "m1" ? { ...m, observation: "Corrigé sur place" } : m,
      ),
    }),
  );
  assert.notEqual(v1, v2);
  const v3 = computeVisitContextVersion(baseVisit({ comments: "Nouveau commentaire" }));
  assert.notEqual(v1, v3);
  console.log("  E observation: ok");
}

// --- F média ---
{
  const v1 = computeVisitContextVersion(baseVisit());
  const v2 = computeVisitContextVersion(
    baseVisit({
      mediaRefs: [
        ...baseVisit().mediaRefs,
        {
          id: "media-2",
          name: "photo-2.jpg",
          kind: "PHOTO",
          category: null,
          observation: null,
          hasUrl: true,
        },
      ],
    }),
  );
  assert.notEqual(v1, v2);
  const v3 = computeVisitContextVersion(baseVisit({ mediaRefs: [] }));
  assert.notEqual(v1, v3);
  console.log("  F média: ok");
}

// --- G ordre stable ---
{
  const a = baseVisit();
  const b = baseVisit({
    measurements: [...a.measurements].reverse(),
    mediaRefs: [...a.mediaRefs],
  });
  assert.equal(computeVisitContextVersion(a), computeVisitContextVersion(b));
  assert.equal(
    canonicalizeVisitContextPayload(a),
    canonicalizeVisitContextPayload(b),
  );
  console.log("  G ordre stable: ok");
}

// --- H champ non exposé (simulé : updatedAt technique absent du payload) ---
{
  // L’input de version n’inclut pas updatedAt / agendaEventId / createdById.
  // Deux lectures avec mêmes champs exposés → même version.
  const v1 = computeVisitContextVersion(baseVisit());
  const v2 = computeVisitContextVersion({ ...baseVisit() });
  assert.equal(v1, v2);
  console.log(
    "  H champ non exposé: ok (updatedAt/agenda exclus du hash — documenté)",
  );
}

// --- I mauvaise org (contrat adapter) ---
{
  const snap = fixtureSnapshot();
  assert.equal(adaptVisitForChatgptContext(snap, "missing"), null);
  const ctx = adaptVisitForChatgptContext(snap, "visit-1");
  assert.ok(ctx);
  assert.equal(ctx.organization?.id, "org-urban");
  console.log("  I org / visit introuvable: ok");
}

// --- J legacy survey format (contrat inchangé) ---
{
  assert.equal(typeof BEWORK_PATCH_FORMAT, "string");
  assert.equal(BEWORK_PATCH_FORMAT, "bework_patch_v1");
  assert.equal(typeof buildSiteSurveyJson, "function");
  console.log("  J legacy survey: ok (buildSiteSurveyJson présent)");
}

// --- K VISIT AVAILABLE (CTX-02B) ---
{
  assert.equal(getSectionCapability("VISIT").mode, "AVAILABLE");
  console.log("  K VISIT AVAILABLE: ok");
}

// --- L aucune mutation ---
{
  const snap = fixtureSnapshot();
  const before = JSON.stringify(snap);
  adaptVisitForChatgptContext(snap, "visit-1");
  computeVisitContextVersion(baseVisit());
  assert.equal(JSON.stringify(snap), before);
  console.log("  L aucune mutation: ok");
}

// --- Stale conceptuel ---
{
  const stateA = baseVisit();
  const versionX = computeVisitContextVersion(stateA);
  const stateB = baseVisit({ subject: "Visite mise à jour" });
  const versionY = computeVisitContextVersion(stateB);
  assert.notEqual(versionX, versionY);
  assert.equal(isVisitContextStale({ baseVersion: versionX, currentVersion: versionY }), true);
  assert.equal(isVisitContextStale({ baseVersion: versionX, currentVersion: versionX }), false);

  const patchLike = {
    type: "bework_patch_v1" as const,
    schema_version: 1 as const,
    patch_id: "patch-test",
    origin: {
      section: "VISIT" as const,
      project_id: "proj-1",
      entity_id: "visit-1",
      base_version: versionX,
    },
    change_intent: "FIELD_UPDATE" as const,
    reason: "test",
    operations: [] as BeworkPatchV1["operations"],
  };

  const stale = validatePatchContext(patchLike, {
    organizationId: "org-urban",
    projectId: "proj-1",
    currentVersion: versionY,
  });
  assert.equal(stale.ok, false);
  assert.equal(stale.code, "VERSION_CONFLICT");

  const fresh = validatePatchContext(patchLike, {
    organizationId: "org-urban",
    projectId: "proj-1",
    currentVersion: versionX,
  });
  assert.equal(fresh.ok, true);

  const ctx = adaptVisitForChatgptContext(fixtureSnapshot(), "visit-1")!;
  assert.equal(ctx.type, "bework_chatgpt_context_v1");
  assert.equal(ctx.expected_output, "bework_patch_v1");
  assert.equal(ctx.target.version, versionX);
  assert.equal(ctx.target.base_version, versionX);
  assert.notEqual(ctx.target.version, 1); // plus hardcodé

  // digestToBaseVersion n’est pas un parseInt(hex)
  const buf = Buffer.from([0, 0, 0, 0, 0, 1]);
  assert.equal(digestToBaseVersion(buf), 1);

  console.log("  Stale conceptuel + adapter: ok");
}

console.log("visit-context-version.test.ts: ok");
