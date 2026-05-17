/** Types Skill PPSPS — analyse des risques */
import type { PpspsGenerationMode, PpspsSiteProfile } from "@/lib/skills/ppsps-generation-modes";

export type { PpspsGenerationMode, PpspsSiteProfile };

export type PpspsOperationType =
  | "construction_neuve"
  | "renovation"
  | "extension"
  | "rehabilitation"
  | "demolition_partielle"
  | "travaux_exterieurs"
  | "autre";

export type PpspsCoactivity = "oui" | "non" | "a_confirmer";

export type PpspsDetailLevel = "synthetique" | "standard" | "detaille" | "tres_detaille";

export type PpspsSiteInfo = {
  siteName: string;
  siteAddress: string;
  operationType: PpspsOperationType;
  operationTypeOther: string;
  startDate: string;
  estimatedDuration: string;
  maxWorkers: string;
  coactivity: PpspsCoactivity;
  spsCoordinator: string;
  projectOwner: string;
  projectManager: string;
  safetyManager: string;
};

export type PpspsRefineEntry = {
  instruction: string;
  at: string;
};

export type PpspsFormInput = {
  site: PpspsSiteInfo;
  trades: string[];
  tradeOther: string;
  selectedRiskTaskIds: string[];
  detailLevel: PpspsDetailLevel;
  constraints: string;
  projectId?: string | null;
  generationMode?: PpspsGenerationMode;
  siteProfile?: PpspsSiteProfile | null;
  normReferences?: string[];
  freeformInstruction?: string;
  oppbtpSearchQuery?: string;
};

export type PpspsGenerationInput = PpspsFormInput & {
  extractedFromFiles?: string;
  includeOppbtpHints?: boolean;
  generationMode?: PpspsGenerationMode;
  refine?: {
    previousMarkdown: string;
    instruction: string;
  };
};

export type PpspsGenerationResponse = {
  markdown: string;
  usedLlm: boolean;
  notice?: string;
  sessionId?: string;
  extractWarnings?: string[];
};

export type PpspsExportFormat = "pdf" | "doc";

export type PpspsProjectSummary = {
  id: string;
  title: string;
};

export type PpspsSessionSummary = {
  id: string;
  siteName: string | null;
  siteAddress: string | null;
  detailLevel: PpspsDetailLevel;
  generationMode: PpspsGenerationMode;
  createdAt: string;
  usedLlm: boolean;
  hasResult: boolean;
  taskCount: number;
  project: PpspsProjectSummary | null;
  linkedDocumentId: string | null;
  refineCount: number;
};

export type PpspsSessionFileSummary = {
  id: string;
  kind: string;
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  storageUrl: string | null;
};

export type PpspsSessionDetail = PpspsSessionSummary & {
  form: PpspsFormInput;
  resultMarkdown: string | null;
  notice: string | null;
  extractedContext: string | null;
  files: PpspsSessionFileSummary[];
  projectId: string | null;
  refines: PpspsRefineEntry[];
};
