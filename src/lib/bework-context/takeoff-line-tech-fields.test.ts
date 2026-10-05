/**
 * Fixture — description / notes / nature persistés + restitués dans le contexte.
 * Étude jetable (pas ROCKMAN CURRENT).
 * node --import tsx src/lib/bework-context/takeoff-line-tech-fields.test.ts
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

async function main() {
  const stamp = Date.now();
  let studyId: string | null = null;
  try {
    const study = await prisma.prepStudy.create({
      data: {
        organizationId: ORG,
        projectId: PROJECT,
        title: `[TEST] tech fields CCTP ${stamp}`,
        trade: "GO",
        version: 1,
        dossierStatus: "PRO_A_VALIDER",
        sourceFormat: "TEST",
        lines: {
          create: [
            {
              organizationId: ORG,
              code: "BASE-01",
              lot: "BASE",
              designation: "Ligne de base",
              unit: "u",
              declaredQuantity: 1,
              role: "quote",
              sortOrder: 0,
              provenance: "HYPOTHESE",
            },
          ],
        },
      },
      select: { id: true, version: true },
    });
    studyId = study.id;

    const raw = {
      format: "bework_patch_v1",
      schema_version: 1,
      patch_id: `test-tech-fields-${stamp}`,
      change_intent: "TECHNICAL_CORRECTION",
      origin: {
        section: "TAKEOFF",
        project_id: PROJECT,
        entity_id: studyId,
        base_version: 1,
      },
      operations: [
        {
          op: "add_line",
          target: { entity_type: "PREP_STUDY", study_id: studyId },
          line: {
            code: "TST-TECH-01",
            lot: "TST",
            designation: "Ligne technique CCTP",
            unit: "m3",
            declared_quantity: 2.5,
            description: "Description technique test",
            notes: "RÉFÉRENCE : NF DTU TEST",
            nature: "en_place",
            provenance: "HYPOTHESE",
            role: "quote",
          },
        },
      ],
    };

    const parsed = parseBeworkPatch(raw);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) throw new Error("parse");

    const subgraph = await loadImpactSubgraph({
      orgId: ORG,
      projectId: PROJECT,
      patch: parsed.patch,
    });
    const impact = analyzePatchImpact({ patch: parsed.patch, subgraph });
    const fp = computePreviewFingerprint(
      buildFingerprintPayload({
        patch: parsed.patch,
        versions: collectVersionSnapshot(subgraph),
        impact,
        subgraph,
      }),
    );

    const commit = await commitUniversalPatch({
      orgId: ORG,
      projectId: PROJECT,
      userId: null,
      raw,
      previewFingerprint: fp,
    });
    assert.equal(commit.ok, true, commit.ok ? "" : `${commit.code}: ${commit.error}`);

    const db = await prisma.prepTakeoffLine.findUniqueOrThrow({
      where: { studyId_code: { studyId, code: "TST-TECH-01" } },
      select: { description: true, notes: true, nature: true },
    });
    assert.equal(db.description, "Description technique test");
    assert.equal(db.notes, "RÉFÉRENCE : NF DTU TEST");
    assert.equal(db.nature, "en_place");

    const ctx = await buildTakeoffModifyContext({
      orgId: ORG,
      projectId: PROJECT,
      studyId,
    });
    const lines = (
      ctx.data as {
        lines?: Array<{
          code: string;
          description: string | null;
          notes: string | null;
          nature: string | null;
        }>;
      }
    ).lines;
    assert.ok(Array.isArray(lines));
    const line = lines!.find((l) => l.code === "TST-TECH-01");
    assert.ok(line, "ligne absente du contexte");
    assert.equal(line!.description, "Description technique test");
    assert.equal(line!.notes, "RÉFÉRENCE : NF DTU TEST");
    assert.equal(line!.nature, "en_place");
    assert.ok(line!.notes?.includes("NF DTU"));

    // ROCKMAN lecture seule — vérifier exposition contexte sans écriture
    const rockman = await buildTakeoffModifyContext({
      orgId: ORG,
      projectId: PROJECT,
      studyId: "cmuvgohrt0002vhqid2s811c4",
    });
    const rLines = (
      rockman.data as {
        lines?: Array<{
          code: string;
          description: string | null;
          notes: string | null;
          nature: string | null;
        }>;
      }
    ).lines;
    const go = rLines?.find((l) => l.code === "GO-01-01");
    assert.ok(go?.description?.includes("Terrassement"));
    assert.ok(go?.notes?.includes("NF DTU 13.1"));
    assert.equal(go?.nature, "en_place");

    console.log(
      JSON.stringify(
        {
          ok: true,
          fixture: { db, context: line },
          rockmanGo0101: go,
          rockmanWrites: 0,
        },
        null,
        2,
      ),
    );
  } finally {
    if (studyId) {
      await prisma.beworkUniversalPatch.deleteMany({
        where: { patchId: { startsWith: `test-tech-fields-${stamp}` } },
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
