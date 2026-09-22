/**
 * Médias bibliothèque commerciale — bucket `documents`, préfixe commercial/{org}/library/
 * Accès via signed URL uniquement (pas d’URL publique).
 */
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  DOCUMENTS_BUCKET,
  buildDocumentsStorageRef,
} from "@/lib/storage/supabase-object";
import { resolveDownloadUrl } from "@/lib/storage/signed-url";
import { recordLibraryHistoryEvent } from "@/lib/commercial/library";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

export type LibraryAttachmentCategory =
  | "photo"
  | "pdf"
  | "fiche_technique"
  | "plan"
  | "notice"
  | "fournisseur"
  | "autre";

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 100) || "fichier";
}

function guessCategory(mime: string, fileName: string): LibraryAttachmentCategory {
  if (mime.startsWith("image/")) return "photo";
  if (mime === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) return "pdf";
  return "autre";
}

async function assertWorkItem(orgId: string, workItemId: string) {
  const wi = await prisma.commercialWorkItem.findFirst({
    where: { id: workItemId, organizationId: orgId },
    select: { id: true },
  });
  if (!wi) throw new Error("Ouvrage introuvable");
  return wi;
}

export async function listLibraryAttachments(orgId: string, workItemId: string) {
  await assertWorkItem(orgId, workItemId);
  return prisma.commercialLibraryAttachment.findMany({
    where: { organizationId: orgId, workItemId },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { id: true, name: true } } },
  });
}

export async function uploadLibraryAttachments(opts: {
  orgId: string;
  workItemId: string;
  files: Array<{ buffer: Buffer; fileName: string; mimeType: string }>;
  createdById?: string | null;
  clientVisible?: boolean;
}) {
  await assertWorkItem(opts.orgId, opts.workItemId);
  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Stockage indisponible");

  const existingMax = await prisma.commercialLibraryAttachment.aggregate({
    where: { workItemId: opts.workItemId },
    _max: { sortOrder: true },
  });
  let sortOrder = (existingMax._max.sortOrder ?? -1) + 1;
  const hasPrimary = await prisma.commercialLibraryAttachment.findFirst({
    where: { workItemId: opts.workItemId, isPrimary: true },
    select: { id: true },
  });

  const created: Awaited<ReturnType<typeof prisma.commercialLibraryAttachment.create>>[] = [];
  let uploadedCount = 0;
  for (const file of opts.files) {
    if (file.buffer.length > MAX_FILE_BYTES) {
      throw new Error(`Fichier trop volumineux (max 25 Mo) : ${file.fileName}`);
    }
    const mime = (file.mimeType || "application/octet-stream").toLowerCase();
    if (!ALLOWED_MIME.has(mime) && !mime.startsWith("image/")) {
      throw new Error(`Type non autorisé : ${file.fileName}`);
    }
    const token = randomBytes(6).toString("hex");
    const safe = safeFileName(file.fileName);
    const storagePath = `commercial/${opts.orgId}/library/${opts.workItemId}/${token}-${safe}`;
    const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(storagePath, file.buffer, {
      contentType: mime,
      upsert: false,
    });
    if (error) throw new Error(error.message);

    const category = guessCategory(mime, file.fileName);
    const makePrimary: boolean = !hasPrimary && uploadedCount === 0 && category === "photo";
    const row = await prisma.commercialLibraryAttachment.create({
      data: {
        id: `cla_${randomBytes(12).toString("hex")}`,
        organizationId: opts.orgId,
        workItemId: opts.workItemId,
        name: file.fileName.slice(0, 200),
        storagePath,
        fileUrl: buildDocumentsStorageRef(storagePath),
        mimeType: mime,
        sizeBytes: file.buffer.length,
        category,
        isPrimary: makePrimary,
        clientVisible: opts.clientVisible === true,
        sortOrder: sortOrder++,
        createdById: opts.createdById ?? null,
      },
    });
    created.push(row);
    uploadedCount += 1;
  }

  if (created.length) {
    await recordLibraryHistoryEvent(opts.orgId, opts.workItemId, {
      label: created.length === 1 ? "Document ajouté" : `${created.length} documents ajoutés`,
      detail: created.map((c) => c.name).join(", "),
      toStatus: "attachment_added",
      actorUserId: opts.createdById ?? null,
    });
  }

  return created;
}

