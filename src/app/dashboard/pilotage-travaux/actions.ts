"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  canEditPilotageOperational,
  canManagePilotage,
  requirePilotageAccess,
  requirePilotageSession,
} from "@/lib/pilotage/access";
import { computeDoeProgress } from "@/lib/pilotage/calculations";
import { DEFAULT_MILESTONES, PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import { logPilotageActivity } from "@/lib/pilotage/history";
import { getTemplateById } from "@/lib/pilotage/templates";
import { refreshPilotageProgress } from "./refresh-progress";

function revalidatePilotage(id?: string) {
  revalidatePath(PILOTAGE_LIST_PATH);
  revalidatePath(`${PILOTAGE_LIST_PATH}/a-traiter`);
  revalidatePath(`${PILOTAGE_LIST_PATH}/blocages`);
  revalidatePath(`${PILOTAGE_LIST_PATH}/calendrier`);
  if (id) revalidatePath(`${PILOTAGE_LIST_PATH}/${id}`);
}

async function refreshProgress(pilotageId: string) {
  await refreshPilotageProgress(pilotageId);
}

function parseDate(v: FormDataEntryValue | null): Date | null {
  if (!v || typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDecimal(v: FormDataEntryValue | null): Prisma.Decimal | null {
  if (!v || typeof v !== "string" || !v.trim()) return null;
  const n = Number(v.replace(",", "."));
  if (Number.isNaN(n) || n < 0) return null;
  return new Prisma.Decimal(n);
}

export async function createWorksitePilotage(formData: FormData): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) {
    return { ok: false, error: "Vous n’avez pas les droits pour créer un pilotage." };
  }

  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) return { ok: false, error: "Chantier obligatoire." };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, clientId: true, title: true },
  });
  if (!project) return { ok: false, error: "Chantier introuvable." };

  if (session.user.role === "CLIENT" && project.clientId !== session.user.id) {
    return { ok: false, error: "Chantier non autorisé." };
  }

  const existing = await prisma.worksitePilotage.findUnique({ where: { projectId } });
  if (existing && !existing.archivedAt) {
    return { ok: false, error: "Ce chantier a déjà un pilotage actif." };
  }

  const startDate = parseDate(formData.get("startDate"));
  const plannedEndDate = parseDate(formData.get("plannedEndDate"));
  if (startDate && plannedEndDate && plannedEndDate < startDate) {
    return { ok: false, error: "La date de fin doit être postérieure à la date de démarrage." };
  }

  const applyTemplate = formData.get("applyTemplate") === "1";
  const templateId = String(formData.get("templateId") ?? "gros-oeuvre");

  const baseData = {
    clientId: project.clientId,
    internalRef: String(formData.get("internalRef") ?? "").trim() || null,
    lot: String(formData.get("lot") ?? "").trim() || null,
    corpsEtat: String(formData.get("corpsEtat") ?? "").trim() || null,
    marketAmountHt: parseDecimal(formData.get("marketAmountHt")),
    notificationDate: parseDate(formData.get("notificationDate")),
    startDate,
    contractualDurationDays: (() => {
      const raw = String(formData.get("contractualDurationDays") ?? "").trim();
      if (!raw) return null;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
    })(),
    plannedEndDate,
    conducteurId: String(formData.get("conducteurId") ?? "").trim() || null,
    assistantId: String(formData.get("assistantId") ?? "").trim() || null,
    clientContactName: String(formData.get("clientContactName") ?? "").trim() || null,
    maitreOuvrage: String(formData.get("maitreOuvrage") ?? "").trim() || null,
    maitreOeuvre: String(formData.get("maitreOeuvre") ?? "").trim() || null,
    bureauControle: String(formData.get("bureauControle") ?? "").trim() || null,
    coordinateurSps: String(formData.get("coordinateurSps") ?? "").trim() || null,
    status: "A_PREPARER" as const,
    description: String(formData.get("description") ?? "").trim() || null,
    createdById: session.user.id,
    archivedAt: null,
  };

  try {
    const pilotage = existing
      ? await prisma.worksitePilotage.update({
          where: { id: existing.id },
          data: baseData,
        })
      : await prisma.worksitePilotage.create({
          data: {
            projectId: project.id,
            ...baseData,
          },
        });

    await logPilotageActivity({
      pilotageId: pilotage.id,
      userId: session.user.id,
      userName: session.user.name,
      actionType: existing ? "réactivation" : "création",
      entityType: "pilotage",
      entityId: pilotage.id,
      entityLabel: project.title,
      comment: existing ? "Pilotage archivé réactivé" : "Pilotage chantier créé",
    });

    if (applyTemplate && !existing) {
      const tpl = getTemplateById(templateId);
      if (tpl) {
        await applyTemplateToPilotage(pilotage.id, tpl.id, session.user.id, session.user.name);
      }
    }

    await refreshProgress(pilotage.id);
    revalidatePilotage(pilotage.id);
    return { ok: true, id: pilotage.id };
  } catch (e) {
    console.error("createWorksitePilotage:", e);
    return { ok: false, error: "Impossible de créer le pilotage. Réessayez." };
  }
}

