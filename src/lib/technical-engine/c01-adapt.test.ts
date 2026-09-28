import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { adaptPrepBundleToTechnical } from "@/lib/technical-engine/adapt-prep";
import { parseTechnicalBundle } from "@/lib/technical-engine/parse";
import { technicalToNormalizedPrep } from "@/lib/technical-engine/normalize-to-prep";

const raw = JSON.parse(
  readFileSync(
    resolve("docs/preparation/exemples/c01-fondations.prep.json"),
    "utf8",
  ),
);
const tech = adaptPrepBundleToTechnical(raw);
assert.equal(tech.format, "bework_technical_bundle_v1");
assert.ok(tech.takeoff.items.length >= 20, `items=${tech.takeoff.items.length}`);
const start = tech.planning_settings?.start_date ?? null;
if (start) assert.notEqual(start, "1970-01-01");

const parsed = parseTechnicalBundle(tech);
assert.equal(parsed.ok, true);
if (!parsed.ok) throw new Error("parse fail");
const norm = technicalToNormalizedPrep(parsed.bundle);
assert.ok(norm.prep, JSON.stringify(norm.prepIssues.filter((i) => i.severity === "error")));
assert.ok((norm.prep!.lines.length ?? 0) >= 20);
assert.equal(norm.prep!.sourceFormat, "bework_technical_bundle_v1");
console.log(
  "ok — C-01 adapt",
  tech.takeoff.items.length,
  "postes, start=",
  start ?? "null",
);
