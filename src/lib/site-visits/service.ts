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
  type MeasureDeduction,
} from "@/lib/site-visits/measurements";
import { SITE_VISIT_STATUS_LABELS, normalizeConstraints, parseVisitPrep, type SiteVisitConstraints, type SiteVisitPrep } from "@/lib/site-visits/types";
import { buildVisitSummary } from "@/lib/site-visits/summary";
import { buildQuoteImpactPoints } from "@/lib/site-visits/impact";
import { buildVisitCompleteness, hasVisitConstraints } from "@/lib/site-visits/completeness";
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
  lots?: string[] | null;
  zones?: string[] | null;
  constraints?: SiteVisitConstraints | null;
  prep?: SiteVisitPrep | null;
  estimatedDuration?: string | null;
  missingLabels?: string[] | null;
};

function parseStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function parseDeductions(raw: unknown): MeasureDeduction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === "object")
    .map((x) => {
      const o = x as MeasureDeduction;
      return {
        label: typeof o.label === "string" ? o.label : null,
        lengthM: o.lengthM != null ? Number(o.lengthM) : null,
        widthM: o.widthM != null ? Number(o.widthM) : null,
        quantity: o.quantity != null ? Number(o.quantity) : null,
      };
    });
}

function primaryActionFor(status: SiteVisitStatus, quoteHref: string | null): {
  kind: string;
  label: string;
  href?: string | null;
} {
  switch (status) {
    case "TO_PLAN":
      return { kind: "plan", label: "Planifier" };
    case "SCHEDULED":
      return { kind: "prepare", label: "Préparer" };
    case "IN_PROGRESS":
      return { kind: "continue", label: "Continuer" };
    case "INCOMPLETE":
      return { kind: "complete", label: "Compléter" };
    case "READY_TO_QUOTE":
      return { kind: "quote", label: "Créer le devis" };
    case "TRANSMITTED":
      return { kind: "open-quote", label: "Voir le devis", href: quoteHref };
    default:
      return { kind: "open", label: "Ouvrir" };
  }
}

