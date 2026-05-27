import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@/lib/supabase";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
];

/** POST — Déposer un fichier dans une rubrique du dossier chantier */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage non configuré" }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }

  const projectId = String(formData.get("projectId") ?? "").trim();
  const folderId = String(formData.get("folderId") ?? "").trim();
  if (!projectId || !folderId) {
    return NextResponse.json({ error: "Chantier et rubrique requis." }, { status: 400 });
  }

  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok || !access.project) {
    return NextResponse.json({ error: "Chantier non autorisé" }, { status: 403 });
  }

  const folder = await prisma.chantierFolder.findFirst({
    where: { id: folderId, projectId },
  });
  if (!folder) {
    return NextResponse.json({ error: "Rubrique introuvable" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 25 Mo)" }, { status: 400 });
  }
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 });
  }

  const displayName = String(formData.get("name") ?? file.name).trim() || file.name;
  const documentType = String(formData.get("documentType") ?? "").trim() || null;
  const comment = String(formData.get("comment") ?? "").trim() || null;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `chantiers/${projectId}/${folder.code}/${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    console.error("Upload chantier:", uploadError);
    return NextResponse.json({ error: "Échec de l'envoi du fichier" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("documents").getPublicUrl(storagePath);

  try {
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
      },
    });
    return NextResponse.json({ id: created.id, fileUrl: created.fileUrl });
  } catch (error) {
    console.error("DB chantier file:", error);
    return NextResponse.json({ error: "Erreur enregistrement" }, { status: 500 });
  }
}
