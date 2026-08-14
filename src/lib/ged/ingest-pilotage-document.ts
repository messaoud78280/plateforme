/**
 * GED V2.0.1 — DOE, photos chantier, pièces marché, docs sous-traitant.
 * Même fileUrl, pas de copie.
 */
import { prisma } from "@/lib/prisma";
import { classifyDocumentType } from "@/lib/ged/classify-document";
import { indexSourceDocument } from "@/lib/ged/index-source-document";
import { suggestFolderCode } from "@/lib/ged/formats";
import {
  resolveOrganizationIdForProject,
  resolveOrganizationIdForUser,
} from "@/lib/ged/org-scope";

async function pilotageContext(pilotageId: string) {
  return prisma.worksitePilotage.findUnique({
    where: { id: pilotageId },
    select: {
      id: true,
      projectId: true,
      project: { select: { clientId: true, title: true } },
    },
  });
}

export async function ingestDoeItemToGed(opts: {
  doeItemId: string;
  addedById: string;
  dryRun?: boolean;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  const item = await prisma.doeItem.findFirst({
    where: { id: opts.doeItemId, archivedAt: null },
    select: {
      id: true,
      title: true,
      category: true,
      fileUrl: true,
      createdAt: true,
      pilotageId: true,
    },
  });
  if (!item?.fileUrl) return { chantierFileId: null, linked: false, reason: "no_file" };
  const ctx = await pilotageContext(item.pilotageId);
  if (!ctx?.project?.clientId) {
    return { chantierFileId: null, linked: false, reason: "no_project" };
  }

  const result = await indexSourceDocument({
    projectId: ctx.projectId,
    clientId: ctx.project.clientId,
    addedById: opts.addedById,
    name: item.title.trim().slice(0, 180) || "Pièce DOE",
    fileUrl: item.fileUrl,
    documentType: "DOE",
    category: "DOE",
    subcategory: item.category || null,
    folderCode: "11",
    classificationStatus: "CLASSE",
    createdAt: item.createdAt,
    dryRun: opts.dryRun,
    primary: {
      entityType: "doe_item",
      entityId: item.id,
      entityLabel: item.title,
    },
  });
  return {
    chantierFileId: result.chantierFileId,
    linked: result.created,
    reason: result.reason,
  };
}

export async function ingestPilotagePhotoToGed(opts: {
  photoId: string;
  addedById: string;
  dryRun?: boolean;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  const photo = await prisma.pilotagePhoto.findFirst({
    where: { id: opts.photoId, archivedAt: null },
    select: {
      id: true,
      title: true,
      fileUrl: true,
      category: true,
      visibility: true,
      authorName: true,
      takenAt: true,
      createdAt: true,
      pilotageId: true,
    },
  });
  if (!photo?.fileUrl) return { chantierFileId: null, linked: false, reason: "no_file" };
  const ctx = await pilotageContext(photo.pilotageId);
  if (!ctx?.project?.clientId) {
    return { chantierFileId: null, linked: false, reason: "no_project" };
  }

  const name = (photo.title?.trim() || "Photo chantier").slice(0, 180);
  const result = await indexSourceDocument({
    projectId: ctx.projectId,
    clientId: ctx.project.clientId,
    addedById: opts.addedById,
    name,
    fileUrl: photo.fileUrl,
    documentType: "PHOTO",
    category: "Photos",
    subcategory: photo.category || null,
    folderCode: "07",
    classificationStatus: "CLASSE",
    visibility: photo.visibility || "Interne entreprise cliente",
    emitterName: photo.authorName,
    documentDate: photo.takenAt,
    createdAt: photo.createdAt,
    dryRun: opts.dryRun,
    primary: {
      entityType: "pilotage_photo",
      entityId: photo.id,
      entityLabel: name,
    },
  });
  return {
    chantierFileId: result.chantierFileId,
    linked: result.created,
    reason: result.reason,
  };
}

export async function ingestMarketDocumentToGed(opts: {
  marketDocumentId: string;
  addedById: string;
  dryRun?: boolean;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  const doc = await prisma.pilotageMarketDocument.findFirst({
    where: { id: opts.marketDocumentId, archivedAt: null },
    select: {
      id: true,
      title: true,
      docType: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      emitter: true,
      chantierFileId: true,
      createdAt: true,
      documentDate: true,
      uploadedById: true,
      pilotageId: true,
    },
  });
  if (!doc) return { chantierFileId: null, linked: false, reason: "not_found" };
  if (doc.chantierFileId) {
    return { chantierFileId: doc.chantierFileId, linked: false, reason: "already_linked" };
  }
  if (!doc.fileUrl) return { chantierFileId: null, linked: false, reason: "no_file" };

  const ctx = await pilotageContext(doc.pilotageId);
  if (!ctx?.project?.clientId) {
    return { chantierFileId: null, linked: false, reason: "no_project" };
  }

  const name = (doc.fileName || doc.title || "Pièce marché").trim().slice(0, 180);
  const folderCode = suggestFolderCode({
    filename: name,
    category: "Marché",
    documentType: doc.docType,
  });
  const result = await indexSourceDocument({
    projectId: ctx.projectId,
    clientId: ctx.project.clientId,
    addedById: opts.addedById || doc.uploadedById || "",
    name,
    fileUrl: doc.fileUrl,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    documentType: doc.docType || "MARCHE",
    category: "Marché",
    folderCode: folderCode === "00" ? "12" : folderCode,
    classificationStatus: "CLASSE",
    emitterName: doc.emitter,
    documentDate: doc.documentDate,
    createdAt: doc.createdAt,
    dryRun: opts.dryRun,
    primary: {
      entityType: "pilotage_market_document",
      entityId: doc.id,
      entityLabel: doc.title,
    },
  });

  if (result.chantierFileId && !opts.dryRun && !doc.chantierFileId) {
    await prisma.pilotageMarketDocument.update({
      where: { id: doc.id },
      data: { chantierFileId: result.chantierFileId },
    });
  }

  return {
    chantierFileId: result.chantierFileId,
    linked: result.created,
    reason: result.reason,
  };
}

export async function ingestSubcontractorDocToGed(opts: {
  docId: string;
  addedById: string;
  dryRun?: boolean;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  const doc = await prisma.pilotageSubcontractorDoc.findFirst({
    where: { id: opts.docId },
    select: {
      id: true,
      docType: true,
      fileUrl: true,
      createdAt: true,
      subcontractor: {
        select: {
          id: true,
          companyName: true,
          pilotageId: true,
        },
      },
    },
  });
  if (!doc?.fileUrl) return { chantierFileId: null, linked: false, reason: "no_file" };
  const ctx = await pilotageContext(doc.subcontractor.pilotageId);
  if (!ctx?.project?.clientId) {
    return { chantierFileId: null, linked: false, reason: "no_project" };
  }

  const name = (
    doc.docType.includes(".")
      ? doc.docType
      : `${doc.docType} — ${doc.subcontractor.companyName}`
  ).slice(0, 180);
  const classified = classifyDocumentType({
    sourceEntityType: "pilotage_subcontractor_doc",
    filename: name,
    currentType: doc.docType,
  });
  const result = await indexSourceDocument({
    projectId: ctx.projectId,
    clientId: ctx.project.clientId,
    addedById: opts.addedById,
    name,
    fileUrl: doc.fileUrl,
    documentType: classified.certain ? classified.documentType : doc.docType || "DOCUMENT",
    category: "Fournisseurs",
    folderCode: "05",
    classificationStatus: "CLASSE",
    emitterName: doc.subcontractor.companyName,
    createdAt: doc.createdAt,
    dryRun: opts.dryRun,
    primary: {
      entityType: "pilotage_subcontractor_doc",
      entityId: doc.id,
      entityLabel: name,
    },
    extraLinks: [
      {
        entityType: "supplier",
        entityId: doc.subcontractor.id,
        entityLabel: doc.subcontractor.companyName,
      },
    ],
  });
  return {
    chantierFileId: result.chantierFileId,
    linked: result.created,
    reason: result.reason,
  };
}

export async function ingestLegacyDocumentToGed(opts: {
  documentId: string;
  addedById?: string;
  dryRun?: boolean;
}): Promise<{ chantierFileId: string | null; linked: boolean; reason?: string }> {
  const doc = await prisma.document.findFirst({
    where: { id: opts.documentId },
    select: {
      id: true,
      name: true,
      fileUrl: true,
      fileSize: true,
      mimeType: true,
      category: true,
      clientId: true,
      projectId: true,
      taskId: true,
      createdAt: true,
      task: { select: { projectId: true, title: true } },
    },
  });
  if (!doc?.fileUrl) return { chantierFileId: null, linked: false, reason: "no_file" };
  const projectId = doc.projectId ?? doc.task?.projectId ?? null;
  const organizationId = projectId
    ? await resolveOrganizationIdForProject(projectId)
    : await resolveOrganizationIdForUser(doc.clientId);
  if (!projectId && !organizationId) {
    return { chantierFileId: null, linked: false, reason: "no_organization" };
  }

  const classified = classifyDocumentType({
    filename: doc.name,
    category: doc.category,
    currentType: doc.category,
  });
  const folderCode = suggestFolderCode({
    filename: doc.name,
    category:
      classified.documentType === "FACTURE"
        ? "Factures"
        : classified.documentType === "DEVIS" || classified.documentType === "CONTRAT"
          ? "Contractuel"
          : doc.category === "AUTRE"
            ? "À classer"
            : "À classer",
    documentType: classified.documentType,
  });

  const result = await indexSourceDocument({
    projectId,
    organizationId,
    clientId: doc.clientId,
    addedById: opts.addedById || doc.clientId,
    name: doc.name,
    fileUrl: doc.fileUrl,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    documentType: classified.documentType,
    category: classified.documentType === "AUTRE" ? "À classer" : classified.documentType,
    folderCode,
    classificationStatus: classified.certain ? "CLASSE" : "A_CLASSER",
    sourceDocumentId: doc.id,
    taskId: doc.taskId,
    createdAt: doc.createdAt,
    documentDate: doc.createdAt,
    dryRun: opts.dryRun,
    primary: {
      entityType: "legacy_document",
      entityId: doc.id,
      entityLabel: doc.task?.title ?? doc.name,
    },
  });
  return {
    chantierFileId: result.chantierFileId,
    linked: result.created,
    reason: result.reason,
  };
}
