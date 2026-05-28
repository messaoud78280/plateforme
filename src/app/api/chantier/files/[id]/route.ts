import { NextResponse } from "next/server";
import type { ChantierFileStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { createServiceRoleClient } from "@/lib/supabase";
import { deleteChantierPdfPreview } from "@/lib/storage/chantier-pdf-preview";

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
    select: { projectId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const access = await canAccessChantierProject(session.user, existing.projectId);
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
  } = {};

  if (body.status !== undefined) {
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
  }

  const updated = await prisma.chantierFile.update({
    where: { id },
    data,
    select: { id: true, status: true },
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
    select: { projectId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const access = await canAccessChantierProject(session.user, existing.projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  if (supabase) {
    await deleteChantierPdfPreview(supabase, existing.projectId, id);
  }

  await prisma.chantierFile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
