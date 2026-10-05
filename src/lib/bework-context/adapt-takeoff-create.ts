/**
 * Contexte ChatGPT CREATE métré — visite (+ plan facultatif) → bework_prep_bundle_v1.
 * Lecture seule. Aucune invention de dimension / métier hardcodé.
 *
 * Si un PrepStudy CURRENT existe déjà → retourne MODIFY (pas un faux CREATE).
 */
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import {
  BEWORK_CONTEXT_FORMAT,
  BEWORK_CONTEXT_SCHEMA_VERSION,
  BEWORK_PATCH_FORMAT,
  type BeworkChatgptContextV1,
} from "@/lib/bework-patch/types";
import { PREP_BUNDLE_FORMAT } from "@/lib/preparation/types";
import { computeVisitContextVersion } from "@/lib/bework-context/visit-context-version";
import { listProjectPlanCandidateFiles } from "@/lib/preparation/plan-source";
import { buildProjectContext } from "@/lib/bework-context/build-project-context";
import { adaptTakeoffForChatgptContext } from "@/lib/bework-context/adapters";
import {
  resolveCurrentPrepStudy,
  resolveCurrentSchedulePlan,
} from "@/lib/chantier/resolve-workspace-entities";
import type { ProjectContextSnapshot } from "@/lib/bework-context/types";

export const TAKEOFF_CREATE_INSTRUCTIONS = [
  "Tu es un copilote chantier BTP. Tu proposes ; le professionnel décide.",
  "Mode CREATE : aucune étude PrepStudy n’existe encore sur ce chantier.",
  "Analyse d’abord les sources (visite, mesures, photos, plan facultatif).",
  "Identifie les informations fiables (MEASURE / MANUAL / PLAN) et les manquantes.",
  "Pose des questions au professionnel avant d’inventer une dimension.",
  "Ne jamais inventer une longueur, largeur, hauteur, profondeur ou quantité absente.",
  "Si une donnée manque : demande confirmation ou laisse null / « À confirmer ».",
  "Les hypothèses restent HYPOTHESIS jusqu’à validation explicite du professionnel.",
  "Quand les informations sont suffisantes, produis UNIQUEMENT un JSON bework_prep_bundle_v1.",
  "Contrat d’import strict (sinon prévisualisation refusée) :",
  "- takeoff.items[] (pas de tableau lines racine) ; id ligne type SUR-01 / TE-01 ;",
  "- quantité = declared_quantity (nombre, point décimal) — jamais le champ quantity ;",
  "- provenance legacy : RELEVE | RELEVE_A_VERIFIER | HYPOTHESE (compatibilité moteur) ;",
  "- provenance_kind métier : MEASURE | PLAN | CALCULATION | MANUAL | HYPOTHESIS | UNKNOWN ;",
  "- cote lue sur plan → provenance RELEVE_A_VERIFIER + provenance_kind PLAN ;",
  "- total calculé → provenance_kind CALCULATION (éventuellement avec formula) ;",
  "- ne jamais écrire PLAN/CALCULATION uniquement dans provenance legacy sans provenance_kind ;",
  "- unités : m2, m3, ml, m, u… (M2 et m² sont normalisés).",
  "- parameters[] est facultatif si aucune formule n’est utilisée.",
  "- role: indicator pour surfaces documentaires qui ne partent pas automatiquement au devis.",
  "Chaque paramètre et chaque ligne doit avoir une provenance explicite.",
  "Ne produis pas de prix, marge, TVA ni conditions commerciales (réservés au devis).",
  "Ne crée pas de workflow/planning obligatoire — le métré quantitatif suffit pour cette étape.",
  "N’impose aucun corps d’état préfabriqué : déduis uniquement des sources fournies.",
  "Ne crée pas de scope arbitraire nommé sans choix utilisateur explicite.",
] as const;

