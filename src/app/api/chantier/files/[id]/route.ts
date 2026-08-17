import { NextResponse } from "next/server";
import type { ChantierFileStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDeleteChantierFile, canUpdateChantierFileStatus } from "@/lib/chantier-dossier/access";
import { canAccessGedFile } from "@/lib/ged/org-scope";
import { createServiceRoleClient } from "@/lib/supabase";
import { deleteChantierPdfPreview } from "@/lib/storage/chantier-pdf-preview";
import { DOCUMENTS_BUCKET, extractStoragePathFromUrl } from "@/lib/storage/supabase-object";
import { gedIndexOwnsStorage, isGedPrimaryEntityType } from "@/lib/ged/source-identity";

const STATUSES: ChantierFileStatus[] = ["RECU", "A_VERIFIER", "VALIDE", "MANQUANT", "A_RELANCER"];

/** PATCH — Mettre à jour statut / commentaire / libellé */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.chantierFile.findUnique({
    where: { id },
    select: { projectId: true, organizationId: true, clientId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const access = await canAccessGedFile(session.user, existing);
  if (!access.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const data: {
    status?: ChantierFileStatus;
    comment?: string | null;
    name?: string;
    documentType?: string | null;
    visibility?: string;
    classificationStatus?: string;
  } = {};

  if (body.status !== undefined) {
    if (!canUpdateChantierFileStatus(session.user)) {
      return NextResponse.json(
        { error: "Seul BeWork peut modifier le statut documentaire." },
        { status: 403 }
      );
    }
    const s = String(body.status);
    if (!STATUSES.includes(s as ChantierFileStatus)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    data.status = s as ChantierFileStatus;
  }
  if (body.comment !== undefined) {
    data.comment = body.comment ? String(body.comment).trim() || null : null;
  }
  if (body.name !== undefined) {
    const n = String(body.name).trim();
    if (!n) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    data.name = n;
  }
  if (body.documentType !== undefined) {
    data.documentType = body.documentType ? String(body.documentType).trim() || null : null;
    if (data.documentType) {
      data.classificationStatus = "CLASSE";
    }
  }
  if (body.visibility !== undefined) {
    const v = String(body.visibility).trim();
    const allowed = [
      "Interne entreprise cliente",
      "Interne BeWork",
      "Intervenants autorisés",
      "BeWork et entreprise cliente",
      "Partage temporaire",
    ];
    if (!allowed.includes(v)) {
      return NextResponse.json({ error: "Visibilité invalide" }, { status: 400 });
    }
    data.visibility = v;
  }

  const updated = await prisma.chantierFile.update({
    where: { id },
    data,
    select: { id: true, status: true, name: true, visibility: true },
  });

  return NextResponse.json(updated);
}

/** DELETE — Supprimer une entrée (fichier ou placeholder) */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.chantierFile.findUnique({
    where: { id },
    select: {
      projectId: true,
      organizationId: true,
      clientId: true,
      fileUrl: true,
      name: true,
      sourceDocumentId: true,
      links: { select: { entityType: true }, take: 20 },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const access = await canAccessGedFile(session.user, existing);
  if (!access.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  if (!canDeleteChantierFile(session.user)) {
    return NextResponse.json(
      { error: "La suppression des pièces du classeur est réservée à BeWork. Contactez votre assistant." },
      { status: 403 }
    );
  }

  const hasPrimarySourceLink = existing.links.some((l) => isGedPrimaryEntityType(l.entityType));
  const ownsStorage = gedIndexOwnsStorage({
    fileUrl: existing.fileUrl,
    projectId: existing.projectId,
    hasPrimarySourceLink,
    sourceDocumentId: existing.sourceDocumentId,
  });

  const supabase = createServiceRoleClient();
  if (supabase) {
    if (ownsStorage && existing.fileUrl) {
      const path = extractStoragePathFromUrl(existing.fileUrl, DOCUMENTS_BUCKET);
      if (path) {
        const { error: storageError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
        if (storageError) {
          console.error("Suppression Storage chantier:", storageError.message, path);
        }
      }
    }
    await deleteChantierPdfPreview(supabase, existing.projectId, id);
  }

  if (hasPrimarySourceLink || existing.sourceDocumentId) {
    await prisma.chantierFile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } else {
    await prisma.chantierFile.delete({ where: { id } });
  }
  return NextResponse.json({ ok: true });
}
