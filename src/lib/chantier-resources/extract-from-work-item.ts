import type { SiteResourceExtractedFrom } from "@prisma/client";
import { suggestTaxonomyFromText } from "@/lib/chantier-resources/taxonomy";
import { normalizeResourceLabel } from "@/lib/chantier-resources/normalize-label";
import {
  inferMaterialOnlyFromStoredWorkItem,
  isMaterialOnlyWorkItemPaste,
} from "@/lib/be-work-devis-work-item-description";

export type ExtractedResourceCandidate = {
  label: string;
  normalizedLabel: string;
  sourceField: SiteResourceExtractedFrom;
  sourceSnippet: string;
  suggestedShortName: string;
  suggestedUnit: string;
  taxonomy: ReturnType<typeof suggestTaxonomyFromText>;
};

const BULLET_SPLIT = /[\n\r]+|(?:\s*[-•·]\s+)|(?:\s*;\s+)/;

function cleanCandidateLine(line: string): string | null {
  const t = line
    .replace(/^[-•·\d.)]+\s*/, "")
    .replace(/^(fourniture|approvisionnement)\s+(de|d[''])\s+/i, "")
    .trim();
  if (t.length < 3 || t.length > 200) return null;
  if (/^(comprenant|hors|selon|conforme|voir)\b/i.test(t)) return null;
  return t;
}

function splitIncludedItems(text: string): string[] {
  return text
    .split(BULLET_SPLIT)
    .map((s) => cleanCandidateLine(s))
    .filter((s): s is string => Boolean(s));
}

function shortNameFromLabel(label: string): string {
  const n = label.trim();
  if (n.length <= 48) return n;
  return `${n.slice(0, 45).trim()}…`;
}

export function extractCandidatesFromWorkItem(item: {
  id: string;
  title: string;
  unit: string;
  includedItems?: string | null;
  fullDescription?: string | null;
  shortDescription?: string | null;
}): ExtractedResourceCandidate[] {
  const out: ExtractedResourceCandidate[] = [];
  const seen = new Set<string>();

  const push = (label: string, field: SiteResourceExtractedFrom, snippet: string) => {
    const normalizedLabel = normalizeResourceLabel(label);
    if (!normalizedLabel || seen.has(`${field}:${normalizedLabel}`)) return;
    seen.add(`${field}:${normalizedLabel}`);
    const taxonomy = suggestTaxonomyFromText(label);
    out.push({
      label: label.trim(),
      normalizedLabel,
      sourceField: field,
      sourceSnippet: snippet.slice(0, 500),
      suggestedShortName: shortNameFromLabel(label),
      suggestedUnit: item.unit?.trim() || "u",
      taxonomy,
    });
  };

  const materialOnly = inferMaterialOnlyFromStoredWorkItem(item);

  if (materialOnly) {
    push(item.title, "title", item.title);
  }

  if (item.includedItems?.trim()) {
    for (const line of splitIncludedItems(item.includedItems)) {
      push(line, "includedItems", line);
    }
  }

  if (out.length === 0 && item.shortDescription?.trim()) {
    const lines = splitIncludedItems(item.shortDescription);
    for (const line of lines.slice(0, 8)) {
      push(line, "fullDescription", line);
    }
  }

  return out;
}

export function extractCandidatesFromPasteObject(
  obj: Record<string, unknown>,
  unitFallback: string,
): ExtractedResourceCandidate[] {
  const title = String(obj.title ?? obj.name ?? "").trim();
  const included = String(obj.includedItems ?? obj.compris ?? "").trim();
  const fakeItem = {
    id: "paste",
    title: title || "Ressource",
    unit: String(obj.unit ?? unitFallback),
    includedItems: included || null,
    shortDescription: String(obj.shortDescription ?? "").trim() || null,
  };
  if (isMaterialOnlyWorkItemPaste(obj) && title) {
    return extractCandidatesFromWorkItem(fakeItem);
  }
  return extractCandidatesFromWorkItem(fakeItem);
}
