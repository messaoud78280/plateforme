import { classifyWorkItemForCodification, type CodificationMappingRule } from "@/lib/bework-work-item-codification/classify";
import {
  buildCodificationPrefix,
  generateCodeBework,
  maxVariantIndexForPrefix,
} from "@/lib/bework-work-item-codification/generate";
import {
  codificationGroupKey,
  isBeworkStructuredCode,
  isLegacyStructuredCode,
} from "@/lib/bework-work-item-codification/normalize";
import { normalizeWorkItemDesignation } from "@/lib/work-item-merge";
import type { WorkItemCodificationStatus } from "@prisma/client";

export type WorkItemCodificationInput = {
  id: string;
  code: string;
  codeBework: string | null;
  sourceCode: string | null;
  lot: string;
  family: string | null;
  familyCode: string | null;
  title: string;
  fullDescription: string;
  unit: string;
  itemType: string | null;
  codificationStatus: WorkItemCodificationStatus;
  normalizedDesignation: string | null;
  avgHt: number | null;
  priceSourceCount: number;
};

export type CodificationProposalRow = {
  id: string;
  codeSource: string;
  currentCode: string;
  currentCodeBework: string | null;
  proposedCodeBework: string;
  importSource: string | null;
  lotCode: string;
  familleCode: string;
  familleNom: string;
  sousFamilleCode: string | null;
  sousFamilleNom: string | null;
  ouvrageCode: string;
  designationNormalisee: string;
  designationSource: string;
  unite: string;
  proposedStatus: WorkItemCodificationStatus;
  confidence: "haute" | "moyenne" | "faible";
  matchReason: string;
  groupKey: string;
  variantIndex: number;
  avgHt: number | null;
  priceSourceCount: number;
};

export type CodificationBeforeAfterReport = {
  total: number;
  alreadyStructured: number;
  toProcess: number;
  proposedAuto: number;
  proposedReview: number;
  byLot: Record<string, number>;
  byFamille: Record<string, number>;
  sampleChanges: Array<{
    codeSource: string;
    before: string | null;
    after: string;
    designation: string;
    status: WorkItemCodificationStatus;
  }>;
};

function effectiveSourceCode(item: WorkItemCodificationInput): string {
  return (item.sourceCode?.trim() || item.code).trim();
}

/**
 * Propositions batch : regroupe les variantes similaires sous le même préfixe.
 */