async function applyTemplateToPilotage(
  pilotageId: string,
  templateId: string,
  userId: string,
  userName?: string | null,
) {
  const tpl = getTemplateById(templateId);
  if (!tpl) return;

  await prisma.$transaction([
    prisma.contractObligation.createMany({
      data: tpl.obligations.map((o) => ({
        pilotageId,
        title: o.title,
        description: o.description,
        category: o.category,
        priority: o.priority,
        expectedPiece: o.expectedPiece ?? null,
        status: "À analyser",
      })),
    }),
    prisma.requiredDocument.createMany({
      data: tpl.requiredDocuments.map((d) => ({
        pilotageId,
        name: d.name,
        category: d.category,
        isMandatory: d.isMandatory,
        status: "Manquant",
      })),
    }),
    prisma.doeItem.createMany({
      data: tpl.doeItems.map((d) => ({
        pilotageId,
        title: d.title,
        category: d.category,
        isMandatory: d.isMandatory,
        status: "Manquant",
      })),
    }),
    prisma.pilotageAction.createMany({
      data: tpl.actions.map((a) => ({
        pilotageId,
        title: a.title,
        description: a.description ?? null,
        category: a.category,
        priority: a.priority,
        status: "À faire",
        createdById: userId,
      })),
    }),
    prisma.planRegister.createMany({
      data: tpl.plans.map((p) => ({
        pilotageId,
        reference: p.reference,
        title: p.title,
        planType: p.planType,
        status: "À produire",
      })),
    }),
    prisma.pilotageMilestone.createMany({
      data: DEFAULT_MILESTONES.map((m) => ({
        pilotageId,
        title: m.title,
        category: m.category,
        sortOrder: m.sortOrder,
        status: "Non démarré",
        verificationStatus: "À vérifier",
        sourceType: "Modèle BeWork",
      })),
    }),
  ]);

  await logPilotageActivity({
    pilotageId,
    userId,
    userName,
    actionType: "modèle appliqué",
    entityType: "template",
    entityLabel: tpl.label,
    comment: "Éléments proposés à valider / adapter — non confirmés contractuellement",
  });
}

export async function createPilotageObligation(
  pilotageId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Titre obligatoire." };

  const created = await prisma.contractObligation.create({
    data: {
      pilotageId,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      category: String(formData.get("category") ?? "Contractuel").trim() || "Contractuel",
      sourceDocument: String(formData.get("sourceDocument") ?? "").trim() || null,
      articleRef: String(formData.get("articleRef") ?? "").trim() || null,
      dueDate: parseDate(formData.get("dueDate")),
      responsibleName: String(formData.get("responsibleName") ?? "").trim() || null,
      priority: String(formData.get("priority") ?? "Normale").trim() || "Normale",
      status: String(formData.get("status") ?? "À préparer").trim() || "À préparer",
      expectedPiece: String(formData.get("expectedPiece") ?? "").trim() || null,
      comment: String(formData.get("comment") ?? "").trim() || null,
    },
  });

  await logPilotageActivity({
    pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "obligation créée",
    entityType: "obligation",
    entityId: created.id,
    entityLabel: title,
  });
  await refreshProgress(pilotageId);
  revalidatePilotage(pilotageId);
  return { ok: true };
}