function serializeConstraints(raw: unknown): SiteVisitConstraints {
  return normalizeConstraints(raw);
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
    lotsJson?: unknown;
    zonesJson?: unknown;
    prepJson?: unknown;
    preparedAt?: Date | null;
    estimatedCrewCount: number | null;
    estimatedDuration: string | null;
    status: SiteVisitStatus;
    agendaEventId: string | null;
    commercialQuoteId: string | null;
    createdAt?: Date;
    updatedAt?: Date;
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
      grossQuantity?: unknown;
      multiplier?: unknown;
      coefficient?: unknown;
      wastePercent?: unknown;
      deductionsJson?: unknown;
      lot?: string | null;
      workItemId?: string | null;
      observation: string | null;
      sortOrder: number;
      modifiedAfterTransmit: boolean;
    }>;
    missingInfos?: Array<{
      id: string;
      label: string;
      comment?: string | null;
      dueAt?: Date | null;
      resolvedAt: Date | null;
    }>;
    medias?: Array<{
      id: string;
      measurementId: string | null;
      zone?: string | null;
      kind: string;
      name: string;
      caption: string | null;
      fileUrl: string | null;
      mimeType: string | null;
      createdAt?: Date;
    }>;
    responsible?: { id: string; name: string | null; email: string } | null;
    commercialQuote?: { id: string; number: string; status: string } | null;
    project?: { id: string; title: string } | null;
  },
) {
  const measurements = (v.measurements ?? []).map((m) => {
    const qty = d(m.computedQuantity);
    const deductions = parseDeductions(m.deductionsJson);
    return {
      id: m.id,
      zone: m.zone,
      label: m.label,
      measureType: m.measureType,
      lengthM: m.lengthM != null ? d(m.lengthM) : null,
      widthM: m.widthM != null ? d(m.widthM) : null,
      heightM: m.heightM != null ? d(m.heightM) : null,
      quantityValue: m.quantityValue != null ? d(m.quantityValue) : null,
      unit: m.unit,
      computedQuantity: qty,
      grossQuantity: m.grossQuantity != null ? d(m.grossQuantity) : qty,
      multiplier: m.multiplier != null ? d(m.multiplier) : null,
      coefficient: m.coefficient != null ? d(m.coefficient) : null,
      wastePercent: m.wastePercent != null ? d(m.wastePercent) : null,
      deductions,
      lot: m.lot ?? null,
      workItemId: m.workItemId ?? null,
      quantityLabel: formatQuantityLabel(qty, m.unit),
      observation: m.observation,
      sortOrder: m.sortOrder,
      modifiedAfterTransmit: m.modifiedAfterTransmit,
    };
  });
  const missingOpen = (v.missingInfos ?? []).filter((i) => !i.resolvedAt);
  const photos = (v.medias ?? []).filter((m) => m.kind === "PHOTO");
  const docs = (v.medias ?? []).filter((m) => m.kind === "DOCUMENT");
  const constraints = serializeConstraints(v.constraintsJson);
  const lots = parseStringList(v.lotsJson);
  const zones = parseStringList(v.zonesJson);
  const prep = parseVisitPrep(v.prepJson);
  const uniqueZones = [
    ...new Set([...zones, ...measurements.map((m) => m.zone?.trim() || "").filter(Boolean)]),
  ];
  const uniqueLots = [
    ...new Set([...lots, ...measurements.map((m) => m.lot?.trim() || "").filter(Boolean)]),
  ];
  const impactPoints = buildQuoteImpactPoints({
    constraints,
    missingOpenLabels: missingOpen.map((i) => i.label),
  });
  const summary = buildVisitSummary({
    siteName: v.siteName,
    clientName: v.clientName,
    siteAddress: v.siteAddress,
    projectId: v.projectId,
    contactName: v.contactName,
    contactPhone: v.contactPhone,
    scheduledAt: v.scheduledAt,
    subject: v.subject,
    lots,
    constraints,
    measurements,
    missingOpen: missingOpen.map((i) => ({ label: i.label })),
    photoCount: photos.length,
    documentCount: docs.length,
    estimatedCrewCount: v.estimatedCrewCount,
    estimatedDuration: v.estimatedDuration,
  });
  const completeness = buildVisitCompleteness({
    clientName: v.clientName,
    siteAddress: v.siteAddress,
    siteName: v.siteName,
    projectId: v.projectId,
    contactName: v.contactName,
    contactPhone: v.contactPhone,
    scheduledAt: v.scheduledAt,
    subject: v.subject,
    lots,
    measurementCount: measurements.length,
    measurementLots: measurements.map((m) => m.lot).filter((x): x is string => Boolean(x)),
    hasConstraints: hasVisitConstraints(constraints),
    missingOpenCount: missingOpen.length,
    photoCount: photos.length,
    documentCount: docs.length,
  });
  const quoteHref = v.commercialQuoteId
    ? `/dashboard/devis-facturation/devis/${v.commercialQuoteId}?fromVisit=${v.id}`
    : null;
  return {
    id: v.id,
    clientName: v.clientName,
    siteName: v.siteName,
    siteAddress: v.siteAddress,
    contactName: v.contactName,
    contactPhone: v.contactPhone,
    clientExternalOrgId: v.clientExternalOrgId,
    projectId: v.projectId,
    projectTitle: v.project?.title ?? null,
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
    constraints,
    lots: uniqueLots,
    zones: uniqueZones,
    prep,
    preparedAt: v.preparedAt?.toISOString() ?? null,
    estimatedCrewCount: v.estimatedCrewCount,
    estimatedDuration: v.estimatedDuration,
    status: v.status,
    statusLabel: SITE_VISIT_STATUS_LABELS[v.status],
    agendaEventId: v.agendaEventId,
    agendaHref: v.agendaEventId ? `/dashboard/agenda?event=${v.agendaEventId}` : "/dashboard/agenda",
    documentsHref: v.projectId
      ? `/dashboard/documents?projectId=${encodeURIComponent(v.projectId)}`
      : `/dashboard/documents?q=${encodeURIComponent(v.siteName || v.clientName)}`,
    projectHref: v.projectId ? `/dashboard/projets/${v.projectId}` : null,
    commercialQuoteId: v.commercialQuoteId,
    commercialQuoteNumber: v.commercialQuote?.number ?? null,
    commercialQuoteHref: quoteHref,
    measurements,
    missingInfos: (v.missingInfos ?? []).map((i) => ({
      id: i.id,
      label: i.label,
      comment: i.comment ?? null,
      dueAt: i.dueAt?.toISOString() ?? null,
      resolvedAt: i.resolvedAt?.toISOString() ?? null,
      open: !i.resolvedAt,
    })),
    medias: (v.medias ?? []).map((m) => ({
      id: m.id,
      measurementId: m.measurementId,
      zone: m.zone ?? null,
      kind: m.kind,
      name: m.name,
      caption: m.caption,
      fileUrl: m.fileUrl,
      mimeType: m.mimeType,
      createdAt: m.createdAt?.toISOString() ?? null,
    })),
    impactPoints,
    completeness: {
      ...completeness,
      tone: v.status === "INCOMPLETE" ? "watch" : completeness.tone,
    },
    primaryAction: primaryActionFor(v.status, quoteHref),
    createdAt: v.createdAt?.toISOString() ?? null,
    updatedAt: v.updatedAt?.toISOString() ?? null,
    summary,
    stats: {
      measurementCount: measurements.length,
      zoneCount: uniqueZones.length,
      lotCount: uniqueLots.length,
      photoCount: photos.length,
      documentCount: docs.length,
      missingOpenCount: missingOpen.length,
      constraintCount: impactPoints.length,
      quantitySummary: measurements
        .slice(0, 5)
        .map((m) => `${m.label} : ${m.quantityLabel}`),
      totalsByUnit: summary.totalsByUnit.map((t) => t.label),
      impactPreview: impactPoints
        .filter((p) => p.severity === "info")
        .slice(0, 4)
        .map((p) => p.label),
    },
  };
}

