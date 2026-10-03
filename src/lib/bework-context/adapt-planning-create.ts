/**
 * Contexte ChatGPT CREATE planning — PrepStudy (+ devis facultatif) → bework_schedule_bundle_v1.
 * Preview = computeSchedule ; commit = écriture JSON étude + commitPrepSchedule CURRENT.
 * Aucun métier hardcodé. Pas de second moteur.
 */
import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { BEWORK_CONTEXT_FORMAT, BEWORK_CONTEXT_SCHEMA_VERSION } from "@/lib/bework-patch/types";
import { getPrepStudyView, PrepError } from "@/lib/preparation/service";
import { computeStudy } from "@/lib/preparation/engine/compute";
import { displayUnit } from "@/lib/preparation/units";
import { isPrepLineTransferable } from "@/lib/preparation/quote-bridge/description";
import {
  parsePrepResources,
  parsePrepSchedule,
  parsePrepWorkflow,
} from "@/lib/preparation/schedule/parse";
import { computeSchedule } from "@/lib/preparation/schedule/compute";
import {
  makeTakeoffQuantityResolver,
  resolveCanonicalTakeoffQuantity,
} from "@/lib/preparation/schedule/resolve-planning-source";
import { commitPrepSchedule } from "@/lib/preparation/schedule/transfer";
import type {
  PrepResourcesDTO,
  PrepScheduleDTO,
  PrepStepKind,
  PrepWorkflowDTO,
} from "@/lib/preparation/schedule/types";
import { STEP_KIND_LABELS } from "@/lib/preparation/schedule/types";
import { listProjectPlanCandidateFiles } from "@/lib/preparation/plan-source";

export const BEWORK_SCHEDULE_BUNDLE_FORMAT = "bework_schedule_bundle_v1" as const;

export const PLANNING_CREATE_INSTRUCTIONS = [
  "Tu es un copilote organisation chantier BTP. Tu proposes ; le professionnel décide.",
  "Mode CREATE : aucun PrepSchedulePlan CURRENT n’existe encore pour ce chantier.",
  "Analyse d’abord le métré (source technique des quantités), le devis s’il existe, la visite et les contraintes.",
  "Discute avant le JSON : démarrage, équipes, rendements, dépendances, coactivité, WAIT, contrôles.",
  "validated_quantity du métré est prioritaire. Ne jamais inventer une quantité opérationnelle.",
  "Les rôles indicator / totaux / quantités négatives ne sont pas des postes exécutables sans validation explicite.",
  "Un rendement ou une équipe proposée reste PLANNING_ASSUMPTION jusqu’à validation professionnelle.",
  "depends_on = objets { step_id, type: FS|SS|FF, lag_days } — jamais un tableau de strings.",
  "Évite les dépendances redondantes (chaîne FS suffisante).",
  "crew_id génériques (ex. TERR-A, MAC-A) uniquement si validés — jamais de salariés fictifs.",
  "WAIT = attente technique sans équipe active.",
  "Quand les choix sont validés, produis UNIQUEMENT un JSON bework_schedule_bundle_v1.",
  "N’impose aucun corps d’état préfabriqué hors sources fournies.",
] as const;

export type BeworkScheduleBundleV1 = {
  format: typeof BEWORK_SCHEDULE_BUNDLE_FORMAT;
  title?: string | null;
  quote_id?: string | null;
  resources: PrepResourcesDTO;
  workflow: PrepWorkflowDTO;
  schedule: PrepScheduleDTO;
  assumptions?: string[];
  warnings?: string[];
};

