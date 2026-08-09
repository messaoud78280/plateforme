import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ttlInvalidatePrefix } from "@/lib/perf/ttl-cache";

/** PATCH /api/notifications/[id] — Marquer comme lu */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const notif = await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true },
    });
    if (notif.count === 0) {
      return NextResponse.json({ error: "Notification introuvable" }, { status: 404 });
    }
    ttlInvalidatePrefix(`notif-unread:${session.user.id}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
