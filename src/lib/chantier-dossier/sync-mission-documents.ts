import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase";
import { DOCUMENTS_BUCKET, downloadStorageObject, extractStoragePathFromUrl } from "@/lib/storage/supabase-object";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";
import { MISSION_TYPE_FOLDER_CODE, type MissionType } from "@/lib/tasks/mission-types";
import { isFeatureEnabled } from "@/lib/feature-flags";

function folderCodeForTask(task: { missionType: string | null; title: string }): string {
  if (task.missionType) {
    const code = MISSION_TYPE_FOLDER_CODE[task.missionType as MissionType];
    if (code) return code;
  }
  if (/devis|chiffrage|avenant/i.test(task.title)) return "01";
  if (/compte\s*rendu|cr\s*chantier/i.test(task.title)) return "06";
  if (/bl|fournisseur|commande/i.test(task.title)) return "05";
  if (/sous[- ]?traitant/i.test(task.title)) return "04";
  if (/doe|fin de chantier/i.test(task.title)) return "11";
  return "01";
}

export type SyncMissionDocResult = {
  synced: number;
  skipped: number;
  errors: string[];
};

/**
 * Copie une pièce jointe mission (Document) dans le classeur chantier.
 */
export async function syncMissionDocumentToChantier(
  documentId: string,
  options?: { addedById?: string | null; projectId?: string; linkTaskToProject?: boolean }
): Promise<{ ok: boolean; chantierFileId?: string; error?: string }> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          missionType: true,
          projectId: true,
          clientId: true,
        },
      },
    },
  });

  if (!doc?.fileUrl || !doc.taskId || !doc.task) {
    return { ok: false, error: "Document ou mission introuvable" };
  }

  const projectId = options?.projectId ?? doc.task.projectId ?? doc.projectId;
  if (!projectId) {
    return { ok: false, error: "Mission non rattachée à un chantier" };
  }

  if (doc.task.projectId && doc.task.projectId !== projectId) {
    return { ok: false, error: "Mission rattachée à un autre chantier" };
  }

  const existing = await prisma.chantierFile.findFirst({
    where: { sourceDocumentId: documentId },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, chantierFileId: existing.id };
  }

  if (options?.linkTaskToProject && !doc.task.projectId) {
    await prisma.task.update({
      where: { id: doc.taskId },
      data: { projectId },
    });
  }

  await ensureChantierFolders(projectId);

  const folderCode = folderCodeForTask(doc.task);
  const folder = await prisma.chantierFolder.findFirst({
    where: { projectId, code: folderCode },
  });
  if (!folder) {
    return { ok: false, error: `Rubrique ${folderCode} introuvable` };
  }

  const storagePath = extractStoragePathFromUrl(doc.fileUrl, DOCUMENTS_BUCKET);
  if (!storagePath) {
    return { ok: false, error: "Chemin fichier introuvable" };
  }

  // Mode GED unique : une entrée classeur pointe vers le même objet Storage (pas de 2e binaire).
  if (isFeatureEnabled("gedLinkWithoutCopy")) {
    const created = await prisma.chantierFile.create({
      data: {
        projectId,
        folderId: folder.id,
        clientId: doc.clientId,
        name: doc.name,
        fileUrl: doc.fileUrl,
        storagePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        documentType: "Mission BeWork",
        status: "RECU",
        comment: `Lié depuis la mission « ${doc.task.title} » (référence unique, sans copie)`,
        addedById: options?.addedById ?? null,
        taskId: doc.taskId,
        sourceDocumentId: documentId,
      },
    });
    return { ok: true, chantierFileId: created.id };
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return { ok: false, error: "Stockage non configuré" };
  }

  const downloaded = await downloadStorageObject(supabase, DOCUMENTS_BUCKET, storagePath);
  if (!downloaded) {
    return { ok: false, error: "Impossible de lire le fichier source" };
  }

  const buffer = Buffer.from(await downloaded.blob.arrayBuffer());
  const safeName = doc.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const targetPath = `chantiers/${projectId}/${folder.code}/${Date.now()}-mission-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(targetPath, buffer, {
    contentType: downloaded.contentType,
    upsert: false,
  });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(targetPath);

  const created = await prisma.chantierFile.create({
    data: {
      projectId,
      folderId: folder.id,
      clientId: doc.clientId,
      name: doc.name,
      fileUrl: urlData.publicUrl,
      storagePath: targetPath,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      documentType: "Mission BeWork",
      status: "RECU",
      comment: `Importé depuis la mission « ${doc.task.title} »`,
      addedById: options?.addedById ?? null,
      taskId: doc.taskId,
      sourceDocumentId: documentId,
    },
  });

  return { ok: true, chantierFileId: created.id };
}

/** Synchronise les pièces des missions déjà rattachées à ce chantier. */
export async function syncProjectMissionDocuments(projectId: string): Promise<SyncMissionDocResult> {
  const result: SyncMissionDocResult = { synced: 0, skipped: 0, errors: [] };

  const documents = await prisma.document.findMany({
    where: {
      fileUrl: { not: "" },
      task: { projectId },
    },
    select: { id: true },
  });

  for (const { id } of documents) {
    const existing = await prisma.chantierFile.findFirst({
      where: { sourceDocumentId: id },
      select: { id: true },
    });
    if (existing) {
      result.skipped += 1;
      continue;
    }
    const r = await syncMissionDocumentToChantier(id, { projectId });
    if (r.ok) result.synced += 1;
    else if (r.error) result.errors.push(r.error);
  }

  return result;
}

/** Missions du même client avec pièces mais sans chantier rattaché. */
export async function findOrphanMissionDocumentsForProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { clientId: true },
  });
  if (!project) return [];

  const docs = await prisma.document.findMany({
    where: {
      clientId: project.clientId,
      fileUrl: { not: "" },
      task: { projectId: null },
      taskId: { not: null },
    },
    include: {
      task: { select: { id: true, title: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const byTask = new Map<
    string,
    { taskId: string; title: string; status: string; documents: { id: string; name: string }[] }
  >();

  for (const d of docs) {
    if (!d.task) continue;
    const existing = byTask.get(d.task.id);
    if (existing) {
      existing.documents.push({ id: d.id, name: d.name });
    } else {
      byTask.set(d.task.id, {
        taskId: d.task.id,
        title: d.task.title,
        status: d.task.status,
        documents: [{ id: d.id, name: d.name }],
      });
    }
  }

  return Array.from(byTask.values());
}

/** Rattache une mission au chantier et importe ses pièces dans le classeur. */
export async function linkMissionToProjectAndSync(
  projectId: string,
  taskId: string,
  addedById?: string | null
): Promise<SyncMissionDocResult> {
  const result: SyncMissionDocResult = { synced: 0, skipped: 0, errors: [] };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { clientId: true },
  });
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { clientId: true, projectId: true },
  });

  if (!project || !task || task.clientId !== project.clientId) {
    result.errors.push("Mission ou chantier incompatible");
    return result;
  }

  if (task.projectId && task.projectId !== projectId) {
    result.errors.push("Mission déjà rattachée à un autre chantier");
    return result;
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { projectId },
  });

  const documents = await prisma.document.findMany({
    where: { taskId, fileUrl: { not: "" } },
    select: { id: true },
  });

  for (const { id } of documents) {
    const existing = await prisma.chantierFile.findFirst({
      where: { sourceDocumentId: id },
      select: { id: true },
    });
    if (existing) {
      result.skipped += 1;
      continue;
    }
    const r = await syncMissionDocumentToChantier(id, {
      projectId,
      addedById,
      linkTaskToProject: true,
    });
    if (r.ok) result.synced += 1;
    else if (r.error) result.errors.push(r.error);
  }

  return result;
}
