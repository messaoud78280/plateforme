/**
 * Notification realtime Messagerie (Supabase Broadcast).
 * Fallback : le client SSE / poll resynchronise si broadcast indisponible.
 */
import { createServiceRoleClient } from "@/lib/supabase";

export type MessagerieRealtimePayload = {
  receiverId: string;
  senderId: string;
  senderName: string;
  title: string;
  preview: string;
  href: string;
  at: string;
  kind: "TASK" | "DIRECT" | "PROJECT";
  conversationKey: string;
};

export async function broadcastMessagerieToUser(
  payload: MessagerieRealtimePayload,
): Promise<boolean> {
  try {
    const sb = createServiceRoleClient();
    if (!sb) return false;

    const channel = sb.channel(`messagerie-user-${payload.receiverId}`, {
      config: { broadcast: { ack: false } },
    });

    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("subscribe timeout")), 2500);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(t);
          resolve();
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(t);
          reject(new Error(String(status)));
        }
      });
    });

    await channel.send({
      type: "broadcast",
      event: "new_message",
      payload,
    });

    await sb.removeChannel(channel);
    return true;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[messagerie/broadcast]", e);
    }
    return false;
  }
}
