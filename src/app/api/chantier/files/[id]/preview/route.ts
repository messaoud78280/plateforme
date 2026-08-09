import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  issueDocumentSignedUrl,
  resolveDocumentAccess,
  streamDocumentBytes,
} from "@/lib/ged/resolve-document-access";
import {
  ensureChantierPdfPreview,
  fileExtension,
  needsPdfConversion,
} from "@/lib/storage/chantier-pdf-preview";
import { createServiceRoleClient } from "@/lib/supabase";
import { DOCUMENTS_BUCKET } from "@/lib/storage/supabase-object";

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

/** GET — Aperçu / téléchargement après ACL GED-V2A.1 (visibilité + scope). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const forceOriginal = new URL(request.url).searchParams.get("download") === "original";
  const asRedirect = new URL(request.url).searchParams.get("redirect") === "1";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  const access = await resolveDocumentAccess(
    {
      id: session.user.id,
      role: session.user.role,
      personType: session.user.personType ?? null,
      permissionProfile: session.user.permissionProfile ?? null,
      isDemo: Boolean(session.user.isDemo),
      demoRootUserId: session.user.demoRootUserId ?? null,
    },
    { kind: "CHANTIER_FILE", id },
  );

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (asRedirect) {
    const signed = await issueDocumentSignedUrl(access);
    if ("error" in signed) {
      return NextResponse.json({ error: signed.error }, { status: signed.status });
    }
    return NextResponse.redirect(signed.url);
  }

  const fileMeta = await prisma.chantierFile.findUnique({
    where: { id },
    select: { projectId: true, fileSize: true },
  });

  const supabase = createServiceRoleClient();
  if (
    supabase &&
    !forceOriginal &&
    access.bucket === DOCUMENTS_BUCKET &&
    fileMeta &&
    needsPdfConversion(access.mimeType, access.fileName)
  ) {
    const converted = await ensureChantierPdfPreview({
      supabase,
      projectId: fileMeta.projectId,
      fileId: id,
      fileUrl: access.storedUrl,
      name: access.fileName,
      mimeType: access.mimeType,
      fileSize: fileMeta.fileSize,
    });
    if (converted) {
      return new NextResponse(new Uint8Array(converted.pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": inlineFilename(access.fileName, true),
          "Cache-Control": "private, max-age=300",
          "X-BeWork-Preview": converted.cached ? "cached" : "converted",
        },
      });
    }
    return NextResponse.json(
      {
        error: "Aperçu PDF indisponible pour ce format",
        hint: conversionHint(access.fileName),
      },
      { status: 422 },
    );
  }

  const downloaded = await streamDocumentBytes(access);
  if (!downloaded) {
    return NextResponse.json({ error: "Impossible de lire le fichier" }, { status: 502 });
  }

  const contentType = access.mimeType || downloaded.contentType || "application/octet-stream";

  return new NextResponse(downloaded.blob, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": inlineFilename(access.fileName),
      "Cache-Control": "private, max-age=120",
    },
  });
}
