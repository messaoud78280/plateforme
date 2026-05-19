/** Identifiants éphémères utilisés en mémoire pendant un lot de regroupement (pas en base). */

export function isEphemeralResourceId(id: string | null | undefined): boolean {
  if (!id) return true;
  return id.startsWith("draft-") || id.startsWith("virtual-");
}

export function isPersistedResourceId(id: string | null | undefined): boolean {
  return Boolean(id) && !isEphemeralResourceId(id);
}
