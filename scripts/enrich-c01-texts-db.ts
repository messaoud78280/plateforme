/**
 * Enrichit en base les études C-01 existantes (textes seuls, sans toucher aux quantités).
 *   node --import tsx scripts/enrich-c01-texts-db.ts
 */
import { PrismaClient } from "@prisma/client";
import { C01_LINE_TEXT_ENRICHMENTS } from "../src/lib/preparation/enrichment/c01-fondations-texts";
import { computeStudy } from "../src/lib/preparation/engine/compute";

const prisma = new PrismaClient();

async function main() {
  const studies = await prisma.prepStudy.findMany({
    where: { archivedAt: null, bundleId: "c01-fondations-demo-v1" },
    include: { parameters: true, lines: true, organization: { select: { name: true } } },
  });
  console.log(`${studies.length} étude(s) C-01 trouvée(s)`);

  for (const study of studies) {
    const params = study.parameters.map((p) => ({
      key: p.key,
      value: p.value === null ? null : Number(p.value),
      formula: p.formula,
      provenance: p.provenance as "HYPOTHESE" | null,
    }));
    const lineEngine = study.lines.map((l) => ({
      code: l.code,
      formula: l.formula,
      declaredQuantity: l.declaredQuantity === null ? null : Number(l.declaredQuantity),
      provenance: l.provenance as "HYPOTHESE" | null,
      literalProvenance: l.literalProvenance as "HYPOTHESE" | null,
    }));
    const before = computeStudy({ params, lines: lineEngine });
    let updated = 0;
    let skipped = 0;

    for (const line of study.lines) {
      const enrich = C01_LINE_TEXT_ENRICHMENTS[line.code];
      if (!enrich) {
        skipped++;
        continue;
      }
      if (line.textsUserEdited) {
        skipped++;
        continue;
      }
      const original = line.originalDesignation ?? line.designation;
      const canRename =
        line.designation === original ||
        line.designation === enrich.replacesDesignation ||
        line.designation === enrich.designation;

      await prisma.prepTakeoffLine.update({
        where: { id: line.id },
        data: {
          designation: canRename ? enrich.designation : line.designation,
          description: enrich.technicalDescription,
          includedServicesJson: enrich.includedServices,
          technicalReferencesJson: enrich.technicalReferences,
          executionNotes: enrich.executionNotes,
          qualityControlsJson: enrich.qualityControls,
          technicalReservationsJson: enrich.technicalReservations,
          originalDesignation: original,
        },
      });
      updated++;
    }

    const afterLines = await prisma.prepTakeoffLine.findMany({ where: { studyId: study.id } });
    const after = computeStudy({
      params,
      lines: afterLines.map((l) => ({
        code: l.code,
        formula: l.formula,
        declaredQuantity: l.declaredQuantity === null ? null : Number(l.declaredQuantity),
        provenance: l.provenance as "HYPOTHESE" | null,
        literalProvenance: l.literalProvenance as "HYPOTHESE" | null,
      })),
    });
    for (const code of before.nodes.keys()) {
      const a = after.nodes.get(code)?.value ?? null;
      const b = before.nodes.get(code)?.value ?? null;
      if (a !== b) throw new Error(`${study.id} ${code}: quantité changée ${b} → ${a}`);
    }

    await prisma.prepStudy.update({
      where: { id: study.id },
      data: { version: study.version + 1 },
    });
    await prisma.prepStudyEvent.create({
      data: {
        studyId: study.id,
        organizationId: study.organizationId,
        kind: "ENRICH_TEXTS",
        detailJson: { updated, skipped, source: "c01-fondations", via: "script" },
      },
    });

    console.log(
      `OK ${study.organization.name} / ${study.title} — ${updated} ligne(s), version ${study.version} → ${study.version + 1}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
