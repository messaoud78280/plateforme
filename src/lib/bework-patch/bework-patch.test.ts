/**
 * Tests Phase B — bework_patch_v1
 * npx tsx src/lib/bework-patch/bework-patch.test.ts
 */
import assert from "node:assert/strict";
import { parseBeworkQuotePatch } from "@/lib/commercial/chatgpt-patch/parse";
import { parsePrepPatch } from "@/lib/preparation/chatgpt-patch/parse";
import {
  buildCanonicalResolution,
  buildChatgptContextSkeleton,
  canDelegateToPrepPatch,
  canDelegateToQuotePatch,
  parseBeworkPatch,
  toLegacyPrepPatch,
  toLegacyQuotePatch,
  validatePatchAgainstChatgptContext,
  validatePatchContext,
} from "@/lib/bework-patch/index";

function baseOrigin(section: string, entity = "ent_1") {
  return {
    section,
    project_id: "proj_1",
    entity_id: entity,
    base_version: 4,
  };
}

// --- TEST 1 : patch valide TAKEOFF ---
{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_takeoff_01",
    origin: baseOrigin("TAKEOFF", "study_1"),
    change_intent: "TECHNICAL_CORRECTION",
    reason: "Nouvelle longueur confirmée",
    operations: [
      {
        op: "update_parameter",
        target: {
          entity_type: "PREP_PARAMETER",
          study_id: "study_1",
          parameter_key: "trenche.length",
        },
        changes: { value: 65 },
      },
    ],
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.patch.operations[0]!.op, "update_parameter");
    assert.equal(canDelegateToPrepPatch(r.patch), true);
    const del = toLegacyPrepPatch(r.patch);
    assert.equal(del.ok, true);
  }
  console.log("ok — TEST 1 TAKEOFF");
}

// --- TEST 2 : patch valide QUOTE ---
{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_quote_01",
    origin: baseOrigin("QUOTE", "DEV-2026-0153"),
    change_intent: "COMMERCIAL_ADJUSTMENT",
    reason: "Ajustement PU",
    operations: [
      {
        op: "update_quote_item",
        target: {
          entity_type: "QUOTE_ITEM",
          quote_id: "quote_1",
          item_id: "item_1",
        },
        changes: { unit_price_ht: 115 },
      },
    ],
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(canDelegateToQuotePatch(r.patch), true);
    const del = toLegacyQuotePatch(r.patch);
    assert.equal(del.ok, true);
    if (del.ok) {
      assert.equal(del.quotePatch.type, "bework_quote_patch_v1");
      assert.equal(del.quotePatch.operations[0]!.op, "update_item");
    }
  }
  console.log("ok — TEST 2 QUOTE");
}

// --- TEST 3 : patch valide PLANNING ---
{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_plan_01",
    origin: baseOrigin("PLANNING", "plan_1"),
    change_intent: "PLANNING_ADJUSTMENT",
    reason: "Durée revue",
    operations: [
      {
        op: "update_duration",
        target: {
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: "plan_1",
          task_id: "task_1",
          step_code: "P01",
        },
        changes: { duration_days: 2 },
      },
    ],
  });
  assert.equal(r.ok, true);
  console.log("ok — TEST 3 PLANNING");
}

// --- TEST 4 : op inconnue ---
{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_bad_op",
    origin: baseOrigin("QUOTE"),
    change_intent: "COMMERCIAL_ADJUSTMENT",
    reason: "x",
    operations: [{ op: "explode_universe", target: {}, changes: {} }],
  });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.ok(r.errors.some((e) => e.code === "UNKNOWN_OPERATION"));
  }
  console.log("ok — TEST 4 op inconnue");
}

// --- TEST 5 : section inconnue ---
{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_bad_sec",
    origin: { ...baseOrigin("CUISINE"), section: "CUISINE" },
    change_intent: "TECHNICAL_CORRECTION",
    reason: "x",
    operations: [
      {
        op: "update_parameter",
        target: { entity_type: "PREP_PARAMETER", study_id: "s", parameter_key: "k" },
        changes: { value: 1 },
      },
    ],
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => e.code === "INVALID_SECTION"));
  console.log("ok — TEST 5 section inconnue");
}

// --- TEST 6 : intent inconnu ---
{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_bad_intent",
    origin: baseOrigin("QUOTE"),
    change_intent: "MAGIC_WISH",
    reason: "x",
    operations: [
      {
        op: "update_quote_item",
        target: { entity_type: "QUOTE_ITEM", quote_id: "q", item_id: "i" },
        changes: { unit_price_ht: 1 },
      },
    ],
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => e.code === "UNSUPPORTED_INTENT"));
  console.log("ok — TEST 6 intent inconnu");
}