export type BeworkTakeoffCreateContextV1 = {
  type: typeof BEWORK_CONTEXT_FORMAT;
  schema_version: typeof BEWORK_CONTEXT_SCHEMA_VERSION;
  section: "TAKEOFF";
  interaction_mode: "CREATE";
  expected_output: typeof PREP_BUNDLE_FORMAT;
  organization: { id: string; name: string };
  /** Null si la visite n’est pas encore rattachée à un chantier. */
  project: {
    id: string;
    title: string;
    description: string | null;
    site_address: string | null;
    site_city: string | null;
    status: string | null;
    chantier_status: string | null;
    client: { name: string | null; company: string | null } | null;
  } | null;
  scope: null;
  visit: Record<string, unknown> | null;
  plan_candidates: Array<{
    id: string;
    name: string;
    document_type: string | null;
    indice: string | null;
    version_label: string | null;
    mime_type: string | null;
    is_current_version: boolean;
  }>;
  sources_fingerprint: string;
  data: {
    takeoff: null;
    note: string;
  };
  instructions: string[];
  target: {
    entity_type: "PREP_STUDY";
    id: null;
    version: 0;
    base_version: 0;
    /** Null tant qu’aucun Project n’est lié — le commit crée / rattache d’abord un chantier. */
    create_on_project_id: string | null;
  };
  versions?: TakeoffContextVersionsBlock;
};

/** Contexte MODIFY — métré CURRENT (ou ARCHIVED deep-link) exposé avec version réelle. */
export type BeworkTakeoffModifyContextV1 = Omit<BeworkChatgptContextV1, "target" | "data"> & {
  interaction_mode: "MODIFY";
  expected_output: typeof BEWORK_PATCH_FORMAT;
  target: BeworkChatgptContextV1["target"] & {
    base_version: number;
    create_on_project_id: string;
  };
  versions: TakeoffContextVersionsBlock;
  data: Record<string, unknown> & {
    interaction_mode: "MODIFY";
    takeoff: {
      exists: true;
      study_id: string;
      version: number;
      status: "CURRENT" | "ARCHIVED";
      is_current: boolean;
      scope_id: string | null;
      updated_at: string | null;
    };
  };
};

export type TakeoffContextVersionsBlock = {
  current_takeoff?: {
    id: string;
    version: number;
    status: "CURRENT" | "ARCHIVED";
    is_current: boolean;
    scope_id: string | null;
    updated_at: string | null;
  };
  quote?: {
    id: string;
    version: number;
    study_version_at_generation: number | null;
  };
  planning?: {
    id: string;
    revision: number;
    study_version_at_generation: number | null;
  };
};

export type BeworkTakeoffChatgptContextV1 =
  | BeworkTakeoffCreateContextV1
  | BeworkTakeoffModifyContextV1;

/** Bloc versions (métré / devis / planning) — pur, testable. */
export function buildTakeoffVersionsBlock(
  snap: ProjectContextSnapshot,
  studyId: string,
  meta: { status: "CURRENT" | "ARCHIVED"; isCurrent: boolean },
): TakeoffContextVersionsBlock {
  const study = snap.takeoffs.find((t) => t.id === studyId);
  const block: TakeoffContextVersionsBlock = {};
  if (study) {
    block.current_takeoff = {
      id: study.id,
      version: study.version,
      status: meta.status,
      is_current: meta.isCurrent,
      scope_id: study.scopeId,
      updated_at: study.updatedAt,
    };
  }

  const quote =
    snap.quotes.find((q) => q.sourcePrepStudyId === studyId) ??
    snap.quotes.find((q) => q.transfer?.studyId === studyId) ??
    null;
  if (quote) {
    block.quote = {
      id: quote.id,
      version: quote.versionNumber ?? 0,
      study_version_at_generation: quote.transfer?.studyVersion ?? null,
    };
  }

  const plansForStudy = snap.schedules.filter(
    (p): p is typeof p & { studyId: string } => p.studyId === studyId,
  );
  const plan = resolveCurrentSchedulePlan(plansForStudy);
  if (plan) {
    block.planning = {
      id: plan.id,
      revision: plan.revisionNumber,
      study_version_at_generation: plan.studyVersionAtGeneration,
    };
  }

  return block;
}

