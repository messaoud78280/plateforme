/**
 * Aperçus liste / toast pour médias messagerie (sans charger le fichier).
 */

export type MsgAttachment = {
  name: string;
  /** Référence opaque `storage://bucket/path` ou URL legacy. */
  fileUrl: string;
  fileSize: number;
  mimeType?: string;
  durationSec?: number;
  kind?: "image" | "audio" | "file";
  bucket?: string;
  storagePath?: string;
};

export function isAudioAttachment(a: MsgAttachment): boolean {
  if (a.kind === "audio") return true;
  const m = (a.mimeType || "").toLowerCase();
  return m.startsWith("audio/") || /\.(webm|ogg|mp3|m4a|aac|wav)$/i.test(a.name);
}

export function isImageAttachment(a: MsgAttachment): boolean {
  if (a.kind === "image") return true;
  const m = (a.mimeType || "").toLowerCase();
  return m.startsWith("image/") || /\.(jpe?g|png|gif|webp)$/i.test(a.name);
}

export function formatMediaPreview(
  content: string,
  attachments?: MsgAttachment[] | null,
): string {
  const atts = Array.isArray(attachments) ? attachments : [];
  if (atts.length === 0) return content.slice(0, 80);

  const audios = atts.filter(isAudioAttachment);
  const images = atts.filter(isImageAttachment);
  if (audios.length > 0 && images.length === 0 && !content.trim()) {
    const d = audios[0]?.durationSec;
    return d && d > 0 ? `🎤 Message vocal (${formatDuration(d)})` : "🎤 Message vocal";
  }
  if (images.length > 0 && audios.length === 0 && !content.trim()) {
    return images.length > 1 ? `📷 ${images.length} photos` : "📷 Photo";
  }
  if (atts.length > 0 && !content.trim()) {
    return atts.length > 1 ? `📎 ${atts.length} fichiers` : `📎 ${atts[0]!.name}`;
  }
  return content.slice(0, 80);
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
