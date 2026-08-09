import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ttlInvalidatePrefix } from "@/lib/perf/ttl-cache";

/** POST /api/alerts/read-all — Marquer toutes les alertes du client comme lues */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "CLIENT") {
    return NextResponse.json({ success: true });
  }

  try {
    await prisma.alert.updateMany({
      where: { clientId: session.user.id, read: false },
      data: { read: true },
    });
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