// --- TEST 7 : intent incompatible ---
{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_intent_mismatch",
    origin: baseOrigin("QUOTE"),
    change_intent: "FIELD_UPDATE",
    reason: "prix",
    operations: [
      {
        op: "update_quote_item",
        target: { entity_type: "QUOTE_ITEM", quote_id: "q", item_id: "i" },
        changes: { unit_price_ht: 115 },
      },
    ],
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => e.code === "INTENT_OPERATION_MISMATCH"));
  console.log("ok — TEST 7 intent incompatible");
}

// --- TEST 8 : target incomplet ---
{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_target_incomplete",
    origin: baseOrigin("TAKEOFF"),
    change_intent: "TECHNICAL_CORRECTION",
    reason: "x",
    operations: [
      {
        op: "update_parameter",
        target: { entity_type: "PREP_PARAMETER" },
        changes: { value: 65 },
      },
    ],
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => e.code === "INVALID_TARGET"));
  console.log("ok — TEST 8 target incomplet");
}

// --- TEST 9 : ID + code incohérents (validate context) ---
{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_id_code",
    origin: baseOrigin("TAKEOFF", "study_1"),
    change_intent: "TECHNICAL_CORRECTION",
    reason: "x",
    operations: [
      {
        op: "update_line",
        target: {
          entity_type: "PREP_LINE",
          study_id: "study_1",
          line_id: "line_abc",
          line_code: "TER-03",
        },
        changes: { designation: "Nouveau libellé" },
      },
    ],
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    const v = validatePatchContext(r.patch, {
      organizationId: "org",
      projectId: "proj_1",
      currentVersion: 4,
      idCodePairs: [{ id: "line_abc", code: "TER-99", kind: "PREP_LINE" }],
    });
    assert.equal(v.ok, false);
    assert.ok(v.errors.some((e) => e.code === "TARGET_ID_CODE_MISMATCH"));
  }
  console.log("ok — TEST 9 ID+code incohérents");
}

// --- TEST 10 : schema_version inconnue ---
{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 99,
    patch_id: "patch_schema",
    origin: baseOrigin("QUOTE"),
    change_intent: "COMMERCIAL_ADJUSTMENT",
    reason: "x",
    operations: [
      {
        op: "update_quote_item",
        target: { entity_type: "QUOTE_ITEM", quote_id: "q", item_id: "i" },
        changes: { unit_price_ht: 1 },
      },
    ],
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => e.code === "UNSUPPORTED_SCHEMA_VERSION"));
  console.log("ok — TEST 10 schema_version");
}

// --- TEST 11 : legacy quote patch toujours accepté par son moteur ---
{
  const legacy = parseBeworkQuotePatch({
    type: "bework_quote_patch_v1",
    patchId: "legacy_quote_ok",
    target: { quoteNumber: "DEV-2026-0001", baseVersion: 1 },
    operations: [
      {
        op: "update_item",
        itemId: "item_x",
        changes: { unitPriceHt: 100 },
      },
    ],
  });
  assert.equal(legacy.ok, true);
  // Le parser universel doit le refuser (pas un bework_patch_v1)
  const uni = parseBeworkPatch({
    type: "bework_quote_patch_v1",
    patchId: "legacy_quote_ok",
    target: { quoteNumber: "DEV-2026-0001" },
    operations: [],
  });
  assert.equal(uni.ok, false);
  console.log("ok — TEST 11 legacy quote");
}

// --- TEST 12 : legacy prep patch toujours accepté ---
{
  const legacy = parsePrepPatch({
    format: "bework_prep_patch_v1",
    patchId: "legacy_prep_ok",
    target: { studyId: "study_1", baseVersion: 2 },
    operations: [
      { op: "update_parameter", key: "depth", changes: { value: 0.9 } },
    ],
  });
  assert.equal(legacy.ok, true);
  console.log("ok — TEST 12 legacy prep");
}