export type BeworkPlanningCreateContextV1 = {
  type: typeof BEWORK_CONTEXT_FORMAT;
  schema_version: typeof BEWORK_CONTEXT_SCHEMA_VERSION;
  section: "PLANNING";
  interaction_mode: "CREATE";
  expected_output: typeof BEWORK_SCHEDULE_BUNDLE_FORMAT;
  organization: { id: string; name: string };
  project: {
    id: string;
    title: string;
    description: string | null;
    site_address: string | null;
    site_city: string | null;
    status: string | null;
    chantier_status: string | null;
    client: { name: string | null; company: string | null } | null;
  };
  takeoff: {
    study_id: string;
    version: number;
    title: string;
    scope: { id: string; name: string; code: string | null } | null;
    lines: Array<{
      code: string;
      designation: string;
      description: string | null;
      unit: string;
      lot: string | null;
      role: string | null;
      provenance: string | null;
      validated_quantity: number | null;
      computed_quantity: number | null;
      declared_quantity: number | null;
      quantity_for_planning: number | null;
      quantity_status: string;
      executable: boolean;
      notes: string | null;
    }>;
    params: Array<{
      key: string;
      label: string;
      value: number | null;
      unit: string;
      provenance: string | null;
    }>;
  };
  quote: {
    id: string;
    number: string;
    status: string;
    version_number: number | null;
    subject: string;
    lines: Array<{
      id: string;
      designation: string;
      quantity: number;
      unit: string;
      study_line_code: string | null;
    }>;
  } | null;
  visit_summary: {
    id: string;
    subject: string | null;
    client_need: string | null;
    constraints: unknown;
    comments: string | null;
  } | null;
  plan_candidates: Array<{ id: string; name: string }>;
  sources_fingerprint: string;
  data: { planning: null; note: string };
  instructions: string[];
  target: {
    entity_type: "PREP_SCHEDULE_PLAN";
    id: null;
    version: 0;
    base_version: 0;
    create_from_study_id: string;
    create_on_project_id: string;
  };
};

export type PlanningCreatePreviewTask = {
  stepId: string;
  name: string;
  kind: string;
  kindLabel: string;
  lot: string | null;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
  durationMode: string;
  quantity: number | null;
  quantityUnit: string | null;
  rateLabel: string | null;
  rateValue: number | null;
  crewLabel: string | null;
  dependsOn: Array<{ stepId: string; type: string }>;
  takeoffIds: string[];
  assumptionFlags: string[];
};

export type PlanningCreatePreviewResult = {
  ok: true;
  bundleFingerprint: string;
  sourcesFingerprint: string;
  studyId: string;
  studyVersion: number;
  quoteId: string | null;
  title: string;
  startDate: string | null;
  baseDurationWorkingDays: number;
  baseEndDate: string | null;
  tasks: PlanningCreatePreviewTask[];
  dependencyCount: number;
  crewCount: number;
  assumptionCount: number;
  toConfirmCount: number;
  warnings: string[];
  errors: string[];
  alreadyImported: boolean;
  assumptions: string[];
};

function lineToQtySource(
  line: {
    code: string;
    unit: string;
    lot: string | null;
    validatedQuantity: number | null;
    declaredQuantity: number | null;
    provenance: string | null;
  },
  engineValue: number | null,
) {
  return {
    code: line.code,
    unit: line.unit,
    lot: line.lot,
    validatedQuantity: line.validatedQuantity,
    declaredQuantity: line.declaredQuantity,
    computedQuantity: null as number | null,
    engineValue,
    provenance: line.provenance,
  };
}

