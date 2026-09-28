/**
 * Commit bework_technical_bundle_v1 → PrepStudy (après confirmation).
 * Aucun devis / PrepSchedulePlan créé ici.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeStudy } from "@/lib/preparation/engine/compute";
import { PrepError } from "@/lib/preparation/service";
import type { DossierStatus, PrepParamDTO, PrepLineDTO } from "@/lib/preparation/types";
import { buildTechnicalImportSummary } from "@/lib/technical-engine/identity";
import { technicalToNormalizedPrep } from "@/lib/technical-engine/normalize-to-prep";
import {
  parseTechnicalJsonText,
  type NormalizedTechnicalBundle,
} from "@/lib/technical-engine/parse";
import { TECHNICAL_BUNDLE_FORMAT } from "@/lib/technical-engine/schema";

type Db = typeof prisma;

function jsonOrNull(v: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (v == null) return Prisma.JsonNull;
  return v as Prisma.InputJsonValue;
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

async function assertProject(db: Db, orgId: string, projectId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true },
  });
  if (!project) throw new PrepError("Projet introuvable dans votre organisation", 404);
}

function bundleParamsToDTO(
  parameters: import("@/lib/preparation/bundle/parse").NormalizedPrepBundle["parameters"],
): PrepParamDTO[] {
  return parameters.map((p) => ({
    ...p,
    originalValue: p.value,
    originalProvenance: p.provenance,
    modifiedAt: null,
  }));
}

function bundleLinesToDTO(
  lines: import("@/lib/preparation/bundle/parse").NormalizedPrepBundle["lines"],
): PrepLineDTO[] {
  return lines.map((l) => ({
    ...l,
    originalDesignation: l.designation,
    textsUserEdited: false,
    originalDeclared: l.declaredQuantity,
    originalProvenance: l.provenance,
    validatedQuantity: null,
    validatedAt: null,
  }));
}

export async function commitTechnicalImport(input: {
  orgId: string;
  projectId: string;
  userId: string;
  raw: string;
  /** Remplacement explicite d’une étude (même bundle_id révision). */
  targetStudyId?: string | null;
  confirmReplace?: boolean;
  /** Forcer une copie malgré fingerprint identique (interdit par défaut). */
  allowDuplicate?: boolean;
}): Promise<{
  studyId: string;
  importId: string;
  kind: "CREATE" | "REPLACE" | "IDENTICAL";
}> {
  await assertProject(prisma, input.orgId, input.projectId);

  const parsed = parseTechnicalJsonText(input.raw);
  if (!parsed.ok) {
    throw new PrepError("Le JSON technique contient des erreurs bloquantes", 422, parsed.issues);
  }
  const tech = parsed.bundle;

  const identical = await prisma.prepImport.findFirst({
    where: {
      organizationId: input.orgId,
      projectId: input.projectId,
      fingerprint: tech.fingerprint,
      status: "APPLIED",
      study: { archivedAt: null },
    },
    select: { studyId: true, id: true },
    orderBy: { appliedAt: "desc" },
  });

  if (identical && !input.allowDuplicate && !input.targetStudyId) {
    return {
      studyId: identical.studyId,
      importId: identical.id,
      kind: "IDENTICAL",
    };
  }

  if (identical && !input.allowDuplicate && input.targetStudyId) {
    return {
      studyId: identical.studyId,
      importId: identical.id,
      kind: "IDENTICAL",
    };
  }

  const { prep, prepIssues } = technicalToNormalizedPrep(tech);
  if (!prep) {
    throw new PrepError(
      "Normalisation vers le moteur métré impossible",
      422,
      prepIssues,
    );
  }

  const params = bundleParamsToDTO(prep.parameters);
  const lines = bundleLinesToDTO(prep.lines);
  const engine = computeStudy({ params, lines });

  const identity = {
    bundleId: tech.bundle_id,
    fingerprint: tech.fingerprint,
    sourceRevision: tech.source_revision ?? 1,
    format: TECHNICAL_BUNDLE_FORMAT,
    startDate: tech.planning_settings?.start_date ?? null,
    desiredStartPeriod: tech.planning_settings?.desired_start_period ?? null,
  };

  const summary = buildTechnicalImportSummary({
    parameters: params.length,
    lines: lines.length,
    warnings: [...parsed.issues, ...prepIssues].filter((i) => i.severity === "warn").length,
    errors: 0,
    workflowSteps: Array.isArray((prep.workflow as { steps?: unknown[] } | null)?.steps)
      ? ((prep.workflow as { steps: unknown[] }).steps.length)
      : 0,
    scheduleTasks: Array.isArray((prep.schedule as { tasks?: unknown[] } | null)?.tasks)
      ? ((prep.schedule as { tasks: unknown[] }).tasks.length)
      : 0,
    identity,
  });

  const studyData = {
    title: prep.study.title,
    trade: prep.study.trade,
    description: prep.study.description,
    mode: prep.mode,
    dossierStatus: (prep.mode === "DEMONSTRATION"
      ? "DEMONSTRATION"
      : "PRO_A_VALIDER") as DossierStatus,
    bundleId: tech.bundle_id,
    sourceFormat: TECHNICAL_BUNDLE_FORMAT,
    sourcesJson: jsonOrNull(prep.sources),
    hypothesesJson: jsonOrNull(prep.hypotheses),
    elementsJson: jsonOrNull(prep.elements),
    lotsJson: jsonOrNull(prep.lots),
    checksJson: jsonOrNull(prep.checks),
    resourcesJson: jsonOrNull(prep.resources),
    workflowJson: jsonOrNull(prep.workflow),
    scheduleJson: jsonOrNull(prep.schedule),
    decisionsJson: jsonOrNull(prep.decisions),
    variantsJson: jsonOrNull(prep.variants),
    disclaimersJson: jsonOrNull(prep.disclaimers),
  };

  const paramRows = (studyId: string) =>
    params.map((p) => ({
      studyId,
      organizationId: input.orgId,
      key: p.key,
      label: p.label,
      unit: p.unit,
      value: p.value,
      formula: p.formula,
      provenance: p.provenance,
      sourceRef: p.sourceRef,
      evidenceJson: jsonOrNull(p.evidence),
      hypothesisId: p.hypothesisId,
      note: p.note,
      sortOrder: p.sortOrder,
      originalValue: p.originalValue,
      originalProvenance: p.originalProvenance,
    }));

  const lineRows = (studyId: string) =>
    lines.map((l) => {
      const node = engine.nodes.get(l.code);
      return {
        studyId,
        organizationId: input.orgId,
        code: l.code,
        lot: l.lot,
        subLot: l.subLot,
        designation: l.designation,
        description: l.description,
        includedServicesJson: jsonOrNull(l.includedServices),
        technicalReferencesJson: jsonOrNull(l.technicalReferences),
        executionNotes: l.executionNotes,
        qualityControlsJson: jsonOrNull(l.qualityControls),
        technicalReservationsJson: jsonOrNull(l.technicalReservations),
        originalDesignation: l.originalDesignation ?? l.designation,
        textsUserEdited: false,
        unit: l.unit,
        elementIdsJson: jsonOrNull(l.elementIds),
        formula: l.formula,
        declaredQuantity: l.declaredQuantity,
        provenance: l.provenance,
        literalProvenance: l.literalProvenance,
        justification: l.justification,
        role: l.role,
        nature: l.nature,
        dependsOnDecisionsJson: jsonOrNull(l.dependsOnDecisions),
        notes: l.notes,
        sortOrder: l.sortOrder,
        computedQuantity: node?.value ?? null,
        computeError: node?.error ?? null,
        originalDeclared: l.originalDeclared,
        originalProvenance: l.originalProvenance,
      };
    });

  // Remplacement : target explicite OU même bundle_id avec confirmReplace
  let targetId = input.targetStudyId ?? null;
  if (!targetId && input.confirmReplace) {
    const existing = await prisma.prepStudy.findFirst({
      where: {
        organizationId: input.orgId,
        projectId: input.projectId,
        bundleId: tech.bundle_id,
        archivedAt: null,
      },
      select: { id: true, dossierStatus: true },
    });
    if (existing) {
      if (existing.dossierStatus === "PRO_VALIDE" && !input.confirmReplace) {
        throw new PrepError(
          "Étude validée : remplacement interdit sans confirmation explicite",
          409,
        );
      }
      targetId = existing.id;
    }
  }

  if (targetId) {
    if (!input.confirmReplace) {
      throw new PrepError(
        "Le remplacement d'une étude existante doit être confirmé explicitement",
        409,
      );
    }
    return prisma.$transaction(async (tx) => {
      const study = await tx.prepStudy.findFirst({
        where: {
          id: targetId!,
          organizationId: input.orgId,
          projectId: input.projectId,
          archivedAt: null,
        },
        include: { parameters: true, lines: true },
      });
      if (!study) throw new PrepError("Étude cible introuvable", 404);

      const snapshot = {
        study: {
          title: study.title,
          bundleId: study.bundleId,
          sourceFormat: study.sourceFormat,
          version: study.version,
        },
        params: study.parameters.map((p) => ({
          key: p.key,
          value: numOrNull(p.value),
          formula: p.formula,
        })),
        lines: study.lines.map((l) => ({
          code: l.code,
          declaredQuantity: numOrNull(l.declaredQuantity),
          formula: l.formula,
        })),
      };

      const version = study.version + 1;
      await tx.prepParameter.deleteMany({ where: { studyId: study.id } });
      await tx.prepTakeoffLine.deleteMany({ where: { studyId: study.id } });
      await tx.prepStudy.update({
        where: { id: study.id },
        data: { ...studyData, version, updatedById: input.userId },
      });
      await tx.prepParameter.createMany({ data: paramRows(study.id) });
      await tx.prepTakeoffLine.createMany({ data: lineRows(study.id) });
      const imp = await tx.prepImport.create({
        data: {
          studyId: study.id,
          organizationId: input.orgId,
          projectId: input.projectId,
          format: TECHNICAL_BUNDLE_FORMAT,
          bundleId: tech.bundle_id,
          fingerprint: tech.fingerprint,
          kind: "REPLACE",
          summaryJson: summary,
          snapshotBeforeJson: snapshot as unknown as Prisma.InputJsonValue,
          versionAfter: version,
          appliedById: input.userId,
        },
      });
      await tx.prepStudyEvent.create({
        data: {
          studyId: study.id,
          organizationId: input.orgId,
          kind: "TECHNICAL_IMPORT_REPLACE",
          detailJson: summary,
          actorUserId: input.userId,
        },
      });
      return { studyId: study.id, importId: imp.id, kind: "REPLACE" as const };
    });
  }

  return prisma.$transaction(async (tx) => {
    const study = await tx.prepStudy.create({
      data: {
        organizationId: input.orgId,
        projectId: input.projectId,
        ...studyData,
        version: 1,
        createdById: input.userId,
        updatedById: input.userId,
      },
      select: { id: true },
    });
    await tx.prepParameter.createMany({ data: paramRows(study.id) });
    await tx.prepTakeoffLine.createMany({ data: lineRows(study.id) });
    const imp = await tx.prepImport.create({
      data: {
        studyId: study.id,
        organizationId: input.orgId,
        projectId: input.projectId,
        format: TECHNICAL_BUNDLE_FORMAT,
        bundleId: tech.bundle_id,
        fingerprint: tech.fingerprint,
        kind: "CREATE",
        summaryJson: summary,
        versionAfter: 1,
        appliedById: input.userId,
      },
    });
    await tx.prepStudyEvent.create({
      data: {
        studyId: study.id,
        organizationId: input.orgId,
        kind: "TECHNICAL_IMPORT_CREATE",
        detailJson: summary,
        actorUserId: input.userId,
      },
    });
    return { studyId: study.id, importId: imp.id, kind: "CREATE" as const };
  });
}

/** Exposé pour tests / Phase E. */
export type { NormalizedTechnicalBundle };
