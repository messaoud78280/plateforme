/**
 * NAVIGATION-RETOUR-V1 / V1.1 — Validation returnTo (anti open-redirect).
 * Autorise uniquement des chemins internes BeWork (/dashboard…).
 */

const DASHBOARD_PREFIX = "/dashboard";

/** Chemins racines : pas de bouton Retour (sidebar suffit). */
export const DASHBOARD_ROOT_PATHS = new Set([
  "/dashboard",
  "/dashboard/a-traiter",
  "/dashboard/messagerie",
  "/dashboard/projets",
  "/dashboard/planning",
  "/dashboard/agenda",
  "/dashboard/commandes",
  "/dashboard/taches",
  "/dashboard/documents",
  "/dashboard/pilotage-travaux",
]);

/**
 * Sanitize un returnTo provenant de query / session.
 * Interdit : URL externe, protocole, //, javascript:, chemins hors dashboard.
 */
export function sanitizeInternalReturnTo(
  raw: string | null | undefined,
  fallbackHref: string,
): string {
  const fallback = fallbackHref.trim().startsWith(DASHBOARD_PREFIX)
    ? fallbackHref.trim()
    : "/dashboard";
  if (raw == null) return fallback;

  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.includes("://") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\")
  ) {
    return fallback;
  }

  if (!trimmed.startsWith("/")) return fallback;

  try {
    const base = "https://bework.local";
    const resolved = new URL(trimmed, base);
    if (resolved.origin !== base) return fallback;
    if (!resolved.pathname.startsWith(DASHBOARD_PREFIX)) return fallback;
    if (resolved.pathname.includes("..")) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}

/** Alias produit V1.1. */
export const resolveSafeReturnTo = sanitizeInternalReturnTo;

export function isSafeDashboardHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed.startsWith(DASHBOARD_PREFIX)) return false;
  return (
    sanitizeInternalReturnTo(trimmed, "/dashboard") ===
    (() => {
      try {
        const u = new URL(trimmed, "https://bework.local");
        return `${u.pathname}${u.search}${u.hash}`;
      } catch {
        return "";
      }
    })()
  );
}

/**
 * Ajoute ?returnTo=… à un href interne (valeur sanitizée).
 * Strip le returnTo imbriqué pour éviter les boucles A↔B.
 */
export function withReturnTo(href: string, returnTo: string | null | undefined): string {
  const safeTarget = sanitizeInternalReturnTo(href, "/dashboard");
  if (!returnTo?.trim()) return safeTarget;
  const stripped = stripNestedReturnTo(returnTo);
  const safeReturn = sanitizeInternalReturnTo(stripped, safeTarget);
  // Ne pas réinjecter si la cible est déjà le même path (boucle)
  try {
    const t = new URL(safeTarget, "https://bework.local");
    const r = new URL(safeReturn, "https://bework.local");
    if (t.pathname === r.pathname && t.search === r.search) return safeTarget;
  } catch {
    /* ignore */
  }
  try {
    const u = new URL(safeTarget, "https://bework.local");
    u.searchParams.set("returnTo", safeReturn);
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return safeTarget;
  }
}

/** Alias produit NAVIGATION-V2. */
export const buildContextualHref = withReturnTo;

/** Retire returnTo imbriqué d’un chemin (un seul niveau parent). */
export function stripNestedReturnTo(href: string): string {
  try {
    const u = new URL(href.trim(), "https://bework.local");
    u.searchParams.delete("returnTo");
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return href;
  }
}

/** Deep-link Messagerie pour revenir à la conversation exacte. */
export function messagerieReturnTo(opts: {
  taskId?: string | null;
  withUserId?: string | null;
  projectId?: string | null;
  channelId?: string | null;
}): string {
  if (opts.taskId) {
    return `/dashboard/messagerie?task=${encodeURIComponent(opts.taskId)}`;
  }
  if (opts.withUserId) {
    return `/dashboard/messagerie?with=${encodeURIComponent(opts.withUserId)}`;
  }
  if (opts.projectId && opts.channelId) {
    const q = new URLSearchParams({
      view: "chantiers",
      project: opts.projectId,
      channelId: opts.channelId,
    });
    return `/dashboard/messagerie?${q.toString()}`;
  }
  if (opts.projectId) {
    return `/dashboard/messagerie?view=chantiers&project=${encodeURIComponent(opts.projectId)}`;
  }
  return "/dashboard/messagerie";
}

