/**
 * Construction bework_chatgpt_context_v1 par section — lecture seule.
 * N’invente jamais de parameter_id.
 * CTX-08 : TAKEOFF dérive du snapshot canonique (buildProjectContext → adapter).
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import {
  adaptTakeoffForChatgptContext,
  adaptVisitForChatgptContext,
  buildProjectContext,
} from "@/lib/bework-context";
import { computeFollowUpContextVersion } from "@/lib/bework-context/follow-up-context-version";
import { sheetToVersionInput } from "@/lib/bework-patch/commit/follow-up-ops";
import { computeReportContextVersion } from "@/lib/bework-context/report-context-version";
import { docToVersionInput } from "@/lib/bework-patch/commit/report-ops";
import {
  computeNoticeContextVersion,
  noticeDocToVersionInput,
} from "@/lib/bework-patch/commit/notice-ops";
import {
  buildCanonicalResolution,
  buildChatgptContextSkeleton,
} from "@/lib/bework-patch/context";
import type {
  BeworkChatgptContextV1,
  BeworkPatchSection,
} from "@/lib/bework-patch/types";
import { parsePrepWorkflowSteps } from "@/lib/preparation/schedule/parse";

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export async function buildUniversalPatchContext(input: {
  orgId: string;
  section: BeworkPatchSection;
  projectId: string;
  entityId: string;
}): Promise<BeworkChatgptContextV1 | null> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.orgId },
    select: { id: true, title: true },
  });
  if (!project) return null;

  switch (input.section) {
    case "QUOTE":
      return buildQuoteContext(input.orgId, project, input.entityId);
    case "TAKEOFF":
      return buildTakeoffContext(input.orgId, project, input.entityId);
    case "PLANNING":
      return buildPlanningContext(input.orgId, project, input.entityId);
    case "VISIT":
      return buildVisitContext(input.orgId, project, input.entityId);
    case "FOLLOW_UP":
      return buildFollowUpContext(input.orgId, project, input.entityId);
    case "REPORT":
    case "NOTICE":
      return buildDocumentContext(input.orgId, project, input.entityId, input.section);
    default:
      return null;
  }
}

async function buildQuoteContext(
  orgId: string,
  project: { id: string; title: string },
  quoteId: string,
): Promise<BeworkChatgptContextV1 | null> {
  const quote = await prisma.commercialQuote.findFirst({
    where: {
      id: quoteId,
      organizationId: orgId,
      OR: [{ projectId: project.id }, { projectId: null }],
    },
    include: {
      currentVersion: {
        include: {
          sections: { orderBy: { sortOrder: "asc" } },
          lines: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!quote?.currentVersion) return null;
  if (quote.projectId && quote.projectId !== project.id) return null;

  const links = await prisma.prepQuoteLink.findMany({
    where: { organizationId: orgId, quoteId: quote.id },
    select: { quoteLineId: true, studyId: true, studyLineCode: true },
  });
  const linkByLine = new Map(links.map((l) => [l.quoteLineId, l]));

  const scheduleLinks = await prisma.prepScheduleQuoteLink.findMany({
    where: { organizationId: orgId, quoteId: quote.id },
    select: { quoteLineId: true, planId: true, taskId: true, studyLineCode: true },
  });

  const quoteItems = quote.currentVersion.lines.map((l) => {
    const link = linkByLine.get(l.id);
    const sched = scheduleLinks.filter((s) => s.quoteLineId === l.id);
    return {
      quote_item_id: l.id,
      takeoff_link: link
        ? { study_id: link.studyId, study_line_code: link.studyLineCode }
        : null,
      schedule_links: sched.map((s) => ({
        plan_id: s.planId,
        task_id: s.taskId,
        step_code: s.studyLineCode,
      })),
      canonical_resolution: buildCanonicalResolution({
        studyId: link?.studyId,
        takeoffLineCode: link?.studyLineCode,
        // Jamais de parameter inventé
      }),
    };
  });

  return buildChatgptContextSkeleton({
    section: "QUOTE",
    project,
    target: {
      entity_type: "COMMERCIAL_QUOTE",
      id: quote.id,
      version: quote.currentVersion.versionNumber,
      code: quote.number,
    },
    data: {
      number: quote.number,
      status: quote.status,
      subject: quote.subject,
      totals: {
        sell_ht: d(quote.currentVersion.totalSellHt),
        ttc: d(quote.currentVersion.totalTtc),
      },
      sections: quote.currentVersion.sections.map((s) => ({
        section_id: s.id,
        title: s.title,
        items: quote.currentVersion!.lines
          .filter((l) => l.sectionId === s.id)
          .map((l) => ({
            item_id: l.id,
            designation: l.designation,
            quantity: d(l.quantity),
            unit: l.unit,
            unit_price_ht: d(l.unitSellHt),
            line_ht: d(l.lineSellHt),
          })),
      })),
    },
    quoteItems,
  });
}

/**
 * CTX-08 — TAKEOFF via snapshot canonique.
 * Legacy `buildMetreChatgptContext` reste intact pour rétrocompatibilité.
 */
