import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ttlInvalidatePrefix } from "@/lib/perf/ttl-cache";

/** PATCH /api/alerts/[id] — Marquer une alerte comme lue */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const updated = await prisma.alert.updateMany({
      where: { id, clientId: session.user.id },
      data: { read: true },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Alerte introuvable" }, { status: 404 });
    }
    ttlInvalidatePrefix(`notif-unread:${session.user.id}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