const visitInclude = {
  measurements: { orderBy: { sortOrder: "asc" as const } },
  missingInfos: { orderBy: { createdAt: "asc" as const } },
  medias: { orderBy: { createdAt: "desc" as const } },
  responsible: { select: { id: true, name: true, email: true } },
  commercialQuote: { select: { id: true, number: true, status: true } },
  project: { select: { id: true, title: true } },
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
  const lots = (input.lots ?? []).map((x) => x.trim()).filter(Boolean);
  const zones = (input.zones ?? []).map((x) => x.trim()).filter(Boolean);
  const constraints = input.constraints ? normalizeConstraints(input.constraints) : null;
  const prep = input.prep ? parseVisitPrep(input.prep) : null;
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
      estimatedDuration: input.estimatedDuration?.trim() || prep?.duration || null,
      lotsJson: lots.length ? lots : undefined,
      zonesJson: zones.length ? zones : undefined,
      constraintsJson: constraints ? (constraints as Prisma.InputJsonValue) : undefined,
      prepJson: prep ? (prep as Prisma.InputJsonValue) : undefined,
      preparedAt: lots.length || zones.length || constraints ? new Date() : null,
      status,
    },
    include: visitInclude,
  });

  const missingLabels = [
    ...(input.missingLabels ?? []),
    ...(prep?.docsToRequest ?? []),
  ]
    .map((x) => x.trim())
    .filter(Boolean);
  if (missingLabels.length) {
    await prisma.siteVisitMissingInfo.createMany({
      data: missingLabels.map((label) => ({
        visitId: visit.id,
        organizationId: input.organizationId,
        label,
      })),
    });
  }

  if (visit.scheduledAt && prep?.addToAgenda !== false) {
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
  projectId?: string | null;
  lot?: string | null;
  state?: string | null;
  take?: number;
}) {
  const q = opts.q?.trim();
  const visits = await prisma.siteVisit.findMany({
    where: {
      organizationId: opts.organizationId,
      status:
        opts.state === "ready"
          ? "READY_TO_QUOTE"
          : opts.state === "quoted"
            ? "TRANSMITTED"
            : opts.status ?? undefined,
      responsibleId: opts.responsibleId || undefined,
      projectId: opts.projectId || undefined,
      scheduledAt:
        opts.from || opts.to
          ? {
              gte: opts.from ?? undefined,
              lte: opts.to ?? undefined,
            }
          : undefined,
      ...(opts.lot
        ? {
            OR: [
              { lotsJson: { array_contains: opts.lot } },
              { measurements: { some: { lot: opts.lot } } },
            ],
          }
        : {}),
      ...(opts.state === "docs"
        ? { medias: { some: {} } }
        : opts.state === "constraints"
          ? { NOT: { constraintsJson: { equals: Prisma.DbNull } } }
          : opts.state === "missing"
            ? { missingInfos: { some: { resolvedAt: null } } }
            : {}),
      ...(q
        ? {
            AND: [
              {
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
              },
            ],
          }
        : {}),
    },
    include: visitInclude,
    orderBy: [{ scheduledAt: "asc" }, { updatedAt: "desc" }],
    take: opts.take ?? 120,
  });
  return visits.map(serializeVisit);
}