/**
 * MODIFY — snapshot canonique + resolver CURRENT.
 * Lecture seule. Deep-link `studyId` peut exposer ARCHIVED (is_current false).
 */
export async function buildTakeoffModifyContext(input: {
  orgId: string;
  projectId: string;
  /** Deep-link étude (peut être ARCHIVED). Absent = CURRENT canonique. */
  studyId?: string | null;
}): Promise<BeworkTakeoffModifyContextV1> {
  const [snap, studies, scopes] = await Promise.all([
    buildProjectContext(input.projectId, input.orgId),
    prisma.prepStudy.findMany({
      where: {
        projectId: input.projectId,
        organizationId: input.orgId,
      },
      select: {
        id: true,
        title: true,
        scopeId: true,
        sourcesJson: true,
        archivedAt: true,
        version: true,
        updatedAt: true,
      },
    }),
    prisma.projectScope.findMany({
      where: {
        projectId: input.projectId,
        organizationId: input.orgId,
      },
      select: {
        id: true,
        referenceStudyId: true,
        referenceQuoteId: true,
        referenceSchedulePlanId: true,
      },
    }),
  ]);
  if (!snap) {
    throw Object.assign(new Error("Chantier introuvable"), {
      code: "PROJECT_NOT_FOUND",
      status: 404,
    });
  }

  const resolved = resolveCurrentPrepStudy({
    studies,
    scopes,
    explicitStudyId: input.studyId ?? null,
  });

  if (!resolved) {
    throw Object.assign(new Error("Aucun métré pour ce chantier"), {
      code: "STUDY_NOT_FOUND",
      status: 404,
    });
  }

  const studyRow = resolved.study;
  const version = studyRow.version ?? 0;
  const updatedAtIso = studyRow.updatedAt.toISOString();

  // Snapshot n’embarque que les non-archivées — fallback minimal si ARCHIVED.
  let ctx = adaptTakeoffForChatgptContext(snap, studyRow.id);
  if (!ctx) {
    ctx = {
      type: BEWORK_CONTEXT_FORMAT,
      schema_version: BEWORK_CONTEXT_SCHEMA_VERSION,
      section: "TAKEOFF",
      project: {
        id: snap.project.id,
        title: snap.project.title,
      },
      organization: {
        id: snap.organization.id,
        name: snap.organization.name,
      },
      target: {
        entity_type: "PREP_STUDY",
        id: studyRow.id,
        version,
        base_version: version,
        code: studyRow.title,
      },
      data: {},
      relationships: { quote_items: [] },
      supported_change_intents: [],
      supported_operations: [],
      expected_output: BEWORK_PATCH_FORMAT,
    };
  }

  const versions = buildTakeoffVersionsBlock(snap, studyRow.id, {
    status: resolved.status,
    isCurrent: resolved.isCurrent,
  });
  if (!versions.current_takeoff) {
    versions.current_takeoff = {
      id: studyRow.id,
      version,
      status: resolved.status,
      is_current: resolved.isCurrent,
      scope_id: studyRow.scopeId,
      updated_at: updatedAtIso,
    };
  } else {
    versions.current_takeoff.status = resolved.status;
    versions.current_takeoff.is_current = resolved.isCurrent;
  }

  return {
    ...ctx,
    interaction_mode: "MODIFY",
    expected_output: BEWORK_PATCH_FORMAT,
    target: {
      ...ctx.target,
      id: studyRow.id,
      version,
      base_version: version,
      create_on_project_id: input.projectId,
    },
    versions,
    data: {
      ...ctx.data,
      interaction_mode: "MODIFY",
      takeoff: {
        exists: true,
        study_id: studyRow.id,
        version,
        status: resolved.status,
        is_current: resolved.isCurrent,
        scope_id: studyRow.scopeId,
        updated_at: updatedAtIso,
      },
    },
  };
}

