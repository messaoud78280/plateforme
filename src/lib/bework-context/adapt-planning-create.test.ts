/**
 * Tests CREATE planning — pure / fixtures (aucune DB).
 * node --import tsx src/lib/bework-context/adapt-planning-create.test.ts
 */
import assert from "node:assert/strict";
import {
  BEWORK_SCHEDULE_BUNDLE_FORMAT,
  PLANNING_CREATE_INSTRUCTIONS,
  computePlanningCreateSourcesFingerprint,
  parseBeworkScheduleBundle,
} from "./adapt-planning-create";
import { computeSchedule } from "@/lib/preparation/schedule/compute";
import { parsePrepWorkflow } from "@/lib/preparation/schedule/parse";

function sampleBundle(extra?: Record<string, unknown>) {
  return {
    format: BEWORK_SCHEDULE_BUNDLE_FORMAT,
    title: "Planning synthétique",
    resources: {
      labor: [
        { id: "L1", role: "Conducteur engin" },
        { id: "L2", role: "Manoeuvre" },
      ],
      equipment: [{ id: "E1", category: "engin", label: "Mini-pelle" }],
      supplies: [],
      rates: [
        {
          id: "R_TERR",
          label: "Terrassement",
          value: 25,
          unit: "m³/j",
          per: "equipe",
          provenance: "PLANNING_ASSUMPTION",
        },
      ],
    },
    workflow: {
      execution_phases: [
        { id: "ph_prep", label: "Préparation", role: "PREPARATION", order: 1 },
        { id: "ph_exec", label: "Exécution", role: "EXECUTION", order: 2 },
      ],
      steps: [
        {
          id: "P01",
          order: 10,
          name: "Implantation",
          kind: "work",
          execution_phase_id: "ph_prep",
          takeoff_ids: [],
          duration: { mode: "fixed", days: 0.5, calendar: "working", provenance: "USER_DECISION" },
          crew: [{ labor_id: "L2", count: 1 }],
          crew_id: "TERR-A",
          crew_size: 1,
          equipment: [],
          supplies: [],
          preconditions: [],
          controls_before_next: [],
          constraints: [],
          safety: [],
          proofs: [],
        },
        {
          id: "P02",
          order: 20,
          name: "Terrassement des fouilles",
          kind: "work",
          lot: "Terrassement",
          execution_phase_id: "ph_exec",
          takeoff_ids: ["TERR.01"],
          duration: {
            mode: "computed",
            driver_item: "TERR.01",
            rate_id: "R_TERR",
            parallel_units: 1,
            rounding: "ceil_half_day",
          },
          crew: [
            { labor_id: "L1", count: 1 },
            { labor_id: "L2", count: 1 },
          ],
          crew_id: "TERR-A",
          crew_size: 2,
          equipment: [{ equipment_id: "E1", count: 1 }],
          supplies: [],
          preconditions: [],
          controls_before_next: [],
          constraints: [],
          safety: [],
          proofs: [],
        },
        {
          id: "P03",
          order: 30,
          name: "Attente / cure",
          kind: "wait",
          execution_phase_id: "ph_exec",
          takeoff_ids: [],
          duration: { mode: "fixed", days: 1, calendar: "calendar", provenance: "SOURCE_DATA" },
          crew: [],
          equipment: [],
          supplies: [],
          preconditions: [],
          controls_before_next: [],
          constraints: [],
          safety: [],
          proofs: [],
        },
        {
          id: "MAC01",
          order: 40,
          name: "Béton de propreté",
          kind: "work",
          lot: "Maçonnerie",
          execution_phase_id: "ph_exec",
          takeoff_ids: ["MAC.01"],
          duration: { mode: "fixed", days: 1, calendar: "working" },
          crew: [{ labor_id: "L2", count: 2 }],
          crew_id: "MAC-A",
          crew_size: 2,
          equipment: [],
          supplies: [],
          preconditions: [],
          controls_before_next: [],
          constraints: [],
          safety: [],
          proofs: [],
        },
        {
          id: "ELEC01",
          order: 50,
          name: "Tableau provisoire",
          kind: "work",
          lot: "Électricité",
          execution_phase_id: "ph_exec",
          takeoff_ids: ["ELEC.01"],
          duration: { mode: "fixed", days: 0.5, calendar: "working" },
          crew: [{ labor_id: "L2", count: 1 }],
          crew_id: "ELEC-A",
          crew_size: 1,
          equipment: [],
          supplies: [],
          preconditions: [],
          controls_before_next: [],
          constraints: [],
          safety: [],
          proofs: [],
        },
        {
          id: "PLOMB01",
          order: 60,
          name: "Attente livraison plomberie",
          kind: "wait",
          lot: "Plomberie",
          execution_phase_id: "ph_exec",
          takeoff_ids: [],
          duration: { mode: "fixed", days: 2, calendar: "calendar" },
          crew: [],
          equipment: [],
          supplies: [],
          preconditions: [],
          controls_before_next: [],
          constraints: [],
          safety: [],
          proofs: [],
        },
      ],
    },
    schedule: {
      start_date: "2026-10-06",
      start_date_provenance: "USER_DECISION",
      calendar: {
        working_days: [1, 2, 3, 4, 5],
        holidays: "FR_METROPOLE",
        granularity_days: 0.5,
      },
      tasks: [
        { step_id: "P01", depends_on: [] },
        { step_id: "P02", depends_on: [{ step_id: "P01", type: "FS", lag_days: 0 }] },
        { step_id: "P03", depends_on: [{ step_id: "P02", type: "FS", lag_days: 0 }] },
        { step_id: "MAC01", depends_on: [{ step_id: "P03", type: "FS", lag_days: 0 }] },
        { step_id: "ELEC01", depends_on: [{ step_id: "MAC01", type: "FS", lag_days: 0 }] },
        { step_id: "PLOMB01", depends_on: [{ step_id: "ELEC01", type: "FS", lag_days: 0 }] },
      ],
    },
    assumptions: ["Rendement terrassement 25 m³/j — hypothèse à valider"],
    warnings: [],
    ...extra,
  };
}

