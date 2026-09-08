/**
 * Normalisation FR → valeurs machine (unités, nombres, emails).
 */
import { parseFrenchNumber } from "@/lib/commercial/import/french-number";

export function stripCodeFences(raw: string): string {
  let t = raw.trim();
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fenced?.[1]) t = fenced[1].trim();
  // Si le JSON est noyé dans du texte, extraire le premier objet {…}
  if (!t.startsWith("{")) {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) t = t.slice(start, end + 1);
  }
  return t;
}

export function normalizeUnit(raw: unknown): string {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
  if (!s) return "U";
  if (/^(m2|m²|m\s*2|metre[s]?\s*carre[s]?|mètres?\s*carrés?)$/.test(s)) return "M²";
  if (/^(m3|m³|m\s*3)$/.test(s)) return "M³";
  if (/^(ml|m\s*l|metre[s]?\s*lineaire[s]?|mètres?\s*linéaires?|metre lineaire)$/.test(s)) {
    return "ML";
  }
  if (/^(u|unite|unité|unités|unit)$/.test(s)) return "U";
  if (/^(forfait|forf|ft|ens|ensemble)$/.test(s)) return "Forfait";
  if (/^(h|heure|heures)$/.test(s)) return "H";
  if (/^(j|jour|jours)$/.test(s)) return "J";
  if (/^(t|tonne|tonnes)$/.test(s)) return "T";
  return String(raw).trim() || "U";
}

/** Accepte "12,50 €", "12.50", "40 m²" → nombre. */
export function normalizeMoneyOrQty(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (raw == null) return null;
  const s = String(raw)
    .replace(/€/g, "")
    .replace(/m[²2]|m[³3]|ml|u|forfait|forf\.?/gi, "")
    .trim();
  return parseFrenchNumber(s);
}

export function normalizePhone(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  return s.replace(/\s+/g, " ");
}

export function normalizeEmail(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s;
}

export function asString(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.length ? s : null;
}

export function asBool(raw: unknown, fallback = false): boolean {
  if (typeof raw === "boolean") return raw;
  if (raw === "true" || raw === 1 || raw === "1") return true;
  if (raw === "false" || raw === 0 || raw === "0") return false;
  return fallback;
}
