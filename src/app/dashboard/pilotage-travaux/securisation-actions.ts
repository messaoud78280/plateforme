"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  canEditPilotageOperational,
  requirePilotageAccess,
  requirePilotageSession,
} from "@/lib/pilotage/access";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import { logPilotageActivity } from "@/lib/pilotage/history";
import { HANDOVER_CHECKLIST_DEFAULT } from "@/lib/pilotage/methodLibrary";
import { refreshPilotageProgress } from "./refresh-progress";
import { normalizeIncomingDocumentsRef } from "@/lib/storage/documents-ref-migrate";

function revalidatePilotage(id: string) {
  revalidatePath(PILOTAGE_LIST_PATH);
  revalidatePath(`${PILOTAGE_LIST_PATH}/${id}`);
}

function parseDate(v: FormDataEntryValue | null): Date | null {
  if (!v || typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function guardEdit(pilotageId: string) {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) {
    return { ok: false as const, error: "Droits insuffisants.", session: null };
  }
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);
  return { ok: true as const, session };
}

export async function createSensitiveDeadline(formData: FormData) {
  const pilotageId = String(formData.get("pilotageId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const deadlineType = String(formData.get("deadlineType") ?? "").trim();
  if (!pilotageId || !title || !deadlineType) {
    return { ok: false as const, error: "Titre, type et chantier obligatoires." };
  }
  const g = await guardEdit(pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  const sourceType = String(formData.get("sourceType") ?? "Saisie manuelle").trim() || "Saisie manuelle";
  const fromExtraction = sourceType.toLowerCase().includes("extraction") || sourceType.toLowerCase().includes("document");
  const item = await prisma.pilotageSensitiveDeadline.create({
    data: {
      pilotageId,
      title,
      deadlineType,
      sourceType,
      articleRef: String(formData.get("articleRef") ?? "").trim() || null,
      pageRef: String(formData.get("pageRef") ?? "").trim() || null,
      startAt: parseDate(formData.get("startAt")),
      dueAt: parseDate(formData.get("dueAt")),
      calculationMode: String(formData.get("calculationMode") ?? "").trim() || null,
      responsibleName: String(formData.get("responsibleName") ?? "").trim() || null,
      confirmationLevel: fromExtraction ? "À vérifier" : String(formData.get("confirmationLevel") ?? "À vérifier").trim() || "À vérifier",
      priority: String(formData.get("priority") ?? "Haute").trim() || "Haute",
      status: fromExtraction ? "À vérifier" : String(formData.get("status") ?? "À traiter").trim() || "À traiter",
      comment: String(formData.get("comment") ?? "").trim() || null,
    },
  });
  await logPilotageActivity({
    pilotageId,
    userId: g.session.user.id,
    userName: g.session.user.name,
    actionType: "échéance sensible créée",
    entityType: "sensitiveDeadline",
    entityId: item.id,
    entityLabel: title,
  });
  await refreshPilotageProgress(pilotageId);
  revalidatePilotage(pilotageId);
  return { ok: true as const };
}

export async function updateSensitiveDeadlineStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) return { ok: false as const, error: "Données manquantes." };
  const item = await prisma.pilotageSensitiveDeadline.findUnique({ where: { id } });
  if (!item) return { ok: false as const, error: "Échéance introuvable." };
  const g = await guardEdit(item.pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  await prisma.pilotageSensitiveDeadline.update({ where: { id }, data: { status } });
  await logPilotageActivity({
    pilotageId: item.pilotageId,
    userId: g.session.user.id,
    userName: g.session.user.name,
    actionType: "échéance sensible mise à jour",
    entityType: "sensitiveDeadline",
    entityId: id,
    entityLabel: item.title,
    oldValue: item.status,
    newValue: status,
  });
  await refreshPilotageProgress(item.pilotageId);
  revalidatePilotage(item.pilotageId);
  return { ok: true as const };
}

export async function createPricingAssumption(formData: FormData) {
  const pilotageId = String(formData.get("pilotageId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!pilotageId || !title) return { ok: false as const, error: "Titre et chantier obligatoires." };
  const g = await guardEdit(pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  const item = await prisma.pilotagePricingAssumption.create({
    data: {
      pilotageId,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      category: String(formData.get("category") ?? "Organisation").trim() || "Organisation",
      lot: String(formData.get("lot") ?? "").trim() || null,
      sourceType: String(formData.get("sourceType") ?? "Saisie manuelle").trim() || "Saisie manuelle",
      authorName: String(formData.get("authorName") ?? "").trim() || null,
      assumedValue: String(formData.get("assumedValue") ?? "").trim() || null,
      justification: String(formData.get("justification") ?? "").trim() || null,
      verificationStatus: String(formData.get("verificationStatus") ?? "Hypothèse d’étude").trim() || "Hypothèse d’étude",
    },
  });
  await logPilotageActivity({
    pilotageId,
    userId: g.session.user.id,
    userName: g.session.user.name,
    actionType: "hypothèse de chiffrage créée",
    entityType: "pricingAssumption",
    entityId: item.id,
    entityLabel: title,
  });
  await refreshPilotageProgress(pilotageId);
  revalidatePilotage(pilotageId);
  return { ok: true as const };
}

export async function updatePricingAssumption(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false as const, error: "Identifiant manquant." };
  const item = await prisma.pilotagePricingAssumption.findUnique({ where: { id } });
  if (!item) return { ok: false as const, error: "Hypothèse introuvable." };
  const g = await guardEdit(item.pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  const verificationStatus = String(formData.get("verificationStatus") ?? item.verificationStatus).trim();
  await prisma.pilotagePricingAssumption.update({
    where: { id },
    data: {
      verificationStatus,
      realityObserved: String(formData.get("realityObserved") ?? "").trim() || item.realityObserved,
      gapSummary: String(formData.get("gapSummary") ?? "").trim() || item.gapSummary,
      impactCost: String(formData.get("impactCost") ?? "").trim() || item.impactCost,
      impactDelay: String(formData.get("impactDelay") ?? "").trim() || item.impactDelay,
      impactOrg: String(formData.get("impactOrg") ?? "").trim() || item.impactOrg,
      decision: String(formData.get("decision") ?? "").trim() || item.decision,
    },
  });
  await refreshPilotageProgress(item.pilotageId);
  revalidatePilotage(item.pilotageId);
  return { ok: true as const };
}

export async function ensureHandoverChecklist(pilotageId: string) {
  const g = await guardEdit(pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  let handover = await prisma.pilotageHandover.findFirst({
    where: { pilotageId, archivedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!handover) {
    handover = await prisma.pilotageHandover.create({
      data: { pilotageId, title: "Passation du marché", status: "À préparer" },
    });
  }
  const count = await prisma.pilotageHandoverItem.count({ where: { handoverId: handover.id, archivedAt: null } });
  if (count === 0) {
    await prisma.pilotageHandoverItem.createMany({
      data: HANDOVER_CHECKLIST_DEFAULT.map((row, i) => ({
        handoverId: handover!.id,
        title: row.title,
        category: row.category,
        sortOrder: (i + 1) * 10,
      })),
    });
  }
  await logPilotageActivity({
    pilotageId,
    userId: g.session.user.id,
    userName: g.session.user.name,
    actionType: "passation préparée",
    entityType: "handover",
    entityId: handover.id,
    entityLabel: handover.title,
  });
  revalidatePilotage(pilotageId);
  return { ok: true as const, handoverId: handover.id };
}

export async function updateHandoverStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) return { ok: false as const, error: "Données manquantes." };
  const item = await prisma.pilotageHandover.findUnique({ where: { id } });
  if (!item) return { ok: false as const, error: "Passation introuvable." };
  const g = await guardEdit(item.pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  await prisma.pilotageHandover.update({
    where: { id },
    data: {
      status,
      closedAt: status === "Clôturée" ? new Date() : item.closedAt,
      meetingNotes: String(formData.get("meetingNotes") ?? "").trim() || item.meetingNotes,
    },
  });
  revalidatePilotage(item.pilotageId);
  return { ok: true as const };
}

export async function toggleHandoverItem(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false as const, error: "Identifiant manquant." };
  const item = await prisma.pilotageHandoverItem.findUnique({
    where: { id },
    include: { handover: { select: { pilotageId: true } } },
  });
  if (!item) return { ok: false as const, error: "Élément introuvable." };
  const g = await guardEdit(item.handover.pilotageId);
  if (!g.ok) return { ok: false as const, error: g.error };

  const field = String(formData.get("field") ?? "transmitted");
  const value = String(formData.get("value") ?? "true") === "true";
  await prisma.pilotageHandoverItem.update({
    where: { id },
    data:
      field === "validated"
        ? { validated: value }
        : field === "includedInScope"
          ? { includedInScope: value }
          : { transmitted: value },
  });
  revalidatePilotage(item.handover.pilotageId);
  return { ok: true as const };
}

export async function createTradeInterface(formData: FormData) {
  const pilotageId = String(formData.get("pilotageId") ?? "").trim();
  const primaryLot = String(formData.get("primaryLot") ?? "").trim();
  const relatedLot = String(formData.get("relatedLot") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  if (!pilotageId || !primaryLot || !relatedLot || !subject) {
    return { ok: false as const, error: "Lots et sujet obligatoires." };
  }
  const g = await guardEdit(pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  const item = await prisma.pilotageTradeInterface.create({
    data: {
      pilotageId,
      primaryLot,
      relatedLot,
      subject,
      description: String(formData.get("description") ?? "").trim() || null,
      zone: String(formData.get("zone") ?? "").trim() || null,
      whoSupplies: String(formData.get("whoSupplies") ?? "").trim() || null,
      whoInstalls: String(formData.get("whoInstalls") ?? "").trim() || null,
      whoPrepares: String(formData.get("whoPrepares") ?? "").trim() || null,
      whoValidates: String(formData.get("whoValidates") ?? "").trim() || null,
      dueAt: parseDate(formData.get("dueAt")),
      riskLevel: String(formData.get("riskLevel") ?? "Modéré").trim() || "Modéré",
      status: String(formData.get("status") ?? "À définir").trim() || "À définir",
    },
  });
  await logPilotageActivity({
    pilotageId,
    userId: g.session.user.id,
    userName: g.session.user.name,
    actionType: "interface lots créée",
    entityType: "tradeInterface",
    entityId: item.id,
    entityLabel: subject,
  });
  revalidatePilotage(pilotageId);
  return { ok: true as const };
}

export async function createEmbeddedElement(formData: FormData) {
  const pilotageId = String(formData.get("pilotageId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!pilotageId || !title) return { ok: false as const, error: "Titre et chantier obligatoires." };
  const g = await guardEdit(pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  const item = await prisma.pilotageEmbeddedElement.create({
    data: {
      pilotageId,
      reference: String(formData.get("reference") ?? "").trim() || null,
      title,
      elementType: String(formData.get("elementType") ?? "Réservation").trim() || "Réservation",
      requestingLot: String(formData.get("requestingLot") ?? "").trim() || null,
      executingLot: String(formData.get("executingLot") ?? "").trim() || null,
      building: String(formData.get("building") ?? "").trim() || null,
      level: String(formData.get("level") ?? "").trim() || null,
      zone: String(formData.get("zone") ?? "").trim() || null,
      planRef: String(formData.get("planRef") ?? "").trim() || null,
      dueAt: parseDate(formData.get("dueAt")),
      pourAt: parseDate(formData.get("pourAt")),
      responsibleName: String(formData.get("responsibleName") ?? "").trim() || null,
      status: String(formData.get("status") ?? "À identifier").trim() || "À identifier",
      observation: String(formData.get("observation") ?? "").trim() || null,
    },
  });
  await logPilotageActivity({
    pilotageId,
    userId: g.session.user.id,
    userName: g.session.user.name,
    actionType: "réservation / incorporation créée",
    entityType: "embeddedElement",
    entityId: item.id,
    entityLabel: title,
  });
  revalidatePilotage(pilotageId);
  return { ok: true as const };
}

export async function createSensitiveWork(formData: FormData) {
  const pilotageId = String(formData.get("pilotageId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!pilotageId || !title) return { ok: false as const, error: "Titre et chantier obligatoires." };
  const g = await guardEdit(pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  const item = await prisma.pilotageSensitiveWork.create({
    data: {
      pilotageId,
      title,
      lot: String(formData.get("lot") ?? "").trim() || null,
      zone: String(formData.get("zone") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      sensitivityLevel: String(formData.get("sensitivityLevel") ?? "Élevé").trim() || "Élevé",
      risks: String(formData.get("risks") ?? "").trim() || null,
      responsibleName: String(formData.get("responsibleName") ?? "").trim() || null,
      plannedAt: parseDate(formData.get("plannedAt")),
      photosRequired: String(formData.get("photosRequired") ?? "true") !== "false",
      status: "À préparer",
    },
  });
  await logPilotageActivity({
    pilotageId,
    userId: g.session.user.id,
    userName: g.session.user.name,
    actionType: "ouvrage sensible créé",
    entityType: "sensitiveWork",
    entityId: item.id,
    entityLabel: title,
  });
  revalidatePilotage(pilotageId);
  return { ok: true as const };
}

export async function createNonConformity(formData: FormData) {
  const pilotageId = String(formData.get("pilotageId") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!pilotageId || !description) return { ok: false as const, error: "Description et chantier obligatoires." };
  const g = await guardEdit(pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  const item = await prisma.pilotageNonConformity.create({
    data: {
      pilotageId,
      reference: String(formData.get("reference") ?? "").trim() || null,
      lot: String(formData.get("lot") ?? "").trim() || null,
      zone: String(formData.get("zone") ?? "").trim() || null,
      description,
      detectedByName: String(formData.get("detectedByName") ?? "").trim() || null,
      origin: String(formData.get("origin") ?? "").trim() || null,
      severity: String(formData.get("severity") ?? "Important").trim() || "Important",
      responsibleName: String(formData.get("responsibleName") ?? "").trim() || null,
      dueAt: parseDate(formData.get("dueAt")),
      status: "Détectée",
    },
  });
  await logPilotageActivity({
    pilotageId,
    userId: g.session.user.id,
    userName: g.session.user.name,
    actionType: "non-conformité créée",
    entityType: "nonConformity",
    entityId: item.id,
    entityLabel: description.slice(0, 80),
  });
  await refreshPilotageProgress(pilotageId);
  revalidatePilotage(pilotageId);
  return { ok: true as const };
}

export async function createDelayEvent(formData: FormData) {
  const pilotageId = String(formData.get("pilotageId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!pilotageId || !title) return { ok: false as const, error: "Titre et chantier obligatoires." };
  const g = await guardEdit(pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  const item = await prisma.pilotageDelayEvent.create({
    data: {
      pilotageId,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      startedAt: parseDate(formData.get("startedAt")),
      endedAt: parseDate(formData.get("endedAt")),
      causeCategory: String(formData.get("causeCategory") ?? "À analyser").trim() || "À analyser",
      presumedOrigin: String(formData.get("presumedOrigin") ?? "").trim() || null,
      impactedMilestone: String(formData.get("impactedMilestone") ?? "").trim() || null,
      confirmationLevel: "À vérifier",
      status: "Identifié",
    },
  });
  await logPilotageActivity({
    pilotageId,
    userId: g.session.user.id,
    userName: g.session.user.name,
    actionType: "retard / perturbation enregistré",
    entityType: "delayEvent",
    entityId: item.id,
    entityLabel: title,
  });
  await refreshPilotageProgress(pilotageId);
  revalidatePilotage(pilotageId);
  return { ok: true as const };
}

export async function createTimelineEvent(formData: FormData) {
  const pilotageId = String(formData.get("pilotageId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const eventType = String(formData.get("eventType") ?? "").trim();
  if (!pilotageId || !title || !eventType) {
    return { ok: false as const, error: "Titre, type et chantier obligatoires." };
  }
  const g = await guardEdit(pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  const item = await prisma.pilotageTimelineEvent.create({
    data: {
      pilotageId,
      title,
      eventType,
      description: String(formData.get("description") ?? "").trim() || null,
      occurredAt: parseDate(formData.get("occurredAt")) ?? new Date(),
      actorInternal: String(formData.get("actorInternal") ?? "").trim() || g.session.user.name,
      actorExternal: String(formData.get("actorExternal") ?? "").trim() || null,
      confirmationLevel: String(formData.get("confirmationLevel") ?? "À vérifier").trim() || "À vérifier",
      visibility: String(formData.get("visibility") ?? "Interne BeWork").trim() || "Interne BeWork",
      proofNote: String(formData.get("proofNote") ?? "").trim() || null,
    },
  });
  await logPilotageActivity({
    pilotageId,
    userId: g.session.user.id,
    userName: g.session.user.name,
    actionType: "fait chronologie ajouté",
    entityType: "timelineEvent",
    entityId: item.id,
    entityLabel: title,
  });
  revalidatePilotage(pilotageId);
  return { ok: true as const };
}

export async function createMeetingPreparation(formData: FormData) {
  const pilotageId = String(formData.get("pilotageId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!pilotageId || !title) return { ok: false as const, error: "Titre et chantier obligatoires." };
  const g = await guardEdit(pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  const item = await prisma.pilotageMeeting.create({
    data: {
      pilotageId,
      title,
      meetingType: String(formData.get("meetingType") ?? "Réunion de chantier").trim() || "Réunion de chantier",
      scheduledAt: parseDate(formData.get("scheduledAt")),
      status: "À préparer",
      participants: String(formData.get("participants") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  await logPilotageActivity({
    pilotageId,
    userId: g.session.user.id,
    userName: g.session.user.name,
    actionType: "réunion préparée",
    entityType: "meeting",
    entityId: item.id,
    entityLabel: title,
  });
  revalidatePilotage(pilotageId);
  return { ok: true as const };
}

export async function createPilotagePhoto(formData: FormData) {
  const pilotageId = String(formData.get("pilotageId") ?? "").trim();
  const fileUrl = normalizeIncomingDocumentsRef(String(formData.get("fileUrl") ?? ""));
  if (!pilotageId || !fileUrl) return { ok: false as const, error: "URL photo et chantier obligatoires." };
  const g = await guardEdit(pilotageId);
  if (!g.ok || !g.session) return { ok: false as const, error: g.error };

  const item = await prisma.pilotagePhoto.create({
    data: {
      pilotageId,
      fileUrl,
      title: String(formData.get("title") ?? "").trim() || null,
      category: String(formData.get("category") ?? "Pendant travaux").trim() || "Pendant travaux",
      caption: String(formData.get("caption") ?? "").trim() || null,
      lot: String(formData.get("lot") ?? "").trim() || null,
      zone: String(formData.get("zone") ?? "").trim() || null,
      building: String(formData.get("building") ?? "").trim() || null,
      level: String(formData.get("level") ?? "").trim() || null,
      linkedType: String(formData.get("linkedType") ?? "").trim() || null,
      authorName: String(formData.get("authorName") ?? "").trim() || g.session.user.name,
      takenAt: parseDate(formData.get("takenAt")) ?? new Date(),
      visibility: String(formData.get("visibility") ?? "Interne entreprise cliente").trim() || "Interne entreprise cliente",
    },
  });
  await logPilotageActivity({
    pilotageId,
    userId: g.session.user.id,
    userName: g.session.user.name,
    actionType: "photo documentée",
    entityType: "photo",
    entityId: item.id,
    entityLabel: item.title ?? item.category,
  });
  void import("@/lib/ged/ingest-pilotage-document")
    .then(({ ingestPilotagePhotoToGed }) =>
      ingestPilotagePhotoToGed({ photoId: item.id, addedById: g.session!.user.id }),
    )
    .catch((e) => console.error("GED ingest photo:", e));
  revalidatePilotage(pilotageId);
  return { ok: true as const };
}

export async function createLessonLearned(formData: FormData) {
  const pilotageId = String(formData.get("pilotageId") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false as const, error: "Titre obligatoire." };
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) {
    return { ok: false as const, error: "Droits insuffisants." };
  }
  if (pilotageId) {
    await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);
  }

  const item = await prisma.pilotageLesson.create({
    data: {
      pilotageId,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      lot: String(formData.get("lot") ?? "").trim() || null,
      cause: String(formData.get("cause") ?? "").trim() || null,
      consequence: String(formData.get("consequence") ?? "").trim() || null,
      solution: String(formData.get("solution") ?? "").trim() || null,
      recommendation: String(formData.get("recommendation") ?? "").trim() || null,
      validationStatus: "Brouillon",
      enrichModels: false,
    },
  });
  if (pilotageId) {
    await logPilotageActivity({
      pilotageId,
      userId: session.user.id,
      userName: session.user.name,
      actionType: "retour d’expérience créé",
      entityType: "lesson",
      entityId: item.id,
      entityLabel: title,
    });
    revalidatePilotage(pilotageId);
  }
  return { ok: true as const };
}