/**
 * Résout le métré CURRENT du chantier (resolver canonique).
 * Lecture seule.
 */
export async function resolveProjectCurrentTakeoff(input: {
  orgId: string;
  projectId: string;
}): Promise<{
  studyId: string;
  version: number;
  status: "CURRENT";
  scopeId: string | null;
  updatedAt: string;
} | null> {
  const [studies, scopes] = await Promise.all([
    prisma.prepStudy.findMany({
      where: {
        projectId: input.projectId,
        organizationId: input.orgId,
      },
      select: {
        id: true,
        scopeId: true,
        sourcesJson: true,
        archivedAt: true,
        version: true,
        updatedAt: true,
      },
    }),
    prisma.projectScope.findMany({
      where: {
        projectId: input.projectId,
        organizationId: input.orgId,
      },
      select: {
        id: true,
        referenceStudyId: true,
        referenceQuoteId: true,
        referenceSchedulePlanId: true,
      },
    }),
  ]);
  const resolved = resolveCurrentPrepStudy({ studies, scopes });
  if (!resolved || !resolved.isCurrent) return null;
  return {
    studyId: resolved.study.id,
    version: resolved.study.version ?? 0,
    status: "CURRENT",
    scopeId: resolved.study.scopeId,
    updatedAt: resolved.study.updatedAt.toISOString(),
  };
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** field_notes stockés dans prepJson.fieldNotes — exposés explicitement pour ChatGPT. */
function fieldNotesFromPrep(prep: unknown): string | null {
  if (!prep || typeof prep !== "object") return null;
  const fn = (prep as { fieldNotes?: unknown }).fieldNotes;
  return typeof fn === "string" && fn.trim() ? fn : null;
}

/** Empreinte des sources chantier pour PREVIEW_STALE (visite + plans candidats). */
export function computeTakeoffCreateSourcesFingerprint(input: {
  projectId: string | null;
  visit:
    | {
        id: string;
        updatedAt: Date | string;
        contextVersion: number;
        measurementCount: number;
        mediaCount: number;
      }
    | null;
  planFileIds: string[];
}): string {
  const payload = {
    projectId: input.projectId,
    visit: input.visit
      ? {
          id: input.visit.id,
          updatedAt:
            input.visit.updatedAt instanceof Date
              ? input.visit.updatedAt.toISOString()
              : String(input.visit.updatedAt),
          contextVersion: input.visit.contextVersion,
          measurementCount: input.visit.measurementCount,
          mediaCount: input.visit.mediaCount,
        }
      : null,
    plans: [...input.planFileIds].sort(),
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * Construit le contexte TAKEOFF pour ChatGPT — multi-tenant strict.
 * Si un métré CURRENT existe → MODIFY (id + version réels).
 * Sinon → CREATE (id null, version 0).
 * Ne crée aucune donnée. Plan facultatif.
 */
export async function buildTakeoffCreateContext(input: {
  orgId: string;
  projectId: string;
  visitId?: string | null;
}): Promise<BeworkTakeoffChatgptContextV1> {
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

  // Resolver canonique — jamais findFirst createdAt / ProjectScope seul.
  const current = await resolveProjectCurrentTakeoff({
    orgId: input.orgId,
    projectId: input.projectId,
  });
  if (current) {
    return buildTakeoffModifyContext({
      orgId: input.orgId,
      projectId: input.projectId,
    });
  }

  const visitWhere = input.visitId
    ? {
        id: input.visitId,
        organizationId: input.orgId,
        OR: [{ projectId: input.projectId }, { projectId: null }],
      }
    : {
        organizationId: input.orgId,
        projectId: input.projectId,
      };

  const visit = await prisma.siteVisit.findFirst({
    where: visitWhere,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      subject: true,
      status: true,
      clientName: true,
      siteAddress: true,
      clientNeed: true,
      comments: true,
      projectId: true,
      constraintsJson: true,
      findingsJson: true,
      proposedWorksJson: true,
      lotsJson: true,
      zonesJson: true,
      prepJson: true,
      updatedAt: true,
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
      missingInfos: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          label: true,
          category: true,
          checkStatus: true,
          dueAt: true,
          resolvedAt: true,
        },
      },
    },
  });

  if (visit && visit.projectId && visit.projectId !== input.projectId) {
    throw Object.assign(new Error("Cette visite appartient à un autre chantier"), {
      code: "PROJECT_MISMATCH",
      status: 403,
    });
  }

  const planFiles = await listProjectPlanCandidateFiles({
    projectId: input.projectId,
    take: 30,
  });

  const visitPayload = visit
    ? {
        id: visit.id,
        subject: visit.subject,
        status: visit.status,
        client_name: visit.clientName,
        site_address: visit.siteAddress,
        client_need: visit.clientNeed,
        comments: visit.comments,
        field_notes: fieldNotesFromPrep(visit.prepJson),
        constraints: visit.constraintsJson,
        findings: visit.findingsJson,
        proposed_works: visit.proposedWorksJson,
        lots: visit.lotsJson,
        zones: visit.zonesJson,
        prep: visit.prepJson,
        measurements: visit.measurements.map((m) => ({
          id: m.id,
          zone: m.zone,
          label: m.label,
          measure_type: m.measureType,
          unit: m.unit,
          length_m: m.lengthM != null ? d(m.lengthM) : null,
          width_m: m.widthM != null ? d(m.widthM) : null,
          height_m: m.heightM != null ? d(m.heightM) : null,
          quantity_value: m.quantityValue != null ? d(m.quantityValue) : null,
          computed_quantity: d(m.computedQuantity),
          lot: m.lot,
          observation: m.observation,
          /** Relevés terrain — à mapper en MEASURE dans le bundle. */
          suggested_provenance: "MEASURE" as const,
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
        })),
        missing_infos: visit.missingInfos.map((mi) => ({
          id: mi.id,
          label: mi.label,
          category: mi.category,
          check_status: mi.checkStatus,
          due_at: mi.dueAt?.toISOString() ?? null,
          resolved_at: mi.resolvedAt?.toISOString() ?? null,
        })),
        context_version: computeVisitContextVersion({
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
            lengthM: numOrNull(m.lengthM),
            widthM: numOrNull(m.widthM),
            heightM: numOrNull(m.heightM),
            quantityValue: numOrNull(m.quantityValue),
            computedQuantity: Number(m.computedQuantity),
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
        }),
        updated_at: visit.updatedAt.toISOString(),
      }
    : null;

  const sourcesFingerprint = computeTakeoffCreateSourcesFingerprint({
    projectId: project.id,
    visit: visitPayload
      ? {
          id: visitPayload.id,
          updatedAt: visitPayload.updated_at,
          contextVersion: visitPayload.context_version,
          measurementCount: visitPayload.measurements.length,
          mediaCount: visitPayload.media_refs.length,
        }
      : null,
    planFileIds: planFiles.map((f) => f.id),
  });

  return {
    type: BEWORK_CONTEXT_FORMAT,
    schema_version: BEWORK_CONTEXT_SCHEMA_VERSION,
    section: "TAKEOFF",
    interaction_mode: "CREATE",
    expected_output: PREP_BUNDLE_FORMAT,
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
    scope: null,
    visit: visitPayload,
    plan_candidates: planFiles.map((f) => ({
      id: f.id,
      name: f.name,
      document_type: f.documentType,
      indice: f.indice,
      version_label: f.versionLabel,
      mime_type: f.mimeType,
      is_current_version: f.isCurrentVersion,
    })),
    sources_fingerprint: sourcesFingerprint,
    data: {
      takeoff: null,
      note: visitPayload
        ? "Aucune étude — préparez un bework_prep_bundle_v1 après discussion avec le professionnel."
        : "Aucune visite liée — vous pouvez quand même préparer un métré si le professionnel fournit les mesures dans la discussion (provenance MANUAL).",
    },
    instructions: [...TAKEOFF_CREATE_INSTRUCTIONS],
    target: {
      entity_type: "PREP_STUDY",
      id: null,
      version: 0,
      base_version: 0,
      create_on_project_id: project.id,
    },
  };
}

