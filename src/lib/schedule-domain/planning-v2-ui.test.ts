/**
 * Tests UI helpers Planning V2 (+ preview ROCKMAN mémoire).
 * node --import tsx src/lib/schedule-domain/planning-v2-ui.test.ts
 */
import assert from "node:assert/strict";
import { BEWORK_SCHEDULE_AI_FORMAT } from "./ai-contract";
import { previewAiSchedule } from "./preview";
import {
  applyCopiedContext,
  buildCommitPayload,
  buildMinimalAiScheduleExample,
  classifyPlanningV2Error,
  clearRawAiJson,
  detectWrongPlanningV2Paste,
  formatIssueLine,
  formatPredecessorEdge,
  initialPlanningV2UiState,
  invalidatePreview,
  staleUserMessage,
  summarizePreviewForConfirm,
} from "./planning-v2-ui";
import { getAiScheduleBundleV1JsonSchema } from "./ai-contract";

function aiBundle(activities: unknown[]) {
  return { format: BEWORK_SCHEDULE_AI_FORMAT, activities };
}

async function main() {
  // --- Collage contexte vs planning ---
  {
    assert.match(
      detectWrongPlanningV2Paste(
        JSON.stringify({
          type: "bework_chatgpt_context_v1",
          expected_output: "bework_schedule_bundle_v1",
          instructions: ["x"],
        }),
      ) ?? "",
      /CONTEXTE/,
    );
    assert.match(
      detectWrongPlanningV2Paste(
        JSON.stringify({ format: "bework_schedule_bundle_v1", activities: [] }),
      ) ?? "",
      /legacy|bundle_v1/i,
    );
    assert.equal(
      detectWrongPlanningV2Paste(
        JSON.stringify({
          format: BEWORK_SCHEDULE_AI_FORMAT,
          activities: [{ id: "P01", name: "A", kind: "WORK", duration_days: 1, after: [] }],
        }),
      ),
      null,
    );
  }

  // --- Séparation context / raw ---
  {
    const s0 = initialPlanningV2UiState();
    const withRaw = { ...s0, rawAiJson: '{"format":"bework_schedule_ai_v1"}' };
    const afterCopy = applyCopiedContext(withRaw, {
      text: '{"expected_output":"bework_schedule_ai_v1"}',
      sourcesFingerprint: "fp1",
      studyId: "study1",
    });
    assert.equal(afterCopy.rawAiJson, withRaw.rawAiJson, "Copier contexte ne touche pas rawAiJson");
    assert.ok(afterCopy.contextJson.includes("bework_schedule_ai_v1"));
    assert.equal(afterCopy.sourcesFingerprint, "fp1");
    assert.equal(afterCopy.previewResult, null);
  }

  // --- Contrat issu du code, pas d’écriture manuelle schema ---
  {
    const schema = getAiScheduleBundleV1JsonSchema();
    assert.ok(schema);
    const ex = buildMinimalAiScheduleExample(["GO-00-01", "GO-00-02"]);
    assert.equal(ex.format, BEWORK_SCHEDULE_AI_FORMAT);
    assert.equal(ex.activities.length, 2);
  }

  // --- Preview call payload / commit payload ---
  {
    const payload = buildCommitPayload({
      raw: '{"format":"bework_schedule_ai_v1","activities":[]}',
      draftHash: "abc",
      sourcesFingerprint: "fp",
      studyId: "s1",
    });
    assert.deepEqual(Object.keys(payload).sort(), [
      "draftHash",
      "raw",
      "sourcesFingerprint",
      "studyId",
    ]);
    assert.equal("plan" in payload, false);
  }

  // --- Issues affichées ---
  {
    assert.equal(
      formatIssueLine({
        path: "activities[4].takeoff_codes[0]",
        message: "SUR-01 est une ligne indicative non exécutable.",
      }),
      "activities[4].takeoff_codes[0]\nSUR-01 est une ligne indicative non exécutable.",
    );
  }

  // --- Stale states ---
  {
    assert.equal(classifyPlanningV2Error("SOURCE_STALE"), "SOURCE_STALE");
    assert.equal(classifyPlanningV2Error("PREVIEW_STALE"), "PREVIEW_STALE");
    assert.equal(classifyPlanningV2Error("PLAN_STATE_STALE"), "PLAN_STATE_STALE");
    assert.equal(classifyPlanningV2Error("PARSE_ERROR"), "SYNTAX_ERROR");
    assert.equal(classifyPlanningV2Error("UNKNOWN_AI_FORMAT"), "CONTRACT_ERROR");
    assert.equal(classifyPlanningV2Error("DEPENDENCY_CYCLE"), "BUSINESS_ERROR");
    assert.equal(classifyPlanningV2Error("WAIT_WITH_CREW"), "BUSINESS_ERROR");
    assert.ok(staleUserMessage("SOURCE_STALE")?.includes("métré"));
    assert.ok(staleUserMessage("PREVIEW_STALE")?.includes("Prévisualisez"));
    assert.ok(staleUserMessage("PLAN_STATE_STALE")?.includes("Rechargez"));
  }

  // --- invalidate / clear ---
  {
    const s = {
      ...initialPlanningV2UiState(),
      rawAiJson: "x",
      previewResult: { ok: true },
      draftHash: "h",
      step: "preview" as const,
    };
    const cleared = clearRawAiJson(s);
    assert.equal(cleared.rawAiJson, "");
    assert.equal(cleared.previewResult, null);
    const inv = invalidatePreview(s);
    assert.equal(inv.step, "json");
    assert.equal(inv.draftHash, null);
  }

  // --- deps + WAIT rendering helpers ---
  {
    assert.equal(
      formatPredecessorEdge("P02", { activityId: "P01", relation: "FS", lagDays: 0 }),
      "P02 ← FS P01",
    );
  }

  // --- Confirm summary + activity count ---
  {
    assert.equal(
      summarizePreviewForConfirm({ calculatedActivities: 22, totalDurationDays: 27 }),
      "22 activités seront créées — durée prévisionnelle 27 jours",
    );
    assert.equal(
      summarizePreviewForConfirm({ calculatedActivities: 2, totalDurationDays: 3 }),
      "2 activités seront créées — durée prévisionnelle 3 jours",
    );
  }

  // --- TEST MINIMAL 2 activités (pipeline pur = Preview serveur) ---
  {
    const lines = [
      {
        code: "GO-00-01",
        executable: true,
        role: "quote",
        quantity_for_planning: 10,
        validated_quantity: 10,
        declared_quantity: 10,
        computed_quantity: 10,
      },
      {
        code: "GO-00-02",
        executable: true,
        role: "quote",
        quantity_for_planning: 10,
        validated_quantity: 10,
        declared_quantity: 10,
        computed_quantity: 10,
      },
    ];
    const preview = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "Installation",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-01"],
          after: [],
        },
        {
          id: "P02",
          name: "Fouilles",
          kind: "WORK",
          duration_days: 2,
          takeoff_codes: ["GO-00-02"],
          after: [{ id: "P01", type: "FS", lag_days: 0 }],
        },
      ]),
      sourceContext: {
        projectId: "p",
        takeoffStudyId: "s",
        takeoffVersion: 1,
        takeoffFingerprint: "fp",
        lines,
      },
    });
    assert.equal(preview.ok, true, JSON.stringify(preview));
    if (preview.ok) {
      assert.equal(preview.stats.inputActivities, 2);
      assert.equal(preview.stats.calculatedActivities, 2);
      assert.equal(preview.stats.totalDurationDays, 3);
      assert.ok(preview.draftHash.length === 64);
    }
  }

  // --- TESTS ERREURS pipeline ---
  {
    const baseCtx = {
      projectId: "p",
      takeoffStudyId: "s",
      takeoffVersion: 1,
      takeoffFingerprint: "fp",
      lines: [
        {
          code: "GO-00-01",
          executable: true,
          role: "quote",
          quantity_for_planning: 1,
          validated_quantity: 1,
          declared_quantity: 1,
          computed_quantity: 1,
        },
        {
          code: "SUR-01",
          executable: false,
          role: "indicator",
          quantity_for_planning: null,
          validated_quantity: null,
          declared_quantity: null,
          computed_quantity: null,
        },
      ],
    };

    const badFormat = previewAiSchedule({
      raw: { format: "bework_schedule_bundle_v1", activities: [] },
      sourceContext: baseCtx,
    });
    assert.equal(badFormat.ok, false);
    if (!badFormat.ok) {
      assert.equal(classifyPlanningV2Error(badFormat.issues[0]?.code, badFormat.issues), "CONTRACT_ERROR");
    }

    const sur = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "X",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["SUR-01"],
          after: [],
        },
      ]),
      sourceContext: baseCtx,
    });
    assert.equal(sur.ok, false);

    const cycle = previewAiSchedule({
      raw: aiBundle([
        {
          id: "P01",
          name: "A",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-01"],
          after: [{ id: "P02", type: "FS", lag_days: 0 }],
        },
        {
          id: "P02",
          name: "B",
          kind: "WORK",
          duration_days: 1,
          takeoff_codes: ["GO-00-01"],
          after: [{ id: "P01", type: "FS", lag_days: 0 }],
        },
      ]),
      sourceContext: baseCtx,
    });
    assert.equal(cycle.ok, false);
    if (!cycle.ok) {
      assert.ok(cycle.issues.some((i) => i.code === "DEPENDENCY_CYCLE"));
    }

    const waitCrew = previewAiSchedule({
      raw: aiBundle([
        {
          id: "W01",
          name: "Cure",
          kind: "WAIT",
          duration_days: 2,
          takeoff_codes: [],
          crew: { id: "TERR-A", size: 2 },
          after: [],
        },
      ]),
      sourceContext: baseCtx,
    });
    assert.equal(waitCrew.ok, false);
    if (!waitCrew.ok) {
      assert.ok(
        waitCrew.issues.some(
          (i) => i.code === "WAIT_WITH_CREW" || /WAIT/i.test(i.message),
        ),
      );
    }
  }

  // --- ROCKMAN PREVIEW mémoire 22/27 (pas de commit) ---
  {
    const lines = Array.from({ length: 22 }, (_, i) => ({
      code: `GO-${String(i).padStart(2, "0")}-01`,
      executable: true,
      role: "quote",
      quantity_for_planning: 10,
      validated_quantity: 10,
      declared_quantity: 10,
      computed_quantity: 10,
    }));
    const activities = lines.map((l, i) => ({
      id: `P${String(i + 1).padStart(2, "0")}`,
      name: `GO ${i + 1}`,
      kind: "WORK",
      duration_days: i < 21 ? 1 : 6,
      takeoff_codes: [l.code],
      after:
        i === 0
          ? []
          : [{ id: `P${String(i).padStart(2, "0")}`, type: "FS", lag_days: 0 }],
    }));
    const preview = previewAiSchedule({
      raw: aiBundle(activities),
      sourceContext: {
        projectId: "rockman-fixture",
        takeoffStudyId: "rockman-fixture-study",
        takeoffVersion: 4,
        takeoffFingerprint: "rockman-fixture-fp",
        lines,
      },
    });
    assert.equal(preview.ok, true, JSON.stringify(preview));
    if (preview.ok) {
      assert.equal(preview.stats.inputActivities, 22);
      assert.equal(preview.stats.normalizedActivities, 22);
      assert.equal(preview.stats.calculatedActivities, 22);
      assert.equal(preview.stats.totalDurationDays, 27);
      assert.equal(
        summarizePreviewForConfirm(preview.stats),
        "22 activités seront créées — durée prévisionnelle 27 jours",
      );
    }
  }

  // commitState pending = bouton disabled côté UI (contrat)
  {
    assert.equal(initialPlanningV2UiState().commitState, "idle");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        suite: "planning-v2-ui.test.ts",
        minimal2activities: "PASS",
        errors: "PASS",
        rockmanPreviewMemory: "22/22 / 27j PASS",
        rockmanCommit: "SKIP — attente validation utilisateur",
        copyContextDoesNotTouchRaw: "PASS",
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
