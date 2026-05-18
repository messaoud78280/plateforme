import { findMergeBlocker } from "@/lib/chantier-resources/synonyms-btp";

/** Garde-fous spécifiques ouvrages (différences techniques critiques). */
const WORK_ITEM_BLOCKERS: { patternA: RegExp; patternB: RegExp; reason: string }[] = [
  {
    patternA: /\bc\s*25\s*\/\s*30\b|\bc25\/30\b/i,
    patternB: /\bc\s*30\s*\/\s*37\b|\bc30\/37\b/i,
    reason: "Béton C25/30 ≠ C30/37",
  },
  {
    patternA: /\bbeton\s+c\s*25/i,
    patternB: /\bbeton\s+c\s*30/i,
    reason: "Classes béton différentes",
  },
  {
    patternA: /\b100\s*mm\b|\bep\s*10\b/i,
    patternB: /\b200\s*mm\b|\bep\s*20\b/i,
    reason: "Épaisseurs / dimensions différentes",
  },
  {
    patternA: /\bba13\b/i,
    patternB: /hydro|h1/i,
    reason: "Placo BA13 ≠ placo hydrofuge",
  },
  {
    patternA: /impression|sous.?couche|primaire/i,
    patternB: /finition|facade|decorative/i,
    reason: "Peinture impression ≠ finition",
  },
  {
    patternA: /baignoire(?!.*balneo)(?!.*balnéo)/i,
    patternB: /balneo|balnéo|hydromassage/i,
    reason: "Baignoire simple ≠ baignoire balnéo",
  },
  {
    patternA: /tpc\s*rouge\s*40|d\s*40\b|ø\s*40/i,
    patternB: /tpc\s*rouge\s*90|d\s*90\b|ø\s*90/i,
    reason: "Diamètres gaines différents",
  },
  {
    patternA: /3g1[,.]5/i,
    patternB: /3g2[,.]5/i,
    reason: "Sections câble différentes",
  },
];

export function findWorkItemMergeBlocker(a: string, b: string): string | null {
  const fromSynonyms = findMergeBlocker(a, b);
  if (fromSynonyms) return fromSynonyms;
  for (const block of WORK_ITEM_BLOCKERS) {
    if (
      (block.patternA.test(a) && block.patternB.test(b)) ||
      (block.patternA.test(b) && block.patternB.test(a))
    ) {
      return block.reason;
    }
  }
  return null;
}