/**
 * Contexte TAKEOFF CREATE depuis une visite autonome (projectId facultatif).
 * Lecture seule — ChatGPT n’est jamais bloqué par l’absence de chantier.
 * Le commit PrepStudy reste lié à un Project (création / rattachement séparés).
 */
export async function buildTakeoffCreateContextFromVisit(input: {
  orgId: string;
  visitId: string;
}): Promise<BeworkTakeoffChatgptContextV1> {
  const visit = await prisma.siteVisit.findFirst({
    where: { id: input.visitId, organizationId: input.orgId },
    select: {
      id: true,
      projectId: true,
      subject: true,
      status: true,
      clientName: true,
      siteAddress: true,
      clientNeed: true,
      comments: true,
      constraintsJson: true,
      findingsJson: true,
      proposedWorksJson: true,
      lotsJson: true,
      zonesJson: true,
      prepJson: true,
      updatedAt: true,
      organization: { select: { id: true, name: true } },
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
      missingInfos: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          label: true,
          category: true,
          checkStatus: true,
          dueAt: true,
          resolvedAt: true,
        },
      },
    },
  });
  if (!visit?.organization) {
    throw Object.assign(new Error("Visite introuvable"), {
      code: "VISIT_NOT_FOUND",
      status: 404,
    });
  }

  if (visit.projectId) {
    return buildTakeoffCreateContext({
      orgId: input.orgId,
      projectId: visit.projectId,
      visitId: visit.id,
    });
  }

  const visitPayload = {
    id: visit.id,
    subject: visit.subject,
    status: visit.status,
    client_name: visit.clientName,
    site_address: visit.siteAddress,
    client_need: visit.clientNeed,
    comments: visit.comments,
    field_notes: fieldNotesFromPrep(visit.prepJson),
    constraints: visit.constraintsJson,
    findings: visit.findingsJson,
    proposed_works: visit.proposedWorksJson,
    lots: visit.lotsJson,
    zones: visit.zonesJson,
    prep: visit.prepJson,
    measurements: visit.measurements.map((m) => ({
      id: m.id,
      zone: m.zone,
      label: m.label,
      measure_type: m.measureType,
      unit: m.unit,
      length_m: m.lengthM != null ? d(m.lengthM) : null,
      width_m: m.widthM != null ? d(m.widthM) : null,
      height_m: m.heightM != null ? d(m.heightM) : null,
      quantity_value: m.quantityValue != null ? d(m.quantityValue) : null,
      computed_quantity: d(m.computedQuantity),
      lot: m.lot,
      observation: m.observation,
      suggested_provenance: "MEASURE" as const,
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
    })),
    missing_infos: visit.missingInfos.map((mi) => ({
      id: mi.id,
      label: mi.label,
      category: mi.category,
      check_status: mi.checkStatus,
      due_at: mi.dueAt?.toISOString() ?? null,
      resolved_at: mi.resolvedAt?.toISOString() ?? null,
    })),
    context_version: computeVisitContextVersion({
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
        lengthM: numOrNull(m.lengthM),
        widthM: numOrNull(m.widthM),
        heightM: numOrNull(m.heightM),
        quantityValue: numOrNull(m.quantityValue),
        computedQuantity: Number(m.computedQuantity),
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
    }),
    updated_at: visit.updatedAt.toISOString(),
  };

  const sourcesFingerprint = computeTakeoffCreateSourcesFingerprint({
    projectId: null,
    visit: {
      id: visitPayload.id,
      updatedAt: visitPayload.updated_at,
      contextVersion: visitPayload.context_version,
      measurementCount: visitPayload.measurements.length,
      mediaCount: visitPayload.media_refs.length,
    },
    planFileIds: [],
  });

  return {
    type: BEWORK_CONTEXT_FORMAT,
    schema_version: BEWORK_CONTEXT_SCHEMA_VERSION,
    section: "TAKEOFF",
    interaction_mode: "CREATE",
    expected_output: PREP_BUNDLE_FORMAT,
    organization: {
      id: visit.organization.id,
      name: visit.organization.name,
    },
    project: null,
    scope: null,
    visit: visitPayload,
    plan_candidates: [],
    sources_fingerprint: sourcesFingerprint,
    data: {
      takeoff: null,
      note:
        "Visite autonome (aucun chantier lié). Discutez du métré avec ChatGPT (bework_prep_bundle_v1). Pour enregistrer l’étude dans BeWork, créez ou liez ensuite un chantier — PrepStudy reste rattaché à un Project.",
    },
    instructions: [
      ...TAKEOFF_CREATE_INSTRUCTIONS,
      "Aucun Project BeWork n’est lié : un plan fourni uniquement dans la discussion ChatGPT n’est pas une source BeWork stockée.",
      "Si une cote est lue sur ce plan externe : provenance PLAN + « à confirmer » si doute — jamais MEASURE.",
    ],
    target: {
      entity_type: "PREP_STUDY",
      id: null,
      version: 0,
      base_version: 0,
      create_on_project_id: null,
    },
  };
}

