/**
 * Normalisation FR → valeurs machine (unités, nombres, emails).
 */
import { parseFrenchNumber } from "@/lib/commercial/import/french-number";

export function stripCodeFences(raw: string): string {
  let t = raw.trim();
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fenced?.[1]) t = fenced[1].trim();
  // Bloc markdown au milieu d’une réponse ChatGPT
  if (!t.startsWith("{")) {
    const midFence = t.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (midFence?.[1]) return midFence[1].trim();
  }
  // Si le JSON est noyé dans du texte, extraire le premier objet {…} équilibré
  if (!t.startsWith("{")) {
    const extracted = extractBalancedJsonObject(t, 0);
    if (extracted) return extracted;
  }
  return t;
}

/** Extrait un objet JSON `{…}` en respectant les guillemets / échappements. */
export function extractBalancedJsonObject(
  text: string,
  fromIndex = 0,
): string | null {
  const start = text.indexOf("{", fromIndex);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i]!;
    if (inString) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Cherche le JSON bework_quote_bundle_v1 dans un collage ChatGPT
 * (prompt + schéma + réponse, ou fence markdown).
 */
export function extractBeworkQuoteBundleText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  const marker = '"bework_quote_bundle_v1"';
  const candidates: string[] = [];

  // 1) fences ```json … ```
  const fenceRe = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/gi;
  let fm: RegExpExecArray | null;
  while ((fm = fenceRe.exec(trimmed))) {
    if (fm[1]) candidates.push(fm[1].trim());
  }

  // 2) chaque objet contenant le format devis
  let searchFrom = 0;
  while (true) {
    const idx = trimmed.indexOf(marker, searchFrom);
    if (idx < 0) break;
    const braceStart = trimmed.lastIndexOf("{", idx);
    if (braceStart >= 0) {
      const obj = extractBalancedJsonObject(trimmed, braceStart);
      if (obj) candidates.push(obj);
    }
    searchFrom = idx + marker.length;
  }

  // Préférer un objet avec vraies lignes (designation non vide + prix)
  const scored = candidates
    .map((c) => {
      try {
        const j = JSON.parse(c) as Record<string, unknown>;
        if (j.format !== "bework_quote_bundle_v1" && j.format !== undefined) {
          return { c, score: -1 };
        }
        const sections = Array.isArray(j.sections) ? j.sections : [];
        let lines = 0;
        let priced = 0;
        for (const s of sections) {
          if (!s || typeof s !== "object") continue;
          const items = (s as { items?: unknown[] }).items;
          if (!Array.isArray(items)) continue;
          for (const it of items) {
            if (!it || typeof it !== "object") continue;
            const o = it as Record<string, unknown>;
            const des = String(o.designation ?? "").trim();
            if (des) lines += 1;
            const price = o.unit_price_ht ?? o.unitPriceHt ?? o.prix_unitaire_ht;
            if (des && price != null && String(price).trim() !== "" && Number(price) !== 0) {
              priced += 1;
            }
          }
        }
        // Schéma vide du prompt (designation "") → score bas
        return { c, score: lines * 10 + priced * 5 + (j.format ? 1 : 0) };
      } catch {
        return { c, score: -1 };
      }
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (scored[0] && scored[0].score > 0) return scored[0].c;
  if (scored[0]) return scored[0].c;

  return stripCodeFences(trimmed);
}

/** Détecte un collage de compte rendu de visite au lieu d’un devis. */
export function detectMistakenSiteSurveyPaste(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/bework_site_survey_v1/.test(t)) {
    return (
      "Vous avez collé le compte rendu de visite (bework_site_survey_v1), pas le devis. " +
      "Collez la réponse de ChatGPT au format bework_quote_bundle_v1 " +
      "(avec client, sections et lignes chiffrées)."
    );
  }
  if (
    /"no_invented_measures"\s*:\s*true/.test(t) &&
    /"distinguish_sources"/.test(t) &&
    !/bework_quote_bundle_v1/.test(t)
  ) {
    return (
      "Ce JSON est un extrait de relevé chantier, pas un devis. " +
      "Dans ChatGPT, demandez : « Génère uniquement le JSON bework_quote_bundle_v1 » " +
      "puis collez cette réponse ici."
    );
  }
  if (
    /Analyse ce compte rendu de visite|DONNÉES DE VISITE \(bework_site_survey_v1\)/i.test(
      t,
    ) &&
    !/"unit_price_ht"\s*:\s*[1-9]/.test(t) &&
    !/"unit_price_ht"\s*:\s*"[1-9]/.test(t)
  ) {
    return (
      "Vous avez collé le prompt BeWork destiné à ChatGPT. " +
      "Collez la réponse de ChatGPT : le JSON devis bework_quote_bundle_v1."
    );
  }
  return null;
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
