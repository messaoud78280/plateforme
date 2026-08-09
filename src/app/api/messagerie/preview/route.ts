import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ttlGet, ttlSet } from "@/lib/perf/ttl-cache";
import { resolveConversationHref } from "@/lib/messagerie/resolve-conversation";
import { formatMediaPreview, type MsgAttachment } from "@/lib/messagerie/media-preview";

export type MessageriePreviewItem = {
  id: string;
  title: string;
  preview: string;
  at: string;
  href: string;
  kind: "TASK" | "DIRECT" | "PROJECT";
  unread: number;
};

/**
 * GET /api/messagerie/preview
 * Aperçu header : conversations non lues (max 3) + total.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = session.user.id;
  const cacheKey = `msg-preview:${userId}`;
  const cached = ttlGet<{ total: number; items: MessageriePreviewItem[] }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const [taskMsgs, directMsgs, projectMsgs] = await Promise.all([
      prisma.taskMessage.findMany({
        where: { receiverId: userId, read: false },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          content: true,
          attachmentsJson: true,
          createdAt: true,
          taskId: true,
          sender: { select: { name: true } },
          task: { select: { title: true } },
        },
      }),
      prisma.directMessage.findMany({
        where: { receiverId: userId, read: false },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          content: true,
          attachmentsJson: true,
          createdAt: true,
          senderId: true,
          sender: { select: { name: true } },
        },
      }),
      prisma.message.findMany({
        where: { receiverId: userId, read: false },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          content: true,
          attachmentsJson: true,
          createdAt: true,
          projectId: true,
          channel: true,
          sender: { select: { name: true } },
          project: { select: { title: true } },
        },
      }),
    ]);

    const byKey = new Map<string, MessageriePreviewItem>();

    for (const m of taskMsgs) {
      const key = `TASK:${m.taskId}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          id: key,
          title: m.task.title,
          preview: `${m.sender.name.split(" ")[0] ?? ""} : ${formatMediaPreview(
            m.content,
            m.attachmentsJson as MsgAttachment[] | null,
          )}`,
          at: m.createdAt.toISOString(),
          href: resolveConversationHref({ kind: "task", taskId: m.taskId, messageId: m.id }),
          kind: "TASK",
          unread: 1,
        });
      } else {
        existing.unread += 1;
      }
    }

    for (const m of directMsgs) {
      const key = `DIRECT:${m.senderId}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          id: key,
          title: m.sender.name,
          preview: formatMediaPreview(
            m.content,
            m.attachmentsJson as MsgAttachment[] | null,
          ),
          at: m.createdAt.toISOString(),
          href: resolveConversationHref({
            kind: "direct",
            userId: m.senderId,
            messageId: m.id,
          }),
          kind: "DIRECT",
          unread: 1,
        });
      } else {
        existing.unread += 1;
      }
    }

    for (const m of projectMsgs) {
      const key = `PROJECT:${m.projectId}:${m.channel}`;
      const existing = byKey.get(key);
      const channel =
        m.channel === "INTERNE" || m.channel === "CLIENT" || m.channel === "FOURNISSEUR"
          ? m.channel
          : "CLIENT";
      if (!existing) {
        byKey.set(key, {
          id: key,
          title: m.project.title,
          preview: `${m.sender.name.split(" ")[0] ?? ""} : ${formatMediaPreview(
            m.content,
            m.attachmentsJson as MsgAttachment[] | null,
          )}`,
          at: m.createdAt.toISOString(),
          href: resolveConversationHref({
            kind: "project_channel",
            projectId: m.projectId,
            channel,
          }),
          kind: "PROJECT",
          unread: 1,
        });
      } else {
        existing.unread += 1;
      }
    }

    const items = Array.from(byKey.values())
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 3);

    const payload = { total: byKey.size, items };
    ttlSet(cacheKey, payload, 15_000);
    ttlSet(`msg-unread:${userId}`, {
      total: byKey.size,
      conversations: byKey.size,
      messages: taskMsgs.length + directMsgs.length + projectMsgs.length,
    }, 15_000);

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[messagerie/preview]", e);
    return NextResponse.json({ total: 0, items: [] });
  }
}
