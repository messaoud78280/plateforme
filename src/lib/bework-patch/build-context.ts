/**
 * Construction bework_chatgpt_context_v1 par section — lecture seule.
 * N’invente jamais de parameter_id.
 * CTX-08 : TAKEOFF dérive du snapshot canonique (buildProjectContext → adapter).
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import {
  adaptVisitForChatgptContext,
  buildProjectContext,
  buildTakeoffEnrichTechSheetsContext,
  buildTakeoffModifyContext,
} from "@/lib/bework-context";
import { VISIT_MODIFY_INSTRUCTIONS } from "@/lib/bework-context/adapters";
import { computeVisitContextVersion } from "@/lib/bework-context/visit-context-version";
import { parseVisitPrep } from "@/lib/site-visits/types";
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
import { parsePrepWorkflow, parsePrepWorkflowSteps } from "@/lib/preparation/schedule/parse";
import {
  parseCrewJson,
  resolveWorkloadPersonDays,
} from "@/lib/preparation/schedule/crew";
import {
  asEquipmentJson,
  asStringListJson,
  asSuppliesJson,
  normalizeDependsOnJson,
  UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT,
} from "@/lib/bework-patch/operation-contracts";
import { buildSupplyContext } from "@/lib/bework-patch/build-supply-context";

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export type BeworkPatchContextPurpose =
  | "modify"
  | "enrich_tech_sheets";

export async function buildUniversalPatchContext(input: {
  orgId: string;
  section: BeworkPatchSection;
  projectId?: string | null;
  entityId: string;
  /** TAKEOFF : enrich_tech_sheets = fiches incomplètes uniquement + instruction auto. */
  purpose?: BeworkPatchContextPurpose | null;
}): Promise<BeworkChatgptContextV1 | null> {
  const projectId = input.projectId?.trim() || null;
  const purpose = input.purpose ?? "modify";

  if (input.section === "VISIT") {
    return buildVisitContextFlexible(input.orgId, projectId, input.entityId);
  }

  if (!projectId) return null;
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: input.orgId },
    select: { id: true, title: true },
  });
  if (!project) return null;

  switch (input.section) {
    case "QUOTE":
      return buildQuoteContext(input.orgId, project, input.entityId);
    case "TAKEOFF":
      return buildTakeoffContext(input.orgId, project, input.entityId, purpose);
    case "PLANNING":
      return buildPlanningContext(input.orgId, project, input.entityId);
    case "FOLLOW_UP":
      return buildFollowUpContext(input.orgId, project, input.entityId);
    case "REPORT":
    case "NOTICE":
      return buildDocumentContext(input.orgId, project, input.entityId, input.section);
    case "SUPPLY":
      return buildSupplyContext(input.orgId, project, input.entityId);
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
 * CTX-08 — TAKEOFF via resolver CURRENT + versions.
 * Deep-link `studyId` : peut exposer ARCHIVED (is_current false).
 * purpose=enrich_tech_sheets → lignes incomplètes + instruction auto ChatGPT.
 */
async function buildTakeoffContext(
  orgId: string,
  project: { id: string; title: string },
  studyId: string,
  purpose: BeworkPatchContextPurpose = "modify",
): Promise<BeworkChatgptContextV1 | null> {
  try {
    const ctx =
      purpose === "enrich_tech_sheets"
        ? await buildTakeoffEnrichTechSheetsContext({
            orgId,
            projectId: project.id,
            studyId,
          })
        : await buildTakeoffModifyContext({
            orgId,
            projectId: project.id,
            studyId,
          });
    if (ctx.project?.id !== project.id) return null;
    return ctx;
  } catch {
    return null;
  }
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
          description: true,
          durationDays: true,
          durationMode: true,
          lot: true,
          startDate: true,
          endDate: true,
          startHalf: true,
          endHalf: true,
          crewJson: true,
          dependsOnJson: true,
          preconditionsJson: true,
          controlsJson: true,
          safetyJson: true,
          equipmentJson: true,
          suppliesJson: true,
          quantitySnapshot: true,
          quantityUnit: true,
          driverTakeoffCode: true,
          rateId: true,
          rateValue: true,
          rateUnit: true,
          ratePer: true,
          parallelUnits: true,
        },
      },
    },
  });
  if (!plan) return null;

  const takeoffLinks = await prisma.prepScheduleTakeoffLink.findMany({
    where: { planId: plan.id, organizationId: orgId },
    select: { taskId: true, studyLineCode: true },
  });

  const study = await prisma.prepStudy.findFirst({
    where: { id: plan.studyId, organizationId: orgId },
    select: { workflowJson: true },
  });
  const workflow = parsePrepWorkflow(study?.workflowJson ?? null);
  const phaseByStep = new Map(
    workflow.steps.map((s) => [s.id, s.execution_phase_id ?? null]),
  );

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
      execution_phases: workflow.execution_phases.map((p) => ({
        id: p.id,
        label: p.label,
        role: p.role,
        order: p.order,
      })),
      /** Contrat parser réel — source operation-contracts (pas une doc dupliquée). */
      operation_contracts: {
        update_dependency: {
          ...UPDATE_DEPENDENCY_DEPENDS_ON_CONTRACT,
          invalid_forms: {
            string_array: {
              example: ["S-Q01-02"],
              result: "normalisé en [] — objets { step_id } requis",
            },
          },
        },
      },
      tasks: plan.tasks.map((t) => {
        const crew = parseCrewJson(t.crewJson);
        const wl = resolveWorkloadPersonDays({
          crewJson: t.crewJson,
          durationDays: Number(t.durationDays),
        });
        return {
          task_id: t.id,
          step_code: t.stepCode,
          name: t.name,
          description: t.description,
          duration_days: Number(t.durationDays),
          duration_mode: t.durationMode,
          lot: t.lot,
          execution_phase_id: phaseByStep.get(t.stepCode) ?? null,
          start_date: t.startDate ? t.startDate.toISOString().slice(0, 10) : null,
          end_date: t.endDate ? t.endDate.toISOString().slice(0, 10) : null,
          start_half: t.startHalf,
          end_half: t.endHalf,
          quantity:
            t.quantitySnapshot != null ? Number(t.quantitySnapshot) : null,
          unit: t.quantityUnit,
          rate_id: t.rateId,
          rate: t.rateValue != null ? Number(t.rateValue) : null,
          rate_unit: t.rateUnit,
          rate_per: t.ratePer,
          parallel_units: t.parallelUnits,
          crew_id: crew.crewId,
          crew_size: crew.crewSize,
          crew: crew.members,
          parallelizable: crew.parallelizable,
          workload_person_days: wl.value,
          workload_source: wl.source,
          preconditions: asStringListJson(t.preconditionsJson),
          controls: asStringListJson(t.controlsJson),
          safety: asStringListJson(t.safetyJson),
          equipment: asEquipmentJson(t.equipmentJson),
          supplies: asSuppliesJson(t.suppliesJson),
          depends_on: normalizeDependsOnJson(t.dependsOnJson),
          takeoff_codes: takeoffLinks
            .filter((l) => l.taskId === t.id)
            .map((l) => l.studyLineCode),
        };
      }),
      note:
        "base_version = revisionNumber. studyVersionAtGeneration = alignement métré (CTX-04) — une édition planning ne le synchronise pas. Ops exposées = ops commitables uniquement. Après update_duration / update_crew / update_productivity / update_dependency / update_workload (si durée impactée), les dates sont recalculées via computeSchedule (phases + leveling). depends_on : objets { step_id, type?, lag_days? } — voir data.operation_contracts.update_dependency et supported_operations[].field_contracts (pas un tableau de strings).",
    },
  });
}

