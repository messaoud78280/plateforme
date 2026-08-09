import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ttlGet, ttlSet } from "@/lib/perf/ttl-cache";

/**
 * GET /api/messagerie/unread-count
 * Convention badge sidebar : nombre de conversations avec au moins 1 message non lu
 * (missions TaskMessage + directs DirectMessage + chantiers Message).
 * Cache TTL 20 s — PERF-V1.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = session.user.id;
  const cacheKey = `msg-unread:${userId}`;
  const cached = ttlGet<{ total: number; conversations: number; messages: number }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const [taskUnread, directUnread, projectUnread] = await Promise.all([
      prisma.taskMessage.groupBy({
        by: ["taskId"],
        where: { receiverId: userId, read: false },
        _count: { id: true },
      }),
      prisma.directMessage.groupBy({
        by: ["senderId"],
        where: { receiverId: userId, read: false },
        _count: { id: true },
      }),
      prisma.message.groupBy({
        by: ["projectId"],
        where: { receiverId: userId, read: false },
        _count: { id: true },
      }),
    ]);

    const conversations =
      taskUnread.length + directUnread.length + projectUnread.length;
    const messages =
      taskUnread.reduce((s, r) => s + r._count.id, 0) +
      directUnread.reduce((s, r) => s + r._count.id, 0) +
      projectUnread.reduce((s, r) => s + r._count.id, 0);

    const payload = {
      total: conversations,
      conversations,
      messages,
    };
    ttlSet(cacheKey, payload, 20_000);
    return NextResponse.json(payload);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur compteur" }, { status: 500 });
  }
}
