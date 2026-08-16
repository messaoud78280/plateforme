/**
 * VISITES-METRES-1 — CRUD visite / relevés / infos manquantes.
 */
import { Prisma, type SiteVisitStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import {
  computeMeasurement,
  formatQuantityLabel,
  type MeasureType,
} from "@/lib/site-visits/measurements";
import { SITE_VISIT_STATUS_LABELS, type SiteVisitConstraints } from "@/lib/site-visits/types";
import { syncSiteVisitAgenda } from "@/lib/site-visits/agenda-sync";

export type CreateSiteVisitInput = {
  organizationId: string;
  actorUserId: string;
  clientName: string;
  siteAddress: string;
  subject: string;
  siteName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  clientExternalOrgId?: string | null;
  projectId?: string | null;
  scheduledAt?: Date | null;
  responsibleId?: string | null;
  clientNeed?: string | null;
  comments?: string | null;
};

function serializeConstraints(raw: unknown): SiteVisitConstraints {
  if (!raw || typeof raw !== "object") return {};
  return raw as SiteVisitConstraints;
}

export function serializeVisit(
  v: {
    id: string;
    clientName: string;
    siteName: string | null;
    siteAddress: string;
    contactName: string | null;
    contactPhone: string | null;
    clientExternalOrgId: string | null;
    projectId: string | null;
    scheduledAt: Date | null;
    responsibleId: string | null;
    createdById: string;
    subject: string;
    clientNeed: string | null;
    urgencyNote: string | null;
    timeConstraints: string | null;
    siteOccupied: boolean;
    comments: string | null;
    constraintsJson: unknown;
    estimatedCrewCount: number | null;
    estimatedDuration: string | null;
    status: SiteVisitStatus;
    agendaEventId: string | null;
    commercialQuoteId: string | null;
    measurements?: Array<{
      id: string;
      zone: string | null;
      label: string;
      measureType: MeasureType;
      lengthM: unknown;
      widthM: unknown;
      heightM: unknown;
      quantityValue: unknown;
      unit: string;
      computedQuantity: unknown;
      observation: string | null;
      sortOrder: number;
      modifiedAfterTransmit: boolean;
    }>;
    missingInfos?: Array<{
      id: string;
      label: string;
      resolvedAt: Date | null;
    }>;
    medias?: Array<{
      id: string;
      measurementId: string | null;
      kind: string;
      name: string;
      caption: string | null;
      fileUrl: string | null;
      mimeType: string | null;
    }>;
    responsible?: { id: string; name: string | null; email: string } | null;
    commercialQuote?: { id: string; number: string; status: string } | null;
  },
) {
  const measurements = (v.measurements ?? []).map((m) => ({
    id: m.id,
    zone: m.zone,
    label: m.label,
    measureType: m.measureType,
    lengthM: m.lengthM != null ? d(m.lengthM) : null,
    widthM: m.widthM != null ? d(m.widthM) : null,
    heightM: m.heightM != null ? d(m.heightM) : null,
    quantityValue: m.quantityValue != null ? d(m.quantityValue) : null,
    unit: m.unit,
    computedQuantity: d(m.computedQuantity),
    quantityLabel: formatQuantityLabel(d(m.computedQuantity), m.unit),
    observation: m.observation,
    sortOrder: m.sortOrder,
    modifiedAfterTransmit: m.modifiedAfterTransmit,
  }));
  const missingOpen = (v.missingInfos ?? []).filter((i) => !i.resolvedAt);
  const photos = (v.medias ?? []).filter((m) => m.kind === "PHOTO");
  const docs = (v.medias ?? []).filter((m) => m.kind === "DOCUMENT");
  return {
    id: v.id,
    clientName: v.clientName,
    siteName: v.siteName,
    siteAddress: v.siteAddress,
    contactName: v.contactName,
    contactPhone: v.contactPhone,
    clientExternalOrgId: v.clientExternalOrgId,
    projectId: v.projectId,
    scheduledAt: v.scheduledAt?.toISOString() ?? null,
    responsibleId: v.responsibleId,
    responsibleName: v.responsible?.name || v.responsible?.email || null,
    createdById: v.createdById,
    subject: v.subject,
    clientNeed: v.clientNeed,
    urgencyNote: v.urgencyNote,
    timeConstraints: v.timeConstraints,
    siteOccupied: v.siteOccupied,
    comments: v.comments,
    constraints: serializeConstraints(v.constraintsJson),
    estimatedCrewCount: v.estimatedCrewCount,
    estimatedDuration: v.estimatedDuration,
    status: v.status,
    statusLabel: SITE_VISIT_STATUS_LABELS[v.status],
    agendaEventId: v.agendaEventId,
    commercialQuoteId: v.commercialQuoteId,
    commercialQuoteNumber: v.commercialQuote?.number ?? null,
    commercialQuoteHref: v.commercialQuoteId
      ? `/dashboard/devis-facturation/devis/${v.commercialQuoteId}`
      : null,
    measurements,
    missingInfos: (v.missingInfos ?? []).map((i) => ({
      id: i.id,
      label: i.label,
      resolvedAt: i.resolvedAt?.toISOString() ?? null,
      open: !i.resolvedAt,
    })),
    medias: (v.medias ?? []).map((m) => ({
      id: m.id,
      measurementId: m.measurementId,
      kind: m.kind,
      name: m.name,
      caption: m.caption,
      fileUrl: m.fileUrl,
      mimeType: m.mimeType,
    })),
    stats: {
      measurementCount: measurements.length,
      photoCount: photos.length,
      documentCount: docs.length,
      missingOpenCount: missingOpen.length,
      quantitySummary: measurements
        .slice(0, 5)
        .map((m) => `${m.label} : ${m.quantityLabel}`),
    },
  };
}

const visitInclude = {
  measurements: { orderBy: { sortOrder: "asc" as const } },
  missingInfos: { orderBy: { createdAt: "asc" as const } },
  medias: { orderBy: { createdAt: "desc" as const } },
  responsible: { select: { id: true, name: true, email: true } },
  commercialQuote: { select: { id: true, number: true, status: true } },
} as const;

export async function createSiteVisit(input: CreateSiteVisitInput) {
  const clientName = input.clientName.trim();
  const siteAddress = input.siteAddress.trim();
  const subject = input.subject.trim();
  if (!clientName || !siteAddress || !subject) {
    throw new Error("Client, adresse et objet requis");
  }
  if (input.projectId) {
    const p = await prisma.project.findFirst({
      where: { id: input.projectId, organizationId: input.organizationId },
      select: { id: true },
    });
    if (!p) throw new Error("Chantier introuvable");
  }

  const status: SiteVisitStatus = input.scheduledAt ? "SCHEDULED" : "TO_PLAN";
  const visit = await prisma.siteVisit.create({
    data: {
      organizationId: input.organizationId,
      clientName,
      siteName: input.siteName?.trim() || null,
      siteAddress,
      contactName: input.contactName?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      clientExternalOrgId: input.clientExternalOrgId || null,
      projectId: input.projectId || null,
      scheduledAt: input.scheduledAt ?? null,
      responsibleId: input.responsibleId || input.actorUserId,
      createdById: input.actorUserId,
      subject,
      clientNeed: input.clientNeed?.trim() || null,
      comments: input.comments?.trim() || null,
      status,
    },
    include: visitInclude,
  });

  if (visit.scheduledAt) {
    await syncSiteVisitAgenda({
      visitId: visit.id,
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
    });
  }

  const refreshed = await prisma.siteVisit.findUniqueOrThrow({
    where: { id: visit.id },
    include: visitInclude,
  });
  return serializeVisit(refreshed);
}

export async function listSiteVisits(opts: {
  organizationId: string;
  status?: SiteVisitStatus | null;
  responsibleId?: string | null;
  q?: string | null;
  from?: Date | null;
  to?: Date | null;
}) {
  const q = opts.q?.trim();
  const visits = await prisma.siteVisit.findMany({
    where: {
      organizationId: opts.organizationId,
      status: opts.status ?? undefined,
      responsibleId: opts.responsibleId || undefined,
      scheduledAt:
        opts.from || opts.to
          ? {
              gte: opts.from ?? undefined,
              lte: opts.to ?? undefined,
            }
          : undefined,
      ...(q
        ? {
            OR: [
              { clientName: { contains: q, mode: "insensitive" } },
              { siteName: { contains: q, mode: "insensitive" } },
              { siteAddress: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
              {
                responsible: {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
    },
    include: visitInclude,
    orderBy: [{ scheduledAt: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });
  return visits.map(serializeVisit);
}

export async function getSiteVisit(organizationId: string, visitId: string) {
  const visit = await prisma.siteVisit.findFirst({
    where: { id: visitId, organizationId },
    include: visitInclude,
  });
  if (!visit) return null;
  return serializeVisit(visit);
}

export async function updateSiteVisit(opts: {
  organizationId: string;
  visitId: string;
  actorUserId: string;
  data: Record<string, unknown>;
}) {
  const existing = await prisma.siteVisit.findFirst({
    where: { id: opts.visitId, organizationId: opts.organizationId },
  });
  if (!existing) throw new Error("Visite introuvable");
  if (existing.status === "CANCELLED") throw new Error("Visite annulée");

  const patch: Prisma.SiteVisitUpdateInput = {};
  const d0 = opts.data;
  if (typeof d0.clientName === "string") patch.clientName = d0.clientName.trim();
  if (typeof d0.siteName === "string" || d0.siteName === null)
    patch.siteName = typeof d0.siteName === "string" ? d0.siteName.trim() || null : null;
  if (typeof d0.siteAddress === "string") patch.siteAddress = d0.siteAddress.trim();
  if (typeof d0.contactName === "string" || d0.contactName === null)
    patch.contactName =
      typeof d0.contactName === "string" ? d0.contactName.trim() || null : null;
  if (typeof d0.contactPhone === "string" || d0.contactPhone === null)
    patch.contactPhone =
      typeof d0.contactPhone === "string" ? d0.contactPhone.trim() || null : null;
  if (typeof d0.subject === "string") patch.subject = d0.subject.trim();
  if (typeof d0.clientNeed === "string" || d0.clientNeed === null)
    patch.clientNeed =
      typeof d0.clientNeed === "string" ? d0.clientNeed.trim() || null : null;
  if (typeof d0.urgencyNote === "string" || d0.urgencyNote === null)
    patch.urgencyNote =
      typeof d0.urgencyNote === "string" ? d0.urgencyNote.trim() || null : null;
  if (typeof d0.timeConstraints === "string" || d0.timeConstraints === null)
    patch.timeConstraints =
      typeof d0.timeConstraints === "string" ? d0.timeConstraints.trim() || null : null;
  if (typeof d0.siteOccupied === "boolean") patch.siteOccupied = d0.siteOccupied;
  if (typeof d0.comments === "string" || d0.comments === null)
    patch.comments = typeof d0.comments === "string" ? d0.comments.trim() || null : null;
  if (d0.constraints != null && typeof d0.constraints === "object") {
    patch.constraintsJson = d0.constraints as Prisma.InputJsonValue;
  }
  if (typeof d0.estimatedCrewCount === "number" || d0.estimatedCrewCount === null)
    patch.estimatedCrewCount =
      typeof d0.estimatedCrewCount === "number" ? d0.estimatedCrewCount : null;
  if (typeof d0.estimatedDuration === "string" || d0.estimatedDuration === null)
    patch.estimatedDuration =
      typeof d0.estimatedDuration === "string"
        ? d0.estimatedDuration.trim() || null
        : null;
  if (typeof d0.responsibleId === "string" || d0.responsibleId === null)
    patch.responsible =
      typeof d0.responsibleId === "string"
        ? { connect: { id: d0.responsibleId } }
        : { disconnect: true };
  if (typeof d0.scheduledAt === "string" || d0.scheduledAt === null) {
    patch.scheduledAt =
      typeof d0.scheduledAt === "string" && d0.scheduledAt
        ? new Date(d0.scheduledAt)
        : null;
  }
  if (typeof d0.status === "string") {
    patch.status = d0.status as SiteVisitStatus;
  } else if (
    existing.status === "TO_PLAN" &&
    (patch.scheduledAt || existing.scheduledAt)
  ) {
    patch.status = "SCHEDULED";
  }

  await prisma.siteVisit.update({ where: { id: existing.id }, data: patch });
  await syncSiteVisitAgenda({
    visitId: existing.id,
    organizationId: opts.organizationId,
    actorUserId: opts.actorUserId,
  });
  return getSiteVisit(opts.organizationId, existing.id);
}

export async function upsertMeasurement(opts: {
  organizationId: string;
  visitId: string;
  measurementId?: string | null;
  data: {
    zone?: string | null;
    label: string;
    measureType: MeasureType;
    lengthM?: number | null;
    widthM?: number | null;
    heightM?: number | null;
    quantityValue?: number | null;
    unit?: string | null;
    observation?: string | null;
  };
}) {
  const visit = await prisma.siteVisit.findFirst({
    where: { id: opts.visitId, organizationId: opts.organizationId },
    select: { id: true, status: true },
  });
  if (!visit) throw new Error("Visite introuvable");
  if (visit.status === "CANCELLED") throw new Error("Visite annulée");

  const label = opts.data.label.trim();
  if (!label) throw new Error("Libellé requis");
  const calc = computeMeasurement(opts.data);
  if (calc.computedQuantity < 0) throw new Error("Quantité invalide");

  const payload = {
    zone: opts.data.zone?.trim() || null,
    label,
    measureType: opts.data.measureType,
    lengthM: opts.data.lengthM ?? null,
    widthM: opts.data.widthM ?? null,
    heightM: opts.data.heightM ?? null,
    quantityValue: opts.data.quantityValue ?? null,
    unit: calc.unit,
    computedQuantity: calc.computedQuantity,
    observation: opts.data.observation?.trim() || null,
    modifiedAfterTransmit: visit.status === "TRANSMITTED",
  };

  if (opts.measurementId) {
    const m = await prisma.siteVisitMeasurement.findFirst({
      where: {
        id: opts.measurementId,
        visitId: visit.id,
        organizationId: opts.organizationId,
      },
    });
    if (!m) throw new Error("Relevé introuvable");
    await prisma.siteVisitMeasurement.update({
      where: { id: m.id },
      data: payload,
    });
  } else {
    const count = await prisma.siteVisitMeasurement.count({
      where: { visitId: visit.id },
    });
    await prisma.siteVisitMeasurement.create({
      data: {
        visitId: visit.id,
        organizationId: opts.organizationId,
        sortOrder: count,
        ...payload,
      },
    });
  }

  if (visit.status === "SCHEDULED" || visit.status === "TO_PLAN") {
    await prisma.siteVisit.update({
      where: { id: visit.id },
      data: { status: "IN_PROGRESS" },
    });
  }

  return getSiteVisit(opts.organizationId, visit.id);
}

export async function deleteMeasurement(opts: {
  organizationId: string;
  visitId: string;
  measurementId: string;
}) {
  await prisma.siteVisitMeasurement.deleteMany({
    where: {
      id: opts.measurementId,
      visitId: opts.visitId,
      organizationId: opts.organizationId,
    },
  });
  return getSiteVisit(opts.organizationId, opts.visitId);
}

export async function addMissingInfo(opts: {
  organizationId: string;
  visitId: string;
  label: string;
}) {
  const label = opts.label.trim();
  if (!label) throw new Error("Libellé requis");
  const visit = await prisma.siteVisit.findFirst({
    where: { id: opts.visitId, organizationId: opts.organizationId },
  });
  if (!visit) throw new Error("Visite introuvable");
  await prisma.siteVisitMissingInfo.create({
    data: {
      visitId: visit.id,
      organizationId: opts.organizationId,
      label,
    },
  });
  if (
    visit.status === "READY_TO_QUOTE" ||
    visit.status === "IN_PROGRESS" ||
    visit.status === "SCHEDULED"
  ) {
    await prisma.siteVisit.update({
      where: { id: visit.id },
      data: { status: "INCOMPLETE" },
    });
  }
  return getSiteVisit(opts.organizationId, visit.id);
}

export async function resolveMissingInfo(opts: {
  organizationId: string;
  visitId: string;
  missingId: string;
}) {
  await prisma.siteVisitMissingInfo.updateMany({
    where: {
      id: opts.missingId,
      visitId: opts.visitId,
      organizationId: opts.organizationId,
    },
    data: { resolvedAt: new Date() },
  });
  return getSiteVisit(opts.organizationId, opts.visitId);
}

export async function finishSiteVisit(opts: {
  organizationId: string;
  visitId: string;
  mode: "incomplete" | "ready";
}) {
  const visit = await prisma.siteVisit.findFirst({
    where: { id: opts.visitId, organizationId: opts.organizationId },
  });
  if (!visit) throw new Error("Visite introuvable");
  if (visit.status === "TRANSMITTED") {
    throw new Error("Visite déjà transmise au devis");
  }
  if (visit.status === "CANCELLED") throw new Error("Visite annulée");

  const next: SiteVisitStatus =
    opts.mode === "incomplete" ? "INCOMPLETE" : "READY_TO_QUOTE";

  await prisma.siteVisit.update({
    where: { id: visit.id },
    data: { status: next },
  });

  if (visit.agendaEventId) {
    await prisma.agendaEvent.updateMany({
      where: { id: visit.agendaEventId, organizationId: opts.organizationId },
      data: { status: "TERMINE" },
    });
  }

  return getSiteVisit(opts.organizationId, visit.id);
}