export async function listSiteVisitKpis(organizationId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const [grouped, thisWeek, incompleteOpen] = await Promise.all([
    prisma.siteVisit.groupBy({
      by: ["status"],
      where: { organizationId, status: { not: "CANCELLED" } },
      _count: { _all: true },
    }),
    prisma.siteVisit.count({
      where: {
        organizationId,
        status: { notIn: ["CANCELLED"] },
        scheduledAt: { gte: startOfWeek, lt: endOfWeek },
      },
    }),
    prisma.siteVisit.count({
      where: {
        organizationId,
        status: { notIn: ["CANCELLED", "TRANSMITTED"] },
        missingInfos: { some: { resolvedAt: null } },
      },
    }),
  ]);
  const countOf = (s: SiteVisitStatus) =>
    grouped.find((g) => g.status === s)?._count._all ?? 0;
  return {
    toPlan: countOf("TO_PLAN"),
    thisWeek,
    inProgress: countOf("IN_PROGRESS"),
    incomplete: Math.max(countOf("INCOMPLETE"), incompleteOpen),
    ready: countOf("READY_TO_QUOTE"),
    toQuote: countOf("READY_TO_QUOTE"),
  };
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
    const merged = normalizeConstraints({
      ...normalizeConstraints(existing.constraintsJson),
      ...(d0.constraints as object),
    });
    patch.constraintsJson = merged as Prisma.InputJsonValue;
  }
  if (typeof d0.estimatedCrewCount === "number" || d0.estimatedCrewCount === null)
    patch.estimatedCrewCount =
      typeof d0.estimatedCrewCount === "number" ? d0.estimatedCrewCount : null;
  if (typeof d0.estimatedDuration === "string" || d0.estimatedDuration === null)
    patch.estimatedDuration =
      typeof d0.estimatedDuration === "string"
        ? d0.estimatedDuration.trim() || null
        : null;
  if (Array.isArray(d0.lots)) {
    patch.lotsJson = parseStringList(d0.lots) as Prisma.InputJsonValue;
  }
  if (Array.isArray(d0.zones)) {
    patch.zonesJson = parseStringList(d0.zones) as Prisma.InputJsonValue;
  }
  if (d0.preparedAt === true) patch.preparedAt = new Date();
  if (d0.preparedAt === false || d0.preparedAt === null) patch.preparedAt = null;
  if (d0.prep != null && typeof d0.prep === "object") {
    patch.prepJson = parseVisitPrep(d0.prep) as Prisma.InputJsonValue;
  }
  if (typeof d0.projectId === "string" || d0.projectId === null) {
    patch.project =
      typeof d0.projectId === "string" && d0.projectId
        ? { connect: { id: d0.projectId } }
        : { disconnect: true };
  }
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
    multiplier?: number | null;
    coefficient?: number | null;
    wastePercent?: number | null;
    deductions?: MeasureDeduction[] | null;
    lot?: string | null;
    workItemId?: string | null;
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
  const deductions = opts.data.deductions ?? [];
  const calc = computeMeasurement({
    ...opts.data,
    deductions,
  });
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
    grossQuantity: calc.grossQuantity,
    multiplier: opts.data.multiplier ?? null,
    coefficient: opts.data.coefficient ?? null,
    wastePercent: opts.data.wastePercent ?? null,
    deductionsJson: deductions.length ? (deductions as Prisma.InputJsonValue) : Prisma.JsonNull,
    lot: opts.data.lot?.trim() || null,
    workItemId: opts.data.workItemId?.trim() || null,
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
  comment?: string | null;
  dueAt?: Date | null;
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
      comment: opts.comment?.trim() || null,
      dueAt: opts.dueAt ?? null,
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
