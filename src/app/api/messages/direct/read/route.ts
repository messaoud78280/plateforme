import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManagerRole, isStaffAgent } from "@/lib/messaging/access";

/** POST /api/messages/direct/read — Marquer comme lus les messages reçus d'un contact */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!isManagerRole(session.user.role) && !isStaffAgent(session.user.role)) {
    return NextResponse.json({ error: "Réservé aux gérants et agents" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { otherUserId } = body as { otherUserId?: string };
    if (!otherUserId || otherUserId === session.user.id) {
      return NextResponse.json({ error: "otherUserId requis" }, { status: 400 });
    }

    await prisma.directMessage.updateMany({
      where: {
        receiverId: session.user.id,
        senderId: otherUserId,
        read: false,
      },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
