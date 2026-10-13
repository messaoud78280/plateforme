/**
 * Empreinte technique visite ↔ métré.
 * Écrit uniquement un événement d’étude. Aucune quantité n’est recalculée.
 */
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildVisitTechnicalSnapshot,
  describeMeasurementNow,
  evaluateVisitTakeoffDrift,
  isVisitExplicitlyLinked,
  readVisitTechnicalBaseline,
  type VisitMeasurementTouch,
  type VisitTakeoffDriftResult,
  type VisitTechnicalSnapshot,
} from "@/lib/site-visits/visit-takeoff-drift";

type BaselineDb = PrismaClient | Prisma.TransactionClient;

const MEASUREMENT_SELECT = {
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
  grossQuantity: true,
  multiplier: true,
  coefficient: true,
  wastePercent: true,
  deductionsJson: true,
  lot: true,
  updatedAt: true,
} as const;

export async function recordVisitTechnicalBaseline(
  db: BaselineDb,
  input: {
    organizationId: string;
    projectId: string;
    studyId: string;
    userId: string;
  },
): Promise<void> {
  const visit = await db.siteVisit.findFirst({
    where: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      status: { not: "CANCELLED" },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      clientNeed: true,
      zonesJson: true,
      lotsJson: true,
      findingsJson: true,
      proposedWorksJson: true,
      measurements: { select: MEASUREMENT_SELECT },
    },
  });
  if (!visit) return;

  const snapshot = buildVisitTechnicalSnapshot({
    id: visit.id,
    clientNeed: visit.clientNeed,
    zonesJson: visit.zonesJson,
    lotsJson: visit.lotsJson,
    findingsJson: visit.findingsJson,
    proposedWorksJson: visit.proposedWorksJson,
    measurements: visit.measurements,
  });

  await db.prepStudyEvent.create({
    data: {
      studyId: input.studyId,
      organizationId: input.organizationId,
      kind: "VISIT_TECHNICAL_BASELINE",
      detailJson: {
        visitTechnicalBaseline: snapshot,
      } as unknown as Prisma.InputJsonValue,
      actorUserId: input.userId,
    },
  });
}

function touchFromMeasurement(m: {
  id: string;
  label: string;
  zone: string | null;
  unit: string | null;
  lengthM: unknown;
  widthM: unknown;
  heightM: unknown;
  quantityValue: unknown;
  computedQuantity: unknown;
  updatedAt: Date;
}): VisitMeasurementTouch {
  const now = describeMeasurementNow(m);
  return {
    id: m.id,
    label: m.zone ? `${m.label} — ${m.zone}` : m.label,
    detail: now ? `Modifié après le métré · ${now}` : "Modifié après le métré",
    updatedAt: m.updatedAt,
  };
}

/** Lecture dossier : empreinte si elle existe, sinon relevés postérieurs au métré. */
export async function loadProjectVisitTakeoffDrift(input: {
  organizationId: string;
  projectId: string;
  study: { id: string; createdAt: Date } | null;
  visit: {
    id: string;
    projectId: string | null;
    commercialQuoteId: string | null;
  } | null;
  quoteIds: readonly string[];
}): Promise<VisitTakeoffDriftResult> {
  const linked = isVisitExplicitlyLinked({
    projectId: input.projectId,
    visit: input.visit,
    quoteIds: input.quoteIds,
  });
  if (!input.study || !input.visit || !linked) {
    return evaluateVisitTakeoffDrift({
      hasStudy: Boolean(input.study),
      visitLinked: linked,
    });
  }

  const [events, visit] = await Promise.all([
    prisma.prepStudyEvent.findMany({
      where: {
        studyId: input.study.id,
        kind: { in: ["VALIDATE_STUDY", "VISIT_TECHNICAL_BASELINE"] },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { kind: true, createdAt: true, detailJson: true },
    }),
    prisma.siteVisit.findFirst({
      where: { id: input.visit.id, organizationId: input.organizationId },
      select: {
        id: true,
        clientNeed: true,
        zonesJson: true,
        lotsJson: true,
        findingsJson: true,
        proposedWorksJson: true,
        measurements: {
          select: MEASUREMENT_SELECT,
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ]);

  let baseline: VisitTechnicalSnapshot | null = null;
  let validatedAt: Date | null = null;
  for (const event of events) {
    if (!validatedAt && event.kind === "VALIDATE_STUDY") {
      validatedAt = event.createdAt;
    }
    if (!baseline) {
      baseline = readVisitTechnicalBaseline(event.detailJson);
    }
  }

  const current = visit
    ? buildVisitTechnicalSnapshot({
        id: visit.id,
        clientNeed: visit.clientNeed,
        zonesJson: visit.zonesJson,
        lotsJson: visit.lotsJson,
        findingsJson: visit.findingsJson,
        proposedWorksJson: visit.proposedWorksJson,
        measurements: visit.measurements,
      })
    : null;

  return evaluateVisitTakeoffDrift({
    hasStudy: true,
    visitLinked: true,
    studyCreatedAt: input.study.createdAt,
    studyValidatedAt: validatedAt,
    baseline,
    current,
    measurementTouches: (visit?.measurements ?? []).map(touchFromMeasurement),
  });
}
