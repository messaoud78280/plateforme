import type { DpgfAnalysisSheetContent } from "./types";

const DEFAULT_MODE_STEPS = [
  "Repérer l'ouvrage sur les plans",
  "Lire la prescription dans le CCTP",
  "Vérifier le support ou l'existant",
  "Identifier les contraintes",
  "Comprendre les étapes de réalisation",
  "Repérer les contrôles à prévoir",
  "Identifier les risques d'oubli",
] as const;

export function emptyDpgfAnalysisContent(): DpgfAnalysisSheetContent {
  return {
    translation: {
      meaning: "",
      beginnerLanguage: "",
      technicalTerms: "",
      concreteExample: "",
    },
    realWorld: {
      whatIsIt: "",
      purpose: "",
      whereOnSite: "",
      whoDoesIt: "",
      whenInProject: "",
      linkedLots: "",
    },
    included: {
      supply: "",
      installation: "",
      accessories: "",
      fixings: "",
      preparation: "",
      cuts: "",
      adjustments: "",
      cleaning: "",
      protection: "",
      minorItems: "",
    },
    excluded: {
      demolition: "",
      wasteEvacuation: "",
      substrateRepair: "",
      specialTreatment: "",
      finishing: "",
      painting: "",
      studies: "",
      executionPlans: "",
      accessMeans: "",
      difficultHandling: "",
      penetrations: "",
      lotCoordination: "",
    },
    documentsToCheck: {
      cctp: "",
      dpgf: "",
      bpu: "",
      architectPlans: "",
      technicalPlans: "",
      sectionDetails: "",
      joineryBook: "",
      manufacturerSheets: "",
      notices: "",
      dtuRules: "",
      sitePhotos: "",
    },
    cctpChecks: [],
    planChecks: [],
    modeOperatoire: DEFAULT_MODE_STEPS.map((title, i) => ({
      order: i + 1,
      title,
      description: "",
      whyImportant: "",
    })),
    vigilancePoints: [],
    questionsBeforeValidation: [],
    noviceErrors: [],
    summary: {
      meaning: "",
      mustVerify: "",
      mainRisk: "",
      priorityDocument: "",
      keyQuestion: "",
    },
  };
}

export function parseLinesField(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function joinLinesField(items: string[] | undefined): string {
  return (items ?? []).filter(Boolean).join("\n");
}

/** Compare deux textes pédagogiques (ignore espaces / casse). */
export function isSameTranslationText(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  const na = norm(a);
  const nb = norm(b);
  return na.length > 0 && na === nb;
}

export function parseDpgfAnalysisContent(raw: unknown): DpgfAnalysisSheetContent {
  const base = emptyDpgfAnalysisContent();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Partial<DpgfAnalysisSheetContent>;
  return {
    translation: { ...base.translation, ...(o.translation ?? {}) },
    realWorld: { ...base.realWorld, ...(o.realWorld ?? {}) },
    included: { ...base.included, ...(o.included ?? {}) },
    excluded: { ...base.excluded, ...(o.excluded ?? {}) },
    documentsToCheck: { ...base.documentsToCheck, ...(o.documentsToCheck ?? {}) },
    cctpChecks: Array.isArray(o.cctpChecks) ? o.cctpChecks.map(String) : base.cctpChecks,
    planChecks: Array.isArray(o.planChecks) ? o.planChecks.map(String) : base.planChecks,
    modeOperatoire: Array.isArray(o.modeOperatoire) && o.modeOperatoire.length > 0 ? o.modeOperatoire : base.modeOperatoire,
    vigilancePoints: Array.isArray(o.vigilancePoints) ? o.vigilancePoints.map(String) : base.vigilancePoints,
    questionsBeforeValidation: Array.isArray(o.questionsBeforeValidation)
      ? o.questionsBeforeValidation.map(String)
      : base.questionsBeforeValidation,
    noviceErrors: Array.isArray(o.noviceErrors) ? o.noviceErrors.map(String) : base.noviceErrors,
    summary: { ...base.summary, ...(o.summary ?? {}) },
  };
}

export function computeContentFlags(content: DpgfAnalysisSheetContent) {
  const hasModeOperatoire = content.modeOperatoire.some(
    (s) => s.description.trim().length > 0 || s.whyImportant.trim().length > 0,
  );
  const hasVigilancePoints = content.vigilancePoints.some((v) => v.trim().length > 0);
  const hasQuestions = content.questionsBeforeValidation.some((q) => q.trim().length > 0);
  return { hasModeOperatoire, hasVigilancePoints, hasQuestions };
}

export async function generateNextDpgfSheetCode(): Promise<string> {
  const { prisma } = await import("@/lib/prisma");
  const count = await prisma.dpgfAnalysisSheet.count();
  const seq = String(count + 1).padStart(4, "0");
  return `BW-DPGF-${seq}`;
}
