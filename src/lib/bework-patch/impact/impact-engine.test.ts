/**
 * Tests Impact Engine Phase D — lecture seule.
 * npx tsx src/lib/bework-patch/impact/impact-engine.test.ts
 */
import assert from "node:assert/strict";
import { analyzePatchImpact } from "@/lib/bework-patch/impact/analyze-impact";
import {
  buildFixtureSubgraph54,
  buildPatch54to65,
  buildPatchPlanningDuration1to2,
  buildPatchPu120to115,
  buildPatchQuoteTechnicalPartial,
  FIXTURE_QUOTE_LINE_ID,
} from "@/lib/bework-patch/impact/fixtures";
import { emptySubgraph } from "@/lib/bework-patch/impact/types";

function approx(a: number, b: number, eps = 0.02) {
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b}`);
}

// --- TEST 54 → 65 ---
{
  const subgraph = buildFixtureSubgraph54();
  const beforeSnap = JSON.stringify(subgraph);
  const impact = analyzePatchImpact({
    patch: buildPatch54to65(),
    subgraph,
  });
  const afterSnap = JSON.stringify(subgraph);
  assert.equal(beforeSnap, afterSnap, "aucune mutation du sous-graphe");

  const direct = impact.directChanges.find((d) => d.field === "value");
  assert.ok(direct);
  assert.equal(direct!.before, 54);
  assert.equal(direct!.after, 65);
  assert.equal(direct!.unit, "ml");

  assert.equal(impact.canonicalResolution.status, "EXACT");

  const vol = impact.derivedChanges.find(
    (d) => d.section === "TAKEOFF" && d.field === "quantity",
  );
  assert.ok(vol);
  approx(vol!.before as number, 25.92);
  approx(vol!.after as number, 31.2);
  assert.equal(vol!.certainty, "CERTAIN");

  const qQty = impact.derivedChanges.find(
    (d) =>
      d.section === "QUOTE" &&
      d.field === "quantity" &&
      d.entityId === FIXTURE_QUOTE_LINE_ID,
  );
  assert.ok(qQty);
  approx(qQty!.after as number, 31.2);
  assert.equal(qQty!.blocked, undefined);

  const planQty = impact.derivedChanges.find(
    (d) => d.section === "PLANNING" && d.field === "quantity_snapshot",
  );
  assert.ok(planQty);
  approx(planQty!.after as number, 31.2);

  const planDur = impact.derivedChanges.find(
    (d) => d.section === "PLANNING" && d.field === "duration_days",
  );
  assert.ok(planDur);
  assert.ok((planDur!.after as number) > (planDur!.before as number));

  assert.ok(impact.impactSummary.affectedSections.includes("TAKEOFF"));
  assert.ok(impact.impactSummary.affectedSections.includes("QUOTE"));
  assert.ok(impact.impactSummary.affectedSections.includes("PLANNING"));
  assert.equal(impact.impactSummary.simulationOnly, true);
  assert.equal(impact.impactSummary.canPropagate, false);

  console.log("ok — TEST 54→65", {
    volume: `${vol!.before} → ${vol!.after}`,
    quoteQty: qQty!.after,
    taskDuration: `${planDur!.before} → ${planDur!.after}`,
  });
}

// --- TEST PU 120 → 115 (commercial) ---
{
  const impact = analyzePatchImpact({
    patch: buildPatchPu120to115(),
    subgraph: buildFixtureSubgraph54(),
  });
  assert.deepEqual(impact.impactSummary.affectedSections, ["QUOTE"]);
  assert.ok(
    impact.derivedChanges.every((d) => d.section === "QUOTE"),
    "pas d’impact TAKEOFF/PLANNING",
  );
  const pu = impact.derivedChanges.find((d) => d.field === "unit_price_ht");
  assert.ok(pu);
  assert.equal(pu!.before, 120);
  assert.equal(pu!.after, 115);
  console.log("ok — TEST PU 120→115 QUOTE only");
}

// --- TEST OVERRIDE ---
{
  const impact = analyzePatchImpact({
    patch: buildPatch54to65(),
    subgraph: buildFixtureSubgraph54({
      quoteQtyOverride: 32,
      quantityAtTransfer: 31.2,
    }),
  });
  assert.ok(impact.overrides.some((o) => o.kind === "LIKELY_OVERRIDE"));
  const blocked = impact.derivedChanges.find(
    (d) =>
      d.section === "QUOTE" &&
      d.field === "quantity" &&
      d.quoteLinkClass === "LIKELY_OVERRIDE",
  );
  assert.ok(blocked);
  assert.equal(blocked!.blocked, true);
  assert.equal(blocked!.after, 32);
  console.log("ok — TEST LIKELY_OVERRIDE (pas de resync 32→31,20)");
}

// --- TEST ACCEPTED ---
{
  const impact = analyzePatchImpact({
    patch: buildPatch54to65(),
    subgraph: buildFixtureSubgraph54({ quoteStatus: "ACCEPTED" }),
  });
  const vol = impact.derivedChanges.find(
    (d) => d.section === "TAKEOFF" && d.field === "quantity",
  );
  assert.ok(vol);
  approx(vol!.after as number, 31.2);
  assert.ok(impact.protectedEntities.some((p) => p.reason.includes("accepté")));
  const q = impact.derivedChanges.find(
    (d) => d.section === "QUOTE" && d.quoteLinkClass === "PROTECTED",
  );
  assert.ok(q);
  assert.equal(q!.blocked, true);
  console.log("ok — TEST ACCEPTED protected + takeoff/planning simulés");
}

// --- TEST PLANNING duration ---
{
  const impact = analyzePatchImpact({
    patch: buildPatchPlanningDuration1to2(),
    subgraph: buildFixtureSubgraph54(),
  });
  assert.deepEqual(impact.impactSummary.affectedSections, ["PLANNING"]);
  const dur = impact.derivedChanges.find((d) => d.field === "duration_days");
  assert.ok(dur);
  assert.equal(dur!.before, 1.5);
  assert.equal(dur!.after, 2);
  assert.ok(!impact.derivedChanges.some((d) => d.section === "TAKEOFF"));
  assert.ok(!impact.derivedChanges.some((d) => d.section === "QUOTE"));
  console.log("ok — TEST PLANNING 1,5→2 j (TAKEOFF/QUOTE inchangés)");
}

// --- TEST PARTIAL from quote ---
{
  const impact = analyzePatchImpact({
    patch: buildPatchQuoteTechnicalPartial(),
    subgraph: buildFixtureSubgraph54(),
  });
  assert.equal(impact.canonicalResolution.status, "PARTIAL");
  assert.ok(
    impact.warnings.some((w) => w.code === "PARTIAL_CANONICAL_RESOLUTION"),
  );
  console.log("ok — TEST PARTIAL (ligne métré, pas de paramètre inventé)");
}

// --- TEST NONE (pas de lien) ---
{
  const g = buildFixtureSubgraph54();
  g.quoteLinks = [];
  const impact = analyzePatchImpact({
    patch: buildPatchQuoteTechnicalPartial(),
    subgraph: g,
  });
  assert.equal(impact.canonicalResolution.status, "NONE");
  assert.ok(impact.warnings.some((w) => w.code === "NONE_CANONICAL"));
  console.log("ok — TEST NONE (pas de PrepQuoteLink)");
}

// --- empty subgraph safety ---
{
  const impact = analyzePatchImpact({
    patch: buildPatch54to65(),
    subgraph: emptySubgraph("p"),
  });
  assert.ok(impact.errors.some((e) => e.code === "STUDY_MISSING"));
  console.log("ok — STUDY_MISSING");
}

console.log("ok — Impact Engine Phase D (tous tests)");
