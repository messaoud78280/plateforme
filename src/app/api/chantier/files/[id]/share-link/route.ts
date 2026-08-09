import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { buildChantierShareMessage } from "@/lib/chantier-dossier/share-external";
import { createServiceRoleClient } from "@/lib/supabase";
import { DOCUMENTS_BUCKET, extractStoragePathFromUrl } from "@/lib/storage/supabase-object";
import {
  isMessagerieMediaPath,
  parseMessagerieStorageRef,
} from "@/lib/messagerie/media-storage";

const SHARE_LINK_SECONDS = 24 * 60 * 60;

/** GET — Lien de téléchargement temporaire pour partage e-mail / WhatsApp. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const file = await prisma.chantierFile.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      fileUrl: true,
      projectId: true,
      project: { select: { title: true } },
    },
  });

  if (!file?.fileUrl) {
    return NextResponse.json({ error: "Fichier introuvable ou pièce non déposée" }, { status: 404 });
  }

  const access = await canAccessChantierProject(session.user, file.projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage non configuré" }, { status: 503 });
  }

  const parsedMsg = parseMessagerieStorageRef(file.fileUrl);
  let bucket = DOCUMENTS_BUCKET;
  let path: string | null = null;
  if (parsedMsg && isMessagerieMediaPath(parsedMsg.bucket, parsedMsg.path)) {
    bucket = parsedMsg.bucket;
    path = parsedMsg.path;
  } else {
    path = extractStoragePathFromUrl(file.fileUrl, DOCUMENTS_BUCKET);
  }
  if (!path) {
    return NextResponse.json({ error: "Impossible de générer un lien de partage" }, { status: 500 });
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SHARE_LINK_SECONDS);

  if (error || !data?.signedUrl) {
    console.error("share-link signedUrl:", error?.message);
    return NextResponse.json({ error: "Lien de partage indisponible" }, { status: 500 });
  }

  const body = buildChantierShareMessage({
    fileName: file.name,
    projectTitle: file.project.title,
    downloadUrl: data.signedUrl,
    validityHours: SHARE_LINK_SECONDS / 3600,
  });

  return NextResponse.json({
    url: data.signedUrl,
    fileName: file.name,
    projectTitle: file.project.title,
    expiresIn: SHARE_LINK_SECONDS,
    body,
  });
}
