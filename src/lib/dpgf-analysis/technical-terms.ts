export type TechnicalTermLine = {
  term: string;
  definition: string;
};

function formatSingleTechnicalTermEntry(x: unknown): string {
  if (typeof x === "string") return x.trim();
  if (!x || typeof x !== "object") return "";

  const o = x as Record<string, unknown>;
  const term = String(o.terme ?? o.term ?? o.acronyme ?? o.mot ?? o.sigle ?? o.label ?? "").trim();
  const definition = String(
    o.definition ?? o.explication ?? o.signification ?? o.description ?? o.valeur ?? "",
  ).trim();

  if (term && definition) return `${term} : ${definition}`;
  if (term) return term;
  return "";
}

/** Normalise tout format JSON de mots techniques en texte multi-lignes « Terme : définition ». */
export function formatTechnicalTermsFromJson(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);

  if (Array.isArray(v)) {
    return v.map(formatSingleTechnicalTermEntry).filter(Boolean).join("\n");
  }

  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    const asSingle = formatSingleTechnicalTermEntry(o);
    if (asSingle && (o.terme || o.term || o.acronyme || o.mot || o.sigle)) return asSingle;

    return Object.entries(o)
      .map(([key, val]) => {
        if (val == null) return "";
        if (typeof val === "string") {
          const k = key.trim();
          const d = val.trim();
          return k && d ? `${k} : ${d}` : k || d;
        }
        const nested = formatSingleTechnicalTermEntry(val);
        if (nested) return nested;
        return key.trim();
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

/**
 * Résout les mots techniques depuis les champs JSON pédagogiques (ordre de priorité métier).
 */
export function resolveTechnicalTermsFromJson(
  fiche: Record<string, unknown>,
  comprehension: Record<string, unknown>,
  analyse: Record<string, unknown>,
): string {
  const candidates = [
    comprehension.mots_techniques_a_expliquer,
    comprehension.mots_techniques,
    analyse.mots_compliques_et_acronymes,
    analyse.termes_cles,
    fiche.mots_techniques_a_expliquer,
    fiche.mots_compliques_et_acronymes,
  ];

  for (const c of candidates) {
    const formatted = formatTechnicalTermsFromJson(c);
    if (formatted) return formatted;
  }
  return "";
}

/** Parse le texte stocké en lignes structurées pour l'affichage. */
export function parseTechnicalTermsDisplay(raw: string | null | undefined): TechnicalTermLine[] {
  if (!raw?.trim()) return [];

  return raw
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      const colonIdx = trimmed.search(/\s*:\s+/);
      if (colonIdx > 0) {
        return {
          term: trimmed.slice(0, colonIdx).trim(),
          definition: trimmed.slice(colonIdx).replace(/^\s*:\s*/, "").trim(),
        };
      }

      return { term: trimmed, definition: "" };
    })
    .filter((x): x is TechnicalTermLine => x != null && Boolean(x.term));
}

export function hasTechnicalTermsContent(raw: string | null | undefined): boolean {
  return parseTechnicalTermsDisplay(raw).length > 0;
}
