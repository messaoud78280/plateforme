/**
 * Contexte ChatGPT CREATE métré — visite (+ plan facultatif) → bework_prep_bundle_v1.
 * Lecture seule. Aucune invention de dimension / métier hardcodé.
 */
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { BEWORK_CONTEXT_FORMAT, BEWORK_CONTEXT_SCHEMA_VERSION } from "@/lib/bework-patch/types";
import { PREP_BUNDLE_FORMAT } from "@/lib/preparation/types";
import { computeVisitContextVersion } from "@/lib/bework-context/visit-context-version";
import { listProjectPlanCandidateFiles } from "@/lib/preparation/plan-source";

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
    create_on_project_id: string;
  };
};

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Empreinte des sources chantier pour PREVIEW_STALE (visite + plans candidats). */
export function computeTakeoffCreateSourcesFingerprint(input: {
  projectId: string;
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
 * Construit le contexte CREATE — multi-tenant strict.
 * Ne crée aucune donnée. Plan facultatif.
 */
export async function buildTakeoffCreateContext(input: {
  orgId: string;
  projectId: string;
  visitId?: string | null;
}): Promise<BeworkTakeoffCreateContextV1> {
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

  const existingStudy = await prisma.prepStudy.findFirst({
    where: {
      organizationId: input.orgId,
      projectId: input.projectId,
      archivedAt: null,
    },
    select: { id: true, version: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
  if (existingStudy) {
    throw Object.assign(
      new Error(
        `Un métré existe déjà (« ${existingStudy.title} » v${existingStudy.version}). Utilisez « Modifier avec ChatGPT ».`,
      ),
      { code: "STUDY_ALREADY_EXISTS", status: 409, studyId: existingStudy.id },
    );
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
