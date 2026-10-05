/**
 * Test isolé — batch atomique delete_line + update_line + add_line (étude jetable, pas ROCKMAN).
 * node --import tsx src/lib/bework-patch/commit/delete-line-commit.test.ts
 *
 * 0 écriture sur cmuvgohrt0002vhqid2s811c4.
 */
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { parseBeworkPatch } from "@/lib/bework-patch/parse";
import { analyzePatchImpact } from "@/lib/bework-patch/impact/analyze-impact";
import { loadImpactSubgraph } from "@/lib/bework-patch/impact/load-subgraph";
import {
  buildFingerprintPayload,
  collectVersionSnapshot,
  computePreviewFingerprint,
} from "@/lib/bework-patch/commit/fingerprint";
import { evaluateCommitEligibility } from "@/lib/bework-patch/commit/eligibility";
import { commitUniversalPatch } from "@/lib/bework-patch/commit/commit-universal";

const ORG = "cmt2nx23j00021k6btoov39gr";
const PROJECT = "cmuv9hj9v000411pbta21yz7b";
const ROCKMAN_STUDY = "cmuvgohrt0002vhqid2s811c4";

async function previewAndCommit(raw: Record<string, unknown>) {
  const parsed = parseBeworkPatch(raw);
  assert.equal(parsed.ok, true, JSON.stringify(parsed.ok ? null : parsed.errors));
  if (!parsed.ok) throw new Error("parse failed");

  const subgraph = await loadImpactSubgraph({
    orgId: ORG,
    projectId: PROJECT,
    patch: parsed.patch,
  });
  const impact = analyzePatchImpact({ patch: parsed.patch, subgraph });
  assert.equal(impact.errors.length, 0, JSON.stringify(impact.errors));
  const deletes = impact.directChanges.filter((c) => c.op === "delete_line");
  assert.ok(deletes.length > 0, "delete_line présent en changement direct");

  const eligibility = evaluateCommitEligibility({ patch: parsed.patch, impact });
  assert.equal(eligibility.ok, true, JSON.stringify(eligibility));

  const fp = computePreviewFingerprint(
    buildFingerprintPayload({
      patch: parsed.patch,
      versions: collectVersionSnapshot(subgraph),
      impact,
      subgraph,
    }),
  );
  const result = await commitUniversalPatch({
    orgId: ORG,
    projectId: PROJECT,
    userId: null,
    raw,
    previewFingerprint: fp,
  });
  return { eligibility, deletes: deletes.length, result };
}

function batchPatch(input: {
  patchId: string;
  intent: string;
  studyId: string;
  version: number;
  operations: unknown[];
}) {
  return {
    format: "bework_patch_v1",
    schema_version: 1,
    patch_id: input.patchId,
    change_intent: input.intent,
    origin: {
      section: "TAKEOFF",
      project_id: PROJECT,
      entity_id: input.studyId,
      base_version: input.version,
    },
    operations: input.operations,
  };
}

async function snapshot(studyId: string) {
  const study = await prisma.prepStudy.findUniqueOrThrow({
    where: { id: studyId },
    select: { version: true, lines: { select: { id: true, code: true, designation: true } } },
  });
  return {
    version: study.version,
    codes: study.lines.map((l) => l.code).sort(),
    byCode: new Map(study.lines.map((l) => [l.code, l])),
  };
}