export async function createPilotageAction(
  pilotageId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role) && session.user.role !== "CLIENT") {
    return { ok: false, error: "Droits insuffisants." };
  }
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Titre obligatoire." };

  const created = await prisma.pilotageAction.create({
    data: {
      pilotageId,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      category: String(formData.get("category") ?? "Autre").trim() || "Autre",
      assigneeName: String(formData.get("assigneeName") ?? "").trim() || null,
      dueDate: parseDate(formData.get("dueDate")),
      priority: String(formData.get("priority") ?? "Normale").trim() || "Normale",
      status: "À faire",
      createdById: session.user.id,
      comment: String(formData.get("comment") ?? "").trim() || null,
    },
  });

  await logPilotageActivity({
    pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "action créée",
    entityType: "action",
    entityId: created.id,
    entityLabel: title,
  });
  revalidatePilotage(pilotageId);
  return { ok: true };
}

export async function updatePilotageActionStatus(
  actionId: string,
  status: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  const action = await prisma.pilotageAction.findUnique({ where: { id: actionId } });
  if (!action) return { ok: false, error: "Action introuvable." };
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, action.pilotageId);

  const old = action.status;
  await prisma.pilotageAction.update({
    where: { id: actionId },
    data: {
      status,
      completedAt: status === "Terminée" ? new Date() : action.completedAt,
    },
  });
  await logPilotageActivity({
    pilotageId: action.pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "changement de statut",
    entityType: "action",
    entityId: actionId,
    entityLabel: action.title,
    oldValue: old,
    newValue: status,
  });
  revalidatePilotage(action.pilotageId);
  return { ok: true };
}

export async function createRequiredDocument(
  pilotageId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Nom du document obligatoire." };

  const created = await prisma.requiredDocument.create({
    data: {
      pilotageId,
      name,
      category: String(formData.get("category") ?? "Administratif").trim() || "Administratif",
      isMandatory: formData.get("isMandatory") !== "0",
      producerName: String(formData.get("producerName") ?? "").trim() || null,
      dueDate: parseDate(formData.get("dueDate")),
      status: String(formData.get("status") ?? "Manquant").trim() || "Manquant",
      comment: String(formData.get("comment") ?? "").trim() || null,
    },
  });

  await logPilotageActivity({
    pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "document attendu ajouté",
    entityType: "required_document",
    entityId: created.id,
    entityLabel: name,
  });
  await refreshProgress(pilotageId);
  revalidatePilotage(pilotageId);
  return { ok: true };
}

export async function createMarketDocument(
  pilotageId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);

  const title = String(formData.get("title") ?? "").trim();
  const docType = String(formData.get("docType") ?? "").trim();
  if (!title || !docType) return { ok: false, error: "Titre et type obligatoires." };

  const created = await prisma.pilotageMarketDocument.create({
    data: {
      pilotageId,
      title,
      docType,
      version: String(formData.get("version") ?? "").trim() || null,
      indice: String(formData.get("indice") ?? "").trim() || null,
      documentDate: parseDate(formData.get("documentDate")),
      emitter: String(formData.get("emitter") ?? "").trim() || null,
      status: String(formData.get("status") ?? "Reçu").trim() || "Reçu",
      comment: String(formData.get("comment") ?? "").trim() || null,
      fileUrl: String(formData.get("fileUrl") ?? "").trim() || null,
      uploadedById: session.user.id,
      isCurrent: true,
    },
  });

  await logPilotageActivity({
    pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "pièce marché ajoutée",
    entityType: "market_document",
    entityId: created.id,
    entityLabel: title,
  });
  revalidatePilotage(pilotageId);
  return { ok: true };
}

export async function createPlanRegister(
  pilotageId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);

  const reference = String(formData.get("reference") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!reference || !title) return { ok: false, error: "Référence et titre obligatoires." };

  const created = await prisma.planRegister.create({
    data: {
      pilotageId,
      reference,
      title,
      planType: String(formData.get("planType") ?? "").trim() || null,
      indice: String(formData.get("indice") ?? "A").trim() || "A",
      author: String(formData.get("author") ?? "").trim() || null,
      visaDueDate: parseDate(formData.get("visaDueDate")),
      status: String(formData.get("status") ?? "À produire").trim() || "À produire",
      observations: String(formData.get("observations") ?? "").trim() || null,
    },
  });

  await logPilotageActivity({
    pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "plan ajouté",
    entityType: "plan",
    entityId: created.id,
    entityLabel: `${reference} — ${title}`,
  });
  await refreshProgress(pilotageId);
  revalidatePilotage(pilotageId);
  return { ok: true };
}

