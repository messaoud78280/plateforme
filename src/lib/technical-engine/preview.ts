/**
 * Preview d’import bework_technical_bundle_v1 — aucune écriture.
 */
import { prisma } from "@/lib/prisma";
import { computeStudy } from "@/lib/preparation/engine/compute";
import { PrepError } from "@/lib/preparation/service";
import { computeSchedule } from "@/lib/preparation/schedule/compute";
import {
  parsePrepResources,
  parsePrepSchedule,
  parsePrepWorkflowSteps,
} from "@/lib/preparation/schedule/parse";
import { technicalToNormalizedPrep } from "@/lib/technical-engine/normalize-to-prep";
import {
  parseTechnicalJsonText,
  type TechnicalIssue,
  type NormalizedTechnicalBundle,
} from "@/lib/technical-engine/parse";
import { readSourceRevisionFromSummary } from "@/lib/technical-engine/identity";

export type TechnicalPreviewDuplicate =
  | {
      kind: "identical";
      studyId: string;
      title: string;
      importedAt: string;
      sourceRevision: number | null;
    }
  | {
      kind: "revision";
      studyId: string;
      title: string;
      previousFingerprint: string;
      previousRevision: number | null;
      newRevision: number | null;
      linesAdded: string[];
      linesRemoved: string[];
      linesChanged: string[];
    };

export type TechnicalImportPreview = {
  fingerprint: string;
  bundleId: string;
  sourceRevision: number | null;
  format: string;
  mode: string;
  title: string;
  projectLabel: string;
  sources: Array<{ id: string; type: string; label: string }>;
  lots: Array<{ code: string; label: string }>;
  lineCount: number;
  parameterCount: number;
  lines: Array<{
    code: string;
    lot: string;
    designation: string;
    unit: string;
    quantity: number | null;
    computed: number | null;
    classification: string | null;
    confidence: string | null;
  }>;
  assumptions: Array<{ id: string; text: string }>;
  unknowns: Array<{ id: string; text: string }>;
  toConfirm: string[];
  workflowSteps: number;
  scheduleTasks: number;
  estimatedDurationDays: number | null;
  startDate: string | null;
  startDateLabel: string;
  desiredStartPeriod: string | null;
  quoteTransferBlocked: true;
  createsQuote: false;
  createsSchedulePlan: false;
  issues: TechnicalIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  duplicate: TechnicalPreviewDuplicate | null;
  exceptionsSummary: {
    linesOk: number;
    calculationsToCheck: number;
    assumptions: number;
    missing: number;
    toVerify: number;
  };
};

type Db = typeof prisma;

async function assertProject(db: Db, orgId: string, projectId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true, title: true },
  });
  if (!project) throw new PrepError("Projet introuvable dans votre organisation", 404);
  return project;
}

async function findIdentical(
  db: Db,
  orgId: string,
  projectId: string,
  fingerprint: string,
): Promise<TechnicalPreviewDuplicate | null> {
  const dup = await db.prepImport.findFirst({
    where: {
      organizationId: orgId,
      projectId,
      fingerprint,
      status: "APPLIED",
      study: { archivedAt: null },
    },
    select: {
      appliedAt: true,
      summaryJson: true,
      study: { select: { id: true, title: true } },
    },
    orderBy: { appliedAt: "desc" },
  });
  if (!dup) return null;
  return {
    kind: "identical",
    studyId: dup.study.id,
    title: dup.study.title,
    importedAt: dup.appliedAt.toISOString(),
    sourceRevision: readSourceRevisionFromSummary(dup.summaryJson),
  };
}

async function findRevisionConflict(
  db: Db,
  orgId: string,
  projectId: string,
  bundleId: string,
  fingerprint: string,
  tech: NormalizedTechnicalBundle,
): Promise<TechnicalPreviewDuplicate | null> {
  const study = await db.prepStudy.findFirst({
    where: {
      organizationId: orgId,
      projectId,
      bundleId,
      archivedAt: null,
    },
    select: {
      id: true,
      title: true,
      lines: { select: { code: true, formula: true, declaredQuantity: true } },
      imports: {
        where: { status: "APPLIED" },
        orderBy: { appliedAt: "desc" },
        take: 1,
        select: { fingerprint: true, summaryJson: true },
      },
    },
  });
  if (!study) return null;
  const last = study.imports[0];
  if (last && last.fingerprint === fingerprint) return null;

  const oldCodes = new Set(study.lines.map((l) => l.code));
  const newCodes = new Set(tech.takeoff.items.map((i) => i.code));
  const oldByCode = new Map(
    study.lines.map((l) => [
      l.code,
      {
        formula: l.formula,
        qty: l.declaredQuantity != null ? Number(l.declaredQuantity) : null,
      },
    ]),
  );

  const linesChanged = tech.takeoff.items
    .filter((it) => {
      const o = oldByCode.get(it.code);
      if (!o) return false;
      return (o.formula ?? null) !== (it.formula ?? null) || o.qty !== (it.quantity ?? null);
    })
    .map((it) => it.code);

  return {
    kind: "revision",
    studyId: study.id,
    title: study.title,
    previousFingerprint: last?.fingerprint ?? "",
    previousRevision: readSourceRevisionFromSummary(last?.summaryJson),
    newRevision: tech.source_revision ?? null,
    linesAdded: [...newCodes].filter((c) => !oldCodes.has(c)),
    linesRemoved: [...oldCodes].filter((c) => !newCodes.has(c)),
    linesChanged,
  };
}

