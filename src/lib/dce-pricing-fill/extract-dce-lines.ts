export type DceExtractedLine = {
  numero?: string;
  lot?: string;
  designation: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  commentaire?: string;
};

export type DceLineMatch = {
  lineIndex: number;
  workItemId: string | null;
  workItemCode: string | null;
  codeBework: string | null;
  score: number;
  reason: string;
};

/** Parse heuristique de lignes tabulées (export Excel / collage DPGF). */
export function parseTabularDceLines(text: string): DceExtractedLine[] {
  const lines: DceExtractedLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const row = raw.trim();
    if (!row || row.length < 4) continue;
    if (/^(total|sous.?total|montant|ht\b|ttc\b)/i.test(row)) continue;

    const parts = row.split(/\t|;/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const designation = parts.find((p) => p.length > 8 && !/^\d+([.,]\d+)?$/.test(p)) ?? parts[1] ?? parts[0];
      const numero = /^\d+([.]\d+)*$/.test(parts[0] ?? "") ? parts[0] : undefined;
      const unite = parts.find((p) => /^(u|ml|m²|m2|m³|ens|ft|kg|h)$/i.test(p));
      lines.push({
        numero,
        designation: designation ?? row,
        unite,
      });
      continue;
    }

    const m = /^(\d+(?:\.\d+)*)\s+(.+)$/.exec(row);
    if (m) {
      lines.push({ numero: m[1], designation: m[2]!.trim() });
    } else if (row.length >= 12) {
      lines.push({ designation: row });
    }
  }
  return lines.slice(0, 800);
}

/** Extraction des lignes DPGF/BPU sans LLM (tableau, numérotation, texte structuré). */
export function extractDceLines(
  extractedText: string,
  _targetDocType: "dpgf" | "bpu",
): DceExtractedLine[] {
  return parseTabularDceLines(extractedText);
}

export function matchDceLinesToCatalog(
  lines: DceExtractedLine[],
  catalogItems: Array<{
    id: string;
    code: string;
    codeBework: string | null;
    title: string;
    normalizedDesignation: string | null;
  }>,
): DceLineMatch[] {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  return lines.map((line, lineIndex) => {
    const hay = norm(line.designation);
    let best: (typeof catalogItems)[0] | null = null;
    let bestScore = 0;

    for (const item of catalogItems) {
      const t = norm(item.normalizedDesignation ?? item.title);
      if (!t || t.length < 6) continue;
      if (hay === t) {
        best = item;
        bestScore = 100;
        break;
      }
      if (hay.includes(t) || t.includes(hay)) {
        const score = Math.min(hay.length, t.length) / Math.max(hay.length, t.length, 1);
        if (score > bestScore) {
          bestScore = score;
          best = item;
        }
      }
    }

    if (!best || bestScore < 0.55) {
      return {
        lineIndex,
        workItemId: null,
        workItemCode: null,
        codeBework: null,
        score: 0,
        reason: "Aucun ouvrage catalogue suffisamment proche — à créer ou lier manuellement.",
      };
    }

    return {
      lineIndex,
      workItemId: best.id,
      workItemCode: best.code,
      codeBework: best.codeBework,
      score: Math.round(bestScore * 100),
      reason: bestScore >= 0.95 ? "Correspondance forte" : "Correspondance partielle — à vérifier",
    };
  });
}
