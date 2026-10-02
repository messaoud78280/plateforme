/**
 * Gate d'intégrité des sources avant génération / régénération planning.
 * Bloque les rattachements cross-project — ne « répare » pas les données.
 */

export type SourceIntegrityInput = {
  organizationId: string;
  project: { id: string; organizationId: string; title?: string | null };
  study: {
    id: string;
    projectId: string;
    organizationId: string;
    version: number;
    scopeId?: string | null;
  };
  plan?: {
    id: string;
    projectId: string;
    studyId: string;
    organizationId: string;
    quoteId?: string | null;
    scopeId?: string | null;
  } | null;
  quote?: {
    id: string;
    projectId: string | null;
    organizationId: string;
    sourcePrepStudyId?: string | null;
    subject?: string | null;
  } | null;
};

export type SourceIntegrityIssue = {
  code: string;
  severity: "BLOCKER" | "WARNING" | "INFO";
  message: string;
};

export type SourceIntegrityResult = {
  ok: boolean;
  blockers: SourceIntegrityIssue[];
  warnings: SourceIntegrityIssue[];
  infos: SourceIntegrityIssue[];
};

export function analyzeSourceIntegrity(
  input: SourceIntegrityInput,
): SourceIntegrityResult {
  const blockers: SourceIntegrityIssue[] = [];
  const warnings: SourceIntegrityIssue[] = [];
  const infos: SourceIntegrityIssue[] = [];

  if (input.project.organizationId !== input.organizationId) {
    blockers.push({
      code: "ORG_PROJECT_MISMATCH",
      severity: "BLOCKER",
      message: "Le chantier n'appartient pas à l'organisation courante.",
    });
  }
  if (input.study.organizationId !== input.organizationId) {
    blockers.push({
      code: "ORG_STUDY_MISMATCH",
      severity: "BLOCKER",
      message: "Le métré n'appartient pas à l'organisation courante.",
    });
  }
  if (input.study.projectId !== input.project.id) {
    blockers.push({
      code: "STUDY_PROJECT_MISMATCH",
      severity: "BLOCKER",
      message: "Le métré n'est pas rattaché au chantier ciblé.",
    });
  }

  if (input.plan) {
    if (input.plan.organizationId !== input.organizationId) {
      blockers.push({
        code: "ORG_PLAN_MISMATCH",
        severity: "BLOCKER",
        message: "Le planning n'appartient pas à l'organisation courante.",
      });
    }
    if (input.plan.projectId !== input.project.id) {
      blockers.push({
        code: "PLAN_PROJECT_MISMATCH",
        severity: "BLOCKER",
        message: "Le planning n'est pas rattaché au chantier ciblé.",
      });
    }
    if (input.plan.studyId !== input.study.id) {
      blockers.push({
        code: "PLAN_STUDY_MISMATCH",
        severity: "BLOCKER",
        message: "Le planning n'est pas rattaché au métré ciblé.",
      });
    }
    if (
      input.plan.scopeId &&
      input.study.scopeId &&
      input.plan.scopeId !== input.study.scopeId
    ) {
      warnings.push({
        code: "SCOPE_MISMATCH",
        severity: "WARNING",
        message: "Le scope du planning diffère du scope du métré.",
      });
    }
  }

  if (input.quote) {
    if (input.quote.organizationId !== input.organizationId) {
      blockers.push({
        code: "ORG_QUOTE_MISMATCH",
        severity: "BLOCKER",
        message: "Le devis n'appartient pas à l'organisation courante.",
      });
    }
    if (input.quote.projectId && input.quote.projectId !== input.project.id) {
      blockers.push({
        code: "QUOTE_PROJECT_MISMATCH",
        severity: "BLOCKER",
        message: "Le devis lié n'appartient pas au même chantier.",
      });
    }
    if (
      input.quote.sourcePrepStudyId &&
      input.quote.sourcePrepStudyId !== input.study.id
    ) {
      warnings.push({
        code: "QUOTE_STUDY_MISMATCH",
        severity: "WARNING",
        message:
          "Le devis pointe vers un autre métré source que le planning généré.",
      });
    }
  }

  return {
    ok: blockers.length === 0,
    blockers,
    warnings,
    infos,
  };
}
