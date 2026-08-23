/**
 * URL canonique du site (SEO, Open Graph, JSON-LD, sitemap).
 * Définir NEXT_PUBLIC_SITE_URL en prod : https://www.bework.fr (sans slash final).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.bework.fr").replace(/\/$/, "");

/** Alias de SITE_URL (compat SEO / anciens extraits) — préférer SITE_URL ou absoluteUrl() dans le nouveau code */
export const BASE_URL = SITE_URL;

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

/**
 * Prise de rendez-vous — appel découverte (Calendly). Surchargable via NEXT_PUBLIC_CALENDLY_BOOKING_URL.
 * @see https://calendly.com/bework-btp/appel-decouverte
 */
export const CALENDLY_APPEL_DECOUVERTE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CALENDLY_BOOKING_URL?.trim()) ||
  "https://calendly.com/bework-btp/appel-decouverte";

/**
 * Origine unique pour emails + magic link (évite mélange localhost / 127.0.0.1).
 * Ordre : NEXTAUTH_URL → NEXT_PUBLIC_SITE_URL → origine de la requête d’inscription.
 */
function isUsableRequestOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    // Railway / Docker : next start --hostname 0.0.0.0 → request.url.origin illisible côté navigateur
    return host !== "0.0.0.0" && host !== "[::]" && host !== "::";
  } catch {
    return false;
  }
}

function isLocalHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "[::1]" ||
    h === "::1" ||
    h.endsWith(".local")
  );
}

function tryParseOrigin(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const u = raw.trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(u)) return null;
  try {
    const origin = new URL(u).origin;
    return isUsableRequestOrigin(origin) ? origin : null;
  } catch {
    return null;
  }
}

export function canonicalRequestOrigin(preferredFromRequest?: string): string {
  return (
    tryParseOrigin(process.env.NEXTAUTH_URL) ??
    tryParseOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    tryParseOrigin(preferredFromRequest) ??
    tryParseOrigin(SITE_URL) ??
    "http://127.0.0.1:3000"
  );
}

/**
 * Origine pour liens dans les emails (validation, reset, magic link).
 * Ne renvoie jamais localhost / 127.0.0.1 — sinon le destinataire obtient ERR_CONNECTION_REFUSED.
 * Ordre : SITE_URL public → NEXTAUTH_URL non-local → NEXT_PUBLIC_SITE_URL → fallback bework.fr.
 */
export function publicAppOriginForEmails(preferredFromRequest?: string): string {
  const candidates = [
    tryParseOrigin(process.env.NEXT_PUBLIC_SITE_URL),
    tryParseOrigin(SITE_URL),
    tryParseOrigin(process.env.NEXTAUTH_URL),
    tryParseOrigin(preferredFromRequest),
  ];
  for (const origin of candidates) {
    if (!origin) continue;
    try {
      if (!isLocalHostname(new URL(origin).hostname)) return origin;
    } catch {
      /* ignore */
    }
  }
  return "https://www.bework.fr";
}

/**
 * Profils par défaut pour JSON-LD Organization.sameAs, si NEXT_PUBLIC_ORG_SAME_AS
 * n’est pas défini en prod. À remplacer/compléter dès qu’une page LinkedIn dédiée
 * « BeWork » (entreprise) existe — en attendant, profil de la fondatrice qui se
 * présente publiquement comme dirigeante BeWork.
 */
const DEFAULT_ORG_SAME_AS = ["https://www.linkedin.com/in/laure-olivie"] as const;

/**
 * URLs pour JSON-LD Organization.sameAs (LinkedIn, profil Google Business, annuaires…).
 * Définir NEXT_PUBLIC_ORG_SAME_AS en prod pour surcharger, URLs séparées par des virgules
 * ou des retours à la ligne. Ex. NEXT_PUBLIC_ORG_SAME_AS=https://www.linkedin.com/company/votre-page,https://...
 */
export function getOrgSameAs(): string[] {
  const raw = process.env.NEXT_PUBLIC_ORG_SAME_AS?.trim();
  if (!raw) return [...DEFAULT_ORG_SAME_AS];
  const fromEnv = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http"));
  return fromEnv.length ? fromEnv : [...DEFAULT_ORG_SAME_AS];
}
