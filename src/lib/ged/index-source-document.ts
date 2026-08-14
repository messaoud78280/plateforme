/**
 * GED V2.0.1 — indexeur unique : crée / réutilise ChantierFile + liens.
 * Jamais de copie Storage. Idempotent via identité source primaire.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";
import {
  isGedPrimaryEntityType,
  type GedSourceIdentity,
} from "@/lib/ged/source-identity";
import { resolveOrganizationIdForProject } from "@/lib/ged/org-scope";

export type IndexSourceResult = {
  chantierFileId: string | null;
  created: boolean;
  reason?: string;
};

export type IndexSourceInput = {
  projectId?: string | null;
  organizationId?: string | null;
  clientId: string;
  addedById: string;
  name: string;
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  storagePath?: string | null;
  documentType?: string | null;
  category?: string | null;
  subcategory?: string | null;
  folderCode: string;
  classificationStatus?: "CLASSE" | "A_CLASSER";
  visibility?: string;
  emitterName?: string | null;
  documentDate?: Date | null;
  sourceDocumentId?: string | null;
  taskId?: string | null;
  status?: "RECU" | "MANQUANT";
  comment?: string | null;
  createdAt?: Date;
  primary: GedSourceIdentity;
  extraLinks?: GedSourceIdentity[];
  /** Identités déjà posées (ex. devis virtuel avant snapshot). */
  alsoMatch?: GedSourceIdentity[];
  dryRun?: boolean;
};

const folderIdCache = new Map<string, string>();

async function resolveFolderId(projectId: string, folderCode: string): Promise<string | null> {
  const wanted = folderCode || "00";
  const cacheKey = `${projectId}:${wanted}`;
  const hit = folderIdCache.get(cacheKey);
  if (hit) return hit;

  await ensureChantierFolders(projectId);
  const folder =
    (await prisma.chantierFolder.findFirst({
      where: { projectId, code: wanted },
      select: { id: true },
    })) ??
    (await prisma.chantierFolder.findFirst({
      where: { projectId, code: "00" },
      select: { id: true },
    }));
  if (!folder) return null;
  folderIdCache.set(cacheKey, folder.id);
  return folder.id;
}

export async function findGedFileIdByIdentities(
  identities: GedSourceIdentity[],
): Promise<string | null> {
  const valid = identities.filter((i) => i.entityType && i.entityId);
  if (valid.length === 0) return null;
  const found = await prisma.chantierFileLink.findFirst({
    where: {
      OR: valid.map((i) => ({
        entityType: i.entityType,
        entityId: i.entityId,
      })),
    },
    select: { fileId: true },
  });
  return found?.fileId ?? null;
}

async function ensureLinks(fileId: string, links: GedSourceIdentity[], createdById: string) {
  const wanted = links.filter((l) => l.entityType && l.entityId);
  if (wanted.length === 0) return;
  const existing = await prisma.chantierFileLink.findMany({
    where: {
      fileId,
      OR: wanted.map((l) => ({ entityType: l.entityType, entityId: l.entityId })),
    },
    select: { entityType: true, entityId: true },
  });
  const have = new Set(existing.map((e) => `${e.entityType}:${e.entityId}`));
  const toCreate = wanted.filter((l) => !have.has(`${l.entityType}:${l.entityId}`));
  if (toCreate.length === 0) return;
  try {
    await prisma.chantierFileLink.createMany({
      data: toCreate.map((l) => ({
        fileId,
        entityType: l.entityType,
        entityId: l.entityId,
        entityLabel: l.entityLabel ?? null,
        createdById,
      })),
    });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) {
      throw e;
    }
  }
}

function isVirtualOrEmptyUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  return url.startsWith("/api/") || url.startsWith("ged://") || url.startsWith("/dashboard/");
}