export async function updateDoeItemStatus(
  itemId: string,
  status: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  const item = await prisma.doeItem.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false, error: "Élément DOE introuvable." };
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, item.pilotageId);

  const old = item.status;
  await prisma.doeItem.update({
    where: { id: itemId },
    data: {
      status,
      verifiedAt: status === "Conforme" ? new Date() : item.verifiedAt,
      verifiedByName: status === "Conforme" ? session.user.name ?? null : item.verifiedByName,
    },
  });
  await logPilotageActivity({
    pilotageId: item.pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "DOE mis à jour",
    entityType: "doe",
    entityId: itemId,
    entityLabel: item.title,
    oldValue: old,
    newValue: status,
  });
  await refreshProgress(item.pilotageId);
  revalidatePilotage(item.pilotageId);
  return { ok: true };
}

export async function updatePilotageStatus(
  pilotageId: string,
  status: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  if (!canManagePilotage(session.user.role) && !canEditPilotageOperational(session.user.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  const pilotage = await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);
  const old = pilotage ? String((await prisma.worksitePilotage.findUnique({ where: { id: pilotageId }, select: { status: true } }))?.status) : "";

  await prisma.worksitePilotage.update({
    where: { id: pilotageId },
    data: {
      status: status as "A_PREPARER" | "EN_COURS" | "SOUS_SURVEILLANCE" | "BLOQUE" | "TERMINE" | "ARCHIVE",
      archivedAt: status === "ARCHIVE" ? new Date() : null,
    },
  });
  await logPilotageActivity({
    pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "changement de statut",
    entityType: "pilotage",
    entityId: pilotageId,
    oldValue: old,
    newValue: status,
  });
  revalidatePilotage(pilotageId);
  return { ok: true };
}

export async function createExtraWork(
  pilotageId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { ok: false, error: "Description obligatoire." };

  const startedWithoutValidation = formData.get("startedWithoutValidation") === "1";
  const writtenValidation = formData.get("writtenValidation") === "1";

  const created = await prisma.extraWork.create({
    data: {
      pilotageId,
      reference: String(formData.get("reference") ?? "").trim() || null,
      description,
      requestOrigin: String(formData.get("requestOrigin") ?? "").trim() || null,
      requester: String(formData.get("requester") ?? "").trim() || null,
      requestedAt: parseDate(formData.get("requestedAt")),
      urgency: String(formData.get("urgency") ?? "Normale").trim() || "Normale",
      estimatedHt: parseDecimal(formData.get("estimatedHt")),
      writtenValidation,
      startedWithoutValidation,
      status: String(formData.get("status") ?? "Identifié").trim() || "Identifié",
      comment: String(formData.get("comment") ?? "").trim() || null,
    },
  });

  await logPilotageActivity({
    pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "travaux supplémentaires",
    entityType: "extra_work",
    entityId: created.id,
    entityLabel: created.reference ?? description.slice(0, 80),
    comment: startedWithoutValidation && !writtenValidation ? "Alerte : démarrage sans validation écrite" : null,
  });
  revalidatePilotage(pilotageId);
  return { ok: true };
}

export async function createWorkSituation(
  pilotageId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);

  const number = String(formData.get("number") ?? "").trim();
  if (!number) return { ok: false, error: "Numéro de situation obligatoire." };

  const created = await prisma.workSituation.create({
    data: {
      pilotageId,
      number,
      periodLabel: String(formData.get("periodLabel") ?? "").trim() || null,
      marketInitialHt: parseDecimal(formData.get("marketInitialHt")),
      requestedHt: parseDecimal(formData.get("requestedHt")),
      validatedHt: parseDecimal(formData.get("validatedHt")),
      paidHt: parseDecimal(formData.get("paidHt")),
      status: String(formData.get("status") ?? "À préparer").trim() || "À préparer",
      comment: String(formData.get("comment") ?? "").trim() || null,
      preparedAt: parseDate(formData.get("preparedAt")),
    },
  });

  await logPilotageActivity({
    pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "situation créée",
    entityType: "situation",
    entityId: created.id,
    entityLabel: `Situation ${number}`,
  });
  revalidatePilotage(pilotageId);
  return { ok: true };
}

