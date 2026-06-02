import {
  BEWORK_CODIFICATION_FAMILIES,
  BEWORK_LOT_LEXICON,
  BEWORK_OUVRAGE_TYPES,
  getFamilleLabel,
  getLotLabel,
} from "@/lib/bework-work-item-codification/lexicon";
import {
  artiprixChapterFromCode,
  inferImportSource,
  normalizeCodificationHaystack,
} from "@/lib/bework-work-item-codification/normalize";
import { normalizeBeWorkMatchString, suggestFamilyCodeFromWorkItem } from "@/lib/bework-devis-family-codes";
import type { WorkItemCodificationMappingMatchType } from "@prisma/client";

export type CodificationMappingRule = {
  sourcePattern: string;
  matchType: WorkItemCodificationMappingMatchType;
  lotCode: string;
  familleCode: string;
  ouvrageCode: string;
  sousFamilleCode: string | null;
  sousFamilleNom: string | null;
  priority: number;
};

export type CodificationClassification = {
  lotCode: string;
  lotLabel: string;
  familleCode: string;
  familleNom: string;
  ouvrageCode: string;
  sousFamilleCode: string | null;
  sousFamilleNom: string | null;
  importSource: string | null;
  confidence: "haute" | "moyenne" | "faible";
  matchReason: string;
  needsReview: boolean;
};

function bestMatchFromLexicon<T extends { code: string; matchTerms: string[] }>(
  hay: string,
  lexicon: T[],
): { code: string; term: string; len: number } | null {
  let best: { code: string; term: string; len: number } | null = null;
  for (const entry of lexicon) {
    for (const term of entry.matchTerms) {
      const t = normalizeBeWorkMatchString(term);
      if (!t || t.length < 3) continue;
      if (!hay.includes(t)) continue;
      if (!best || t.length > best.len) best = { code: entry.code, term, len: t.length };
    }
  }
  return best;
}

function matchMappingRule(
  code: string,
  sourceCode: string | null,
  rules: CodificationMappingRule[],
): CodificationMappingRule | null {
  const candidates = [sourceCode?.trim(), code.trim()].filter(Boolean) as string[];
  const sorted = [...rules].filter((r) => r).sort((a, b) => b.priority - a.priority);

  for (const raw of candidates) {
    const upper = raw.toUpperCase();
    for (const rule of sorted) {
      const pat = rule.sourcePattern.trim();
      switch (rule.matchType) {
        case "exact":
          if (raw === pat || upper === pat.toUpperCase()) return rule;
          break;
        case "prefix":
          if (upper.startsWith(pat.toUpperCase())) return rule;
          break;
        case "regex": {
          try {
            if (new RegExp(pat, "i").test(raw)) return rule;
          } catch {
            /* ignore invalid regex */
          }
          break;
        }
        case "artiprix_chapter": {
          const ch = artiprixChapterFromCode(raw);
          if (ch === pat || raw.startsWith(`${pat}.`)) return rule;
          break;
        }
        default:
          break;
      }
    }
  }
  return null;
}

export function classifyWorkItemForCodification(
  input: {
    code: string;
    sourceCode: string | null;
    lot: string;
    family: string | null;
    familyCode: string | null;
    title: string;
    fullDescription?: string | null;
    itemType?: string | null;
  },
  mappingRules: CodificationMappingRule[] = [],
): CodificationClassification {
  const hay = normalizeCodificationHaystack([
    input.title,
    input.family,
    input.lot,
    input.fullDescription?.slice(0, 320),
  ]);
  const importSource = inferImportSource(input.code, input.sourceCode);
  const mapped = matchMappingRule(input.code, input.sourceCode, mappingRules);

  if (mapped) {
    const ouv = BEWORK_OUVRAGE_TYPES.find((o) => o.code === mapped.ouvrageCode);
    return {
      lotCode: mapped.lotCode,
      lotLabel: getLotLabel(mapped.lotCode),
      familleCode: mapped.familleCode,
      familleNom: getFamilleLabel(mapped.familleCode),
      ouvrageCode: mapped.ouvrageCode,
      sousFamilleCode: mapped.sousFamilleCode ?? ouv?.sousFamilleCode ?? mapped.ouvrageCode,
      sousFamilleNom: mapped.sousFamilleNom ?? ouv?.sousFamilleNom ?? null,
      importSource,
      confidence: mapped.matchType === "exact" ? "haute" : "moyenne",
      matchReason: `Correspondance table : ${mapped.sourcePattern} (${mapped.matchType})`,
      needsReview: mapped.ouvrageCode === "GEN" || mapped.familleCode === "GEN",
    };
  }

  const lotMatch = bestMatchFromLexicon(hay, BEWORK_LOT_LEXICON);
  const famFromLex = bestMatchFromLexicon(hay, BEWORK_CODIFICATION_FAMILIES);
  const famFromDevis = suggestFamilyCodeFromWorkItem({
    lot: input.lot,
    family: input.family,
    title: input.title,
    fullDescription: input.fullDescription,
    itemType: input.itemType ?? "ouvrage_technique",
  });

  const familleCode = (famFromLex?.code ?? famFromDevis ?? "MAC").toUpperCase();
  const ouvMatch = bestMatchFromLexicon(hay, BEWORK_OUVRAGE_TYPES.filter((o) => o.code !== "GEN"));
  const ouvrageCode = ouvMatch?.code ?? "GEN";

  const ouvDef = BEWORK_OUVRAGE_TYPES.find((o) => o.code === ouvrageCode);
  let lotCode = lotMatch?.code ?? "GO";
  if (!lotMatch && /vrd|caniveau|bordure|regard|assainissement/i.test(hay)) lotCode = "VRD";
  if (!lotMatch && /cloison|plafond|peinture|carrelage|menuiserie/i.test(hay)) lotCode = "SO";

  const confidence: CodificationClassification["confidence"] =
    famFromLex && ouvMatch ? "moyenne" : famFromDevis && ouvMatch ? "moyenne" : "faible";

  const needsReview =
    ouvrageCode === "GEN" ||
    confidence === "faible" ||
    familleCode === "MAC" && !famFromLex;

  return {
    lotCode,
    lotLabel: getLotLabel(lotCode),
    familleCode,
    familleNom: getFamilleLabel(familleCode),
    ouvrageCode,
    sousFamilleCode: ouvDef?.sousFamilleCode ?? ouvrageCode,
    sousFamilleNom: ouvDef?.sousFamilleNom ?? ouvDef?.label ?? null,
    importSource,
    confidence,
    matchReason: [
      lotMatch ? `lot:${lotMatch.term}` : `lot défaut ${lotCode}`,
      famFromLex ? `famille:${famFromLex.term}` : famFromDevis ? `famille devis:${famFromDevis}` : "famille défaut MAC",
      ouvMatch ? `ouvrage:${ouvMatch.term}` : "ouvrage GEN",
    ].join(" · "),
    needsReview,
  };
}
