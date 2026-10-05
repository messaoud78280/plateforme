/**
 * Contexte ChatGPT CREATE / remplissage visite — bework_site_survey_v1.
 * Lecture seule. Discussion d’abord ; JSON seulement sur demande utilisateur.
 * PLAN ≠ PHOTO ≠ MEASURE. Aucune invention de dimension.
 */
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import {
  BEWORK_CONTEXT_FORMAT,
  BEWORK_CONTEXT_SCHEMA_VERSION,
} from "@/lib/bework-patch/types";
import { BEWORK_SITE_SURVEY_FORMAT } from "@/lib/site-visits/survey-types";
import { computeVisitContextVersion } from "@/lib/bework-context/visit-context-version";
import { listProjectPlanCandidateFiles } from "@/lib/preparation/plan-source";
import { parseVisitPrep } from "@/lib/site-visits/types";

export const VISIT_CREATE_INSTRUCTIONS = [
  "Tu es un copilote chantier BTP. Tu proposes ; le professionnel décide.",
  "Mode CREATE / remplissage VISIT : collecter les faits terrain, pas un métré complet.",
  "1) Analyse les informations disponibles (visite, photos, plans, documents).",
  "2) Identifie les données manquantes utiles au professionnel.",
  "3) Pose des questions avant de produire un JSON.",
  "4) Ne produis le JSON bework_site_survey_v1 QUE lorsque l’utilisateur demande de poursuivre.",
  "Ne JAMAIS inventer une longueur, largeur, hauteur, profondeur ou quantité absente.",
  "Ordre de confiance : MEASURE > MANUAL > PLAN > CALCULATION > HYPOTHESIS > UNKNOWN.",
  "MEASURE = relevé terrain réel. PLAN = cote explicitement lisible sur le plan (provenance_kind=PLAN).",
  "PHOTO n’est PAS une mesure : ne jamais déduire une dimension depuis une photo.",
  "Si une cote du plan n’est pas lisible : null + « à confirmer » — aucune estimation silencieuse.",
  "HYPOTHESIS reste informative uniquement ; elle ne remplace jamais MEASURE / PLAN / MANUAL.",
  "Ne pas transformer la visite en moteur de métré (ouvrages / formules / décomposition) — réservé au module MÉTRÉ.",
  "Chaque donnée issue du plan : source_ref + document_id si disponible + provenance_kind=PLAN.",
  "Retourner exclusivement un JSON bework_site_survey_v1 compatible preview BeWork.",
] as const;