export async function createSubcontractor(
  pilotageId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) {
    return { ok: false, error: "Droits insuffisants." };
  }
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);

  const companyName = String(formData.get("companyName") ?? "").trim();
  if (!companyName) return { ok: false, error: "Entreprise obligatoire." };

  const created = await prisma.pilotageSubcontractor.create({
    data: {
      pilotageId,
      companyName,
      siren: String(formData.get("siren") ?? "").trim() || null,
      prestation: String(formData.get("prestation") ?? "").trim() || null,
      amountHt: parseDecimal(formData.get("amountHt")),
      contactName: String(formData.get("contactName") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      approvalStatus: String(formData.get("approvalStatus") ?? "En attente").trim() || "En attente",
      dossierStatus: String(formData.get("dossierStatus") ?? "Incomplet").trim() || "Incomplet",
      observations: String(formData.get("observations") ?? "").trim() || null,
    },
  });

  await logPilotageActivity({
    pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "sous-traitant ajouté",
    entityType: "subcontractor",
    entityId: created.id,
    entityLabel: companyName,
  });
  revalidatePilotage(pilotageId);
  return { ok: true };
}

export async function generatePilotageReport(
  pilotageId: string,
): Promise<{ ok: true; reportId: string } | { ok: false; error: string }> {
  const session = await requirePilotageSession();
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);

  const pilotage = await prisma.worksitePilotage.findUnique({
    where: { id: pilotageId },
    include: {
      project: { include: { client: { select: { name: true, company: true } } } },
      actions: { where: { archivedAt: null }, orderBy: { dueDate: "asc" } },
      obligations: { where: { archivedAt: null } },
      requiredDocuments: { where: { archivedAt: null } },
      plans: { where: { archivedAt: null } },
      subcontractors: { where: { archivedAt: null } },
      situations: { where: { archivedAt: null }, orderBy: { createdAt: "desc" }, take: 5 },
      extraWorks: { where: { archivedAt: null } },
      doeItems: { where: { archivedAt: null } },
    },
  });
  if (!pilotage) return { ok: false, error: "Pilotage introuvable." };

  const doe = computeDoeProgress(pilotage.doeItems);
  const contentJson = {
    chantier: pilotage.project.title,
    client: pilotage.project.client.company ?? pilotage.project.client.name,
    lot: pilotage.lot,
    status: pilotage.status,
    adminProgressPct: pilotage.adminProgressPct,
    doeProgressPct: doe.pct,
    actionsOpen: pilotage.actions.filter((a) => a.status !== "Terminée" && a.status !== "Annulée").length,
    actionsOverdue: pilotage.actions.filter((a) => a.dueDate && a.dueDate < new Date() && a.status !== "Terminée").length,
    docsMissing: pilotage.requiredDocuments.filter((d) => ["Manquant", "À préparer", "À corriger"].includes(d.status)).length,
    visasPending: pilotage.plans.filter((p) => ["En attente de visa", "Envoyé pour visa"].includes(p.status)).length,
    extraWithoutValidation: pilotage.extraWorks.filter((e) => e.startedWithoutValidation && !e.writtenValidation).length,
    generatedAt: new Date().toISOString(),
  };

  const report = await prisma.pilotageReport.create({
    data: {
      pilotageId,
      title: `Rapport de suivi — ${pilotage.project.title}`,
      periodEnd: new Date(),
      contentJson,
      createdById: session.user.id,
      createdByName: session.user.name ?? null,
    },
  });

  await logPilotageActivity({
    pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "rapport généré",
    entityType: "report",
    entityId: report.id,
    entityLabel: report.title,
  });
  revalidatePilotage(pilotageId);
  return { ok: true, reportId: report.id };
}

