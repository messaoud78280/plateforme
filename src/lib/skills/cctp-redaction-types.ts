import type { CctpAssistantInsights } from "@/lib/skills/cctp-assistant-intelligence";
import type { CctpDocumentClassification } from "@/lib/skills/cctp-document-classifier";
import type { CctpGenerationMode, CctpMarketProfile } from "@/lib/skills/cctp-generation-modes";

/** Niveau de détail attendu pour la rédaction CCTP. */
export type CctpDetailLevel = "synthese" | "standard" | "detaille";

/** Contexte projet saisi dans le formulaire. */
export type CctpProjectContext = {
  projectType: string;
  lot: string;
  location: string;
  constraints: string;
  detailLevel: CctpDetailLevel;
  availableDocuments: string;
};

/** Affinage itératif sur un résultat existant. */
export type CctpRefineInput = {
  previousMarkdown: string;
  instruction: string;
};

/** Entrée génération complète. */
export type CctpGenerationInput = {
  request: string;
  context: CctpProjectContext;
  extractedFromFiles?: string;
  normReferences?: string[];
  generationMode?: CctpGenerationMode;
  marketProfile?: CctpMarketProfile | null;
  refine?: CctpRefineInput;
  checkedDocumentIds?: string[];
  documentClassifications?: CctpDocumentClassification[];
};

/** Corps JSON POST /api/skills/cctp */
export type CctpRedactionRequestBody = {
  request: string;
  context: CctpProjectContext;
  normReferences?: string[];
  generationMode?: CctpGenerationMode;
  marketProfile?: CctpMarketProfile | null;
  refineSessionId?: string;
  refineInstruction?: string;
  /** Ids checklist pièces (cat:libellé) pour audit documentaire. */
  checkedDocumentIds?: string[];
};

/** Réponse API génération CCTP */
export type CctpRedactionResponseBody = {
  markdown: string;
  usedLlm: boolean;
  notice?: string;
  sessionId?: string;
  extractWarnings?: string[];
  generationMode?: CctpGenerationMode;
  refined?: boolean;
  assistantInsights?: CctpAssistantInsights;
  documentClassifications?: CctpDocumentClassification[];
};

/** Résumé session pour historique UI */
export type CctpSessionSummary = {
  id: string;
  requestText: string;
  lot: string | null;
  projectType: string | null;
  createdAt: string;
  usedLlm: boolean;
  hasResult: boolean;
  generationMode?: string | null;
};

/** Détail session (rechargement) */
export type CctpSessionDetail = CctpSessionSummary & {
  location: string | null;
  constraints: string | null;
  detailLevel: CctpDetailLevel;
  availableDocuments: string | null;
  normReferences: string[];
  marketProfile: string | null;
  resultMarkdown: string | null;
  notice: string | null;
  extractedContext: string | null;
  files: {
    id: string;
    kind: string;
    fileName: string;
    fileSize: number;
    mimeType: string | null;
    storageUrl: string | null;
  }[];
};

export type CctpExportFormat = "pdf" | "doc";