async function buildTakeoffContext(
  orgId: string,
  project: { id: string; title: string },
  studyId: string,
): Promise<BeworkChatgptContextV1 | null> {
  const snapshot = await buildProjectContext(project.id, orgId, {
    includeLines: true,
  });
  if (!snapshot) return null;

  const adapted = adaptTakeoffForChatgptContext(snapshot, studyId);
  if (!adapted) return null;

  // Garde-fou : l’étude doit appartenir au projet déjà scopé org.
  if (adapted.project.id !== project.id) return null;
  return adapted;
}

async function buildPlanningContext(
  orgId: string,
  project: { id: string; title: string },
  planId: string,
): Promise<BeworkChatgptContextV1 | null> {
  const plan = await prisma.prepSchedulePlan.findFirst({
    where: { id: planId, organizationId: orgId, projectId: project.id },
    include: {
      tasks: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          stepCode: true,
          name: true,
          durationDays: true,
          lot: true,
          startDate: true,
          endDate: true,
          crewJson: true,
          dependsOnJson: true,
        },
      },
    },
  });
  if (!plan) return null;

  const takeoffLinks = await prisma.prepScheduleTakeoffLink.findMany({
    where: { planId: plan.id, organizationId: orgId },
    select: { taskId: true, studyLineCode: true },
  });

  return buildChatgptContextSkeleton({
    section: "PLANNING",
    project,
    target: {
      entity_type: "PREP_SCHEDULE_PLAN",
      id: plan.id,
      version: plan.revisionNumber,
      code: plan.title,
      base_version: plan.revisionNumber,
    },
    data: {
      title: plan.title,
      revision_number: plan.revisionNumber,
      study_version_at_generation: plan.studyVersionAtGeneration,
      study_id: plan.studyId,
      scope_id: plan.scopeId,
      start_date: plan.startDate ? plan.startDate.toISOString().slice(0, 10) : null,
      base_duration_working_days: plan.baseDurationWorkingDays
        ? Number(plan.baseDurationWorkingDays)
        : null,
      tasks: plan.tasks.map((t) => ({
        task_id: t.id,
        step_code: t.stepCode,
        name: t.name,
        duration_days: Number(t.durationDays),
        lot: t.lot,
        start_date: t.startDate ? t.startDate.toISOString().slice(0, 10) : null,
        end_date: t.endDate ? t.endDate.toISOString().slice(0, 10) : null,
        takeoff_codes: takeoffLinks
          .filter((l) => l.taskId === t.id)
          .map((l) => l.studyLineCode),
      })),
      note:
        "base_version = revisionNumber. studyVersionAtGeneration = alignement métré (CTX-04) — une édition planning ne le synchronise pas.",
    },
  });
}

/**
 * CTX-07 — VISIT via snapshot canonique + version dérivée.
 * Legacy bework_site_survey_v1 inchangé.
 */
async function buildVisitContext(
  orgId: string,
  project: { id: string; title: string },
  visitId: string,
): Promise<BeworkChatgptContextV1 | null> {
  const snapshot = await buildProjectContext(project.id, orgId, {
    includeLines: true,
  });
  if (!snapshot) return null;

  const adapted = adaptVisitForChatgptContext(snapshot, visitId);
  if (!adapted) return null;
  if (adapted.project.id !== project.id) return null;
  return adapted;
}