async function main() {
  const stamp = Date.now();
  const patchPrefix = `test-delete-line-${stamp}`;
  let studyId: string | null = null;

  const rockmanBefore = await prisma.prepStudy.findUnique({
    where: { id: ROCKMAN_STUDY },
    select: { version: true, _count: { select: { lines: true } } },
  });

  try {
    const study = await prisma.prepStudy.create({
      data: {
        organizationId: ORG,
        projectId: PROJECT,
        title: `[TEST] delete_line atomic ${stamp}`,
        trade: "GO",
        version: 1,
        dossierStatus: "BROUILLON",
        sourceFormat: "TEST",
        lines: {
          create: Array.from({ length: 8 }, (_, i) => ({
            organizationId: ORG,
            code: `L-${String(i + 1).padStart(2, "0")}`,
            lot: "GO-01 TEST",
            designation: `Ligne test ${i + 1}`,
            unit: "m2",
            declaredQuantity: 10 + i,
            role: "quote",
            sortOrder: i,
            provenance: "HYPOTHESE",
          })),
        },
      },
      select: { id: true },
    });
    studyId = study.id;
    const s0 = await snapshot(studyId);
    const id = (code: string) => s0.byCode.get(code)!.id;

    // --- 1. FIELD_UPDATE : delete (line_id+line_code) + delete (line_id seul) + update + add ---
    const r1 = await previewAndCommit(
      batchPatch({
        patchId: `${patchPrefix}-field`,
        intent: "FIELD_UPDATE",
        studyId,
        version: 1,
        operations: [
          {
            op: "delete_line",
            target: { entity_type: "PREP_LINE", study_id: studyId, line_id: id("L-01"), line_code: "L-01" },
          },
          {
            op: "delete_line",
            target: { entity_type: "PREP_LINE", study_id: studyId, line_id: id("L-02") },
          },
          {
            op: "update_line",
            target: { entity_type: "PREP_LINE", study_id: studyId, line_id: id("L-03"), line_code: "L-03" },
            changes: { designation: "Ligne test 3 — reformulée" },
          },
          {
            op: "add_line",
            target: { entity_type: "PREP_STUDY", study_id: studyId },
            line: {
              code: "NEW-01",
              lot: "GO-01 TEST",
              designation: "Ligne ajoutée test",
              unit: "m3",
              declared_quantity: 2.5,
              provenance: "HYPOTHESE",
              role: "quote",
            },
          },
        ],
      }),
    );
    assert.equal(r1.eligibility.ok && r1.eligibility.mode, "FULL_SYNC");
    assert.equal(r1.deletes, 2);
    assert.equal(r1.result.ok, true, r1.result.ok ? "" : `${r1.result.code}: ${r1.result.error}`);
    const s1 = await snapshot(studyId);
    assert.equal(s1.version, 2, "version +1 une seule fois");
    assert.deepEqual(
      s1.codes,
      ["L-03", "L-04", "L-05", "L-06", "L-07", "L-08", "NEW-01"],
    );
    assert.equal(s1.byCode.get("L-03")!.designation, "Ligne test 3 — reformulée");

    // --- 2. TECHNICAL_CORRECTION : même batch, ciblage par line_code seul ---
    const r2 = await previewAndCommit(
      batchPatch({
        patchId: `${patchPrefix}-tech`,
        intent: "TECHNICAL_CORRECTION",
        studyId,
        version: 2,
        operations: [
          { op: "delete_line", target: { entity_type: "PREP_LINE", study_id: studyId, line_code: "L-04" } },
          {
            op: "update_line",
            target: { entity_type: "PREP_LINE", study_id: studyId, line_code: "L-05" },
            changes: { notes: "À vérifier sur plan" },
          },
          {
            op: "add_line",
            target: { entity_type: "PREP_STUDY", study_id: studyId },
            line: { code: "NEW-02", lot: "GO-01 TEST", designation: "Ajout 2", unit: "FT", declared_quantity: 1 },
          },
        ],
      }),
    );
    assert.equal(r2.result.ok, true, r2.result.ok ? "" : `${r2.result.code}: ${r2.result.error}`);
    const s2 = await snapshot(studyId);
    assert.equal(s2.version, 3);
    assert.deepEqual(s2.codes, ["L-03", "L-05", "L-06", "L-07", "L-08", "NEW-01", "NEW-02"]);

    // --- 3. Rollback : update_line sur une ligne supprimée dans le même batch → 0 écriture ---
    const r3 = await previewAndCommit(
      batchPatch({
        patchId: `${patchPrefix}-rollback`,
        intent: "FIELD_UPDATE",
        studyId,
        version: 3,
        operations: [
          { op: "delete_line", target: { entity_type: "PREP_LINE", study_id: studyId, line_id: s2.byCode.get("L-06")!.id } },
          {
            op: "add_line",
            target: { entity_type: "PREP_STUDY", study_id: studyId },
            line: { code: "NEW-03", lot: "GO-01 TEST", designation: "Ajout 3", unit: "FT", declared_quantity: 1 },
          },
          {
            op: "update_line",
            target: { entity_type: "PREP_LINE", study_id: studyId, line_code: "L-06" },
            changes: { designation: "Ne doit pas passer" },
          },
        ],
      }),
    );
    assert.equal(r3.result.ok, false, "commit doit échouer");
    const s3 = await snapshot(studyId);
    assert.equal(s3.version, 3, "version inchangée après rollback");
    assert.deepEqual(s3.codes, s2.codes, "aucune ligne supprimée/ajoutée après rollback");
    const journal = await prisma.beworkUniversalPatch.count({
      where: { patchId: `${patchPrefix}-rollback` },
    });
    assert.equal(journal, 0, "aucun journal pour le patch rollback");

    const rockmanAfter = await prisma.prepStudy.findUnique({
      where: { id: ROCKMAN_STUDY },
      select: { version: true, _count: { select: { lines: true } } },
    });
    assert.deepEqual(rockmanAfter, rockmanBefore, "ROCKMAN inchangé");

    console.log(
      JSON.stringify(
        {
          ok: true,
          fieldUpdate: { mode: r1.eligibility.ok ? r1.eligibility.mode : null, version: s1.version, lines: s1.codes.length },
          technicalCorrection: { version: s2.version, lines: s2.codes.length },
          rollback: {
            code: r3.result.ok ? null : r3.result.code,
            error: r3.result.ok ? null : r3.result.error,
            version: s3.version,
          },
          rockman: rockmanAfter,
        },
        null,
        2,
      ),
    );
  } finally {
    if (studyId) {
      await prisma.beworkUniversalPatch.deleteMany({ where: { patchId: { startsWith: patchPrefix } } });
      await prisma.prepTakeoffLine.deleteMany({ where: { studyId } });
      await prisma.prepStudyEvent.deleteMany({ where: { studyId } }).catch(() => {});
      await prisma.prepStudy.delete({ where: { id: studyId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
