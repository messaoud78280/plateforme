/**
 * Charge SourceContext depuis la BDD pour Preview/Commit V2.
 * Hors du domaine pur (imports Prisma ici uniquement).
 */
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { isPrepLineTransferable } from "@/lib/preparation/quote-bridge/description";
import { resolveCanonicalTakeoffQuantity } from "@/lib/preparation/schedule/resolve-planning-source";
import type { ScheduleSourceContext } from "../business-validator";

export type LoadedPlanningV2Sources = {
  sourceContext: ScheduleSourceContext;
  studyId: string;
  studyTitle: string;
  studyMode: string;
  projectId: string;
  orgId: string;
};

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : d(v as never);
  return typeof n === "number" && Number.isFinite(n) ? n : Number(n);
}

function fingerprint(input: {
  projectId: string;
  studyId: string;
  studyVersion: number;
  studyUpdatedAt: Date;
  lineCodes: string[];
  quoteId: string | null;
  quoteVersionNumber: number | null;
}): string {
  const payload = {
    projectId: input.projectId,
    studyId: input.studyId,
    studyVersion: input.studyVersion,
    studyUpdatedAt: input.studyUpdatedAt.toISOString(),
    lines: [...input.lineCodes].sort(),
    quoteId: input.quoteId,
    quoteVersionNumber: input.quoteVersionNumber,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function loadSourceContextFromDb(input: {
  orgId: string;
  projectId: string;
  studyId?: string | null;
}): Promise<LoadedPlanningV2Sources> {
  const study = await prisma.prepStudy.findFirst({
    where: {
      organizationId: input.orgId,
      projectId: input.projectId,
      archivedAt: null,
      ...(input.studyId ? { id: input.studyId } : {}),
    },
    select: {
      id: true,
      title: true,
      mode: true,
      version: true,
      updatedAt: true,
      projectId: true,
      organizationId: true,
      lines: {
        orderBy: { sortOrder: "asc" },
        select: {
          code: true,
          role: true,
          unit: true,
          validatedQuantity: true,
          declaredQuantity: true,
          computedQuantity: true,
          provenance: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!study) {
    throw Object.assign(new Error("Aucun métré sur ce chantier"), {
      code: "STUDY_REQUIRED",
      status: 422,
    });
  }

  const quote = await prisma.commercialQuote.findFirst({
    where: { organizationId: input.orgId, projectId: input.projectId },
    select: {
      id: true,
      currentVersion: { select: { versionNumber: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const lines = study.lines.map((l) => {
    const validated = num(l.validatedQuantity);
    const declared = num(l.declaredQuantity);
    const computed = num(l.computedQuantity);
    const resolved = resolveCanonicalTakeoffQuantity({
      code: l.code,
      unit: l.unit,
      validatedQuantity: validated,
      declaredQuantity: declared,
      computedQuantity: computed,
      provenance: l.provenance,
    });
    const role = l.role ?? null;
    const executable =
      Boolean(role) &&
      isPrepLineTransferable(role!) &&
      role !== "indicator";
    return {
      code: l.code,
      executable,
      role,
      quantity_for_planning: resolved.quantity,
      validated_quantity: validated,
      declared_quantity: declared,
      computed_quantity: computed,
    };
  });

  const takeoffFingerprint = fingerprint({
    projectId: study.projectId,
    studyId: study.id,
    studyVersion: study.version,
    studyUpdatedAt: study.updatedAt,
    lineCodes: study.lines.map((l) => l.code),
    quoteId: quote?.id ?? null,
    quoteVersionNumber: quote?.currentVersion?.versionNumber ?? null,
  });

  return {
    orgId: study.organizationId,
    projectId: study.projectId,
    studyId: study.id,
    studyTitle: study.title,
    studyMode: study.mode,
    sourceContext: {
      projectId: study.projectId,
      takeoffStudyId: study.id,
      takeoffVersion: study.version,
      takeoffFingerprint,
      lines,
      quoteId: quote?.id ?? null,
      quoteVersion: quote?.currentVersion?.versionNumber ?? null,
    },
  };
}

export async function findExistingCurrentOrInitialPlan(input: {
  orgId: string;
  projectId: string;
}): Promise<{ id: string; revisionNumber: number; status: string } | null> {
  return prisma.prepSchedulePlan.findFirst({
    where: {
      organizationId: input.orgId,
      projectId: input.projectId,
      status: { in: ["CURRENT", "INITIAL"] },
    },
    select: { id: true, revisionNumber: true, status: true },
    orderBy: { createdAt: "desc" },
  });
}
