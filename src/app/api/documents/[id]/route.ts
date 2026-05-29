import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase";
import { DOCUMENTS_BUCKET, extractStoragePathFromUrl } from "@/lib/storage/supabase-object";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Réservé aux clients" }, { status: 403 });
  }

  const { id } = await params;
  const doc = await prisma.document.findFirst({
    where: { id, clientId: session.user.id },
  });
  if (!doc) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const supabase = createServiceRoleClient();
  if (supabase && doc.fileUrl) {
    try {
      const path = extractStoragePathFromUrl(doc.fileUrl, DOCUMENTS_BUCKET);
      if (path) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
      }
    } catch {
      // continue to delete DB record even if storage delete fails
    }
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
