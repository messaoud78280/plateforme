import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGedFile } from "@/lib/ged/org-scope";

/** POST /api/chantier/files/[id]/favorite — bascule favori utilisateur. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: fileId } = await params;
  const file = await prisma.chantierFile.findFirst({
    where: { id: fileId, deletedAt: null },
    select: { id: true, projectId: true, organizationId: true, clientId: true },
  });
  if (!file) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const access = await canAccessGedFile(session.user, file);
  if (!access.ok) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const existing = await prisma.chantierFileFavorite.findUnique({
    where: { fileId_userId: { fileId, userId: session.user.id } },
  });
  if (existing) {
    await prisma.chantierFileFavorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, favorited: false });
  }
  await prisma.chantierFileFavorite.create({
    data: { fileId, userId: session.user.id },
  });
  return NextResponse.json({ ok: true, favorited: true });
}
