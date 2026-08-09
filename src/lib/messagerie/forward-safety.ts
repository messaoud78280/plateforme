/**
 * MESSAGERIE-V2C.4 — Garde-fou transfert INTERNE → EXTERNE.
 * Ne jamais laisser fuiter silencieusement un contenu interne.
 */

export type ForwardScope = "INTERNAL" | "EXTERNAL";

export function scopeFromPartyExternal(external: boolean): ForwardScope {
  return external ? "EXTERNAL" : "INTERNAL";
}

export function scopeFromChannel(channel?: string | null): ForwardScope {
  if (!channel || channel === "INTERNE") return "INTERNAL";
  return "EXTERNAL";
}

export function scopeFromTaskInternal(isInternal: boolean): ForwardScope {
  return isInternal ? "INTERNAL" : "EXTERNAL";
}

export type ForwardSafetyResult =
  | { ok: true; needsConfirm: false }
  | {
      ok: true;
      needsConfirm: true;
      warning: string;
    }
  | { ok: false; error: string };

/**
 * Source INTERNE → destination EXTERNE : confirmation obligatoire.
 * Autres cas : OK sans confirm (ACL lecture/écriture vérifiées côté API).
 */
export function evaluateForwardSafety(
  sourceScope: ForwardScope,
  destScope: ForwardScope,
): ForwardSafetyResult {
  if (sourceScope === "INTERNAL" && destScope === "EXTERNAL") {
    return {
      ok: true,
      needsConfirm: true,
      warning:
        "Vous allez transférer un message interne à un destinataire externe.",
    };
  }
  return { ok: true, needsConfirm: false };
}

export function canForwardAttachments(params: {
  sourceScope: ForwardScope;
  destScope: ForwardScope;
  hasAttachments: boolean;
}): { include: boolean; reason?: string } {
  if (!params.hasAttachments) return { include: true };
  if (params.sourceScope === "INTERNAL" && params.destScope === "EXTERNAL") {
    return {
      include: false,
      reason:
        "Les pièces jointes internes ne sont pas transférées vers un destinataire externe.",
    };
  }
  return { include: true };
}