export async function ensureDefaultMilestones(pilotageId: string) {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) return { ok: false as const, error: "Droits insuffisants." };
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);

  const count = await prisma.pilotageMilestone.count({ where: { pilotageId, archivedAt: null } });
  if (count > 0) return { ok: true as const, created: 0 };

  await prisma.pilotageMilestone.createMany({
    data: DEFAULT_MILESTONES.map((m) => ({
      pilotageId,
      title: m.title,
      category: m.category,
      sortOrder: m.sortOrder,
      status: "Non démarré",
      verificationStatus: "À vérifier",
      sourceType: "Modèle BeWork",
    })),
  });
  await logPilotageActivity({
    pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "jalons initialisés",
    entityType: "milestone",
    entityLabel: `${DEFAULT_MILESTONES.length} jalons`,
  });
  revalidatePilotage(pilotageId);
  return { ok: true as const, created: DEFAULT_MILESTONES.length };
}

export async function updateMilestoneStatus(formData: FormData) {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) return { ok: false as const, error: "Droits insuffisants." };

  const milestoneId = String(formData.get("milestoneId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!milestoneId || !status) return { ok: false as const, error: "Données manquantes." };

  const item = await prisma.pilotageMilestone.findUnique({ where: { id: milestoneId } });
  if (!item) return { ok: false as const, error: "Jalon introuvable." };
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, item.pilotageId);

  await prisma.pilotageMilestone.update({
    where: { id: milestoneId },
    data: {
      status,
      actualAt: status === "Atteint" ? new Date() : item.actualAt,
      progressPct: status === "Atteint" ? 100 : status === "En cours" ? Math.max(item.progressPct, 40) : item.progressPct,
    },
  });
  await logPilotageActivity({
    pilotageId: item.pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "jalon mis à jour",
    entityType: "milestone",
    entityId: milestoneId,
    entityLabel: item.title,
    oldValue: item.status,
    newValue: status,
  });
  await refreshProgress(item.pilotageId);
  revalidatePilotage(item.pilotageId);
  return { ok: true as const };
}

export async function createBlocker(formData: FormData) {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) return { ok: false as const, error: "Droits insuffisants." };

  const pilotageId = String(formData.get("pilotageId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!pilotageId || !title) return { ok: false as const, error: "Titre et chantier obligatoires." };
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);

  const blocker = await prisma.pilotageBlocker.create({
    data: {
      pilotageId,
      title,
      severity: String(formData.get("severity") ?? "Important").trim() || "Important",
      consequence: String(formData.get("consequence") ?? "").trim() || null,
      nextAction: String(formData.get("nextAction") ?? "").trim() || null,
      internalOwner: String(formData.get("internalOwner") ?? "").trim() || null,
      externalDecider: String(formData.get("externalDecider") ?? "").trim() || null,
      priority: String(formData.get("priority") ?? "Haute").trim() || "Haute",
      nextFollowUpAt: parseDate(formData.get("nextFollowUpAt")),
      status: "Ouvert",
    },
  });
  await logPilotageActivity({
    pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "blocage créé",
    entityType: "blocker",
    entityId: blocker.id,
    entityLabel: title,
  });
  await refreshProgress(pilotageId);
  revalidatePilotage(pilotageId);
  return { ok: true as const };
}

export async function resolveBlocker(formData: FormData) {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) return { ok: false as const, error: "Droits insuffisants." };

  const blockerId = String(formData.get("blockerId") ?? "").trim();
  if (!blockerId) return { ok: false as const, error: "Blocage manquant." };

  const item = await prisma.pilotageBlocker.findUnique({ where: { id: blockerId } });
  if (!item) return { ok: false as const, error: "Blocage introuvable." };
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, item.pilotageId);

  await prisma.pilotageBlocker.update({
    where: { id: blockerId },
    data: { status: "Résolu", resolvedAt: new Date() },
  });
  await logPilotageActivity({
    pilotageId: item.pilotageId,
    userId: session.user.id,
    userName: session.user.name,
    actionType: "blocage résolu",
    entityType: "blocker",
    entityId: blockerId,
    entityLabel: item.title,
  });
  await refreshProgress(item.pilotageId);
  revalidatePilotage(item.pilotageId);
  return { ok: true as const };
}

