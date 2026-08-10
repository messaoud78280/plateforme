import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProjectChannel } from "@/lib/messagerie/project-channels";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const msg = await prisma.message.findUnique({
      where: { id },
      select: { id: true, receiverId: true, channelId: true },
    });

    if (!msg) {
      return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
    }

    if (msg.channelId) {
      const ok = await canAccessProjectChannel(session.user.id, msg.channelId, "read");
      if (!ok) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      await prisma.messageChannelReceipt.updateMany({
        where: { messageId: id, userId: session.user.id },
        data: { read: true, readAt: new Date() },
      });
      if (msg.receiverId === session.user.id) {
        await prisma.message.update({
          where: { id },
          data: { read: true },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (msg.receiverId !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await prisma.message.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erreur marquage message lu:", error);
    return NextResponse.json(
      { error: "Erreur lors du marquage du message." },
      { status: 500 },
    );
  }
}
