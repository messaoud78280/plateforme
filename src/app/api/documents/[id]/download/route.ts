import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessDocument } from "@/lib/documents/access";
import { createServiceRoleClient } from "@/lib/supabase";
import { DOCUMENTS_BUCKET } from "@/lib/storage/supabase-object";
import { resolveDownloadUrl } from "@/lib/storage/signed-url";

/** GET — Téléchargement sécurisé via URL signée (bucket privé). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      fileUrl: true,
      clientId: true,
      task: { select: { clientId: true, assignedToId: true } },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  if (!canAccessDocument(session.user, doc)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.redirect(doc.fileUrl);
  }

  const resolved = await resolveDownloadUrl(supabase, doc.fileUrl, {
    bucket: DOCUMENTS_BUCKET,
    expiresIn: 60 * 60,
  });

  return NextResponse.redirect(resolved.url);
}
