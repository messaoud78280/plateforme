/** Seuil « Voir plus » — ~10 lignes × ~48 car. */
export const LONG_MESSAGE_CHAR_THRESHOLD = 480;
export const LONG_MESSAGE_LINE_THRESHOLD = 10;

export function isLongMessageBody(text: string): boolean {
  if (!text) return false;
  const lines = text.split("\n").length;
  return text.length > LONG_MESSAGE_CHAR_THRESHOLD || lines > LONG_MESSAGE_LINE_THRESHOLD;
}
