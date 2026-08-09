/**
 * MESSAGERIE-V2C.4.1 — Soft-delete / masquage message.
 * Ne purge pas Storage ni les objets Action BeWork liés.
 */

export type MessageDeleteKind = "DIRECT" | "TASK" | "PROJECT";
export type MessageDeleteMode = "me" | "everyone";

export type SoftDeletedFields = {
  deletedAt?: string | Date | null;
  deletedById?: string | null;
};

/** Libellé d’affichage après soft-delete « pour tous ». */
export function deletedMessageLabel(
  msg: SoftDeletedFields,
  viewerId: string,
): string | null {
  if (!msg.deletedAt) return null;
  if (msg.deletedById && msg.deletedById === viewerId) {
    return "Vous avez supprimé ce message";
  }
  return "Message supprimé";
}

/** Citation reply vers un message soft-deleted. */
export function deletedReplyExcerpt(): string {
  return "Message supprimé";
}

export function isSoftDeleted(msg: SoftDeletedFields): boolean {
  return Boolean(msg.deletedAt);
}

/**
 * Réduit le payload API d’un message soft-deleted :
 * pas de contenu / PJ exposés aux clients (audit DB conservé).
 */
export function redactSoftDeletedMessage<T extends Record<string, unknown>>(
  msg: T & SoftDeletedFields,
): T {
  if (!msg.deletedAt) return msg;
  return {
    ...msg,
    content: "",
    attachmentsJson: null,
    payloadJson: msg.payloadJson
      ? sanitizePayloadKeepReply(msg.payloadJson)
      : msg.payloadJson,
  };
}

function sanitizePayloadKeepReply(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }
  const base = payload as Record<string, unknown>;
  const replyTo = base.replyTo;
  const out: Record<string, unknown> = {};
  if (replyTo && typeof replyTo === "object") {
    const r = replyTo as Record<string, unknown>;
    out.replyTo = {
      id: typeof r.id === "string" ? r.id : "",
      senderName: typeof r.senderName === "string" ? r.senderName : "Message",
      excerpt: deletedReplyExcerpt(),
    };
  }
  return out;
}

/** Si la cible de reply est soft-deleted, masquer l’extrait. */
export function maybeRedactReplyExcerpt(
  reply: { id: string; senderName: string; excerpt: string } | null,
  deletedIds: Set<string>,
): { id: string; senderName: string; excerpt: string } | null {
  if (!reply) return null;
  if (!deletedIds.has(reply.id)) return reply;
  return { ...reply, excerpt: deletedReplyExcerpt() };
}