/**
 * Empreinte sources actuelle — pour PREVIEW_STALE au commit.
 * Ne vérifie pas l’absence d’étude (le commit CREATE le fait via import).
 */
export async function loadCurrentTakeoffCreateSourcesFingerprint(input: {
  orgId: string;
  projectId: string;
  visitId?: string | null;
}): Promise<{ fingerprint: string; visitId: string | null }> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.orgId },
    select: { id: true },
  });
  if (!project) {
    throw Object.assign(new Error("Chantier introuvable"), {
      code: "PROJECT_NOT_FOUND",
      status: 404,
    });
  }

  const visitWhere = input.visitId
    ? {
        id: input.visitId,
        organizationId: input.orgId,
        OR: [{ projectId: input.projectId }, { projectId: null }],
      }
    : {
        organizationId: input.orgId,
        projectId: input.projectId,
      };

  const visit = await prisma.siteVisit.findFirst({
    where: visitWhere,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      subject: true,
      status: true,
      clientName: true,
      siteAddress: true,
      clientNeed: true,
      comments: true,
      updatedAt: true,
      measurements: {
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
        select: {
          id: true,
          name: true,
          kind: true,
          category: true,
          caption: true,
          observation: true,
          fileUrl: true,
          storagePath: true,
        },
      },
    },
  });

  const planFiles = await listProjectPlanCandidateFiles({
    projectId: input.projectId,
    take: 30,
  });

  const contextVersion = visit
    ? computeVisitContextVersion({
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
          lengthM: numOrNull(m.lengthM),
          widthM: numOrNull(m.widthM),
          heightM: numOrNull(m.heightM),
          quantityValue: numOrNull(m.quantityValue),
          computedQuantity: Number(m.computedQuantity),
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
      })
    : 0;

  return {
    fingerprint: computeTakeoffCreateSourcesFingerprint({
      projectId: project.id,
      visit: visit
        ? {
            id: visit.id,
            updatedAt: visit.updatedAt,
            contextVersion,
            measurementCount: visit.measurements.length,
            mediaCount: visit.medias.length,
          }
        : null,
      planFileIds: planFiles.map((f) => f.id),
    }),
    visitId: visit?.id ?? null,
  };
}
