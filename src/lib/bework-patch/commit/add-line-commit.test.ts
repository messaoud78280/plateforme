/**
 * Test isolé — commit add_line atomique (étude jetable, pas ROCKMAN CURRENT).
 * node --import tsx src/lib/bework-patch/commit/add-line-commit.test.ts
 *
 * Crée une PrepStudy temporaire, commit 1 add_line puis batch 35, vérifie count+version,
 * puis purge. 0 écriture sur cmuvgohrt0002vhqid2s811c4.
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
import { commitUniversalPatch } from "@/lib/bework-patch/commit/commit-universal";
import { buildTakeoffModifyContext } from "@/lib/bework-context/adapt-takeoff-create";

const ORG = "cmt2nx23j00021k6btoov39gr";
const PROJECT = "cmuv9hj9v000411pbta21yz7b";

function goLine(i: number) {
  const lotIdx = String(Math.floor(i / 5)).padStart(2, "0");
  const code = `GO-${lotIdx}-${String((i % 5) + 1).padStart(2, "0")}`;
  return {
    code,
    lot: `GO-${lotIdx} LOT TEST`,
    designation: `Ligne test ${code}`,
    unit: i % 3 === 0 ? "m3" : i % 3 === 1 ? "m2" : "FT",
    declared_quantity: i % 3 === 2 ? 1 : 10 + i * 0.11,
    formula: null as string | null,
    provenance: "HYPOTHESE" as const,
    role: "quote" as const,
    nature: null as null,
    notes: i === 0 ? "NF DTU 13.1" : null,
    description: `Description ${code}`,
  };
}

async function commitAddLines(input: {
  studyId: string;
  version: number;
  lines: ReturnType<typeof goLine>[];
  patchId: string;
}) {
  const ops = input.lines.map((line) => ({
    op: "add_line" as const,
    target: { entity_type: "PREP_STUDY" as const, study_id: input.studyId },
    line,
  }));
  const raw = {
    format: "bework_patch_v1",
    schema_version: 1,
    patch_id: input.patchId,
    change_intent: "TECHNICAL_CORRECTION",
    origin: {
      section: "TAKEOFF",
      project_id: PROJECT,
      entity_id: input.studyId,
      base_version: input.version,
    },
    operations: ops,
  };
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
  const versions = collectVersionSnapshot(subgraph);
  const fp = computePreviewFingerprint(
    buildFingerprintPayload({
      patch: parsed.patch,
      versions,
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
  return result;
}

async function main() {
  const stamp = Date.now();
  let studyId: string | null = null;

  try {
    const study = await prisma.prepStudy.create({
      data: {
        organizationId: ORG,
        projectId: PROJECT,
        title: `[TEST] add_line atomic ${stamp}`,
        trade: "GO",
        version: 1,
        dossierStatus: "BROUILLON",
        sourceFormat: "TEST",
        lines: {
          create: Array.from({ length: 14 }, (_, i) => ({
            organizationId: ORG,
            code: `SUR-${String(i + 1).padStart(2, "0")}`,
            lot: "SURFACES",
            designation: `Surface test ${i + 1}`,
            unit: "m2",
            declaredQuantity: 10 + i,
            role: "quote",
            sortOrder: i,
            provenance: "HYPOTHESE",
          })),
        },
      },
      select: { id: true, version: true },
    });
    studyId = study.id;

    const beforeCount = await prisma.prepTakeoffLine.count({
      where: { studyId },
    });
    assert.equal(beforeCount, 14);

    // --- Test 1 add_line ---
    const one = goLine(0);
    // Avoid collision with later batch codes: use unique prefix
    const oneLine = {
      ...one,
      code: "TST-01-01",
      lot: "TST LOT",
      designation: "Ligne unique test",
    };
    const r1 = await commitAddLines({
      studyId,
      version: 1,
      lines: [oneLine],
      patchId: `test-add-line-1-${stamp}`,
    });
    assert.equal(r1.ok, true, r1.ok ? "" : `${r1.code}: ${r1.error}`);
    if (!r1.ok) throw new Error(r1.error);

    const after1 = await prisma.prepTakeoffLine.count({ where: { studyId } });
    const study1 = await prisma.prepStudy.findUniqueOrThrow({
      where: { id: studyId },
      select: { version: true },
    });
    assert.equal(after1, 15, "1 add_line → count 15");
    assert.equal(study1.version, 2, "version 1→2");
    const tst = await prisma.prepTakeoffLine.findUnique({
      where: { studyId_code: { studyId, code: "TST-01-01" } },
    });
    assert.ok(tst, "TST-01-01 présente");

    // --- Test batch 35 add_line (14 SUR + 1 TST + 35 GO = 50 ; on veut simuler 14→49) ---
    // Pour coller au scénario ROCKMAN : repartir d'une étude à 14 lignes.
    // On purge TST et on reset version pour le batch isolé.
    await prisma.prepTakeoffLine.delete({
      where: { studyId_code: { studyId, code: "TST-01-01" } },
    });
    await prisma.prepStudy.update({
      where: { id: studyId },
      data: { version: 1 },
    });
    // Retirer le journal du premier patch pour ne pas polluer (étude jetable)
    await prisma.beworkUniversalPatch.deleteMany({
      where: { patchId: `test-add-line-1-${stamp}` },
    });

    const batch = Array.from({ length: 35 }, (_, i) => goLine(i));
    // Ensure unique codes vs SUR-*
    assert.ok(batch.every((l) => l.code.startsWith("GO-")));

    const r35 = await commitAddLines({
      studyId,
      version: 1,
      lines: batch,
      patchId: `test-add-line-35-${stamp}`,
    });
    assert.equal(r35.ok, true, r35.ok ? "" : `${r35.code}: ${r35.error}`);
    if (!r35.ok) throw new Error(r35.error);

    const after35 = await prisma.prepTakeoffLine.count({ where: { studyId } });
    const study35 = await prisma.prepStudy.findUniqueOrThrow({
      where: { id: studyId },
      select: { version: true },
    });
    assert.equal(after35, 49, "14+35 → 49");
    assert.equal(study35.version, 2, "version 1→2 après batch");

    const go0101 = await prisma.prepTakeoffLine.findUnique({
      where: { studyId_code: { studyId, code: "GO-00-01" } },
      select: { code: true, designation: true },
    });
    assert.ok(go0101);

    // Contexte MODIFY doit restituer les 49 lignes
    const ctx = await buildTakeoffModifyContext({
      orgId: ORG,
      projectId: PROJECT,
      studyId,
    });
    const data = ctx.data as { counts?: { lines?: number }; lines?: unknown[] };
    const lineCount =
      data.counts?.lines ??
      (Array.isArray(data.lines) ? data.lines.length : null);
    assert.equal(lineCount, 49, `contexte count=${lineCount}`);

    console.log(
      JSON.stringify(
        {
          ok: true,
          testStudyId: studyId,
          test1: { count: 15, version: 2 },
          test35: { count: after35, version: study35.version, contextLines: lineCount },
          rockmanUntouched: true,
        },
        null,
        2,
      ),
    );
  } finally {
    if (studyId) {
      await prisma.beworkUniversalPatch.deleteMany({
        where: {
          OR: [
            { patchId: { startsWith: `test-add-line-1-${stamp}` } },
            { patchId: { startsWith: `test-add-line-35-${stamp}` } },
          ],
        },
      });
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