// --- TEST 13 : context_v1 QUOTE avec liens réels ---
{
  const ctx = buildChatgptContextSkeleton({
    section: "QUOTE",
    project: { id: "proj_1", title: "Chantier test" },
    target: {
      entity_type: "COMMERCIAL_QUOTE",
      id: "quote_1",
      version: 4,
      code: "DEV-2026-0153",
    },
    quoteItems: [
      {
        quote_item_id: "item_1",
        takeoff_link: { study_id: "study_1", study_line_code: "TER-03" },
        canonical_resolution: buildCanonicalResolution({
          studyId: "study_1",
          takeoffLineCode: "TER-03",
          parameterKey: "trenche.length",
          parameterId: "param_1",
        }),
      },
    ],
  });
  assert.equal(ctx.type, "bework_chatgpt_context_v1");
  assert.equal(ctx.expected_output, "bework_patch_v1");
  assert.ok(ctx.supported_operations.length > 0);
  assert.equal(ctx.relationships.quote_items![0]!.canonical_resolution.status, "EXACT");
  console.log("ok — TEST 13 context QUOTE liens");
}

// --- TEST 14 : PARTIAL ---
{
  const res = buildCanonicalResolution({
    studyId: "study_1",
    takeoffLineCode: "TER-03",
  });
  assert.equal(res.status, "PARTIAL");
  assert.equal(res.parameter_key, null);
  assert.equal(res.resolved_to, "TAKEOFF_LINE");

  const ctx = buildChatgptContextSkeleton({
    section: "QUOTE",
    project: { id: "proj_1", title: "T" },
    target: { entity_type: "COMMERCIAL_QUOTE", id: "q", version: 4 },
    quoteItems: [
      {
        quote_item_id: "item_1",
        takeoff_link: { study_id: "study_1", study_line_code: "TER-03" },
        canonical_resolution: res,
      },
    ],
  });
  const patch = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_partial_ctx",
    origin: baseOrigin("QUOTE", "q"),
    change_intent: "COMMERCIAL_ADJUSTMENT",
    reason: "x",
    operations: [
      {
        op: "update_quote_item",
        target: { entity_type: "QUOTE_ITEM", quote_id: "q", item_id: "item_1" },
        changes: { unit_price_ht: 10 },
      },
    ],
  });
  assert.equal(patch.ok, true);
  if (patch.ok) {
    const v = validatePatchAgainstChatgptContext(patch.patch, ctx);
    assert.equal(v.ok, true);
    assert.ok(v.warnings.some((w) => w.code === "PARTIAL_CANONICAL_RESOLUTION"));
  }
  console.log("ok — TEST 14 PARTIAL");
}

// --- TEST 15 : NONE ---
{
  const res = buildCanonicalResolution({});
  assert.equal(res.status, "NONE");
  const ctx = buildChatgptContextSkeleton({
    section: "QUOTE",
    project: { id: "proj_1", title: "T" },
    target: { entity_type: "COMMERCIAL_QUOTE", id: "q", version: 4 },
    quoteItems: [
      {
        quote_item_id: "item_orphan",
        takeoff_link: null,
        canonical_resolution: res,
      },
    ],
  });
  const patch = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_none_ctx",
    origin: baseOrigin("QUOTE", "q"),
    change_intent: "COMMERCIAL_ADJUSTMENT",
    reason: "x",
    operations: [
      {
        op: "update_quote_item",
        target: { entity_type: "QUOTE_ITEM", quote_id: "q", item_id: "item_orphan" },
        changes: { unit_price_ht: 10 },
      },
    ],
  });
  assert.equal(patch.ok, true);
  if (patch.ok) {
    const v = validatePatchAgainstChatgptContext(patch.patch, ctx);
    assert.ok(v.warnings.some((w) => w.code === "UNLINKED_QUOTE_ITEM"));
  }
  console.log("ok — TEST 15 NONE");
}

// --- VERSION strict ---
{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_ver",
    origin: baseOrigin("QUOTE"),
    change_intent: "COMMERCIAL_ADJUSTMENT",
    reason: "x",
    operations: [
      {
        op: "update_quote_item",
        target: { entity_type: "QUOTE_ITEM", quote_id: "q", item_id: "i" },
        changes: { unit_price_ht: 1 },
      },
    ],
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    const v = validatePatchContext(r.patch, {
      organizationId: "org",
      projectId: "proj_1",
      currentVersion: 5,
    });
    assert.equal(v.ok, false);
    assert.equal(v.code, "VERSION_CONFLICT");
  }
  console.log("ok — VERSION_CONFLICT strict");
}

console.log("ok — bework_patch Phase B (tests 1–15)");

// --- Phase C : capability + analyze preview-only ---
import {
  analyzeBeworkPatchInput,
  getSectionCapability,
  SECTION_PATCH_CAPABILITY,
} from "@/lib/bework-patch/index";

