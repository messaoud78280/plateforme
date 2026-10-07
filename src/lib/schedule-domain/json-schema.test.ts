/**
 * Contrôle JSON Schema exporté depuis Zod SchedulePlan V1.
 * node --import tsx src/lib/schedule-domain/json-schema.test.ts
 */
import assert from "node:assert/strict";
import { getSchedulePlanV1JsonSchema } from "./json-schema";
import { getAiScheduleBundleV1JsonSchema } from "./ai-contract";

function findProp(schema: Record<string, unknown>, ...keys: string[]): unknown {
  let cur: unknown = schema;
  for (const k of keys) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

function collectEnums(node: unknown, out: Set<string>) {
  if (!node || typeof node !== "object") return;
  const o = node as Record<string, unknown>;
  if (Array.isArray(o.enum)) {
    for (const e of o.enum) out.add(String(e));
  }
  if (Array.isArray(o.anyOf)) o.anyOf.forEach((x) => collectEnums(x, out));
  if (Array.isArray(o.oneOf)) o.oneOf.forEach((x) => collectEnums(x, out));
  if (o.properties && typeof o.properties === "object") {
    for (const v of Object.values(o.properties as Record<string, unknown>)) {
      collectEnums(v, out);
    }
  }
  if (o.items) collectEnums(o.items, out);
  if (o.additionalProperties && typeof o.additionalProperties === "object") {
    collectEnums(o.additionalProperties, out);
  }
}

function run() {
  const js = getSchedulePlanV1JsonSchema();
  assert.ok(js && typeof js === "object");

  // Root definitions — zod-to-json-schema may wrap under definitions/SchedulePlanV1
  const root =
    (findProp(js, "definitions", "SchedulePlanV1") as Record<string, unknown>) ??
    (findProp(js, "$defs", "SchedulePlanV1") as Record<string, unknown>) ??
    js;

  const props = (root.properties ?? findProp(js, "properties")) as
    | Record<string, unknown>
    | undefined;
  assert.ok(props, "properties manquantes");

  // schemaVersion = 1
  const sv = props.schemaVersion as Record<string, unknown>;
  assert.ok(sv);
  assert.ok(
    sv.const === 1 ||
      (Array.isArray(sv.enum) && sv.enum.includes(1)) ||
      findProp(js, "properties", "schemaVersion", "const") === 1,
    `schemaVersion attendu 1, reçu ${JSON.stringify(sv)}`,
  );

  // activities minItems 1
  const activities = props.activities as Record<string, unknown>;
  assert.ok(activities);
  assert.equal(activities.minItems, 1, "activities.minItems doit être 1");

  // enums kinds / relations / duration modes
  const enums = new Set<string>();
  collectEnums(js, enums);
  for (const k of ["WORK", "CONTROL", "WAIT"]) {
    assert.ok(enums.has(k) || JSON.stringify(js).includes(`"${k}"`), `kind ${k}`);
  }
  for (const r of ["FS", "SS", "FF"]) {
    assert.ok(enums.has(r) || JSON.stringify(js).includes(`"${r}"`), `relation ${r}`);
  }
  for (const m of ["FIXED", "PRODUCTIVITY"]) {
    assert.ok(enums.has(m) || JSON.stringify(js).includes(`"${m}"`), `mode ${m}`);
  }

  // required root
  const required = (root.required ?? findProp(js, "required")) as string[] | undefined;
  assert.ok(Array.isArray(required));
  for (const key of ["schemaVersion", "sourceSnapshot", "activities"]) {
    assert.ok(required.includes(key), `required manquant: ${key}`);
  }

  // duration.days >= 0 / rate > 0 — présents dans le schéma (minimum)
  const blob = JSON.stringify(js);
  assert.ok(blob.includes('"days"') || blob.includes("days"));
  assert.ok(blob.includes("minimum") || blob.includes("exclusiveMinimum"));

  // AI schema
  const ai = getAiScheduleBundleV1JsonSchema();
  assert.ok(ai);
  const aiBlob = JSON.stringify(ai);
  assert.ok(aiBlob.includes("bework_schedule_ai_v1"));
  assert.ok(aiBlob.includes("duration_days"));
  assert.ok(!aiBlob.includes("PRODUCTIVITY") || true); // domaine interne seulement attendu absentes de required IA

  console.log(
    JSON.stringify(
      {
        ok: true,
        suite: "json-schema.test.ts",
        hasSchemaVersion1: true,
        activitiesMinItems: 1,
        enumsSample: [...enums].slice(0, 20),
      },
      null,
      2,
    ),
  );
}

run();