export async function updateLibraryAttachment(
  orgId: string,
  workItemId: string,
  attachmentId: string,
  data: {
    name?: string;
    caption?: string | null;
    category?: string;
    clientVisible?: boolean;
    isPrimary?: boolean;
    sortOrder?: number;
  },
  actorUserId?: string | null,
) {
  await assertWorkItem(orgId, workItemId);
  const existing = await prisma.commercialLibraryAttachment.findFirst({
    where: { id: attachmentId, organizationId: orgId, workItemId },
  });
  if (!existing) throw new Error("Document introuvable");

  if (data.isPrimary === true) {
    await prisma.commercialLibraryAttachment.updateMany({
      where: { workItemId, organizationId: orgId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const updated = await prisma.commercialLibraryAttachment.update({
    where: { id: attachmentId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim().slice(0, 200) || existing.name } : {}),
      ...(data.caption !== undefined ? { caption: data.caption } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.clientVisible !== undefined ? { clientVisible: data.clientVisible } : {}),
      ...(data.isPrimary !== undefined ? { isPrimary: data.isPrimary } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
  });

  await recordLibraryHistoryEvent(orgId, workItemId, {
    label: data.isPrimary ? "Photo principale définie" : "Document modifié",
    detail: updated.name,
    toStatus: "attachment_updated",
    actorUserId: actorUserId ?? null,
  });

  return updated;
}

export async function reorderLibraryAttachments(
  orgId: string,
  workItemId: string,
  orderedIds: string[],
) {
  await assertWorkItem(orgId, workItemId);
  const rows = await prisma.commercialLibraryAttachment.findMany({
    where: { organizationId: orgId, workItemId },
    select: { id: true },
  });
  const owned = new Set(rows.map((r) => r.id));
  const ids = orderedIds.filter((id) => owned.has(id));
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.commercialLibraryAttachment.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );
  return listLibraryAttachments(orgId, workItemId);
}

export async function deleteLibraryAttachment(
  orgId: string,
  workItemId: string,
  attachmentId: string,
  actorUserId?: string | null,
) {
  await assertWorkItem(orgId, workItemId);
  const existing = await prisma.commercialLibraryAttachment.findFirst({
    where: { id: attachmentId, organizationId: orgId, workItemId },
  });
  if (!existing) throw new Error("Document introuvable");

  const supabase = createServiceRoleClient();
  if (supabase) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([existing.storagePath]).catch(() => {});
  }

  await prisma.commercialLibraryAttachment.delete({ where: { id: attachmentId } });

  if (existing.isPrimary) {
    const nextPhoto = await prisma.commercialLibraryAttachment.findFirst({
      where: { workItemId, organizationId: orgId, category: "photo" },
      orderBy: { sortOrder: "asc" },
    });
    if (nextPhoto) {
      await prisma.commercialLibraryAttachment.update({
        where: { id: nextPhoto.id },
        data: { isPrimary: true },
      });
    }
  }

  await recordLibraryHistoryEvent(orgId, workItemId, {
    label: "Document supprimé",
    detail: existing.name,
    toStatus: "attachment_deleted",
    actorUserId: actorUserId ?? null,
  });

  return { deleted: true as const };
}

export async function getLibraryAttachmentSignedUrl(
  orgId: string,
  workItemId: string,
  attachmentId: string,
  expiresIn = 15 * 60,
) {
  await assertWorkItem(orgId, workItemId);
  const existing = await prisma.commercialLibraryAttachment.findFirst({
    where: { id: attachmentId, organizationId: orgId, workItemId },
  });
  if (!existing) throw new Error("Document introuvable");

  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Stockage indisponible");

  const ref = existing.fileUrl || buildDocumentsStorageRef(existing.storagePath);
  const resolved = await resolveDownloadUrl(supabase, ref, { expiresIn });
  if (!resolved.url) throw new Error("Impossible de générer le lien sécurisé");
  return {
    url: resolved.url,
    name: existing.name,
    mimeType: existing.mimeType,
    clientVisible: existing.clientVisible,
  };
}

/** Documents autorisés pour devis client uniquement. */
export async function listClientVisibleAttachments(orgId: string, workItemId: string) {
  await assertWorkItem(orgId, workItemId);
  return prisma.commercialLibraryAttachment.findMany({
    where: { organizationId: orgId, workItemId, clientVisible: true },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
  });
}
