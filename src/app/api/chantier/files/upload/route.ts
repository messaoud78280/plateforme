import { after } from "next/server";
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";
import { ensureChantierPdfPreview, needsPdfConversion } from "@/lib/storage/chantier-pdf-preview";
import {
  GED_MAX_BYTES,
  previewModeLabel,
  resolveGedPreviewMode,
  suggestFolderCode,
} from "@/lib/ged/formats";

const MAX_FILE_SIZE = GED_MAX_BYTES;
const BLOCKED_MIME_PREFIXES = [
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-executable",
  "application/x-sh",
  "application/x-bash",
  "application/x-php",
  "application/x-python",
  "application/javascript",
  "text/javascript",
];
const ALLOWED_MIME_PREFIXES = ["application/", "image/", "video/", "audio/", "text/"];
const BLOCKED_EXTENSIONS = /\.(exe|bat|cmd|com|msi|scr|ps1|vbs|js|jar|sh|bash)$/i;

function isAllowedMime(mime: string | null | undefined, filename: string) {
  if (BLOCKED_EXTENSIONS.test(filename)) return false;
  if (!mime) return true;
  const m = mime.toLowerCase();
  if (BLOCKED_MIME_PREFIXES.some((p) => m.startsWith(p))) return false;
  return ALLOWED_MIME_PREFIXES.some((p) => m.startsWith(p));
}

