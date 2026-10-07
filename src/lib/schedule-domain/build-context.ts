/**
 * Contexte ChatGPT Planning V2 — expected_output = bework_schedule_ai_v1.
 * Contrat / JSON Schema dérivés du code (ai-contract), jamais écrits à la main dans React.
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { getPrepStudyView } from "@/lib/preparation/service";
import { computeStudy } from "@/lib/preparation/engine/compute";
import { displayUnit } from "@/lib/preparation/units";
import { isPrepLineTransferable } from "@/lib/preparation/quote-bridge/description";
import { resolveCanonicalTakeoffQuantity } from "@/lib/preparation/schedule/resolve-planning-source";
import {
  AI_SCHEDULE_V1_BUSINESS_RULES,
  BEWORK_SCHEDULE_AI_FORMAT,
  getAiScheduleBundleV1JsonSchema,
} from "./ai-contract";
import { buildMinimalAiScheduleExample } from "./planning-v2-ui";
import { loadSourceContextFromDb } from "./repository/load-source-context";

export const PLANNING_V2_CREATE_INSTRUCTIONS = [
  "Tu es un copilote organisation chantier BTP. Tu proposes ; le professionnel décide.",
  "Mode CREATE Planning V2 : produis uniquement bework_schedule_ai_v1.",
  "Analyse d’abord le métré (quantités), le devis s’il existe, la visite et les contraintes.",
  "validated_quantity du métré est prioritaire. Ne jamais inventer une quantité opérationnelle.",
  "kinds autorisés : WORK, CONTROL, WAIT — MILESTONE interdit.",
  "after.type : FS, SS, FF — SF interdit.",
  "WAIT = attente technique sans crew.",
  "takeoff_codes = codes lignes métré exécutables uniquement (pas indicator).",
  "duration_days = durée FIXED en jours ouvrés (nombres ≥ 0).",
  "Quand les choix sont validés, produis UNIQUEMENT le JSON bework_schedule_ai_v1.",
] as const;

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : d(v as never);
  return typeof n === "number" && Number.isFinite(n) ? n : Number(n);
}

export async function buildPlanningV2Context(input: {
  orgId: string;
  projectId: string;
  studyId?: string | null;
}) {
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
    select: { id: true, revisionNumber: true },
    orderBy: { updatedAt: "desc" },
  });
  if (existingPlan) {
    throw Object.assign(
      new Error(
        `Un planning existe déjà (rév. ${existingPlan.revisionNumber}). Rechargez le chantier.`,
      ),
      { code: "PLAN_ALREADY_EXISTS", status: 409, planId: existingPlan.id },
    );
  }

  const loaded = await loadSourceContextFromDb({
    orgId: input.orgId,
    projectId: input.projectId,
    studyId: input.studyId,
  });

  const study = await getPrepStudyView(input.orgId, loaded.studyId);
  if (!study) {
    throw Object.assign(new Error("Métré introuvable"), {
      code: "STUDY_NOT_FOUND",
      status: 404,
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
      {
        code: line.code,
        unit: line.unit,
        validatedQuantity: line.validatedQuantity,
        declaredQuantity: line.declaredQuantity,
        computedQuantity: eng,
        provenance: line.provenance,
      },
      eng,
    );
    return {
      code: line.code,
      designation: line.designation,
      unit: displayUnit(line.unit) || line.unit,
      lot: line.lot,
      role: line.role,
      validated_quantity: line.validatedQuantity,
      computed_quantity: eng,
      declared_quantity: line.declaredQuantity,
      quantity_for_planning: executable ? resolved.quantity : null,
      executable,
    };
  });

  const executableCodes = lines.filter((l) => l.executable).map((l) => l.code);

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
            take: 120,
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

  const visit = await prisma.siteVisit.findFirst({
    where: { organizationId: input.orgId, projectId: input.projectId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      subject: true,
      clientNeed: true,
      constraintsJson: true,
      comments: true,
    },
  });

  const context = {
    type: "bework_chatgpt_context_v1" as const,
    schema_version: 1,
    section: "PLANNING" as const,
    interaction_mode: "CREATE" as const,
    engine: "schedule-domain-v1",
    expected_output: BEWORK_SCHEDULE_AI_FORMAT,
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
      study_id: loaded.studyId,
      version: loaded.sourceContext.takeoffVersion,
      title: study.title,
      lines,
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
            quantity: num(l.quantity),
            unit: l.unit,
            reference: l.reference,
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
    sources_fingerprint: loaded.sourceContext.takeoffFingerprint,
    json_schema: getAiScheduleBundleV1JsonSchema(),
    business_rules: [...AI_SCHEDULE_V1_BUSINESS_RULES],
    minimal_valid_example: buildMinimalAiScheduleExample(executableCodes),
    instructions: [...PLANNING_V2_CREATE_INSTRUCTIONS],
    target: {
      entity_type: "PREP_SCHEDULE_PLAN",
      id: null,
      create_from_study_id: loaded.studyId,
      create_on_project_id: input.projectId,
    },
  };

  return {
    context,
    text: JSON.stringify(context, null, 2),
    sourcesFingerprint: loaded.sourceContext.takeoffFingerprint,
    studyId: loaded.studyId,
  };
}
