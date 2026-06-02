/**
 * Import Artiprix : code principal BeWork généré, code Artiprix dans sourceCode.
 * Format : BW-[LOT]-[FAMILLE]-[SOUS-FAMILLE]-[NUMERO]
 */

import { classifyWorkItemForCodification, type CodificationMappingRule } from "@/lib/bework-work-item-codification/classify";
import {
  buildCodificationPrefix,
  generateCodeBework,
  maxVariantIndexForPrefix,
} from "@/lib/bework-work-item-codification/generate";
import {
  artiprixChapterFromCode,
  codificationGroupKey,
  isBeworkStructuredCode,
} from "@/lib/bework-work-item-codification/normalize";
import { normalizeWorkItemDesignation } from "@/lib/work-item-merge";
import type { StructuredPasteFormValues } from "@/lib/be-work-devis-structured-paste";
import type { WorkItemCodificationStatus } from "@prisma/client";

export const ARTIPRIX_IMPORT_SOURCE_LABEL = "Artiprix";

export function isArtiprixChapterCode(code: string): boolean {
  return /^\d+(\.\d+)+$/.test(code.trim());
}

export function shouldGenerateArtiprixBeWorkCode(
  pastedCode: string,
  pasteSource?: Record<string, unknown>,
): boolean {
  const c = pastedCode.trim();
  if (isArtiprixChapterCode(c)) return true;
  if (isBeworkStructuredCode(c)) return false;
  const src = String(pasteSource?.source ?? pasteSource?.importSource ?? "").toLowerCase();
  if (src.includes("artiprix")) return true;
  const cat = String(pasteSource?.catalogue ?? pasteSource?.catalog ?? "").toLowerCase();
  if (cat.includes("artiprix")) return true;
  return false;
}

export type ResolvedArtiprixImport = {
  code: string;
  codeBework: string;
  sourceCode: string;
  importSource: string;
  sourceLine: string | null;
  lotCode: string;
  familleCode: string;
  familleNom: string;
  sousFamilleCode: string | null;
  sousFamilleNom: string | null;
  ouvrageCode: string;
  familyCode: string;
  normalizedDesignation: string;
  designationSource: string;
  codificationStatus: WorkItemCodificationStatus;
};

function codificationSegment(cls: {
  sousFamilleCode: string | null;
  ouvrageCode: string;
}): string {
  return (cls.sousFamilleCode ?? cls.ouvrageCode ?? "GEN").toUpperCase();
}

/**
 * Génère le code BeWork et métadonnées pour une ligne d’import (Artiprix ou déjà BW).
 */
export function resolveArtiprixImportRow(
  values: StructuredPasteFormValues,
  pasteSource: Record<string, unknown> | undefined,
  usedCodes: Set<string>,
  mappingRules: CodificationMappingRule[] = [],
): ResolvedArtiprixImport | { error: string } {
  const pastedCode = values.code.trim();
  if (!pastedCode) return { error: "Code manquant." };

  const designation = values.title.trim() || values.fullDescription.trim().slice(0, 500);
  const haystackCode = pastedCode;

  const cls = classifyWorkItemForCodification(
    {
      code: haystackCode,
      sourceCode: isArtiprixChapterCode(pastedCode) ? pastedCode : pastedCode,
      lot: values.lot,
      family: values.family,
      familyCode: null,
      title: values.title,
      fullDescription: values.fullDescription,
      itemType: "ouvrage_technique",
    },
    mappingRules,
  );

  const seg = codificationSegment(cls);
  const prefix = buildCodificationPrefix(cls.lotCode, cls.familleCode, seg);

  let variant = maxVariantIndexForPrefix(usedCodes, prefix);
  let code: string;
  do {
    variant += 1;
    code = generateCodeBework(cls.lotCode, cls.familleCode, seg, variant);
  } while (usedCodes.has(code.toUpperCase()));

  usedCodes.add(code.toUpperCase());

  const sourceCode = isArtiprixChapterCode(pastedCode)
    ? pastedCode
    : artiprixChapterFromCode(pastedCode) || pastedCode;

  const norm =
    normalizeWorkItemDesignation(designation || values.fullDescription) ||
    codificationGroupKey(cls.lotCode, cls.familleCode, seg, designation);

  const codificationStatus: WorkItemCodificationStatus =
    cls.needsReview || cls.confidence === "faible" ? "a_verifier" : "auto";

  if (shouldGenerateArtiprixBeWorkCode(pastedCode, pasteSource) || !isBeworkStructuredCode(pastedCode)) {
    return {
      code,
      codeBework: code,
      sourceCode,
      importSource: ARTIPRIX_IMPORT_SOURCE_LABEL,
      sourceLine: artiprixChapterFromCode(sourceCode),
      lotCode: cls.lotCode,
      familleCode: cls.familleCode,
      familleNom: cls.familleNom,
      sousFamilleCode: cls.sousFamilleCode,
      sousFamilleNom: cls.sousFamilleNom,
      ouvrageCode: cls.ouvrageCode,
      familyCode: cls.familleCode,
      normalizedDesignation: norm,
      designationSource: designation || values.fullDescription.slice(0, 500),
      codificationStatus,
    };
  }

  return {
    code: pastedCode,
    codeBework: pastedCode,
    sourceCode: sourceCode,
    importSource: ARTIPRIX_IMPORT_SOURCE_LABEL,
    sourceLine: null,
    lotCode: cls.lotCode,
    familleCode: cls.familleCode,
    familleNom: cls.familleNom,
    sousFamilleCode: cls.sousFamilleCode,
    sousFamilleNom: cls.sousFamilleNom,
    ouvrageCode: cls.ouvrageCode,
    familyCode: cls.familleCode,
    normalizedDesignation: norm,
    designationSource: designation,
    codificationStatus,
  };
}
