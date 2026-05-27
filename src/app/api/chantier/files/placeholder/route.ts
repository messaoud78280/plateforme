import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";

/** POST — Marquer une pièce attendue (sans fichier) : statut MANQUANT ou A_RELANCER */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const projectId = String(body.projectId ?? "").trim();
  const folderId = String(body.folderId ?? "").trim();
  const name = String(body.name ?? "").trim();
  if (!projectId || !folderId || !name) {
    return NextResponse.json({ error: "Chantier, rubrique et intitulé requis." }, { status: 400 });
  }

  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok || !access.project) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const status = body.status === "A_RELANCER" ? "A_RELANCER" : "MANQUANT";

  const created = await prisma.chantierFile.create({
    data: {
      projectId,
      folderId,
      clientId: access.project.clientId,
      name,
      fileUrl: null,
      documentType: body.documentType ? String(body.documentType).trim() || null : null,
      comment: body.comment ? String(body.comment).trim() || null : null,
      status,
      addedById: session.user.id,
    },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
