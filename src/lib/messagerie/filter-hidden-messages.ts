import { prisma } from "@/lib/prisma";
import {
  redactSoftDeletedMessage,
  type MessageDeleteKind,
} from "@/lib/messagerie/message-delete";

/** IDs masqués « pour moi » pour un lot de messages. */
export async function loadHiddenMessageIds(
  userId: string,
  kind: MessageDeleteKind,
  messageIds: string[],
): Promise<Set<string>> {
  if (messageIds.length === 0) return new Set();
  const rows = await prisma.messageUserHide.findMany({
    where: {
      userId,
      messageKind: kind,
      messageId: { in: messageIds },
    },
    select: { messageId: true },
  });
  return new Set(rows.map((r) => r.messageId));
}

/** Filtre les hides + rédige les soft-deletes pour la réponse API. */
export async function presentMessagesForViewer<
  T extends { id: string; deletedAt?: Date | string | null; deletedById?: string | null },
>(
  userId: string,
  kind: MessageDeleteKind,
  messages: T[],
): Promise<T[]> {
  const hidden = await loadHiddenMessageIds(
    userId,
    kind,
    messages.map((m) => m.id),
  );
  return messages
    .filter((m) => !hidden.has(m.id))
    .map((m) => redactSoftDeletedMessage(m as T & Record<string, unknown>) as T);
}