export function buildWorkItemCodificationProposals(
  items: WorkItemCodificationInput[],
  existingCodeBework: Set<string>,
  mappingRules: CodificationMappingRule[] = [],
): CodificationProposalRow[] {
  const usedCodes = new Set(existingCodeBework);
  const prefixCounters = new Map<string, number>();

  for (const c of existingCodeBework) {
    const upper = c.toUpperCase();
    const parts = upper.split("-");
    if (parts.length >= 5) {
      const prefix = parts.slice(0, 4).join("-");
      const v = Number.parseInt(parts[4] ?? "0", 10);
      prefixCounters.set(prefix, Math.max(prefixCounters.get(prefix) ?? 0, v));
    }
  }

  const eligible = items.filter((i) => {
    if (i.codificationStatus === "valide" && i.codeBework && isBeworkStructuredCode(i.codeBework)) return false;
    if (isBeworkStructuredCode(i.codeBework)) return false;
    return isLegacyStructuredCode(i.code) || !i.codeBework;
  });

  const groups = new Map<string, WorkItemCodificationInput[]>();
  for (const item of eligible) {
    const cls = classifyWorkItemForCodification(
      {
        code: item.code,
        sourceCode: effectiveSourceCode(item),
        lot: item.lot,
        family: item.family,
        familyCode: item.familyCode,
        title: item.title,
        fullDescription: item.fullDescription,
        itemType: item.itemType,
      },
      mappingRules,
    );
    const norm =
      item.normalizedDesignation?.trim() ||
      normalizeWorkItemDesignation(item.title || item.fullDescription);
    const gk = codificationGroupKey(cls.lotCode, cls.familleCode, cls.ouvrageCode, norm);
    const list = groups.get(gk) ?? [];
    list.push(item);
    groups.set(gk, list);
  }

  const out: CodificationProposalRow[] = [];

  for (const [, groupItems] of groups) {
    const sorted = [...groupItems].sort((a, b) =>
      effectiveSourceCode(a).localeCompare(effectiveSourceCode(b), "fr", { sensitivity: "base" }),
    );

    const first = sorted[0]!;
    const cls = classifyWorkItemForCodification(
      {
        code: first.code,
        sourceCode: effectiveSourceCode(first),
        lot: first.lot,
        family: first.family,
        familyCode: first.familyCode,
        title: first.title,
        fullDescription: first.fullDescription,
        itemType: first.itemType,
      },
      mappingRules,
    );

    const prefix = buildCodificationPrefix(cls.lotCode, cls.familleCode, cls.ouvrageCode);
    let variant = prefixCounters.get(prefix) ?? maxVariantIndexForPrefix(usedCodes, prefix);

    for (const item of sorted) {
      variant += 1;
      let proposed = generateCodeBework(cls.lotCode, cls.familleCode, cls.ouvrageCode, variant);
      while (usedCodes.has(proposed.toUpperCase())) {
        variant += 1;
        proposed = generateCodeBework(cls.lotCode, cls.familleCode, cls.ouvrageCode, variant);
      }
      usedCodes.add(proposed.toUpperCase());

      const norm =
        item.normalizedDesignation?.trim() ||
        normalizeWorkItemDesignation(item.title || item.fullDescription);
      const itemCls = classifyWorkItemForCodification(
        {
          code: item.code,
          sourceCode: effectiveSourceCode(item),
          lot: item.lot,
          family: item.family,
          familyCode: item.familyCode,
          title: item.title,
          fullDescription: item.fullDescription,
          itemType: item.itemType,
        },
        mappingRules,
      );

      const proposedStatus: WorkItemCodificationStatus =
        itemCls.needsReview || itemCls.confidence === "faible" ? "a_verifier" : "auto";

      out.push({
        id: item.id,
        codeSource: effectiveSourceCode(item),
        currentCode: item.code,
        currentCodeBework: item.codeBework,
        proposedCodeBework: proposed,
        importSource: itemCls.importSource,
        lotCode: itemCls.lotCode,
        familleCode: itemCls.familleCode,
        familleNom: itemCls.familleNom,
        sousFamilleCode: itemCls.sousFamilleCode,
        sousFamilleNom: itemCls.sousFamilleNom,
        ouvrageCode: itemCls.ouvrageCode,
        designationNormalisee: norm,
        designationSource: item.title.trim() || item.fullDescription.slice(0, 500),
        unite: item.unit,
        proposedStatus,
        confidence: itemCls.confidence,
        matchReason: itemCls.matchReason,
        groupKey: codificationGroupKey(itemCls.lotCode, itemCls.familleCode, itemCls.ouvrageCode, norm),
        variantIndex: variant,
        avgHt: item.avgHt,
        priceSourceCount: item.priceSourceCount,
      });
    }

    prefixCounters.set(prefix, variant);
  }

  return out.sort((a, b) => a.proposedCodeBework.localeCompare(b.proposedCodeBework, "fr"));
}

export function buildCodificationBeforeAfterReport(
  items: WorkItemCodificationInput[],
  proposals: CodificationProposalRow[],
): CodificationBeforeAfterReport {
  const proposalMap = new Map(proposals.map((p) => [p.id, p]));
  const alreadyStructured = items.filter((i) => isBeworkStructuredCode(i.codeBework)).length;
  const byLot: Record<string, number> = {};
  const byFamille: Record<string, number> = {};
  let proposedAuto = 0;
  let proposedReview = 0;

  for (const p of proposals) {
    byLot[p.lotCode] = (byLot[p.lotCode] ?? 0) + 1;
    byFamille[p.familleCode] = (byFamille[p.familleCode] ?? 0) + 1;
    if (p.proposedStatus === "auto") proposedAuto += 1;
    else proposedReview += 1;
  }

  const sampleChanges = proposals.slice(0, 40).map((p) => ({
    codeSource: p.codeSource,
    before: p.currentCodeBework ?? p.currentCode,
    after: p.proposedCodeBework,
    designation: p.designationSource.slice(0, 120),
    status: p.proposedStatus,
  }));

  return {
    total: items.length,
    alreadyStructured: alreadyStructured,
    toProcess: proposals.length,
    proposedAuto,
    proposedReview,
    byLot,
    byFamille,
    sampleChanges,
  };
}
