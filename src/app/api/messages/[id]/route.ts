import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const msg = await prisma.message.findUnique({
      where: { id },
    });

    if (!msg) {
      return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
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
      { status: 500 }
    );
  }
}