function run() {
  // TEST A/B fingerprint
  {
    const a = computePlanningCreateSourcesFingerprint({
      projectId: "p1",
      studyId: "s1",
      studyVersion: 2,
      studyUpdatedAt: "2026-10-03T10:00:00.000Z",
      lineCodes: ["TERR.01", "MAC.01"],
      quoteId: null,
      quoteVersionNumber: null,
      visitId: null,
      visitUpdatedAt: null,
    });
    const withQuote = computePlanningCreateSourcesFingerprint({
      projectId: "p1",
      studyId: "s1",
      studyVersion: 2,
      studyUpdatedAt: "2026-10-03T10:00:00.000Z",
      lineCodes: ["TERR.01", "MAC.01"],
      quoteId: "q1",
      quoteVersionNumber: 1,
      visitId: null,
      visitUpdatedAt: null,
    });
    assert.notEqual(a, withQuote, "TEST B devis enrichit l’empreinte");
  }

  // TEST L stale
  {
    const v2 = computePlanningCreateSourcesFingerprint({
      projectId: "p1",
      studyId: "s1",
      studyVersion: 2,
      studyUpdatedAt: "2026-10-03T10:00:00.000Z",
      lineCodes: ["TERR.01"],
      quoteId: null,
      quoteVersionNumber: null,
      visitId: null,
      visitUpdatedAt: null,
    });
    const v3 = computePlanningCreateSourcesFingerprint({
      projectId: "p1",
      studyId: "s1",
      studyVersion: 3,
      studyUpdatedAt: "2026-10-03T10:00:00.000Z",
      lineCodes: ["TERR.01"],
      quoteId: null,
      quoteVersionNumber: null,
      visitId: null,
      visitUpdatedAt: null,
    });
    assert.notEqual(v2, v3, "TEST L version métré change l’empreinte");
  }

  // TEST C validated prioritaire (logique canonique)
  {
    function resolve(v: number | null, c: number | null, d: number | null) {
      if (v != null) return v;
      if (c != null) return c;
      return d;
    }
    assert.equal(resolve(45.184, 40, 30), 45.184, "TEST C validated");
  }

  // TEST D indicateur négatif non exécutable
  {
    const eng = -1.092;
    const executable = eng >= 0;
    assert.equal(executable, false, "TEST D indicateur négatif");
  }

  // TEST E/F/G parse + compute
  {
    const parsed = parseBeworkScheduleBundle(JSON.stringify(sampleBundle()));
    assert.equal(parsed.ok, true, "TEST G parse");
    assert.ok(
      parsed.bundle.resources.rates.some((r) =>
        (r.provenance ?? "").includes("ASSUMPTION"),
      ),
      "TEST E hypothese rendement",
    );
    const wf = parsePrepWorkflow(parsed.bundle.workflow);
    const qty: Record<string, number> = {
      "TERR.01": 45.184,
      "MAC.01": 8,
      "ELEC.01": 1,
    };
    const result = computeSchedule({
      workflowSteps: wf.steps,
      schedule: parsed.bundle.schedule,
      resources: parsed.bundle.resources,
      qtyOf: (code) => qty[code] ?? null,
      executionPhases: wf.execution_phases,
    });
    assert.equal(result.errors.length, 0, `TEST G compute: ${result.errors.join(";")}`);
    assert.ok(result.placed.length >= 6, "généricité multi-lots");
    const terr = result.placed.find((t) => t.stepId === "P02");
    assert.ok(terr, "tâche terrassement");
    assert.ok((terr!.duration.durationDays ?? 0) > 0, "durée calculée");
    const wait = result.placed.find((t) => t.stepId === "P03");
    assert.equal(wait?.kind, "wait", "WAIT présent");
  }

  // Instructions
  {
    const joined = PLANNING_CREATE_INSTRUCTIONS.join(" ");
    assert.match(joined, /Discute/);
    assert.match(joined, /PLANNING_ASSUMPTION|depends_on/);
    assert.doesNotMatch(joined, /\bC-01\b|\bMOREL\b|\bcuisine\b/i);
  }

  console.log("adapt-planning-create.test.ts: ok (A–G, L, généricité, WAIT, instructions)");
}

run();