/**
 * VISIT autonome (project facultatif) + enrichissement chantier si lié.
 */
async function buildVisitContextFlexible(
  orgId: string,
  projectId: string | null,
  visitId: string,
): Promise<BeworkChatgptContextV1 | null> {
  const visit = await prisma.siteVisit.findFirst({
    where: { id: visitId, organizationId: orgId },
    select: { id: true, projectId: true },
  });
  if (!visit) return null;
  if (projectId && visit.projectId && visit.projectId !== projectId) return null;

  const effectiveProjectId = visit.projectId || projectId;
  if (effectiveProjectId) {
    const snapshot = await buildProjectContext(effectiveProjectId, orgId, {
      includeLines: true,
    });
    if (snapshot) {
      const adapted = adaptVisitForChatgptContext(snapshot, visitId);
      if (adapted) return adapted;
    }
  }

  return buildStandaloneVisitContext(orgId, visitId);
}

async function buildStandaloneVisitContext(
  orgId: string,
  visitId: string,
): Promise<BeworkChatgptContextV1 | null> {
  const visit = await prisma.siteVisit.findFirst({
    where: { id: visitId, organizationId: orgId },
    select: {
      id: true,
      subject: true,
      status: true,
      clientName: true,
      siteName: true,
      siteAddress: true,
      clientNeed: true,
      comments: true,
      contactName: true,
      contactPhone: true,
      scheduledAt: true,
      lotsJson: true,
      zonesJson: true,
      constraintsJson: true,
      findingsJson: true,
      proposedWorksJson: true,
      commercialJson: true,
      prepJson: true,
      organization: { select: { id: true, name: true } },
      responsible: { select: { id: true, name: true } },
      measurements: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          zone: true,
          label: true,
          measureType: true,
          unit: true,
          lengthM: true,
          widthM: true,
          heightM: true,
          quantityValue: true,
          computedQuantity: true,
          lot: true,
          observation: true,
        },
      },
      medias: {
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          name: true,
          kind: true,
          category: true,
          caption: true,
          observation: true,
          hypothesis: true,
          origin: true,
          fileUrl: true,
          storagePath: true,
        },
      },
    },
  });
  if (!visit) return null;

  const prep = parseVisitPrep(visit.prepJson);
  const version = computeVisitContextVersion({
    id: visit.id,
    subject: visit.subject,
    status: visit.status,
    clientName: visit.clientName,
    siteAddress: visit.siteAddress,
    clientNeed: visit.clientNeed,
    comments: visit.comments,
    measurements: visit.measurements.map((m) => ({
      id: m.id,
      zone: m.zone,
      label: m.label,
      measureType: m.measureType,
      unit: m.unit,
      lengthM: m.lengthM != null ? d(m.lengthM) : null,
      widthM: m.widthM != null ? d(m.widthM) : null,
      heightM: m.heightM != null ? d(m.heightM) : null,
      quantityValue: m.quantityValue != null ? d(m.quantityValue) : null,
      computedQuantity: d(m.computedQuantity),
      lot: m.lot,
      observation: m.observation,
    })),
    mediaRefs: visit.medias.map((m) => ({
      id: m.id,
      name: m.name,
      kind: m.kind,
      category: m.category,
      observation: m.observation ?? m.caption,
      hasUrl: Boolean(m.fileUrl || m.storagePath),
    })),
  });

  const skeleton = buildChatgptContextSkeleton({
    section: "VISIT",
    project: null,
    target: {
      entity_type: "SITE_VISIT",
      id: visit.id,
      version,
      code: visit.subject,
      base_version: version,
    },
    data: {
      interaction_mode: "MODIFY",
      project: null,
      client: {
        name: visit.clientName,
        phone: visit.contactPhone,
        email: prep.contactEmail ?? null,
        contact_name: visit.contactName,
      },
      site: {
        name: visit.siteName,
        address: visit.siteAddress,
        zip_code: prep.zipCode ?? null,
        city: prep.city ?? null,
      },
      visit: {
        subject: visit.subject,
        status: visit.status,
        scheduled_at: visit.scheduledAt?.toISOString() ?? null,
        responsible: visit.responsible?.name ?? null,
        client_need: visit.clientNeed,
        lots: visit.lotsJson,
        zones: visit.zonesJson,
        comments: visit.comments,
        field_notes: prep.fieldNotes ?? null,
        constraints: visit.constraintsJson,
        findings: visit.findingsJson,
        proposed_works: visit.proposedWorksJson,
        commercial: visit.commercialJson,
      },
      measurements: visit.measurements.map((m) => ({
        measurement_id: m.id,
        zone: m.zone,
        label: m.label,
        measure_type: m.measureType,
        unit: m.unit,
        length_m: m.lengthM != null ? d(m.lengthM) : null,
        width_m: m.widthM != null ? d(m.widthM) : null,
        height_m: m.heightM != null ? d(m.heightM) : null,
        quantity_value: m.quantityValue != null ? d(m.quantityValue) : null,
        quantity: d(m.computedQuantity),
        lot: m.lot,
        observation: m.observation,
        provenance_kind: "MEASURE",
      })),
      media_refs: visit.medias.map((m) => ({
        id: m.id,
        name: m.name,
        kind: m.kind,
        category: m.category,
        caption: m.caption,
        observation: m.observation,
        hypothesis: m.hypothesis,
        origin: m.origin,
        has_url: Boolean(m.fileUrl || m.storagePath),
        provenance_kind: m.kind === "DOCUMENT" ? "PLAN" : "UNKNOWN",
      })),
      plan_sources: [],
      counts: {
        measurements: visit.measurements.length,
        media_refs: visit.medias.length,
        plan_sources: 0,
      },
      instructions: [...VISIT_MODIFY_INSTRUCTIONS],
      note: "Visite autonome — aucun chantier lié. Project = null. Métré = étape suivante.",
    },
  });

  return {
    ...skeleton,
    organization: visit.organization
      ? { id: visit.organization.id, name: visit.organization.name }
      : { id: orgId, name: "" },
    project: null,
  };
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