async function buildFollowUpContext(
  orgId: string,
  project: { id: string; title: string },
  entityId: string,
): Promise<BeworkChatgptContextV1 | null> {
  // entityId peut être follow-up sheet OU planId (suivi chantier)
  const sheet = await prisma.followUpSheet.findFirst({
    where: {
      id: entityId,
      organizationId: orgId,
      projectId: project.id,
    },
    select: {
      id: true,
      title: true,
      status: true,
      notes: true,
      prepSchedulePlanId: true,
      updatedAt: true,
    },
  });

  if (sheet) {
    const version = computeFollowUpContextVersion(sheetToVersionInput(sheet));
    return buildChatgptContextSkeleton({
      section: "FOLLOW_UP",
      project,
      target: {
        entity_type: "FOLLOW_UP_SHEET",
        id: sheet.id,
        version,
        base_version: version,
        code: sheet.title,
      },
      data: {
        title: sheet.title,
        status: sheet.status,
        notes: sheet.notes,
        prep_schedule_plan_id: sheet.prepSchedulePlanId,
        version_note:
          "target.version = empreinte déterministe (SHA-256→uint48) de l’état ChatGPT FOLLOW_UP (title/status/notes/plan).",
      },
    });
  }

  // Fallback : plan de suivi
  const plan = await prisma.prepSchedulePlan.findFirst({
    where: { id: entityId, organizationId: orgId, projectId: project.id },
    include: {
      tasks: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          stepCode: true,
          name: true,
          executionStatus: true,
          progressPercent: true,
        },
        take: 80,
      },
    },
  });
  if (!plan) return null;

  return buildChatgptContextSkeleton({
    section: "FOLLOW_UP",
    project,
    target: {
      entity_type: "PREP_SCHEDULE_PLAN",
      id: plan.id,
      version: plan.revisionNumber,
      code: plan.title,
    },
    data: {
      mode: "planning_suivi",
      tasks: plan.tasks.map((t) => ({
        task_id: t.id,
        step_code: t.stepCode,
        name: t.name,
        execution_status: t.executionStatus,
        progress_percent: t.progressPercent,
      })),
    },
  });
}

async function buildDocumentContext(
  orgId: string,
  project: { id: string; title: string },
  docId: string,
  section: "REPORT" | "NOTICE",
): Promise<BeworkChatgptContextV1 | null> {
  const doc = await prisma.siteDocument.findFirst({
    where: { id: docId, organizationId: orgId, projectId: project.id },
    select: {
      id: true,
      kind: true,
      title: true,
      number: true,
      versionNumber: true,
      status: true,
      payloadJson: true,
      quickNotes: true,
    },
  });
  if (!doc) return null;
  if (section === "REPORT" && doc.kind !== "COMPTE_RENDU") return null;
  if (section === "NOTICE" && doc.kind !== "NOTICE") return null;

  if (section === "REPORT") {
    const version = computeReportContextVersion(docToVersionInput(doc));
    return buildChatgptContextSkeleton({
      section,
      project,
      target: {
        entity_type: "SITE_DOCUMENT",
        id: doc.id,
        version,
        base_version: version,
        code: doc.number,
      },
      data: {
        kind: doc.kind,
        title: doc.title,
        status: doc.status,
        quick_notes: doc.quickNotes,
        payload: doc.payloadJson,
        version_note:
          "target.version = empreinte déterministe (SHA-256→uint48) de l’état ChatGPT REPORT.",
      },
    });
  }

  const version = computeNoticeContextVersion(noticeDocToVersionInput(doc));
  return buildChatgptContextSkeleton({
    section,
    project,
    target: {
      entity_type: "SITE_DOCUMENT",
      id: doc.id,
      version,
      base_version: version,
      code: doc.number,
    },
    data: {
      kind: doc.kind,
      title: doc.title,
      status: doc.status,
      quick_notes: doc.quickNotes,
      payload: doc.payloadJson,
      version_note:
        "target.version = empreinte déterministe (SHA-256→uint48) de l’état ChatGPT NOTICE.",
    },
  });
}

/** Expose aussi les workflow steps d’une étude (optionnel pour TAKEOFF). */
export async function enrichTakeoffWorkflow(
  orgId: string,
  studyId: string,
): Promise<unknown[] | null> {
  const study = await prisma.prepStudy.findFirst({
    where: { id: studyId, organizationId: orgId },
    select: { workflowJson: true },
  });
  if (!study) return null;
  return parsePrepWorkflowSteps(study.workflowJson);
}
