/**
 * MESSAGERIE-V2C.4 — Métadonnées de réponse (citation).
 * Direct/Task : payloadJson.replyTo
 * Project (pas de payloadJson) : marqueur dans le content
 */

export type MessageReplyMeta = {
  id: string;
  senderName: string;
  excerpt: string;
};

const REPLY_OPEN = "«bw-reply»";
const REPLY_CLOSE = "«/bw-reply»";

const EXCERPT_MAX = 120;

export function makeReplyExcerpt(text: string, max = EXCERPT_MAX): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "Pièce jointe";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function getReplyFromPayload(payload: unknown): MessageReplyMeta | null {
  if (!payload || typeof payload !== "object") return null;
  const r = (payload as { replyTo?: unknown }).replyTo;
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  return {
    id: o.id,
    senderName: typeof o.senderName === "string" ? o.senderName : "Message",
    excerpt: typeof o.excerpt === "string" ? o.excerpt : "",
  };
}

export function mergeReplyIntoPayload(
  existing: unknown,
  reply: MessageReplyMeta,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  return {
    ...base,
    replyTo: {
      id: reply.id,
      senderName: reply.senderName,
      excerpt: makeReplyExcerpt(reply.excerpt),
    },
  };
}

export function encodeReplyIntoContent(body: string, reply: MessageReplyMeta): string {
  const meta: MessageReplyMeta = {
    id: reply.id,
    senderName: reply.senderName,
    excerpt: makeReplyExcerpt(reply.excerpt),
  };
  return `${REPLY_OPEN}${JSON.stringify(meta)}${REPLY_CLOSE}\n${body}`;
}

export function parseContentWithReply(content: string): {
  reply: MessageReplyMeta | null;
  body: string;
} {
  if (!content.startsWith(REPLY_OPEN)) {
    return { reply: null, body: content };
  }
  const end = content.indexOf(REPLY_CLOSE);
  if (end < 0) return { reply: null, body: content };
  const raw = content.slice(REPLY_OPEN.length, end);
  try {
    const parsed = JSON.parse(raw) as MessageReplyMeta;
    if (typeof parsed?.id !== "string") return { reply: null, body: content };
    const body = content.slice(end + REPLY_CLOSE.length).replace(/^\n/, "");
    return {
      reply: {
        id: parsed.id,
        senderName: parsed.senderName || "Message",
        excerpt: parsed.excerpt || "",
      },
      body,
    };
  } catch {
    return { reply: null, body: content };
  }
}

/** Citation courte pour affichage (2 lignes max). */
export function shortQuoteLines(excerpt: string, maxChars = 90): string {
  const t = excerpt.replace(/\s+/g, " ").trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars - 1)}…`;
}