export async function indexSourceDocument(input: IndexSourceInput): Promise<IndexSourceResult> {
  if (!input.primary.entityType || !input.primary.entityId) {
    return { chantierFileId: null, created: false, reason: "no_identity" };
  }
  if (!input.clientId) {
    return { chantierFileId: null, created: false, reason: "no_client" };
  }

  const organizationId =
    input.organizationId ||
    (input.projectId ? await resolveOrganizationIdForProject(input.projectId) : null);
  if (!input.projectId && !organizationId) {
    return { chantierFileId: null, created: false, reason: "no_organization" };
  }

  const matchIds = [
    input.primary,
    ...(input.alsoMatch ?? []),
    ...(input.sourceDocumentId
      ? [{ entityType: "legacy_document", entityId: input.sourceDocumentId }]
      : []),
  ];

  let existingId = await findGedFileIdByIdentities(matchIds);
  if (!existingId && input.sourceDocumentId) {
    const bySource = await prisma.chantierFile.findFirst({
      where: { sourceDocumentId: input.sourceDocumentId },
      select: { id: true },
    });
    existingId = bySource?.id ?? null;
  }

  if (existingId) {
    if (input.dryRun) {
      return { chantierFileId: existingId, created: false, reason: "already_linked" };
    }
    const current = await prisma.chantierFile.findUnique({
      where: { id: existingId },
      select: { fileUrl: true, deletedAt: true, organizationId: true },
    });
    const nextUrl = input.fileUrl?.trim() || null;
    const patch: {
      fileUrl?: string;
      mimeType?: string;
      fileSize?: number;
      storagePath?: string;
      deletedAt?: Date | null;
      organizationId?: string;
    } = {};
    if (nextUrl && current && isVirtualOrEmptyUrl(current.fileUrl) && !isVirtualOrEmptyUrl(nextUrl)) {
      patch.fileUrl = nextUrl;
      if (input.mimeType) patch.mimeType = input.mimeType;
      if (input.fileSize != null) patch.fileSize = input.fileSize;
      if (input.storagePath) patch.storagePath = input.storagePath;
    }
    if (current?.deletedAt) patch.deletedAt = null;
    if (organizationId && !current?.organizationId) patch.organizationId = organizationId;
    if (Object.keys(patch).length > 0) {
      await prisma.chantierFile.update({
        where: { id: existingId },
        data: patch,
      });
    }
    await ensureLinks(existingId, [input.primary, ...(input.extraLinks ?? [])], input.addedById);
    return { chantierFileId: existingId, created: false, reason: "already_linked" };
  }

  if (input.dryRun) {
    return { chantierFileId: null, created: true, reason: "dry_run" };
  }

  let folderId: string | null = null;
  if (input.projectId) {
    folderId = await resolveFolderId(input.projectId, input.folderCode);
    if (!folderId) return { chantierFileId: null, created: false, reason: "no_folder" };
  }

  try {
    const file = await prisma.chantierFile.create({
      data: {
        projectId: input.projectId ?? null,
        organizationId,
        folderId,
        clientId: input.clientId,
        name: input.name.trim().slice(0, 180) || "Document",
        fileUrl: input.fileUrl?.trim() || null,
        fileSize: input.fileSize ?? null,
        mimeType: input.mimeType ?? null,
        storagePath: input.storagePath ?? null,
        documentType: input.documentType ?? null,
        category: input.category ?? null,
        subcategory: input.subcategory ?? null,
        status: input.status ?? "RECU",
        visibility: input.visibility ?? "Interne entreprise cliente",
        classificationStatus: input.classificationStatus ?? "CLASSE",
        isCurrentVersion: true,
        addedById: input.addedById?.trim() || null,
        emitterName: input.emitterName?.trim() || null,
        documentDate: input.documentDate ?? input.createdAt ?? null,
        sourceDocumentId: input.sourceDocumentId ?? null,
        taskId: input.taskId ?? null,
        comment: input.comment ?? null,
        ...(input.createdAt ? { createdAt: input.createdAt } : {}),
      },
      select: { id: true },
    });
    await ensureLinks(file.id, [input.primary, ...(input.extraLinks ?? [])], input.addedById);
    return { chantierFileId: file.id, created: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const again = await findGedFileIdByIdentities(matchIds);
      if (again) {
        await ensureLinks(again, [input.primary, ...(input.extraLinks ?? [])], input.addedById);
        return { chantierFileId: again, created: false, reason: "already_linked" };
      }
    }
    throw e;
  }
}

/** Soft-delete des index GED liés à un message supprimé pour tous (fichier physique intact). */
export async function archiveGedIndexesForMessage(opts: {
  messageKind: string;
  messageId: string;
}): Promise<number> {
  const prefix = `${opts.messageKind}:${opts.messageId}:`;
  const links = await prisma.chantierFileLink.findMany({
    where: {
      entityType: "message_attachment",
      entityId: { startsWith: prefix },
    },
    select: { fileId: true },
  });
  const ids = [...new Set(links.map((l) => l.fileId))];
  if (ids.length === 0) return 0;
  await prisma.chantierFile.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return ids.length;
}

export function isPrimarySourceLinkType(entityType: string): boolean {
  return isGedPrimaryEntityType(entityType);
}