export function computePlanningCreateSourcesFingerprint(input: {
  projectId: string;
  studyId: string;
  studyVersion: number;
  studyUpdatedAt: Date | string;
  lineCodes: string[];
  quoteId: string | null;
  quoteVersionNumber: number | null;
  visitId: string | null;
  visitUpdatedAt: Date | string | null;
}): string {
  const payload = {
    projectId: input.projectId,
    studyId: input.studyId,
    studyVersion: input.studyVersion,
    studyUpdatedAt:
      input.studyUpdatedAt instanceof Date
        ? input.studyUpdatedAt.toISOString()
        : String(input.studyUpdatedAt),
    lines: [...input.lineCodes].sort(),
    quoteId: input.quoteId,
    quoteVersionNumber: input.quoteVersionNumber,
    visit: input.visitId
      ? {
          id: input.visitId,
          updatedAt:
            input.visitUpdatedAt instanceof Date
              ? input.visitUpdatedAt.toISOString()
              : input.visitUpdatedAt,
        }
      : null,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function fingerprintBundle(bundle: BeworkScheduleBundleV1): string {
  const payload = {
    format: bundle.format,
    title: bundle.title ?? null,
    quote_id: bundle.quote_id ?? null,
    resources: bundle.resources,
    workflow: bundle.workflow,
    schedule: bundle.schedule,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function extractJsonObject(raw: string): unknown {
  const t = raw.trim();
  if (!t) throw Object.assign(new Error("JSON manquant"), { status: 422 });
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(t.slice(start, end + 1));
    }
    throw Object.assign(new Error("JSON illisible"), { status: 422, code: "PARSE_ERROR" });
  }
}

export function parseBeworkScheduleBundle(raw: string): {
  ok: true;
  bundle: BeworkScheduleBundleV1;
  fingerprint: string;
  warnings: string[];
} {
  const obj = extractJsonObject(raw);
  if (!obj || typeof obj !== "object") {
    throw Object.assign(new Error("JSON invalide"), { status: 422, code: "PARSE_ERROR" });
  }
  const o = obj as Record<string, unknown>;
  const format = String(o.format ?? o.type ?? "");
  if (
    format &&
    format !== BEWORK_SCHEDULE_BUNDLE_FORMAT &&
    format !== "bework_prep_bundle_v1"
  ) {
    throw Object.assign(
      new Error(
        `Format attendu : ${BEWORK_SCHEDULE_BUNDLE_FORMAT} (reçu : ${format}).`,
      ),
      { status: 422, code: "PARSE_ERROR" },
    );
  }

  const resources = parsePrepResources(o.resources ?? {});
  const workflow = parsePrepWorkflow(o.workflow ?? { steps: [] });
  const schedule = parsePrepSchedule(o.schedule ?? null);
  if (!schedule || !workflow.steps.length) {
    throw Object.assign(
      new Error("Le JSON doit contenir workflow.steps et schedule.tasks"),
      { status: 422, code: "PARSE_ERROR" },
    );
  }

  const warnings: string[] = [];
  if (Array.isArray(o.warnings)) {
    for (const w of o.warnings) {
      if (typeof w === "string" && w.trim()) warnings.push(w.trim());
    }
  }
  const assumptions: string[] = [];
  if (Array.isArray(o.assumptions)) {
    for (const a of o.assumptions) {
      if (typeof a === "string" && a.trim()) assumptions.push(a.trim());
    }
  }

  // Dépendances strings → erreur claire
  for (const task of schedule.tasks) {
    for (const dep of task.depends_on) {
      if (typeof (dep as unknown) === "string") {
        throw Object.assign(
          new Error(
            "depends_on doit être des objets { step_id, type, lag_days }, pas des strings.",
          ),
          { status: 422, code: "PARSE_ERROR" },
        );
      }
    }
  }

  const bundle: BeworkScheduleBundleV1 = {
    format: BEWORK_SCHEDULE_BUNDLE_FORMAT,
    title: typeof o.title === "string" ? o.title : null,
    quote_id: typeof o.quote_id === "string" ? o.quote_id : typeof o.quoteId === "string" ? o.quoteId : null,
    resources,
    workflow,
    schedule,
    assumptions,
    warnings,
  };
  return { ok: true, bundle, fingerprint: fingerprintBundle(bundle), warnings };
}

export async function loadCurrentPlanningCreateSourcesFingerprint(input: {
  orgId: string;
  projectId: string;
  studyId?: string | null;
}): Promise<{
  fingerprint: string;
  studyId: string;
  studyVersion: number;
  quoteId: string | null;
}> {
  const study = await prisma.prepStudy.findFirst({
    where: {
      organizationId: input.orgId,
      projectId: input.projectId,
      archivedAt: null,
      ...(input.studyId ? { id: input.studyId } : {}),
    },
    select: {
      id: true,
      version: true,
      updatedAt: true,
      lines: { select: { code: true }, orderBy: { sortOrder: "asc" } },
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

  const visit = await prisma.siteVisit.findFirst({
    where: { organizationId: input.orgId, projectId: input.projectId },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return {
    fingerprint: computePlanningCreateSourcesFingerprint({
      projectId: input.projectId,
      studyId: study.id,
      studyVersion: study.version,
      studyUpdatedAt: study.updatedAt,
      lineCodes: study.lines.map((l) => l.code),
      quoteId: quote?.id ?? null,
      quoteVersionNumber: quote?.currentVersion?.versionNumber ?? null,
      visitId: visit?.id ?? null,
      visitUpdatedAt: visit?.updatedAt ?? null,
    }),
    studyId: study.id,
    studyVersion: study.version,
    quoteId: quote?.id ?? null,
  };
}

export async function buildPlanningCreateContext(input: {
  orgId: string;
  projectId: string;
  studyId?: string | null;
}): Promise<BeworkPlanningCreateContextV1> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.orgId },
    select: {
      id: true,
      title: true,
      description: true,
      siteAddress: true,
      siteCity: true,
      status: true,
      chantierStatus: true,
      organization: { select: { id: true, name: true } },
      client: { select: { name: true, company: true } },
    },
  });
  if (!project?.organization) {
    throw Object.assign(new Error("Chantier introuvable dans votre organisation"), {
      code: "PROJECT_NOT_FOUND",
      status: 404,
    });
  }

  const existingPlan = await prisma.prepSchedulePlan.findFirst({
    where: {
      organizationId: input.orgId,
      projectId: input.projectId,
      status: { in: ["CURRENT", "INITIAL"] },
    },
    select: { id: true, title: true, revisionNumber: true, status: true },
    orderBy: { updatedAt: "desc" },
  });
  if (existingPlan) {
    throw Object.assign(
      new Error(
        `Un planning existe déjà (rév. ${existingPlan.revisionNumber}). Utilisez « Modifier avec ChatGPT ».`,
      ),
      {
        code: "PLAN_ALREADY_EXISTS",
        status: 409,
        planId: existingPlan.id,
      },
    );
  }

  const studyRow = await prisma.prepStudy.findFirst({
    where: {
      organizationId: input.orgId,
      projectId: input.projectId,
      archivedAt: null,
      ...(input.studyId ? { id: input.studyId } : {}),
    },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!studyRow) {
    throw Object.assign(new Error("Préparez d’abord le métré avant le planning."), {
      code: "STUDY_REQUIRED",
      status: 422,
    });
  }

  const study = await getPrepStudyView(input.orgId, studyRow.id);
  if (!study) {
    throw Object.assign(new Error("Métré introuvable"), {
      code: "STUDY_NOT_FOUND",
      status: 404,
    });
  }
  if (study.project.id !== input.projectId) {
    throw Object.assign(new Error("Ce métré appartient à un autre chantier"), {
      code: "PROJECT_MISMATCH",
      status: 403,
    });
  }

  const engine = computeStudy({ params: study.params, lines: study.lines });
  const lines = study.lines.map((line) => {
    const node = engine.nodes.get(line.code);
    const eng =
      node?.value != null && Number.isFinite(node.value) ? Number(node.value) : null;
    const executable =
      isPrepLineTransferable(line.role) &&
      line.role !== "indicator" &&
      (eng == null || eng >= 0);
    const resolved = resolveCanonicalTakeoffQuantity(
      lineToQtySource(line, eng),
      eng,
    );
    let quantity_status = "Quantité absente — à confirmer";
    if (line.validatedQuantity != null) quantity_status = "Quantité validée";
    else if (eng != null) quantity_status = "Quantité calculée";
    else if (line.declaredQuantity != null) quantity_status = "Quantité déclarée";
    if (!executable) {
      quantity_status =
        line.role === "indicator" || (eng != null && eng < 0)
          ? "Indicateur / non exécutable"
          : quantity_status;
    }
    return {
      code: line.code,
      designation: line.designation,
      description: line.description,
      unit: displayUnit(line.unit) || line.unit,
      lot: line.lot,
      role: line.role,
      provenance: line.provenance,
      validated_quantity: line.validatedQuantity,
      computed_quantity: eng,
      declared_quantity: line.declaredQuantity,
      quantity_for_planning: executable ? resolved.quantity : null,
      quantity_status,
      executable,
      notes: line.notes,
    };
  });

  const quote = await prisma.commercialQuote.findFirst({
    where: { organizationId: input.orgId, projectId: input.projectId },
    select: {
      id: true,
      number: true,
      status: true,
      subject: true,
      currentVersion: {
        select: {
          versionNumber: true,
          lines: {
            orderBy: { sortOrder: "asc" },
            take: 200,
            select: {
              id: true,
              designation: true,
              quantity: true,
              unit: true,
              reference: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const prepLinks = quote
    ? await prisma.prepQuoteLink.findMany({
        where: { organizationId: input.orgId, quoteId: quote.id },
        select: { quoteLineId: true, studyLineCode: true },
      })
    : [];
  const linkByQuoteLine = new Map(prepLinks.map((l) => [l.quoteLineId, l.studyLineCode]));

  const visit = await prisma.siteVisit.findFirst({
    where: { organizationId: input.orgId, projectId: input.projectId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      subject: true,
      clientNeed: true,
      constraintsJson: true,
      comments: true,
      updatedAt: true,
    },
  });

  const planFiles = await listProjectPlanCandidateFiles({
    projectId: input.projectId,
    take: 20,
  });

  const fingerprint = computePlanningCreateSourcesFingerprint({
    projectId: input.projectId,
    studyId: study.id,
    studyVersion: study.version,
    studyUpdatedAt: study.updatedAt,
    lineCodes: study.lines.map((l) => l.code),
    quoteId: quote?.id ?? null,
    quoteVersionNumber: quote?.currentVersion?.versionNumber ?? null,
    visitId: visit?.id ?? null,
    visitUpdatedAt: visit?.updatedAt ?? null,
  });

  return {
    type: BEWORK_CONTEXT_FORMAT,
    schema_version: BEWORK_CONTEXT_SCHEMA_VERSION,
    section: "PLANNING",
    interaction_mode: "CREATE",
    expected_output: BEWORK_SCHEDULE_BUNDLE_FORMAT,
    organization: {
      id: project.organization.id,
      name: project.organization.name,
    },
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      site_address: project.siteAddress,
      site_city: project.siteCity,
      status: project.status,
      chantier_status: project.chantierStatus,
      client: project.client
        ? { name: project.client.name, company: project.client.company }
        : null,
    },
    takeoff: {
      study_id: study.id,
      version: study.version,
      title: study.title,
      scope: study.scope,
      lines,
      params: study.params.map((p) => ({
        key: p.key,
        label: p.label,
        value: p.value,
        unit: displayUnit(p.unit) || p.unit,
        provenance: p.provenance,
      })),
    },
    quote: quote
      ? {
          id: quote.id,
          number: quote.number,
          status: quote.status,
          version_number: quote.currentVersion?.versionNumber ?? null,
          subject: quote.subject,
          lines: (quote.currentVersion?.lines ?? []).map((l) => ({
            id: l.id,
            designation: l.designation,
            quantity: d(l.quantity),
            unit: l.unit,
            study_line_code: linkByQuoteLine.get(l.id) ?? l.reference ?? null,
          })),
        }
      : null,
    visit_summary: visit
      ? {
          id: visit.id,
          subject: visit.subject,
          client_need: visit.clientNeed,
          constraints: visit.constraintsJson,
          comments: visit.comments,
        }
      : null,
    plan_candidates: planFiles.map((f) => ({ id: f.id, name: f.name })),
    sources_fingerprint: fingerprint,
    data: {
      planning: null,
      note: "Discutez l’organisation chantier. Puis produisez bework_schedule_bundle_v1.",
    },
    instructions: [...PLANNING_CREATE_INSTRUCTIONS],
    target: {
      entity_type: "PREP_SCHEDULE_PLAN",
      id: null,
      version: 0,
      base_version: 0,
      create_from_study_id: study.id,
      create_on_project_id: input.projectId,
    },
  };
}

function assumptionFlagsForStep(
  step: PrepWorkflowDTO["steps"][number],
  resources: PrepResourcesDTO,
): string[] {
  const flags: string[] = [];
  const duration = step.duration;
  if (duration.mode === "computed") {
    const rate = resources.rates.find((r) => r.id === duration.rate_id);
    const prov = (rate?.provenance ?? "").toUpperCase();
    if (
      !rate ||
      prov.includes("HYPOTH") ||
      prov.includes("ASSUMPTION") ||
      prov.includes("PLANNING_ASSUMPTION") ||
      prov.includes("AI")
    ) {
      flags.push("HYPOTHÈSE DE PLANIFICATION — rendement");
    }
  } else if (duration.mode === "fixed") {
    const prov = (duration.provenance ?? "").toUpperCase();
    if (prov.includes("HYPOTH") || prov.includes("ASSUMPTION") || prov.includes("AI")) {
      flags.push("HYPOTHÈSE DE PLANIFICATION — durée");
    }
  }
  if (!step.crew_id && step.kind === "work") {
    flags.push("Équipe à confirmer");
  }
  if (step.crew_id && !(step.crew_size != null && step.crew_size > 0) && step.kind === "work") {
    flags.push("Effectif à confirmer");
  }
  return flags;
}

export async function previewPlanningCreateFromBundle(input: {
  orgId: string;
  projectId: string;
  raw: string;
  sourcesFingerprint: string;
  studyId?: string | null;
}): Promise<PlanningCreatePreviewResult> {
  const current = await loadCurrentPlanningCreateSourcesFingerprint({
    orgId: input.orgId,
    projectId: input.projectId,
    studyId: input.studyId,
  });
  if (input.sourcesFingerprint && input.sourcesFingerprint !== current.fingerprint) {
    throw Object.assign(
      new Error(
        "Les données du chantier ont changé. Analysez de nouveau la proposition.",
      ),
      {
        code: "PREVIEW_STALE",
        status: 409,
        sourcesFingerprint: current.fingerprint,
      },
    );
  }

  const parsed = parseBeworkScheduleBundle(input.raw);
  const study = await getPrepStudyView(input.orgId, current.studyId);
  if (!study) throw new PrepError("Métré introuvable", 404);

  const engine = computeStudy({ params: study.params, lines: study.lines });
  const qtySourceByCode = new Map(
    study.lines.map((l) => {
      const eng = engine.nodes.get(l.code)?.value ?? null;
      const engNum = eng != null && Number.isFinite(eng) ? Number(eng) : null;
      return [l.code, lineToQtySource(l, engNum)];
    }),
  );
  const qtyOf = makeTakeoffQuantityResolver(qtySourceByCode, (c) => {
    const v = engine.nodes.get(c)?.value ?? null;
    return v != null && Number.isFinite(v) ? Number(v) : null;
  });
  const lineByCode = new Map(study.lines.map((l) => [l.code, l]));

  const computed = computeSchedule({
    workflowSteps: parsed.bundle.workflow.steps,
    schedule: parsed.bundle.schedule,
    resources: parsed.bundle.resources,
    qtyOf,
    qtyUnitOf: (c) => {
      const l = lineByCode.get(c);
      return l ? displayUnit(l.unit) || l.unit : null;
    },
    executionPhases: parsed.bundle.workflow.execution_phases,
  });

  const laborById = new Map(parsed.bundle.resources.labor.map((l) => [l.id, l.role]));
  const rateById = new Map(parsed.bundle.resources.rates.map((r) => [r.id, r]));
  const stepById = new Map(parsed.bundle.workflow.steps.map((s) => [s.id, s]));

  const tasks: PlanningCreatePreviewTask[] = computed.placed.map((t) => {
    const step = stepById.get(t.stepId);
    const rate = t.duration.rateId ? rateById.get(t.duration.rateId) : null;
    const crewParts =
      step?.crew.map((c) => {
        const role = laborById.get(c.labor_id) ?? c.labor_id;
        return `${c.count}× ${role}`;
      }) ?? [];
    const crewLabel =
      [step?.crew_id, crewParts.join(", ")].filter(Boolean).join(" · ") || null;
    return {
      stepId: t.stepId,
      name: t.name,
      kind: t.kind,
      kindLabel: STEP_KIND_LABELS[t.kind as PrepStepKind] ?? t.kind,
      lot: t.lot,
      startDate: t.startDate,
      endDate: t.endDate,
      durationDays: t.duration.durationDays,
      durationMode: t.duration.mode,
      quantity: t.duration.quantity,
      quantityUnit: t.duration.quantityUnit,
      rateLabel: rate?.label ?? null,
      rateValue: t.duration.rateValue,
      crewLabel,
      dependsOn: t.dependsOn.map((d) => ({ stepId: d.stepId, type: d.type })),
      takeoffIds: t.takeoffIds,
      assumptionFlags: step
        ? assumptionFlagsForStep(step, parsed.bundle.resources)
        : [],
    };
  });

  const dependencyCount = tasks.reduce((n, t) => n + t.dependsOn.length, 0);
  const crewIds = new Set(
    parsed.bundle.workflow.steps.map((s) => s.crew_id).filter(Boolean),
  );
  const assumptionFlags = tasks.flatMap((t) => t.assumptionFlags);
  const assumptions = [
    ...(parsed.bundle.assumptions ?? []),
    ...[...new Set(assumptionFlags)],
  ];
  const toConfirmCount = tasks.filter(
    (t) =>
      t.assumptionFlags.length > 0 ||
      (t.kind === "work" && (t.quantity == null || !t.crewLabel)),
  ).length;

  const prior = await prisma.prepSchedulePlan.findUnique({
    where: {
      organizationId_idempotencyKey: {
        organizationId: input.orgId,
        idempotencyKey: `chatgpt-planning-create:${parsed.fingerprint}`,
      },
    },
    select: { id: true, title: true },
  });

  const warnings = [
    ...parsed.warnings,
    ...(parsed.bundle.warnings ?? []),
    ...computed.warnings,
  ];
  if (prior) {
    warnings.push(`Ce JSON a déjà créé le planning « ${prior.title} ».`);
  }

  return {
    ok: true,
    bundleFingerprint: parsed.fingerprint,
    sourcesFingerprint: current.fingerprint,
    studyId: current.studyId,
    studyVersion: current.studyVersion,
    quoteId: parsed.bundle.quote_id ?? current.quoteId,
    title:
      parsed.bundle.title?.trim() ||
      `Planning — ${study.title}`,
    startDate: computed.startDate,
    baseDurationWorkingDays: computed.baseDurationWorkingDays ?? 0,
    baseEndDate: computed.baseEnd?.date ?? null,
    tasks,
    dependencyCount,
    crewCount: crewIds.size,
    assumptionCount: assumptions.length,
    toConfirmCount,
    warnings,
    errors: computed.errors,
    alreadyImported: Boolean(prior),
    assumptions,
  };
}

export async function commitPlanningCreateFromBundle(input: {
  orgId: string;
  projectId: string;
  userId: string;
  raw: string;
  sourcesFingerprint: string;
  studyId?: string | null;
  allowDuplicate?: boolean;
}): Promise<{
  ok: true;
  planId: string;
  studyId: string;
  href: string;
  action: "created" | "idempotent";
  taskCount: number;
  baseDurationWorkingDays: number | null;
}> {
  const preview = await previewPlanningCreateFromBundle({
    orgId: input.orgId,
    projectId: input.projectId,
    raw: input.raw,
    sourcesFingerprint: input.sourcesFingerprint,
    studyId: input.studyId,
  });

  if (preview.errors.length) {
    throw Object.assign(new Error(preview.errors[0]!), {
      code: "SCHEDULE_ERROR",
      status: 422,
      errors: preview.errors,
    });
  }

  const idempotencyKey = `chatgpt-planning-create:${preview.bundleFingerprint}`;
  const existing = await prisma.prepSchedulePlan.findUnique({
    where: {
      organizationId_idempotencyKey: {
        organizationId: input.orgId,
        idempotencyKey,
      },
    },
  });
  if (existing && !input.allowDuplicate) {
    return {
      ok: true,
      planId: existing.id,
      studyId: preview.studyId,
      href: `/dashboard/visites-metres/etudes/${preview.studyId}/planning/${existing.id}`,
      action: "idempotent",
      taskCount: preview.tasks.length,
      baseDurationWorkingDays:
        existing.baseDurationWorkingDays != null
          ? d(existing.baseDurationWorkingDays)
          : preview.baseDurationWorkingDays,
    };
  }

  // Bloquer si un CURRENT/INITIAL est apparu entre-temps
  if (!input.allowDuplicate) {
    const other = await prisma.prepSchedulePlan.findFirst({
      where: {
        organizationId: input.orgId,
        projectId: input.projectId,
        status: { in: ["CURRENT", "INITIAL"] },
      },
      select: { id: true, revisionNumber: true },
    });
    if (other) {
      throw Object.assign(
        new Error(
          `Un planning existe déjà (rév. ${other.revisionNumber}). Utilisez « Modifier avec ChatGPT ».`,
        ),
        { code: "PLAN_ALREADY_EXISTS", status: 409, planId: other.id },
      );
    }
  }

  const parsed = parseBeworkScheduleBundle(input.raw);
  const key =
    existing && input.allowDuplicate
      ? `${idempotencyKey}:copy:${Date.now()}`
      : idempotencyKey;

  // Persister resources/workflow/schedule sur l’étude (contrat moteur existant)
  await prisma.prepStudy.update({
    where: { id: preview.studyId },
    data: {
      resourcesJson: parsed.bundle.resources as unknown as Prisma.InputJsonValue,
      workflowJson: parsed.bundle.workflow as unknown as Prisma.InputJsonValue,
      scheduleJson: parsed.bundle.schedule as unknown as Prisma.InputJsonValue,
      updatedById: input.userId,
    },
  });

  try {
    const commit = await commitPrepSchedule({
      orgId: input.orgId,
      studyId: preview.studyId,
      userId: input.userId,
      idempotencyKey: key,
      selectedStepIds: preview.tasks.map((t) => t.stepId),
      quoteId: preview.quoteId,
      title: preview.title,
    });

    // Premier planning chantier = CURRENT (Phases 1–2)
    await prisma.prepSchedulePlan.update({
      where: { id: commit.planId },
      data: {
        status: "CURRENT",
        revisionKind: "CURRENT",
        scopeId: null,
        ...(preview.quoteId ? { quoteId: preview.quoteId } : {}),
      },
    });

    return {
      ok: true,
      planId: commit.planId,
      studyId: preview.studyId,
      href: commit.href,
      action: commit.action,
      taskCount: commit.taskCount,
      baseDurationWorkingDays: commit.baseDurationWorkingDays,
    };
  } catch (e) {
    // Best-effort : ne laisse pas un JSON partiel sans plan si échec commit
    // (les JSON study restent utilisables pour retry — acceptable)
    throw e;
  }
}
