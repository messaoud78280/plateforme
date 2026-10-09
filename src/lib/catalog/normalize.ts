/**
 * Normalisation Catalogue Matériaux — anti-doublons sans invention.
 */

export function normalizeDesignation(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeManufacturer(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  return normalizeDesignation(t);
}

export function normalizeManufacturerRef(
  raw: string | null | undefined,
): string | null {
  const t = (raw ?? "").trim().toLowerCase().replace(/\s+/g, "");
  return t || null;
}

export function normalizeGtin(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim().replace(/\s+/g, "");
  if (!t) return null;
  if (!/^\d{8,14}$/.test(t)) return null;
  return t;
}

/** URL canonique (indice anti-doublon, pas identité seule). */
export function canonicalizeCatalogUrl(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    u.pathname = u.pathname.replace(/\/+$/, "") || "";
    for (const k of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "fbclid",
      "gclid",
    ]) {
      u.searchParams.delete(k);
    }
    return u.toString().toLowerCase();
  } catch {
    return null;
  }
}
