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

/** Entrée génération (V2 : fichiers + normes). */
export type CctpGenerationInput = {
  request: string;
  context: CctpProjectContext;
  extractedFromFiles?: string;
  normReferences?: string[];
};

/** Corps JSON legacy POST /api/skills/cctp */
export type CctpRedactionRequestBody = {
  request: string;
  context: CctpProjectContext;
  normReferences?: string[];
};

/** Réponse API génération CCTP */
export type CctpRedactionResponseBody = {
  markdown: string;
  usedLlm: boolean;
  notice?: string;
  sessionId?: string;
  extractWarnings?: string[];
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
};

/** Détail session (rechargement) */
export type CctpSessionDetail = CctpSessionSummary & {
  location: string | null;
  constraints: string | null;
  detailLevel: CctpDetailLevel;
  availableDocuments: string | null;
  normReferences: string[];
  resultMarkdown: string | null;
  notice: string | null;
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