export type BeworkVisitCreateContextV1 = {
  type: typeof BEWORK_CONTEXT_FORMAT;
  schema_version: typeof BEWORK_CONTEXT_SCHEMA_VERSION;
  section: "VISIT";
  interaction_mode: "CREATE";
  expected_output: typeof BEWORK_SITE_SURVEY_FORMAT;
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
  visit: Record<string, unknown>;
  plan_candidates: Array<{
    id: string;
    name: string;
    document_type: string | null;
    indice: string | null;
    version_label: string | null;
    mime_type: string | null;
    is_current_version: boolean;
    provenance_kind: "PLAN";
  }>;
  sources_fingerprint: string;
  data: {
    note: string;
    provenance_policy: string[];
  };
  instructions: string[];
  target: {
    entity_type: "SITE_VISIT";
    id: string;
    version: number;
    base_version: number;
  };
};

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function computeVisitCreateSourcesFingerprint(input: {
  visitId: string;
  contextVersion: number;
  updatedAt: string;
  measurementCount: number;
  mediaCount: number;
  planFileIds: string[];
}): string {
  const payload = {
    visitId: input.visitId,
    contextVersion: input.contextVersion,
    updatedAt: input.updatedAt,
    measurementCount: input.measurementCount,
    mediaCount: input.mediaCount,
    plans: [...input.planFileIds].sort(),
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function buildVisitCreateContext(input: {
  orgId: string;
  visitId: string;
}): Promise<BeworkVisitCreateContextV1> {
  const visit = await prisma.siteVisit.findFirst({
    where: { id: input.visitId, organizationId: input.orgId },
    select: {
      id: true,
      subject: true,
      status: true,
      clientName: true,
      siteName: true,
      siteAddress: true,
      clientNeed: true,
      comments: true,
      projectId: true,
      constraintsJson: true,
      findingsJson: true,
      proposedWorksJson: true,
      commercialJson: true,
      lotsJson: true,
      zonesJson: true,
      prepJson: true,
      scheduledAt: true,
      updatedAt: true,
      responsible: { select: { id: true, name: true } },
      project: {
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
      },
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
          comment: true,
        },
      },
    },
  });

  if (!visit) {
    throw Object.assign(new Error("Visite introuvable"), {
      code: "VISIT_NOT_FOUND",
      status: 404,
    });
  }
  if (!visit.projectId || !visit.project?.organization) {
    throw Object.assign(
      new Error("Liez la visite à un chantier pour utiliser ChatGPT."),
      { code: "PROJECT_REQUIRED", status: 400 },
    );
  }

  const project = visit.project;
  const organization = project.organization!;
  const planFiles = await listProjectPlanCandidateFiles({
    projectId: project.id,
    take: 30,
  });
  const prep = parseVisitPrep(visit.prepJson);

  const contextVersion = computeVisitContextVersion({
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
  });

  const sourcesFingerprint = computeVisitCreateSourcesFingerprint({
    visitId: visit.id,
    contextVersion,
    updatedAt: visit.updatedAt.toISOString(),
    measurementCount: visit.measurements.length,
    mediaCount: visit.medias.length,
    planFileIds: planFiles.map((f) => f.id),
  });

  return {
    type: BEWORK_CONTEXT_FORMAT,
    schema_version: BEWORK_CONTEXT_SCHEMA_VERSION,
    section: "VISIT",
    interaction_mode: "CREATE",
    expected_output: BEWORK_SITE_SURVEY_FORMAT,
    organization: {
      id: organization.id,
      name: organization.name,
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
    visit: {
      id: visit.id,
      subject: visit.subject,
      status: visit.status,
      client_name: visit.clientName,
      site_name: visit.siteName,
      site_address: visit.siteAddress,
      client_need: visit.clientNeed,
      comments: visit.comments,
      scheduled_at: visit.scheduledAt?.toISOString() ?? null,
      responsible: visit.responsible?.name ?? null,
      constraints: visit.constraintsJson,
      findings: visit.findingsJson,
      proposed_works: visit.proposedWorksJson,
      commercial: visit.commercialJson,
      lots: visit.lotsJson,
      zones: visit.zonesJson,
      field_notes: prep.fieldNotes ?? null,
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
        /** PHOTO ≠ PLAN — ne jamais en déduire une cote. */
        provenance_kind: m.kind === "DOCUMENT" ? "PLAN" : "UNKNOWN",
      })),
      missing_infos: visit.missingInfos.map((mi) => ({
        id: mi.id,
        label: mi.label,
        category: mi.category,
        check_status: mi.checkStatus,
        comment: mi.comment,
      })),
      context_version: contextVersion,
      updated_at: visit.updatedAt.toISOString(),
    },
    plan_candidates: planFiles.map((f) => ({
      id: f.id,
      name: f.name,
      document_type: f.documentType,
      indice: f.indice,
      version_label: f.versionLabel,
      mime_type: f.mimeType,
      is_current_version: f.isCurrentVersion,
      provenance_kind: "PLAN" as const,
    })),
    sources_fingerprint: sourcesFingerprint,
    data: {
      note: "Visite = faits / sources. Métré = ouvrages / quantités (étape suivante).",
      provenance_policy: [
        "MEASURE",
        "MANUAL",
        "PLAN",
        "CALCULATION",
        "HYPOTHESIS",
        "UNKNOWN",
      ],
    },
    instructions: [...VISIT_CREATE_INSTRUCTIONS],
    target: {
      entity_type: "SITE_VISIT",
      id: visit.id,
      version: contextVersion,
      base_version: contextVersion,
    },
  };
}

export async function loadCurrentVisitCreateSourcesFingerprint(input: {
  orgId: string;
  visitId: string;
}): Promise<{ fingerprint: string; contextVersion: number; projectId: string }> {
  const ctx = await buildVisitCreateContext(input);
  return {
    fingerprint: ctx.sources_fingerprint,
    contextVersion: ctx.target.version,
    projectId: ctx.project.id,
  };
}
