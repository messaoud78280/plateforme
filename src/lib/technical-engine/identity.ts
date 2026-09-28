/**
 * Identité d’import technique — lecture / écriture via PrepImport existant (pas de nouvelle colonne).
 */
import type { Prisma } from "@prisma/client";

export type TechnicalImportIdentity = {
  bundleId: string | null;
  fingerprint: string;
  sourceRevision: number | null;
  format: string;
  startDate: string | null;
  desiredStartPeriod: string | null;
};

export function buildTechnicalImportSummary(input: {
  parameters: number;
  lines: number;
  warnings: number;
  errors: number;
  workflowSteps: number;
  scheduleTasks: number;
  identity: TechnicalImportIdentity;
  adaptedFromPrep?: boolean;
}): Prisma.InputJsonValue {
  return {
    parameters: input.parameters,
    lines: input.lines,
    warnings: input.warnings,
    errors: input.errors,
    workflowSteps: input.workflowSteps,
    scheduleTasks: input.scheduleTasks,
    sourceRevision: input.identity.sourceRevision,
    adaptedFromPrep: input.adaptedFromPrep ?? false,
    technical: {
      bundleId: input.identity.bundleId,
      fingerprint: input.identity.fingerprint,
      sourceRevision: input.identity.sourceRevision,
      format: input.identity.format,
      startDate: input.identity.startDate,
      desiredStartPeriod: input.identity.desiredStartPeriod,
    },
  };
}

export function readSourceRevisionFromSummary(summary: unknown): number | null {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) return null;
  const s = summary as Record<string, unknown>;
  const top = s.sourceRevision;
  if (typeof top === "number" && Number.isFinite(top)) return Math.trunc(top);
  const tech = s.technical;
  if (tech && typeof tech === "object" && !Array.isArray(tech)) {
    const r = (tech as Record<string, unknown>).sourceRevision;
    if (typeof r === "number" && Number.isFinite(r)) return Math.trunc(r);
  }
  return null;
}
