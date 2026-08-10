import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messagerieDeepLink } from "@/lib/messagerie/bework-actions";

/** GET ?kind=TASK|DIRECT&id= — retrouve la conversation d’un message source. */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") ?? "TASK";
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  if (kind === "TASK") {
    const m = await prisma.taskMessage.findUnique({
      where: { id },
      select: { id: true, taskId: true },
    });
    if (!m) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({
      kind: "TASK",
      messageId: m.id,
      taskId: m.taskId,
      href: messagerieDeepLink("TASK", m.id, { taskId: m.taskId }),
    });
  }

  if (kind === "DIRECT") {
    const m = await prisma.directMessage.findUnique({
      where: { id },
      select: { id: true, senderId: true, receiverId: true },
    });
    if (!m) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    const otherId = m.senderId === session.user.id ? m.receiverId : m.senderId;
    return NextResponse.json({
      kind: "DIRECT",
      messageId: m.id,
      contactId: otherId,
      href: `/dashboard/messagerie?with=${otherId}&messageId=${m.id}`,
    });
  }

  return NextResponse.json({ error: "kind invalide" }, { status: 400 });
}
