"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { requirePilotageSession } from "@/lib/pilotage/access";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";

async function assertFileAccess(fileId: string) {
  const session = await requirePilotageSession();
  const file = await prisma.chantierFile.findUnique({
    where: { id: fileId },
    select: { id: true, projectId: true, deletedAt: true },
  });
  if (!file || file.deletedAt) return { ok: false as const, error: "Document introuvable." };
  const access = await canAccessChantierProject(session.user, file.projectId);
  if (!access.ok) return { ok: false as const, error: "Accès refusé." };
  return { ok: true as const, session, file };
}

export async function classifyChantierFile(formData: FormData) {
  const fileId = String(formData.get("fileId") ?? "").trim();
  const g = await assertFileAccess(fileId);
  if (!g.ok) return g;

  const category = String(formData.get("category") ?? "").trim() || null;
  const folderId = String(formData.get("folderId") ?? "").trim() || null;
  const data: {
    category: string | null;
    subcategory: string | null;
    documentType: string | null;
    indice: string | null;
    classificationStatus: string;
    folderId?: string;
  } = {
    category,
    subcategory: String(formData.get("subcategory") ?? "").trim() || null,
    documentType: String(formData.get("documentType") ?? "").trim() || null,
    indice: String(formData.get("indice") ?? "").trim() || null,
    classificationStatus: "CLASSE",
  };
  if (folderId) {
    const folder = await prisma.chantierFolder.findFirst({
      where: { id: folderId, projectId: g.file.projectId },
    });
    if (folder) data.folderId = folder.id;
  }

  await prisma.chantierFile.update({ where: { id: fileId }, data });
  revalidatePath(`${PILOTAGE_LIST_PATH}`);
  return { ok: true as const };
}

export async function softDeleteChantierFile(formData: FormData) {
  const fileId = String(formData.get("fileId") ?? "").trim();
  const g = await assertFileAccess(fileId);
  if (!g.ok) return g;
  await prisma.chantierFile.update({
    where: { id: fileId },
    data: { deletedAt: new Date() },
  });
  return { ok: true as const };
}

export async function restoreChantierFile(formData: FormData) {
  const fileId = String(formData.get("fileId") ?? "").trim();
  const session = await requirePilotageSession();
  const file = await prisma.chantierFile.findUnique({
    where: { id: fileId },
    select: { id: true, projectId: true },
  });
  if (!file) return { ok: false as const, error: "Document introuvable." };
  const access = await canAccessChantierProject(session.user, file.projectId);
  if (!access.ok) return { ok: false as const, error: "Accès refusé." };
  await prisma.chantierFile.update({
    where: { id: fileId },
    data: { deletedAt: null },
  });
  return { ok: true as const };
}

export async function addChantierFileComment(formData: FormData) {
  const fileId = String(formData.get("fileId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { ok: false as const, error: "Commentaire vide." };
  const g = await assertFileAccess(fileId);
  if (!g.ok) return g;

  const pageRaw = String(formData.get("pageNumber") ?? "").trim();
  const pageNumber = pageRaw ? Number(pageRaw) : null;

  await prisma.chantierFileComment.create({
    data: {
      fileId,
      content,
      pageNumber: Number.isFinite(pageNumber) ? pageNumber : null,
      authorId: g.session.user.id,
      authorName: g.session.user.name,
      visibility: String(formData.get("visibility") ?? "Interne BeWork").trim() || "Interne BeWork",
      status: "Ouvert",
    },
  });
  return { ok: true as const };
}

export async function linkChantierFileToEntity(formData: FormData) {
  const fileId = String(formData.get("fileId") ?? "").trim();
  const entityType = String(formData.get("entityType") ?? "").trim();
  if (!fileId || !entityType) return { ok: false as const, error: "Données manquantes." };
  const g = await assertFileAccess(fileId);
  if (!g.ok) return g;

  await prisma.chantierFileLink.create({
    data: {
      fileId,
      entityType,
      entityId: String(formData.get("entityId") ?? "").trim() || null,
      entityLabel: String(formData.get("entityLabel") ?? "").trim() || null,
      pilotageId: String(formData.get("pilotageId") ?? "").trim() || null,
      createdById: g.session.user.id,
    },
  });
  return { ok: true as const };
}

export async function toggleChantierFileFavorite(formData: FormData) {
  const fileId = String(formData.get("fileId") ?? "").trim();
  const g = await assertFileAccess(fileId);
  if (!g.ok) return g;

  const existing = await prisma.chantierFileFavorite.findUnique({
    where: { fileId_userId: { fileId, userId: g.session.user.id } },
  });
  if (existing) {
    await prisma.chantierFileFavorite.delete({ where: { id: existing.id } });
    return { ok: true as const, favorited: false };
  }
  await prisma.chantierFileFavorite.create({
    data: { fileId, userId: g.session.user.id },
  });
  return { ok: true as const, favorited: true };
}
