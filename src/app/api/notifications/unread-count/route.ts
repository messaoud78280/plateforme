import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClientRole } from "@/lib/authz";
import { ttlGet, ttlSet } from "@/lib/perf/ttl-cache";

/** GET /api/notifications/unread-count — badge header léger (sans payload inbox). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = session.user.id;
  const cacheKey = `notif-unread:${userId}`;
  const cached = ttlGet<{ unreadCount: number }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const isClient = isClientRole(session.user);
    const [unreadNotifCount, unreadAlertCount] = await Promise.all([
      prisma.notification.count({ where: { userId, read: false } }),
      isClient
        ? prisma.alert.count({ where: { clientId: userId, read: false } })
        : Promise.resolve(0),
    ]);
    const payload = { unreadCount: unreadNotifCount + unreadAlertCount };
    ttlSet(cacheKey, payload, 20_000);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[notifications/unread-count]", e);
    return NextResponse.json({ unreadCount: 0 });
  }
}
