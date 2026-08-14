import type { NextRequest } from "next/server";

/** En-têtes pays (ordre de priorité) — Cloudflare en prod : cf-ipcountry. */
export const GEO_COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "x-country-code",
  "x-client-country",
] as const;

export function parseBlockedCountries(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(",").map((c) => c.trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)))];
}

export function detectCountryCode(request: NextRequest): string | null {
  for (const header of GEO_COUNTRY_HEADERS) {
    const value = request.headers.get(header)?.trim().toUpperCase();
    if (value && /^[A-Z]{2}$/.test(value)) return value;
  }
  return null;
}

/** Chemins jamais bloqués (SEO, assets, page d’info future). */
export function shouldSkipGeoBlock(pathname: string): boolean {
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/api/health" || pathname === "/api/health-db") return true;
  if (pathname.startsWith("/access-denied")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (/\.(ico|png|jpg|jpeg|gif|webp|svg|woff2?|txt|xml)$/i.test(pathname)) return true;
  return false;
}

export function isCountryBlocked(country: string | null, blocked: string[]): boolean {
  if (!blocked.length || !country) return false;
  return blocked.includes(country);
}