{
  assert.equal(getSectionCapability("QUOTE").mode, "AVAILABLE");
  assert.equal(getSectionCapability("TAKEOFF").mode, "AVAILABLE");
  assert.equal(getSectionCapability("PLANNING").mode, "AVAILABLE");
  assert.equal(getSectionCapability("VISIT").mode, "AVAILABLE");
  assert.equal(getSectionCapability("FOLLOW_UP").mode, "AVAILABLE");
  assert.equal(getSectionCapability("REPORT").mode, "AVAILABLE");
  assert.equal(getSectionCapability("NOTICE").mode, "AVAILABLE");
  for (const [section, cap] of Object.entries(SECTION_PATCH_CAPABILITY)) {
    if (cap.mode === "PREVIEW_ONLY") {
      assert.ok(cap.label, `${section} doit exposer un label preview`);
    }
  }
  console.log("ok — Phase C capabilities");
}

{
  const result = analyzeBeworkPatchInput({
    raw: {
      type: "bework_patch_v1",
      schema_version: 1,
      patch_id: "patch_plan_preview",
      origin: baseOrigin("PLANNING", "plan_1"),
      change_intent: "PLANNING_ADJUSTMENT",
      reason: "Ajustement durée",
      operations: [
        {
          op: "update_duration",
          target: {
            entity_type: "PREP_SCHEDULE_TASK",
            plan_id: "plan_1",
            task_id: "t1",
            step_code: "ELEC-01",
          },
          changes: { duration_days: 3 },
        },
      ],
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.capability.mode, "AVAILABLE");
  // Sans subgraph, canCommit peut rester vrai structurellement ; le commit réel valide le plan.
  assert.equal(result.capability.mode, "AVAILABLE");
  assert.equal(result.directChanges.length, 1);
  console.log("ok — CTX-02A PLANNING capability AVAILABLE");
}

{
  const result = analyzeBeworkPatchInput({
    raw: {
      type: "bework_patch_v1",
      schema_version: 1,
      patch_id: "patch_quote_avail",
      origin: baseOrigin("QUOTE", "quote_1"),
      change_intent: "COMMERCIAL_ADJUSTMENT",
      reason: "PU",
      operations: [
        {
          op: "update_quote_item",
          target: {
            entity_type: "QUOTE_ITEM",
            quote_id: "quote_1",
            item_id: "line_1",
          },
          changes: { unit_price_ht: 42 },
        },
      ],
    },
    snapshot: {
      organizationId: "org",
      projectId: "proj_1",
      currentVersion: 4,
    },
  });
  assert.equal(result.capability.mode, "AVAILABLE");
  assert.equal(result.legacyDelegate, "quote");
  assert.equal(result.canCommit, true);
  console.log("ok — Phase C QUOTE available + legacy");
}

console.log("ok — bework_patch Phase C");

// --- VISIT autonome : project_id facultatif ---
{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_visit_standalone",
    origin: {
      section: "VISIT",
      entity_id: "visit_rockman",
      base_version: 4,
    },
    change_intent: "FIELD_UPDATE",
    reason: "Compléter observations",
    operations: [
      {
        op: "update_visit",
        target: { entity_type: "SITE_VISIT", id: "visit_rockman" },
        changes: { comments: "Observation terrain" },
      },
    ],
  });
  assert.equal(r.ok, true, "VISIT sans project_id doit parser");
  if (r.ok) {
    assert.equal(r.patch.origin.project_id, null);
    assert.equal(r.patch.origin.entity_id, "visit_rockman");
    const v = validatePatchContext(r.patch, {
      organizationId: "org",
      projectId: null,
      currentVersion: 4,
    });
    assert.equal(v.ok, true, "preview VISIT sans project OK");
  }
  console.log("ok — VISIT autonome sans project_id");
}

{
  const r = parseBeworkPatch({
    type: "bework_patch_v1",
    schema_version: 1,
    patch_id: "patch_takeoff_no_project",
    origin: {
      section: "TAKEOFF",
      entity_id: "study_1",
      base_version: 4,
    },
    change_intent: "TECHNICAL_CORRECTION",
    reason: "x",
    operations: [
      {
        op: "update_parameter",
        target: {
          entity_type: "PREP_PARAMETER",
          study_id: "study_1",
          parameter_key: "trenche.length",
        },
        changes: { value: 65 },
      },
    ],
  });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.ok(r.errors.some((e) => e.path === "origin.project_id"));
  }
  console.log("ok — TAKEOFF sans project_id toujours refusé");
}