function messagerieHasConversationContext(href: string): boolean {
  try {
    const u = new URL(href, "https://bework.local");
    if (u.searchParams.get("channelId")) return true;
    if (u.searchParams.get("project")) return true;
    if (u.searchParams.get("task")) return true;
    if (u.searchParams.get("with")) return true;
    if (u.searchParams.get("view") === "chantiers") return true;
    return false;
  } catch {
    return false;
  }
}

/** Libellé français cohérent selon le chemin de retour. */
export function contextBackLabelForHref(
  href: string,
  fallbackLabel = "Retour",
): string {
  const path = href.split(/[?#]/)[0] ?? href;

  if (path === "/dashboard/messagerie" || path.startsWith("/dashboard/messagerie/")) {
    return messagerieHasConversationContext(href)
      ? "Retour à la conversation"
      : "Retour à la Messagerie";
  }
  if (path === "/dashboard/commandes") return "Retour aux commandes";
  if (path === "/dashboard/taches") return "Retour aux tâches";
  if (path === "/dashboard/projets") return "Retour aux chantiers";
  if (path === "/dashboard/agenda" || path === "/dashboard/planning") {
    return "Retour à l'Agenda";
  }
  if (path === "/dashboard/a-traiter" || path === "/dashboard/pilotage-travaux/a-traiter") {
    return "Retour à À traiter";
  }
  if (path === "/dashboard/documents") return "Retour aux documents";
  if (path === "/dashboard/fiches-suivi") return "Retour aux fiches de suivi";
  if (path === "/dashboard/fournisseurs") return "Retour aux fournisseurs";
  if (path === "/dashboard/clients") return "Retour aux clients";
  if (path === "/dashboard/equipe" || path === "/dashboard/agents") {
    return "Retour à l'équipe";
  }
  if (path.startsWith("/dashboard/parametres")) return "Retour aux paramètres";
  if (path.startsWith("/dashboard/projets/")) return "Retour au chantier";
  if (path.startsWith("/dashboard/commandes/")) return "Retour à la commande";
  if (path.startsWith("/dashboard/devis")) return "Retour aux devis";
  if (path.startsWith("/dashboard/pilotage-travaux")) return "Retour au pilotage";

  return fallbackLabel.startsWith("Retour") ? fallbackLabel : `Retour ${fallbackLabel}`;
}

/** Libellé court mobile. */
export function contextBackLabelShort(href: string): string {
  const full = contextBackLabelForHref(href);
  if (full === "Retour à la conversation") return "Conversation";
  if (full === "Retour à la Messagerie") return "Messagerie";
  if (full === "Retour aux chantiers") return "Chantiers";
  if (full === "Retour à À traiter") return "À traiter";
  if (full === "Retour à l'Agenda") return "Agenda";
  if (full === "Retour aux commandes") return "Commandes";
  if (full === "Retour au chantier") return "Chantier";
  return full.replace(/^Retour (à la |à l'|à |aux )?/i, "").replace(/^./, (c) => c.toUpperCase());
}

/**
 * Indique si l’historique navigateur peut être utilisé sans risque
 * (referrer même origine + chemin dashboard).
 */
export function canSafelyUseBrowserHistory(): boolean {
  if (typeof window === "undefined") return false;
  if (window.history.length <= 1) return false;
  const ref = document.referrer;
  if (!ref) return false;
  try {
    const u = new URL(ref);
    if (u.origin !== window.location.origin) return false;
    return u.pathname.startsWith(DASHBOARD_PREFIX);
  } catch {
    return false;
  }
}
