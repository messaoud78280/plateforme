import { chatCompletion, isSkillsLlmConfigured } from "@/lib/skills/llm-chat";

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

export async function extractDceLinesWithAi(
  extractedText: string,
  targetDocType: "dpgf" | "bpu",
): Promise<DceExtractedLine[]> {
  if (!isSkillsLlmConfigured()) {
    return parseTabularDceLines(extractedText);
  }

  const system = `Tu es un conducteur de travaux BTP. Extrais les lignes d'un document ${targetDocType.toUpperCase()} issu d'un DCE.
Réponds UNIQUEMENT avec un JSON valide : { "lines": [ { "numero": "1.1", "lot": "GO", "designation": "...", "unite": "m²", "quantite": 12.5, "prixUnitaireHt": null } ] }
Ne invente pas de prix si absents du texte. Maximum 400 lignes.`;

  const content = await chatCompletion([
    { role: "system", content: system },
    {
      role: "user",
      content: `Texte extrait du DCE (tronqué si besoin):\n\n${extractedText.slice(0, 120_000)}`,
    },
  ]);

  const jsonMatch = /\{[\s\S]*\}/.exec(content);
  if (!jsonMatch) return parseTabularDceLines(extractedText);

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { lines?: DceExtractedLine[] };
    if (!Array.isArray(parsed.lines)) return parseTabularDceLines(extractedText);
    return parsed.lines
      .filter((l) => l?.designation?.trim())
      .map((l) => ({
        numero: l.numero?.trim(),
        lot: l.lot?.trim(),
        designation: l.designation.trim(),
        unite: l.unite?.trim(),
        quantite: typeof l.quantite === "number" ? l.quantite : undefined,
        prixUnitaireHt: typeof l.prixUnitaireHt === "number" ? l.prixUnitaireHt : undefined,
      }))
      .slice(0, 400);
  } catch {
    return parseTabularDceLines(extractedText);
  }
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
