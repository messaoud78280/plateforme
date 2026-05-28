import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  DOCUMENTS_BUCKET,
  downloadStorageObject,
  extractStoragePathFromUrl,
} from "@/lib/storage/supabase-object";

function inlineFilename(name: string): string {
  const safe = name.replace(/[^\w.\- àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/g, "_").slice(0, 180);
  return `inline; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

/** GET — Flux fichier pour aperçu inline (PDF, images, texte) — même origine, session requise. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const file = await prisma.chantierFile.findUnique({
    where: { id },
    select: { projectId: true, fileUrl: true, mimeType: true, name: true },
  });
  if (!file?.fileUrl) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const access = await canAccessChantierProject(session.user, file.projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage non configuré" }, { status: 503 });
  }

  const path = extractStoragePathFromUrl(file.fileUrl, DOCUMENTS_BUCKET);
  if (!path) {
    return NextResponse.json({ error: "Chemin stockage invalide" }, { status: 400 });
  }

  const downloaded = await downloadStorageObject(supabase, DOCUMENTS_BUCKET, path);
  if (!downloaded) {
    return NextResponse.json({ error: "Impossible de lire le fichier" }, { status: 502 });
  }

  const contentType = file.mimeType || downloaded.contentType || "application/octet-stream";

  return new NextResponse(downloaded.blob, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": inlineFilename(file.name),
      "Cache-Control": "private, max-age=120",
    },
  });
}
