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
import {
  ensureChantierPdfPreview,
  fileExtension,
  isDirectPreviewable,
  needsPdfConversion,
} from "@/lib/storage/chantier-pdf-preview";

export const maxDuration = 120;

function inlineFilename(name: string, pdf = false): string {
  const base = pdf ? name.replace(/\.[^.]+$/, "") + ".pdf" : name;
  const safe = base.replace(/[^\w.\- àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/g, "_").slice(0, 180);
  return `inline; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(base)}`;
}

function conversionHint(name: string): string {
  const ext = fileExtension(name);
  if ([".numbers", ".pages", ".key"].includes(ext)) {
    return "Pour Numbers / Pages / Keynote : exportez le document en PDF depuis votre Mac, puis déposez le PDF dans le classeur pour l’aperçu et le partage.";
  }
  return "La conversion en PDF a échoué. Essayez d’exporter le document en PDF puis de le redéposer.";
}

/** GET — Aperçu inline : PDF/images/texte natifs, ou PDF généré (LibreOffice / ConvertAPI). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const forceOriginal = new URL(request.url).searchParams.get("download") === "original";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const file = await prisma.chantierFile.findUnique({
    where: { id },
    select: { projectId: true, fileUrl: true, mimeType: true, name: true, fileSize: true },
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

  if (!forceOriginal && needsPdfConversion(file.mimeType, file.name)) {
    const converted = await ensureChantierPdfPreview({
      supabase,
      projectId: file.projectId,
      fileId: id,
      fileUrl: file.fileUrl,
      name: file.name,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
    });
    if (converted) {
      return new NextResponse(new Uint8Array(converted.pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": inlineFilename(file.name, true),
          "Cache-Control": "private, max-age=300",
          "X-BeWork-Preview": converted.cached ? "cached" : "converted",
        },
      });
    }
    return NextResponse.json(
      {
        error: "Aperçu PDF indisponible pour ce format",
        hint: conversionHint(file.name),
      },
      { status: 422 }
    );
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
