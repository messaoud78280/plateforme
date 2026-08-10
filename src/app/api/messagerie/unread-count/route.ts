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
    const participantChannelIds = (
      await prisma.projectChannelParticipant.findMany({
        where: { userId },
        select: { channelId: true },
      })
    ).map((r) => r.channelId);

    const [taskUnread, directUnread, projectUnread, channelReceipts] = await Promise.all([
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
        where: { receiverId: userId, read: false, channelId: null },
        _count: { id: true },
      }),
      // V2C.6C — unread canal uniquement si encore participant
      participantChannelIds.length === 0
        ? Promise.resolve([] as { message: { channelId: string | null } }[])
        : prisma.messageChannelReceipt.findMany({
            where: {
              userId,
              read: false,
              message: {
                channelId: { in: participantChannelIds },
                deletedAt: null,
              },
            },
            select: { message: { select: { channelId: true } } },
          }),
    ]);

    const channelIdsWithUnread = new Set(
      channelReceipts
        .map((r) => r.message.channelId)
        .filter((id): id is string => Boolean(id)),
    );
    const channelUnreadCount = channelReceipts.length;
    const channelConvCount = channelIdsWithUnread.size;
    const conversations =
      taskUnread.length + directUnread.length + projectUnread.length + channelConvCount;
    const messages =
      taskUnread.reduce((s, r) => s + r._count.id, 0) +
      directUnread.reduce((s, r) => s + r._count.id, 0) +
      projectUnread.reduce((s, r) => s + r._count.id, 0) +
      channelUnreadCount;

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
