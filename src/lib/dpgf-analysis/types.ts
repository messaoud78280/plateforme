import type {
  DpgfAnalysisComprehensionLevel,
  DpgfAnalysisSheetSource,
  WorkItemStatus,
} from "@prisma/client";

export type DpgfAnalysisModeOperatoireStep = {
  order: number;
  title: string;
  description: string;
  whyImportant: string;
};

export type DpgfAnalysisSheetContent = {
  translation: {
    meaning: string;
    beginnerLanguage: string;
    technicalTerms: string;
    concreteExample: string;
  };
  realWorld: {
    whatIsIt: string;
    purpose: string;
    whereOnSite: string;
    whoDoesIt: string;
    whenInProject: string;
    linkedLots: string;
  };
  included: {
    supply: string;
    installation: string;
    accessories: string;
    fixings: string;
    preparation: string;
    cuts: string;
    adjustments: string;
    cleaning: string;
    protection: string;
    minorItems: string;
  };
  excluded: {
    demolition: string;
    wasteEvacuation: string;
    substrateRepair: string;
    specialTreatment: string;
    finishing: string;
    painting: string;
    studies: string;
    executionPlans: string;
    accessMeans: string;
    difficultHandling: string;
    penetrations: string;
    lotCoordination: string;
  };
  documentsToCheck: {
    cctp: string;
    dpgf: string;
    bpu: string;
    architectPlans: string;
    technicalPlans: string;
    sectionDetails: string;
    joineryBook: string;
    manufacturerSheets: string;
    notices: string;
    dtuRules: string;
    sitePhotos: string;
  };
  cctpChecks: string[];
  planChecks: string[];
  modeOperatoire: DpgfAnalysisModeOperatoireStep[];
  vigilancePoints: string[];
  questionsBeforeValidation: string[];
  noviceErrors: string[];
  summary: {
    meaning: string;
    mustVerify: string;
    mainRisk: string;
    priorityDocument: string;
    keyQuestion: string;
  };
};

export type DpgfAnalysisSheetLinks = {
  cctpReference?: string;
  planReference?: string;
  dcePieceNote?: string;
  lotNote?: string;
  internalNote?: string;
};

export type DpgfAnalysisFilterParams = {
  q?: string;
  lot?: string;
  trade?: string;
  family?: string;
  ouvrageType?: string;
  unit?: string;
  level?: DpgfAnalysisComprehensionLevel;
  status?: WorkItemStatus;
  source?: DpgfAnalysisSheetSource;
  hasModeOperatoire?: boolean;
  hasVigilance?: boolean;
  hasQuestions?: boolean;
};

export type DpgfAnalysisListRow = {
  id: string;
  codeSheet: string;
  simplifiedDesignation: string | null;
  originalDesignation: string;
  lot: string;
  tradeCode: string | null;
  familyName: string | null;
  unit: string;
  comprehensionLevel: DpgfAnalysisComprehensionLevel;
  status: WorkItemStatus;
  updatedAt: Date;
};

export type DpgfAnalysisStats = {
  totalSheets: number;
  lotsCovered: number;
  toVerify: number;
  validated: number;
  levelDebutant: number;
  levelIntermediaire: number;
  levelConfirme: number;
};