export async function previewTechnicalImport(input: {
  orgId: string;
  projectId: string;
  raw: string;
}): Promise<
  | { ok: true; preview: TechnicalImportPreview }
  | { ok: false; issues: TechnicalIssue[] }
> {
  await assertProject(prisma, input.orgId, input.projectId);
  const parsed = parseTechnicalJsonText(input.raw);
  if (!parsed.ok) return { ok: false, issues: parsed.issues };

  const tech = parsed.bundle;
  const { prep, prepIssues } = technicalToNormalizedPrep(tech);
  const issues: TechnicalIssue[] = [
    ...parsed.issues,
    ...prepIssues.map((i) => ({
      ...i,
      severity: i.severity === "error" ? ("error" as const) : i.severity === "warn" ? ("warn" as const) : ("info" as const),
    })),
  ];

  if (!prep) {
    return { ok: false, issues };
  }

  const engine = computeStudy({ params: prep.parameters, lines: prep.lines });

  let estimatedDurationDays: number | null = null;
  if (prep.workflow && prep.schedule) {
    const workflow = parsePrepWorkflowSteps(prep.workflow);
    const schedule = parsePrepSchedule(prep.schedule);
    const resources = parsePrepResources(prep.resources);
    if (schedule && workflow.length) {
      const qtyMap = new Map(
        [...engine.nodes.entries()].map(([code, n]) => [code, n.value]),
      );
      const computed = computeSchedule({
        workflowSteps: workflow,
        schedule,
        resources,
        qtyOf: (code) => qtyMap.get(code) ?? null,
      });
      estimatedDurationDays = computed.baseDurationWorkingDays;
      for (const w of computed.warnings) {
        issues.push({ path: "schedule", message: w, severity: "warn" });
      }
      for (const e of computed.errors) {
        issues.push({ path: "schedule", message: e, severity: "error" });
      }
    }
  }

  const identical = await findIdentical(
    prisma,
    input.orgId,
    input.projectId,
    tech.fingerprint,
  );
  const revision =
    !identical && tech.bundle_id
      ? await findRevisionConflict(
          prisma,
          input.orgId,
          input.projectId,
          tech.bundle_id,
          tech.fingerprint,
          tech,
        )
      : null;

  const startDate = tech.planning_settings?.start_date ?? null;
  const toConfirm: string[] = [];
  for (const it of tech.takeoff.items) {
    for (const t of it.to_confirm ?? []) toConfirm.push(`${it.code} : ${t}`);
  }
  for (const u of tech.unknowns ?? []) toConfirm.push(`Inconnu : ${u.text}`);

  const linesPreview = tech.takeoff.items.map((it) => {
    const node = engine.nodes.get(it.code);
    return {
      code: it.code,
      lot: it.lot,
      designation: it.designation,
      unit: it.unit,
      quantity: it.quantity ?? null,
      computed: node?.value ?? null,
      classification: it.provenance?.classification ?? null,
      confidence: it.provenance?.confidence ?? null,
    };
  });

  const assumptionsCount = (tech.assumptions?.length ?? 0) +
    linesPreview.filter((l) => l.classification === "ASSUMED").length;
  const calcToCheck = linesPreview.filter(
    (l) => l.classification === "CALCULATED" || l.confidence === "to_confirm",
  ).length;
  const missing = tech.unknowns?.length ?? 0;
  const toVerify = toConfirm.length;
  const linesOk = Math.max(
    0,
    linesPreview.length - calcToCheck - linesPreview.filter((l) => l.classification === "ASSUMED").length,
  );

  const errorCount = issues.filter((i) => i.severity === "error").length;
  if (errorCount > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    preview: {
      fingerprint: tech.fingerprint,
      bundleId: tech.bundle_id,
      sourceRevision: tech.source_revision ?? null,
      format: tech.format,
      mode: tech.mode ?? "professional",
      title: tech.meta.title,
      projectLabel: tech.project.title,
      sources: tech.sources.map((s) => ({
        id: s.id,
        type: s.type,
        label: s.label,
      })),
      lots:
        tech.lots && tech.lots.length
          ? tech.lots
          : [...new Map(tech.takeoff.items.map((i) => [i.lot, { code: i.lot, label: i.lot }])).values()],
      lineCount: tech.takeoff.items.length,
      parameterCount: tech.takeoff.parameters.length,
      lines: linesPreview,
      assumptions: (tech.assumptions ?? []).map((a) => ({ id: a.id, text: a.text })),
      unknowns: (tech.unknowns ?? []).map((u) => ({ id: u.id, text: u.text })),
      toConfirm,
      workflowSteps: tech.workflow?.steps.length ?? 0,
      scheduleTasks: tech.schedule?.tasks.length ?? 0,
      estimatedDurationDays,
      startDate,
      startDateLabel: startDate ?? "Date de démarrage à définir",
      desiredStartPeriod: tech.planning_settings?.desired_start_period ?? null,
      quoteTransferBlocked: true,
      createsQuote: false,
      createsSchedulePlan: false,
      issues,
      errorCount: 0,
      warningCount: issues.filter((i) => i.severity === "warn").length,
      infoCount: issues.filter((i) => i.severity === "info").length,
      duplicate: identical ?? revision,
      exceptionsSummary: {
        linesOk,
        calculationsToCheck: calcToCheck,
        assumptions: assumptionsCount,
        missing,
        toVerify,
      },
    },
  };
}
