import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ttlGet, ttlSet } from "@/lib/perf/ttl-cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE Messagerie — SECOURS / resynchronisation du badge unread.
 * Chemin principal client = Supabase Broadcast (immédiat).
 * Ici : tick serveur 2,5 s uniquement quand le client ouvre ce flux
 * (Broadcast indisponible ou en attente de SUBSCRIBED).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  let closed = false;
  let lastTotal = -1;
  let timer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      async function tick() {
        if (closed) return;
        try {
          const cacheKey = `msg-unread:${userId}`;
          let payload = ttlGet<{ total: number }>(cacheKey);
          if (!payload) {
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
            payload = {
              total: taskUnread.length + directUnread.length + projectUnread.length,
            };
            ttlSet(cacheKey, {
              ...payload,
              conversations: payload.total,
              messages: 0,
            }, 5_000);
          }
          if (payload.total !== lastTotal) {
            lastTotal = payload.total;
            send({ type: "unread", total: payload.total, at: new Date().toISOString() });
          } else {
            send({ type: "ping", at: new Date().toISOString() });
          }
        } catch {
          send({ type: "ping", at: new Date().toISOString() });
        }
      }

      void tick();
      timer = setInterval(() => void tick(), 2500);
    },
    cancel() {
      closed = true;
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
