import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClientRole } from "@/lib/authz";

export type InboxItemDto = {
  id: string;
  source: "notification" | "alert";
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
};

/** GET /api/notifications/inbox — Liste récente + compteur non lues */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = session.user.id;
  const isClient = isClientRole(session.user);

  try {
    const [notifications, unreadNotifCount, alerts, unreadAlertCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          message: true,
          read: true,
          actionUrl: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where: { userId, read: false } }),
      isClient
        ? prisma.alert.findMany({
            where: { clientId: userId },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
              id: true,
              title: true,
              message: true,
              read: true,
              actionUrl: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
      isClient
        ? prisma.alert.count({ where: { clientId: userId, read: false } })
        : Promise.resolve(0),
    ]);

    const items: InboxItemDto[] = [
      ...notifications.map((n) => ({
        id: n.id,
        source: "notification" as const,
        title: n.title,
        message: n.message,
        read: n.read,
        actionUrl: n.actionUrl,
        createdAt: n.createdAt.toISOString(),
      })),
      ...alerts.map((a) => ({
        id: a.id,
        source: "alert" as const,
        title: a.title,
        message: a.message,
        read: a.read,
        actionUrl: a.actionUrl,
        createdAt: a.createdAt.toISOString(),
      })),
    ];

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      unreadCount: unreadNotifCount + unreadAlertCount,
      items: items.slice(0, 20),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}
