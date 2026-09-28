import assert from "node:assert/strict";
import { parseTechnicalBundle } from "@/lib/technical-engine/parse";
import { technicalToPrepBundleJson, technicalToNormalizedPrep } from "@/lib/technical-engine/normalize-to-prep";
import { adaptPrepBundleToTechnical } from "@/lib/technical-engine/adapt-prep";
import {
  GENERIC_PAINT_TECHNICAL_BUNDLE,
  MOREL_TERRASSEMENT_TECHNICAL_BUNDLE,
} from "@/lib/technical-engine/fixtures";
import { computeSchedule } from "@/lib/preparation/schedule/compute";
import {
  parsePrepResources,
  parsePrepSchedule,
  parsePrepWorkflowSteps,
} from "@/lib/preparation/schedule/parse";
import { computeStudy } from "@/lib/preparation/engine/compute";
import { normalizeCivilStartDate } from "@/lib/preparation/schedule/calendar";

// --- Parser générique (métier inconnu) ---
const paint = parseTechnicalBundle(GENERIC_PAINT_TECHNICAL_BUNDLE);
assert.equal(paint.ok, true);
if (!paint.ok) throw new Error("paint parse failed");
assert.equal(paint.bundle.planning_settings?.start_date, null);
assert.ok(paint.bundle.assumptions?.length);
assert.ok(paint.bundle.unknowns?.length);

const paintPrep = technicalToNormalizedPrep(paint.bundle);
assert.ok(paintPrep.prep, "normalisation peinture");
assert.equal(paintPrep.prep!.sourceFormat, "bework_technical_bundle_v1");
assert.ok(paintPrep.prep!.lines.length >= 2);

const paintEngine = computeStudy({
  params: paintPrep.prep!.parameters,
  lines: paintPrep.prep!.lines,
});
const pei01 = paintEngine.nodes.get("PEI-01");
assert.ok(pei01?.value != null && pei01.value > 40, `PEI-01 surface murs ≈ ${pei01?.value}`);

// --- MOREL : hypothèses fouilles ---
const morel = parseTechnicalBundle(MOREL_TERRASSEMENT_TECHNICAL_BUNDLE);
assert.equal(morel.ok, true);
if (!morel.ok) throw new Error("morel parse failed");

const fouilleHyp = morel.bundle.takeoff.parameters.filter((p) =>
  p.key === "fouille.largeur" || p.key === "fouille.profondeur",
);
assert.equal(fouilleHyp.length, 2);
assert.ok(fouilleHyp.every((p) => p.provenance?.classification === "ASSUMED"));

const ter03 = morel.bundle.takeoff.items.find((i) => i.code === "TER-03");
assert.ok(ter03);
assert.equal(ter03!.provenance?.confidence, "to_confirm");
assert.ok(ter03!.assumptions?.includes("H-FOUILLE"));
assert.ok(
  ter03!.warnings?.some((w) => /HYPOTHÈSE/i.test(w)),
  "warning hypothèse fouilles",
);

const morelPrep = technicalToNormalizedPrep(morel.bundle);
assert.ok(morelPrep.prep);
const morelEngine = computeStudy({
  params: morelPrep.prep!.parameters,
  lines: morelPrep.prep!.lines,
});
const emprise = morelEngine.nodes.get("TER-01");
assert.equal(emprise?.value, 120);
const volumeDec = morelEngine.nodes.get("TER-04");
assert.equal(volumeDec?.value, 45);
const fouilles = morelEngine.nodes.get("TER-03");
assert.ok(
  fouilles?.value != null && Math.abs(fouilles.value - 25.92) < 0.01,
  `TER-03 = ${fouilles?.value}`,
);

// Schedule relatif sans date civile
const wf = parsePrepWorkflowSteps(morelPrep.prep!.workflow);
const sch = parsePrepSchedule(morelPrep.prep!.schedule);
assert.ok(sch);
assert.equal(sch!.start_date, null);
const sched = computeSchedule({
  workflowSteps: wf,
  schedule: sch!,
  resources: parsePrepResources(morelPrep.prep!.resources),
  qtyOf: (c) => morelEngine.nodes.get(c)?.value ?? null,
});
assert.equal(sched.startDate, null);
assert.ok(sched.placed.every((t) => t.startDate == null));
assert.ok(sched.baseDurationWorkingDays != null && sched.baseDurationWorkingDays > 0);

// start_date 1970 rejetée
const bad = parseTechnicalBundle({
  ...MOREL_TERRASSEMENT_TECHNICAL_BUNDLE,
  planning_settings: {
    ...MOREL_TERRASSEMENT_TECHNICAL_BUNDLE.planning_settings,
    start_date: "1970-01-01",
  },
});
assert.equal(bad.ok, true);
if (bad.ok) {
  assert.equal(bad.bundle.planning_settings?.start_date, null);
}

assert.equal(normalizeCivilStartDate("1970-01-01"), null);

// --- Adapter prep → technical → prep ---
const prepJson = technicalToPrepBundleJson(morel.bundle);
const adapted = adaptPrepBundleToTechnical(prepJson);
assert.equal(adapted.format, "bework_technical_bundle_v1");
const adaptedParsed = parseTechnicalBundle(adapted);
assert.equal(adaptedParsed.ok, true);

// create_quote forcé false
const withQuote = parseTechnicalBundle({
  ...GENERIC_PAINT_TECHNICAL_BUNDLE,
  quote_transfer: { create_quote: true },
});
assert.equal(withQuote.ok, true);
if (withQuote.ok) {
  assert.equal(withQuote.bundle.quote_transfer?.create_quote, false);
}

console.log("ok — technical-engine phases B/C/D/F (parse, normalize, morel, paint, adapt)");
