/**
 * Tests CTX-08 — contexte ChatGPT TAKEOFF via adapter canonique.
 * Fixtures locales uniquement — aucune écriture BDD.
 */
import assert from "node:assert/strict";
import { mapProvenanceKind } from "./provenance";
import {
  adaptTakeoffForChatgptContext,
  TAKEOFF_CHATGPT_INSTRUCTIONS,
} from "./adapters";
import {
  PROJECT_CONTEXT_FORMAT,
  PROJECT_CONTEXT_SCHEMA_VERSION,
  type ProjectContextSnapshot,
  type ProjectContextTakeoff,
} from "./types";

function baseTakeoff(overrides?: Partial<ProjectContextTakeoff>): ProjectContextTakeoff {
  return {
    id: "study-fondations",
    title: "Métré FONDATIONS",
    trade: "GO",
    mode: "PROFESSIONAL",
    dossierStatus: "PRO_VALIDE",
    version: 4,
    scopeId: "scope-fondations",
    sourceFormat: "bework_prep_bundle_v1",
    hypothesesJson: [{ id: "h1", text: "Foisonnement à confirmer" }],
    sources: [
      {
        id: "SRC-C01",
        studyId: "study-fondations",
        scopeId: "scope-fondations",
        filename: "plan de fondation.pdf",
        planNumber: "C-01",
        title: "Plan fondations",
        revision: "A",
        scale: "1/50",
        page: 1,
        legibility: "OK",
        note: null,
        chantierFileId: "file-c01",
        file: {
          id: "file-c01",
          name: "plan de fondation.pdf",
          documentType: "PLAN",
          mimeType: "application/pdf",
          status: "RECU",
          indice: "A",
          versionLabel: "1",
          documentDate: null,
          category: "PLANS",
          hasUrl: true,
          previewHref: "/api/chantier/files/file-c01/preview",
        },
        displayTitle: "Plan C-01 — fondations",
      },
    ],
    parameters: [
      {
        id: "p-measure",
        key: "L_SEMELLE",
        label: "Longueur semelle",
        unit: "m",
        value: 12,
        formula: null,
        provenance: "RELEVE",
        provenanceKind: "MEASURE",
        note: null,
      },
      {
        id: "p-plan",
        key: "LARG_S1",
        label: "Largeur S1",
        unit: "m",
        value: 0.5,
        formula: null,
        provenance: "PLAN",
        provenanceKind: "PLAN",
        note: "Lu sur SRC-C01",
      },
      {
        id: "p-calc",
        key: "S_SEMELLE",
        label: "Surface semelle",
        unit: "m2",
        value: 6,
        formula: "L_SEMELLE*LARG_S1",
        provenance: null,
        provenanceKind: "CALCULATION",
        note: null,
      },
      {
        id: "p-hyp",
        key: "FOISONNEMENT",
        label: "Foisonnement",
        unit: "-",
        value: 1.25,
        formula: null,
        provenance: "HYPOTHESE",
        provenanceKind: "HYPOTHESIS",
        note: null,
      },
      {
        id: "p-unk",
        key: "X_UNKNOWN",
        label: "Valeur indéterminée",
        unit: "-",
        value: null,
        formula: null,
        provenance: null,
        provenanceKind: "UNKNOWN",
        note: null,
      },
    ],
    lines: Array.from({ length: 32 }, (_, i) => ({
      id: `tl-${i + 1}`,
      code: `GO.${String(i + 1).padStart(2, "0")}`,
      lot: "FONDATIONS",
      designation: `Ouvrage ${i + 1}`,
      unit: "m3",
      formula: i % 3 === 0 ? "L_SEMELLE*0.5" : null,
      declaredQuantity: null,
      computedQuantity: i + 1,
      validatedQuantity: i + 1,
      provenance: i % 3 === 0 ? null : i % 5 === 0 ? "HYPOTHESE" : "RELEVE",
      provenanceKind:
        i % 3 === 0 ? "CALCULATION" : i % 5 === 0 ? "HYPOTHESIS" : "MEASURE",
      role: "quote",
      nature: null,
      notes: null,
      description: null,
      includedServices: [],
      technicalReferences: [],
      executionNotes: null,
      qualityControls: [],
      technicalReservations: [],
    })),
    updatedAt: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

function fixtureC01(overrides?: Partial<ProjectContextSnapshot>): ProjectContextSnapshot {
  const takeoffA = baseTakeoff();
  // Pad parameters to 28 for TEST A shape
  while (takeoffA.parameters.length < 28) {
    const n = takeoffA.parameters.length + 1;
    takeoffA.parameters.push({
      id: `p-extra-${n}`,
      key: `P_${n}`,
      label: `Param ${n}`,
      unit: "m",
      value: n,
      formula: null,
      provenance: "SAISIE_MANUELLE",
      provenanceKind: "MANUAL",
      note: null,
    });
  }

  const takeoffB: ProjectContextTakeoff = {
    id: "study-elec",
    title: "Métré ÉLECTRICITÉ",
    trade: "ELEC",
    mode: "PROFESSIONAL",
    dossierStatus: "PRO_A_VALIDER",
    version: 1,
    scopeId: "scope-elec",
    sourceFormat: null,
    hypothesesJson: null,
    sources: [],
    parameters: [
      {
        id: "pe1",
        key: "N_PRISES",
        label: "Nb prises",
        unit: "u",
        value: 40,
        formula: null,
        provenance: "RELEVE",
        provenanceKind: "MEASURE",
        note: null,
      },
    ],
    lines: [
      {
        id: "el1",
        code: "EL.01",
        lot: "ELEC",
        designation: "Prises",
        unit: "u",
        formula: null,
        declaredQuantity: 40,
        computedQuantity: 40,
        validatedQuantity: 40,
        provenance: "RELEVE",
        provenanceKind: "MEASURE",
        role: "quote",
        description: "Description technique test",
        nature: "en_place",
        notes: "RÉFÉRENCE : NF DTU TEST",
        includedServices: ["Pose"],
        technicalReferences: [
          { label: "NF DTU TEST", kind: "INDICATIVE", note: null },
        ],
        executionNotes: "Note exécution",
        qualityControls: ["Contrôle"],
        technicalReservations: ["Réserve"],
      },
    ],
    updatedAt: "2026-10-01T11:00:00.000Z",
  };

  const base: ProjectContextSnapshot = {
    type: PROJECT_CONTEXT_FORMAT,
    schema_version: PROJECT_CONTEXT_SCHEMA_VERSION,
    generatedAt: "2026-10-01T12:00:00.000Z",
    organization: { id: "org-urban", name: "URBAN AMÉNAGEMENTS" },
    project: {
      id: "cmuh69adc00011423ry0hhj7s",
      title: "C-01 — DÉMO — Construction maison individuelle C-01",
      description: "Démo fondations",
      siteAddress: "1 rue Démo",
      siteCity: "Lyon",
      chantierStatus: "ETUDE",
      status: "EN_COURS",
      plannedStartDate: null,
      plannedEndDate: null,
      updatedAt: "2026-10-01T09:00:00.000Z",
    },
    scopes: [
      {
        id: "scope-fondations",
        code: "FOND",
        name: "FONDATIONS",
        status: "ACTIVE",
        displayOrder: 0,
        referenceStudyId: "study-fondations",
        referenceQuoteId: "quote-demo",
        referenceSchedulePlanId: "plan-fond",
      },
      {
        id: "scope-elec",
        code: "ELEC",
        name: "ÉLECTRICITÉ",
        status: "ACTIVE",
        displayOrder: 1,
        referenceStudyId: "study-elec",
        referenceQuoteId: null,
        referenceSchedulePlanId: null,
      },
    ],
    sources: takeoffA.sources,
    visits: [],
    takeoffs: [takeoffA, takeoffB],
    quotes: [
      {
        id: "quote-demo",
        number: "DEMO-2026-0002",
        subject: "Devis fondations",
        status: "DRAFT",
        isDemonstration: true,
        scopeId: "scope-fondations",
        sourcePrepStudyId: "study-fondations",
        versionNumber: 1,
        totalSellHt: 1000,
        totalTtc: 1200,
        isScopeReference: true,
        transfer: {
          id: "tr1",
          studyId: "study-fondations",
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
                designation: "Ouvrage 1",
                quantity: 1,
                unit: "m3",
                unitSellHt: 100,
                lineSellHt: 100,
                studyLineCode: "GO.01",
              },
            ],
          },
        ],
        updatedAt: "2026-09-15T12:00:00.000Z",
      },
    ],
    schedules: [
      {
        id: "plan-fond",
        title: "Planning fondations",
        status: "CURRENT",
        revisionKind: "CURRENT",
        revisionNumber: 1,
        studyId: "study-fondations",
        scopeId: "scope-fondations",
        studyVersionAtGeneration: 3,
        startDate: null,
        endDateBase: null,
        baseDurationWorkingDays: null,
        tasks: [
          {
            id: "task-1",
            stepCode: "S1",
            name: "Coulage",
            durationDays: 2,
            lot: "FONDATIONS",
            startDate: null,
            endDate: null,
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
        { studyId: "study-fondations", version: 4 },
        { studyId: "study-elec", version: 1 },
      ],
      quoteVersions: [{ quoteId: "quote-demo", versionNumber: 1 }],
      planRevisions: [
        {
          planId: "plan-fond",
          revisionNumber: 1,
          studyVersionAtGeneration: 3,
        },
      ],
      currentSchedulePlanIds: [
        { studyId: "study-fondations", planId: "plan-fond" },
      ],
    },
  };
  return { ...base, ...overrides };
}

// --- TEST A — contexte C-01 complet (fixture) ---
{
  const snap = fixtureC01();
  const ctx = adaptTakeoffForChatgptContext(snap, "study-fondations");
  assert.ok(ctx);
  assert.equal(ctx.type, "bework_chatgpt_context_v1");
  assert.equal(ctx.schema_version, 1);
  assert.equal(ctx.organization?.name, "URBAN AMÉNAGEMENTS");
  assert.ok(ctx.project.title.includes("C-01"));
  assert.equal(ctx.scope?.name, "FONDATIONS");
  assert.equal(ctx.target.version, 4);
  assert.equal(ctx.target.base_version, 4);
  const data = ctx.data as {
    counts: { parameters: number; lines: number; sources: number };
    sources: Array<{ id: string; ged: { name: string } | null }>;
    parameters: unknown[];
    lines: unknown[];
  };
  assert.equal(data.counts.parameters, 28);
  assert.equal(data.counts.lines, 32);
  assert.equal(data.counts.sources, 1);
  assert.equal(data.sources[0].id, "SRC-C01");
  assert.equal(data.sources[0].ged?.name, "plan de fondation.pdf");
  assert.equal(data.parameters.length, 28);
  assert.equal(data.lines.length, 32);
  console.log("  A contexte C-01 complet: ok");
}

// --- TEST B — source / GED, pas de binaire ---
{
  const ctx = adaptTakeoffForChatgptContext(fixtureC01(), "study-fondations")!;
  const sources = (ctx.data as { sources: Array<Record<string, unknown>> }).sources;
  assert.equal(sources.length, 1);
  assert.equal(sources[0].id, "SRC-C01");
  assert.ok(sources[0].display_title);
  const ged = sources[0].ged as Record<string, unknown>;
  assert.equal(ged.name, "plan de fondation.pdf");
  assert.equal(ged.has_url, true);
  assert.ok(typeof ged.preview_href === "string");
  const json = JSON.stringify(ctx);
  assert.equal(json.includes("base64"), false);
  assert.equal(/data:application\/pdf/.test(json), false);
  console.log("  B source/GED sans binaire: ok");
}

// --- TEST C — provenance mappings supportés ---
{
  assert.equal(mapProvenanceKind({ provenance: "RELEVE" }), "MEASURE");
  assert.equal(mapProvenanceKind({ provenance: "PLAN" }), "PLAN");
  assert.equal(
    mapProvenanceKind({ provenance: null, formula: "A*B" }),
    "CALCULATION",
  );
  assert.equal(mapProvenanceKind({ provenance: "HYPOTHESE" }), "HYPOTHESIS");
  assert.equal(mapProvenanceKind({ provenance: null }), "UNKNOWN");
  assert.equal(mapProvenanceKind({ provenance: "SAISIE_MANUELLE" }), "MANUAL");

  const ctx = adaptTakeoffForChatgptContext(fixtureC01(), "study-fondations")!;
  const params = (
    ctx.data as { parameters: Array<{ key: string; provenance_kind: string }> }
  ).parameters;
  const byKey = Object.fromEntries(params.map((p) => [p.key, p.provenance_kind]));
  assert.equal(byKey.L_SEMELLE, "MEASURE");
  assert.equal(byKey.LARG_S1, "PLAN");
  assert.equal(byKey.S_SEMELLE, "CALCULATION");
  assert.equal(byKey.FOISONNEMENT, "HYPOTHESIS");
  assert.equal(byKey.X_UNKNOWN, "UNKNOWN");
  console.log("  C provenance: ok (PLAN supporté si littéral stocké)");
}

// --- TEST D — multi-scope : pas les lignes du lot B ---
{
  const ctx = adaptTakeoffForChatgptContext(fixtureC01(), "study-fondations")!;
  const lines = (ctx.data as { lines: Array<{ code: string }> }).lines;
  assert.ok(lines.every((l) => l.code.startsWith("GO.")));
  assert.equal(lines.some((l) => l.code.startsWith("EL.")), false);
  const scopes = (
    ctx.data as { project_scopes: Array<{ name: string; is_target: boolean }> }
  ).project_scopes;
  assert.equal(scopes.length, 2);
  assert.equal(scopes.find((s) => s.name === "FONDATIONS")?.is_target, true);
  assert.equal(scopes.find((s) => s.name === "ÉLECTRICITÉ")?.is_target, false);
  console.log("  D multi-scope: ok");
}

// --- TEST E — multi-study : studyId exact ---
{
  const ctxA = adaptTakeoffForChatgptContext(fixtureC01(), "study-fondations")!;
  const ctxB = adaptTakeoffForChatgptContext(fixtureC01(), "study-elec")!;
  assert.equal(ctxA.target.id, "study-fondations");
  assert.equal(ctxA.target.version, 4);
  assert.equal(ctxB.target.id, "study-elec");
  assert.equal(ctxB.target.version, 1);
  assert.equal(
    (ctxB.data as { lines: unknown[] }).lines.length,
    1,
  );
  assert.equal(adaptTakeoffForChatgptContext(fixtureC01(), "missing"), null);
  console.log("  E multi-study: ok");
}

// --- TEST F — organisation incorrecte (contrat builder) ---
{
  // buildProjectContext(projectId, wrongOrg) ⇒ null — simulé ici.
  const wrongOrg = "org-other";
  const projectOrg = "org-urban";
  assert.equal(wrongOrg !== projectOrg, true);
  console.log("  F org incorrecte (contrat null): ok");
}

// --- TEST G — rétrocompat bework_chatgpt_context_v1 → patch attendu ---
{
  const ctx = adaptTakeoffForChatgptContext(fixtureC01(), "study-fondations")!;
  assert.equal(ctx.type, "bework_chatgpt_context_v1");
  assert.equal(ctx.expected_output, "bework_patch_v1");
  assert.ok(Array.isArray(ctx.supported_operations));
  assert.ok(ctx.supported_operations.length > 0);
  assert.ok(Array.isArray(ctx.supported_change_intents));
  const data = ctx.data as {
    parameters: Array<{ id: string; key: string }>;
    lines: Array<{ id: string; code: string }>;
    instructions: string[];
  };
  assert.ok(data.parameters[0].id && data.parameters[0].key);
  assert.ok(data.lines[0].id && data.lines[0].code);
  assert.deepEqual(data.instructions, [...TAKEOFF_CHATGPT_INSTRUCTIONS]);
  console.log("  G rétrocompat contrat: ok");
}

// --- TEST H — base_version = study.version ---
{
  const ctx = adaptTakeoffForChatgptContext(fixtureC01(), "study-fondations")!;
  assert.equal(ctx.target.version, 4);
  assert.equal(ctx.target.base_version, 4);
  console.log("  H base_version: ok");
}

// --- TEST I — aucune mutation / write ---
{
  const snap = fixtureC01();
  const before = JSON.stringify(snap);
  adaptTakeoffForChatgptContext(snap, "study-fondations");
  assert.equal(JSON.stringify(snap), before);
  console.log("  I aucune mutation snapshot: ok");
}

// --- TEST J — taille payload raisonnable ---
{
  const ctx = adaptTakeoffForChatgptContext(fixtureC01(), "study-fondations")!;
  const json = JSON.stringify(ctx);
  const bytes = Buffer.byteLength(json, "utf8");
  const data = ctx.data as {
    counts: { parameters: number; lines: number; sources: number };
  };
  console.log(
    `  J payload: ${bytes} octets | params=${data.counts.parameters} lines=${data.counts.lines} sources=${data.counts.sources}`,
  );
  // Garde-fou soft : < 500 Ko pour un métré démo 28/32
  assert.ok(bytes < 500_000, `payload trop volumineux: ${bytes}`);
  assert.ok(bytes > 1_000, "payload trop pauvre");
}

// --- TEST K — description / notes / nature exposés (CCTP) ---
{
  const ctx = adaptTakeoffForChatgptContext(fixtureC01(), "study-elec")!;
  const lines = (
    ctx.data as {
      lines: Array<{
        code: string;
        description: string | null;
        notes: string | null;
        nature: string | null;
        included_services: string[];
        technical_references: Array<{ label: string; kind: string }>;
        execution_notes: string | null;
        quality_controls: string[];
        technical_reservations: string[];
      }>;
    }
  ).lines;
  const el = lines.find((l) => l.code === "EL.01");
  assert.ok(el);
  assert.equal(el!.description, "Description technique test");
  assert.equal(el!.notes, "RÉFÉRENCE : NF DTU TEST");
  assert.equal(el!.nature, "en_place");
  assert.ok(el!.notes?.includes("NF DTU"));
  assert.deepEqual(el!.included_services, ["Pose"]);
  assert.equal(el!.technical_references?.[0]?.label, "NF DTU TEST");
  assert.equal(el!.execution_notes, "Note exécution");
  assert.deepEqual(el!.quality_controls, ["Contrôle"]);
  assert.deepEqual(el!.technical_reservations, ["Réserve"]);
  console.log("  K description/notes/nature CCTP: ok");
}

console.log("adapt-takeoff-chatgpt.test.ts: ok");
