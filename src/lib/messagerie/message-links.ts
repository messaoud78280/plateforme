/** Badges discrets « inbox zero métier » liés à un message source. */

export type MessageLinkBadge = {
  badge: string;
  href?: string | null;
  type?: string;
};

export function badgeFromMeta(meta: unknown, type?: string | null): string {
  const m = (meta ?? {}) as { badge?: string };
  if (m.badge) return m.badge;
  if (type === "REMINDER") return "Rappel";
  if (type === "ASSIGN") return "Assigné";
  if (type === "LINK") return "Traité";
  return "Traité";
}

export function badgeIcon(badge: string): string {
  const b = badge.toLowerCase();
  if (b.includes("livraison")) return "📦";
  if (b.includes("agenda") || b.includes("intervention")) return "📅";
  if (b.includes("commande")) return "🛒";
  if (b.includes("avenant")) return "📝";
  if (b.includes("tâche") || b.includes("tache")) return "✓";
  if (b.includes("rappel")) return "⏰";
  if (b.includes("factur")) return "💶";
  if (b.includes("fiche")) return "📋";
  return "✓";
}