/** POST — Déposer un fichier dans une rubrique du dossier chantier (GED) */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage non configuré (service role)" }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }

  const projectId = String(formData.get("projectId") ?? "").trim();
  let folderId = String(formData.get("folderId") ?? "").trim();
  if (!projectId) {
    return NextResponse.json({ error: "Chantier requis." }, { status: 400 });
  }

  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok || !access.project) {
    return NextResponse.json({ error: "Chantier non autorisé" }, { status: 403 });
  }

  await ensureChantierFolders(projectId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 100 Mo)" }, { status: 400 });
  }
  if (!isAllowedMime(file.type, file.name)) {
    return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 });
  }

  const displayName = String(formData.get("name") ?? file.name).trim() || file.name;
  const documentType = String(formData.get("documentType") ?? "").trim() || null;
  const comment = String(formData.get("comment") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const subcategory = String(formData.get("subcategory") ?? "").trim() || null;
  const indice = String(formData.get("indice") ?? "").trim() || null;
  const versionLabel = String(formData.get("versionLabel") ?? "1").trim() || "1";
  const visibility =
    String(formData.get("visibility") ?? "Interne entreprise cliente").trim() ||
    "Interne entreprise cliente";
  const classifyLater =
    String(formData.get("classifyLater") ?? "") === "true" ||
    String(formData.get("classifyLater") ?? "") === "1";
  const replacesFileId = String(formData.get("replacesFileId") ?? "").trim() || null;
  const emitterName = String(formData.get("emitterName") ?? "").trim() || null;
  const pilotageId = String(formData.get("pilotageId") ?? "").trim() || null;
  const linkEntityType = String(formData.get("linkEntityType") ?? "").trim() || null;
  const linkEntityId = String(formData.get("linkEntityId") ?? "").trim() || null;
  const linkEntityLabel = String(formData.get("linkEntityLabel") ?? "").trim() || null;
  const taskIdRaw = String(formData.get("taskId") ?? "").trim() || null;

  let taskIdValid: string | null = null;
  if (taskIdRaw) {
    const linkedTask = await prisma.task.findFirst({
      where: { id: taskIdRaw, projectId },
      select: { id: true },
    });
    if (linkedTask) taskIdValid = linkedTask.id;
  }

  if (!folderId) {
    const code = classifyLater
      ? "00"
      : suggestFolderCode({ filename: displayName, category, documentType });
    const folder =
      (await prisma.chantierFolder.findFirst({ where: { projectId, code } })) ??
      (await prisma.chantierFolder.findFirst({ where: { projectId }, orderBy: { sortOrder: "asc" } }));
    if (!folder) {
      return NextResponse.json({ error: "Aucune rubrique disponible." }, { status: 400 });
    }
    folderId = folder.id;
  }

  const folder = await prisma.chantierFolder.findFirst({
    where: { id: folderId, projectId },
  });
  if (!folder) {
    return NextResponse.json({ error: "Rubrique introuvable" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const checksum = createHash("sha256").update(buffer).digest("hex");

  const duplicate = await prisma.chantierFile.findFirst({
    where: { projectId, checksum, deletedAt: null },
    select: { id: true, name: true },
  });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `chantiers/${projectId}/${folder.code}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    console.error("Upload chantier:", {
      message: uploadError.message,
      storagePath,
      mimeType: file.type,
      fileSize: file.size,
    });
    return NextResponse.json({ error: "Échec de l'envoi du fichier" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("documents").getPublicUrl(storagePath);
  const previewMode = resolveGedPreviewMode(displayName, file.type || null);
  const classificationStatus = classifyLater || folder.code === "00" ? "A_CLASSER" : "CLASSE";

  try {
    if (replacesFileId) {
      const prev = await prisma.chantierFile.findFirst({
        where: { id: replacesFileId, projectId, deletedAt: null },
      });
      if (prev) {
        await prisma.chantierFile.update({
          where: { id: prev.id },
          data: { isCurrentVersion: false },
        });
      }
    }

    const created = await prisma.chantierFile.create({
      data: {
        projectId,
        folderId,
        clientId: access.project.clientId,
        name: displayName,
        fileUrl: urlData.publicUrl,
        fileSize: file.size,
        mimeType: file.type || null,
        documentType,
        comment,
        status: "RECU",
        addedById: session.user.id,
        taskId: taskIdValid,
        category: classifyLater ? "À classer" : category,
        subcategory,
        indice,
        versionLabel,
        visibility,
        isCurrentVersion: true,
        replacesFileId,
        checksum,
        classificationStatus,
        storagePath,
        previewStatus: previewModeLabel(previewMode),
        emitterName,
      },
    });

    if (linkEntityType) {
      await prisma.chantierFileLink.create({
        data: {
          fileId: created.id,
          entityType: linkEntityType,
          entityId: linkEntityId,
          entityLabel: linkEntityLabel,
          pilotageId,
          createdById: session.user.id,
        },
      });
    }

    if (pilotageId && (category === "Marché" || documentType)) {
      const pilotage = await prisma.worksitePilotage.findFirst({
        where: { id: pilotageId, projectId, archivedAt: null },
        select: { id: true },
      });
      if (pilotage) {
        await prisma.pilotageMarketDocument.create({
          data: {
            pilotageId,
            docType: documentType || category || "Autre",
            title: displayName,
            version: versionLabel,
            indice,
            emitter: emitterName,
            status: "Reçu",
            isCurrent: true,
            fileUrl: urlData.publicUrl,
            fileName: displayName,
            fileSize: file.size,
            mimeType: file.type || null,
            uploadedById: session.user.id,
            chantierFileId: created.id,
          },
        });
      }
    }

    if (needsPdfConversion(file.type || null, displayName)) {
      after(async () => {
        try {
          await ensureChantierPdfPreview({
            supabase,
            projectId,
            fileId: created.id,
            fileUrl: urlData.publicUrl,
            name: displayName,
            mimeType: file.type || null,
            fileSize: file.size,
          });
          await prisma.chantierFile.update({
            where: { id: created.id },
            data: { previewStatus: previewModeLabel("converted") },
          });
        } catch (e) {
          console.error("Conversion PDF chantier (arrière-plan):", e);
          await prisma.chantierFile
            .update({
              where: { id: created.id },
              data: {
                previewStatus: "Erreur de traitement — original disponible au téléchargement",
              },
            })
            .catch(() => undefined);
        }
      });
    }

    return NextResponse.json({
      id: created.id,
      fileUrl: created.fileUrl,
      duplicateOf: duplicate ? { id: duplicate.id, name: duplicate.name } : null,
      classificationStatus,
      previewStatus: created.previewStatus,
    });
  } catch (error) {
    console.error("DB chantier file:", error);
    return NextResponse.json({ error: "Erreur enregistrement" }, { status: 500 });
  }
}
