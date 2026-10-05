/**
 * Fiche technique PrepTakeoffLine via bework_patch_v1 — add_line / update_line.
 * Étude jetable (pas ROCKMAN).
 * node --import tsx src/lib/bework-patch/tech-sheet-commit.test.ts
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

const SHEET = {
  included_services: [
    "Réglage du fond de fouille",
    "Mise en œuvre du béton",
  ],
  technical_references: [
    {
      label: "NF DTU TEST",
      kind: "INDICATIVE" as const,
      note: "Référence de test",
    },
  ],
  execution_notes: "Note exécution test",
  quality_controls: ["Contrôle niveau", "Contrôle géométrie"],
  technical_reservations: ["Dimension à confirmer"],
};

async function commitRaw(raw: unknown, previewFingerprint: string) {
  return commitUniversalPatch({
    orgId: ORG,
    projectId: PROJECT,
    userId: null,
    raw,
    previewFingerprint,
  });
}

async function fingerprintFor(raw: unknown) {
  const parsed = parseBeworkPatch(raw);
  assert.equal(parsed.ok, true, JSON.stringify(parsed.ok ? null : parsed.errors));
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
  return { parsed, impact, fp };
}

async function main() {
  const stamp = Date.now();
  let studyId: string | null = null;

  try {
    // --- kind invalide : rejet parse, 0 écriture ---
    {
      const bad = {
        format: "bework_patch_v1",
        schema_version: 1,
        patch_id: `test-tech-bad-kind-${stamp}`,
        change_intent: "TECHNICAL_CORRECTION",
        origin: {
          section: "TAKEOFF",
          project_id: PROJECT,
          entity_id: "x",
          base_version: 1,
        },
        operations: [
          {
            op: "add_line",
            target: { entity_type: "PREP_STUDY", study_id: "x" },
            line: {
              code: "BAD-01",
              lot: "T",
              designation: "Bad",
              unit: "u",
              declared_quantity: 1,
              technical_references: [
                { label: "X", kind: "MANDATORY", note: null },
              ],
            },
          },
        ],
      };
      const parsed = parseBeworkPatch(bad);
      assert.equal(parsed.ok, false);
      if (!parsed.ok) {
        assert.ok(
          parsed.errors.some((e) => /kind|MANDATORY|INDICATIVE/i.test(e.message)),
        );
      }
      console.log("ok — kind invalide rejeté");
    }

    // --- 4 kinds valides parse ---
    {
      const kinds = ["INDICATIVE", "DOSSIER", "TO_VERIFY", "PHOTO"] as const;
      const raw = {
        format: "bework_patch_v1",
        schema_version: 1,
        patch_id: `test-tech-4kinds-${stamp}`,
        change_intent: "TECHNICAL_CORRECTION",
        origin: {
          section: "TAKEOFF",
          project_id: PROJECT,
          entity_id: "x",
          base_version: 1,
        },
        operations: [
          {
            op: "add_line",
            target: { entity_type: "PREP_STUDY", study_id: "x" },
            line: {
              code: "KINDS-01",
              lot: "T",
              designation: "Kinds",
              unit: "u",
              declared_quantity: 1,
              technical_references: kinds.map((kind) => ({
                label: `Ref ${kind}`,
                kind,
                note: null,
              })),
            },
          },
        ],
      };
      const parsed = parseBeworkPatch(raw);
      assert.equal(parsed.ok, true);
      if (parsed.ok && parsed.patch.operations[0]?.op === "add_line") {
        assert.equal(
          parsed.patch.operations[0].line.technical_references?.length,
          4,
        );
      }
      console.log("ok — 4 kinds INDICATIVE/DOSSIER/TO_VERIFY/PHOTO");
    }

    const study = await prisma.prepStudy.create({
      data: {
        organizationId: ORG,
        projectId: PROJECT,
        title: `[TEST] tech sheet fiche ${stamp}`,
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
              designation: "Ligne base vide tech",
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

    // --- rétrocompat add_line sans fiche ---
    {
      const raw = {
        format: "bework_patch_v1",
        schema_version: 1,
        patch_id: `test-tech-retro-${stamp}`,
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
              code: "RETRO-01",
              lot: "R",
              designation: "Ancien format",
              unit: "m2",
              declared_quantity: 3,
              provenance: "HYPOTHESE",
              role: "quote",
            },
          },
        ],
      };
      const { fp } = await fingerprintFor(raw);
      const r = await commitRaw(raw, fp);
      assert.equal(r.ok, true, r.ok ? "" : `${r.code}: ${r.error}`);
      const row = await prisma.prepTakeoffLine.findUniqueOrThrow({
        where: { studyId_code: { studyId, code: "RETRO-01" } },
      });
      assert.equal(row.includedServicesJson, null);
      console.log("ok — rétrocompat add_line sans fiche");
    }

    const v2 = (
      await prisma.prepStudy.findUniqueOrThrow({
        where: { id: studyId },
        select: { version: true },
      })
    ).version;

    // --- add_line complet avec fiche ---
    {
      const raw = {
        format: "bework_patch_v1",
        schema_version: 1,
        patch_id: `test-tech-add-${stamp}`,
        change_intent: "TECHNICAL_CORRECTION",
        origin: {
          section: "TAKEOFF",
          project_id: PROJECT,
          entity_id: studyId,
          base_version: v2,
        },
        operations: [
          {
            op: "add_line",
            target: { entity_type: "PREP_STUDY", study_id: studyId },
            line: {
              code: "TST-SHEET-01",
              lot: "TST",
              designation: "Béton de propreté test",
              description: "Description technique test",
              unit: "m3",
              declared_quantity: 1.48,
              provenance: "HYPOTHESE",
              role: "quote",
              nature: "en_place",
              ...SHEET,
            },
          },
        ],
      };
      const { fp, impact } = await fingerprintFor(raw);
      const after = impact.directChanges[0]?.after as Record<string, unknown>;
      assert.deepEqual(after.included_services, SHEET.included_services);
      const r = await commitRaw(raw, fp);
      assert.equal(r.ok, true, r.ok ? "" : `${r.code}: ${r.error}`);

      const row = await prisma.prepTakeoffLine.findUniqueOrThrow({
        where: { studyId_code: { studyId, code: "TST-SHEET-01" } },
        select: {
          includedServicesJson: true,
          technicalReferencesJson: true,
          executionNotes: true,
          qualityControlsJson: true,
          technicalReservationsJson: true,
          textsUserEdited: true,
        },
      });
      assert.deepEqual(row.includedServicesJson, SHEET.included_services);
      assert.equal(row.executionNotes, SHEET.execution_notes);
      assert.deepEqual(row.qualityControlsJson, SHEET.quality_controls);
      assert.deepEqual(
        row.technicalReservationsJson,
        SHEET.technical_reservations,
      );
      const refs = row.technicalReferencesJson as Array<{
        label: string;
        kind: string;
        note: string | null;
      }>;
      assert.equal(refs[0]?.label, "NF DTU TEST");
      assert.equal(refs[0]?.kind, "INDICATIVE");
      assert.equal(row.textsUserEdited, false);
      console.log("ok — add_line fiche complète persistée");
    }

    const v3 = (
      await prisma.prepStudy.findUniqueOrThrow({
        where: { id: studyId },
        select: { version: true },
      })
    ).version;

    // --- update_line sur BASE-01 (vide) ---
    {
      const beforeV = v3;
      const raw = {
        format: "bework_patch_v1",
        schema_version: 1,
        patch_id: `test-tech-upd-${stamp}`,
        change_intent: "TECHNICAL_CORRECTION",
        origin: {
          section: "TAKEOFF",
          project_id: PROJECT,
          entity_id: studyId,
          base_version: beforeV,
        },
        operations: [
          {
            op: "update_line",
            target: {
              entity_type: "PREP_LINE",
              study_id: studyId,
              line_code: "BASE-01",
            },
            changes: { ...SHEET },
          },
        ],
      };
      const { fp } = await fingerprintFor(raw);
      const r = await commitRaw(raw, fp);
      assert.equal(r.ok, true, r.ok ? "" : `${r.code}: ${r.error}`);
      const afterV = (
        await prisma.prepStudy.findUniqueOrThrow({
          where: { id: studyId },
          select: { version: true },
        })
      ).version;
      assert.equal(afterV, beforeV + 1);

      const row = await prisma.prepTakeoffLine.findUniqueOrThrow({
        where: { studyId_code: { studyId, code: "BASE-01" } },
        select: {
          includedServicesJson: true,
          executionNotes: true,
          qualityControlsJson: true,
          technicalReservationsJson: true,
          technicalReferencesJson: true,
          textsUserEdited: true,
        },
      });
      assert.deepEqual(row.includedServicesJson, SHEET.included_services);
      assert.equal(row.executionNotes, SHEET.execution_notes);
      assert.equal(row.textsUserEdited, true);
      console.log("ok — update_line fiche + version +1");
    }

    // --- atomicité batch : 1 valide + 1 kind invalide → 0 écriture ---
    {
      const beforeCount = await prisma.prepTakeoffLine.count({
        where: { studyId },
      });
      const beforeV = (
        await prisma.prepStudy.findUniqueOrThrow({
          where: { id: studyId },
          select: { version: true },
        })
      ).version;
      const raw = {
        format: "bework_patch_v1",
        schema_version: 1,
        patch_id: `test-tech-atomic-${stamp}`,
        change_intent: "TECHNICAL_CORRECTION",
        origin: {
          section: "TAKEOFF",
          project_id: PROJECT,
          entity_id: studyId,
          base_version: beforeV,
        },
        operations: [
          {
            op: "add_line",
            target: { entity_type: "PREP_STUDY", study_id: studyId },
            line: {
              code: "ATOMIC-OK",
              lot: "A",
              designation: "Ok",
              unit: "u",
              declared_quantity: 1,
              ...SHEET,
            },
          },
          {
            op: "add_line",
            target: { entity_type: "PREP_STUDY", study_id: studyId },
            line: {
              code: "ATOMIC-BAD",
              lot: "A",
              designation: "Bad",
              unit: "u",
              declared_quantity: 1,
              technical_references: [
                { label: "X", kind: "MANDATORY", note: null },
              ],
            },
          },
        ],
      };
      const parsed = parseBeworkPatch(raw);
      assert.equal(parsed.ok, false);
      const afterCount = await prisma.prepTakeoffLine.count({
        where: { studyId },
      });
      const afterV = (
        await prisma.prepStudy.findUniqueOrThrow({
          where: { id: studyId },
          select: { version: true },
        })
      ).version;
      assert.equal(afterCount, beforeCount);
      assert.equal(afterV, beforeV);
      const journal = await prisma.beworkUniversalPatch.findUnique({
        where: {
          organizationId_patchId: {
            organizationId: ORG,
            patchId: `test-tech-atomic-${stamp}`,
          },
        },
      });
      assert.equal(journal, null);
      console.log("ok — atomicité batch (parse reject, 0 écriture)");
    }

    // --- contexte ChatGPT ---
    {
      const ctx = await buildTakeoffModifyContext({
        orgId: ORG,
        projectId: PROJECT,
        studyId,
      });
      const lines = (
        ctx.data as {
          lines: Array<{
            code: string;
            included_services: string[];
            technical_references: Array<{ label: string; kind: string }>;
            execution_notes: string | null;
            quality_controls: string[];
            technical_reservations: string[];
          }>;
        }
      ).lines;
      const sheet = lines.find((l) => l.code === "TST-SHEET-01");
      assert.ok(sheet);
      assert.deepEqual(sheet!.included_services, SHEET.included_services);
      assert.equal(sheet!.technical_references[0]?.label, "NF DTU TEST");
      assert.equal(sheet!.execution_notes, SHEET.execution_notes);
      assert.deepEqual(sheet!.quality_controls, SHEET.quality_controls);
      assert.deepEqual(
        sheet!.technical_reservations,
        SHEET.technical_reservations,
      );
      console.log("ok — contexte ChatGPT expose fiche");
    }

    // --- C-01 IM-01 lecture inchangée ---
    {
      const im = await prisma.prepTakeoffLine.findFirst({
        where: {
          studyId: "cmuh6cy4c000y1423lqo85g5v",
          code: "IM-01",
        },
        select: {
          includedServicesJson: true,
          technicalReferencesJson: true,
          executionNotes: true,
        },
      });
      assert.ok(im);
      assert.ok(Array.isArray(im!.includedServicesJson));
      assert.ok(
        (im!.includedServicesJson as unknown[]).length > 0,
        "IM-01 prestations présentes",
      );
      console.log("ok — C-01 / IM-01 inchangé (lecture)");
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          studyId,
          rockmanWrites: 0,
          migration: 0,
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
            { patchId: { startsWith: `test-tech-` } },
          ],
          projectId: PROJECT,
        },
      });
      // only delete patches from this stamp
      await prisma.beworkUniversalPatch.deleteMany({
        where: { patchId: { contains: String(stamp) } },
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
