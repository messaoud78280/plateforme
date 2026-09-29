/**
 * Construction bework_chatgpt_context_v1 par section — lecture seule.
 * N’invente jamais de parameter_id.
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
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

async function buildTakeoffContext(
  orgId: string,
  project: { id: string; title: string },
  studyId: string,
): Promise<BeworkChatgptContextV1 | null> {
  const study = await prisma.prepStudy.findFirst({
    where: {
      id: studyId,
      organizationId: orgId,
      projectId: project.id,
      archivedAt: null,
    },
    select: {
      id: true,
      title: true,
      version: true,
      hypothesesJson: true,
      parameters: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          key: true,
          label: true,
          unit: true,
          value: true,
          formula: true,
          provenance: true,
        },
      },
      lines: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          code: true,
          designation: true,
          unit: true,
          formula: true,
          declaredQuantity: true,
          validatedQuantity: true,
          role: true,
        },
      },
    },
  });
  if (!study) return null;

  const paramList = study.parameters.map((p) => ({
    id: p.id,
    key: p.key,
    label: p.label,
    value: p.value != null ? Number(p.value) : null,
    unit: p.unit,
    formula: p.formula,
    provenance: p.provenance,
  }));

  const lineList = study.lines.map((l) => ({
    id: l.id,
    code: l.code,
    designation: l.designation,
    unit: l.unit,
    formula: l.formula,
    declared_quantity: l.declaredQuantity != null ? Number(l.declaredQuantity) : null,
    validated_quantity: l.validatedQuantity != null ? Number(l.validatedQuantity) : null,
    role: l.role,
  }));

  const quoteLinks = await prisma.prepQuoteLink.findMany({
    where: { organizationId: orgId, studyId: study.id },
    select: { quoteLineId: true, quoteId: true, studyLineCode: true },
  });
  const schedLinks = await prisma.prepScheduleTakeoffLink.findMany({
    where: { organizationId: orgId },
    select: { planId: true, taskId: true, studyLineCode: true },
    take: 200,
  });
  // Restrict schedule links to plans of this study
  const plans = await prisma.prepSchedulePlan.findMany({
    where: { studyId: study.id, organizationId: orgId },
    select: { id: true },
  });
  const planIds = new Set(plans.map((p) => p.id));
  const relevantSched = schedLinks.filter((s) => planIds.has(s.planId));

  return buildChatgptContextSkeleton({
    section: "TAKEOFF",
    project,
    target: {
      entity_type: "PREP_STUDY",
      id: study.id,
      version: study.version,
      code: study.title,
    },
    data: {
      title: study.title,
      parameters: paramList,
      lines: lineList,
      quote_links: quoteLinks.map((l) => ({
        study_line_code: l.studyLineCode,
        quote_id: l.quoteId,
        quote_line_id: l.quoteLineId,
      })),
      schedule_links: relevantSched.map((s) => ({
        plan_id: s.planId,
        task_id: s.taskId,
        study_line_code: s.studyLineCode,
      })),
    },
    quoteItems: quoteLinks.map((l) => ({
      quote_item_id: l.quoteLineId,
      takeoff_link: { study_id: study.id, study_line_code: l.studyLineCode },
      canonical_resolution: buildCanonicalResolution({
        studyId: study.id,
        takeoffLineCode: l.studyLineCode,
      }),
    })),
  });
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
    },
    data: {
      title: plan.title,
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
    },
  });
}

async function buildVisitContext(
  orgId: string,
  project: { id: string; title: string },
  visitId: string,
): Promise<BeworkChatgptContextV1 | null> {
  const visit = await prisma.siteVisit.findFirst({
    where: {
      id: visitId,
      organizationId: orgId,
      projectId: project.id,
    },
    include: {
      measurements: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!visit) return null;

  return buildChatgptContextSkeleton({
    section: "VISIT",
    project,
    target: {
      entity_type: "SITE_VISIT",
      id: visit.id,
      version: 1,
      code: visit.subject,
    },
    data: {
      subject: visit.subject,
      client_name: visit.clientName,
      site_address: visit.siteAddress,
      measurements: visit.measurements.map((m) => ({
        measurement_id: m.id,
        label: m.label,
        unit: m.unit,
        length_m: m.lengthM != null ? Number(m.lengthM) : null,
        width_m: m.widthM != null ? Number(m.widthM) : null,
        height_m: m.heightM != null ? Number(m.heightM) : null,
        quantity: Number(m.computedQuantity),
        observation: m.observation,
      })),
      note: "Aucune FK mesure → paramètre métré : canonical_resolution = NONE sauf lien explicite futur.",
    },
  });
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
    return buildChatgptContextSkeleton({
      section: "FOLLOW_UP",
      project,
      target: {
        entity_type: "FOLLOW_UP_SHEET",
        id: sheet.id,
        version: Math.floor(sheet.updatedAt.getTime() / 1000),
        code: sheet.title,
      },
      data: {
        title: sheet.title,
        status: sheet.status,
        notes: sheet.notes,
        prep_schedule_plan_id: sheet.prepSchedulePlanId,
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

  return buildChatgptContextSkeleton({
    section,
    project,
    target: {
      entity_type: "SITE_DOCUMENT",
      id: doc.id,
      version: doc.versionNumber,
      code: doc.number,
    },
    data: {
      kind: doc.kind,
      title: doc.title,
      status: doc.status,
      quick_notes: doc.quickNotes,
      payload: doc.payloadJson,
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
