/**
 * Garde-fous devis de démonstration (issus du Métré).
 * Protections serveur — indépendantes de l'UI.
 */
import { DEMO_WATERMARK } from "@/lib/preparation/types";

export const DEMO_QUOTE_PREFIX = "DEMO";

/** Statuts interdits pour un devis de démonstration (envoi client / acceptation). */
export const DEMO_BLOCKED_QUOTE_STATUSES = new Set([
  "SENT",
  "VIEWED",
  "ACCEPTED",
]);

export function ensureDemoWatermark(text: string | null | undefined): string {
  const base = (text ?? "").trim();
  if (base.includes(DEMO_WATERMARK)) return base || DEMO_WATERMARK;
  return base ? `${DEMO_WATERMARK}\n\n${base}` : DEMO_WATERMARK;
}

export function assertDemoQuoteAllowsStatus(
  isDemonstration: boolean,
  toStatus: string,
): void {
  if (!isDemonstration) return;
  if (DEMO_BLOCKED_QUOTE_STATUSES.has(toStatus)) {
    throw new Error(
      `Devis de démonstration : le statut « ${toStatus} » est interdit. ${DEMO_WATERMARK}`,
    );
  }
}

export function assertDemoQuoteNotBillable(isDemonstration: boolean, action = "facturation"): void {
  if (!isDemonstration) return;
  throw new Error(
    `Devis de démonstration : ${action} interdite. ${DEMO_WATERMARK}`,
  );
}

export function assertDemoQuoteNotSendable(isDemonstration: boolean): void {
  if (!isDemonstration) return;
  throw new Error(
    `Devis de démonstration : envoi à un client réel interdit. ${DEMO_WATERMARK}`,
  );
}
