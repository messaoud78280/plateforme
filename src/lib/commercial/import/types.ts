/**
 * Structure intermédiaire d’import devis — indépendante du moteur CommercialQuote.
 */

export type ImportConfidence = "ok" | "warn" | "missing";

export type ImportedCustomer = {
  name: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  confidence: ImportConfidence;
};

export type ImportedIssuerMeta = {
  name: string | null;
  /** Métadonnée d’origine uniquement — ne remplace jamais l’org BeWork. */
  note: string | null;
};

export type ImportedLine = {
  id: string;
  kind: "WORK" | "COMMENT" | "SECTION_HEADER";
  designation: string;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  unitSellHt: number | null;
  discountPercent: number | null;
  vatRate: number | null;
  lineSellHt: number | null;
  confidence: ImportConfidence;
  warnings: string[];
};

export type ImportedSection = {
  id: string;
  title: string;
  lines: ImportedLine[];
};

export type ImportedPaymentSchedule = {
  percents: number[];
  confidence: ImportConfidence;
};

export type ImportedTotals = {
  totalHt: number | null;
  totalVat: number | null;
  totalTtc: number | null;
  vatRateGuess: number | null;
  confidence: ImportConfidence;
};

export type ImportedQuoteDraft = {
  source: {
    fileName: string;
    mimeType: string;
    fileSize: number;
    sha256: string | null;
    storageKey: string | null;
    format: "pdf" | "xlsx" | "csv" | "unknown";
    scannedPdf: boolean;
  };
  reference: string | null;
  issueDate: string | null; // ISO date YYYY-MM-DD
  subject: string | null;
  issuer: ImportedIssuerMeta;
  customer: ImportedCustomer;
  sections: ImportedSection[];
  paymentSchedule: ImportedPaymentSchedule | null;
  totals: ImportedTotals;
  warnings: string[];
  flags: {
    bonPourAccordMention: boolean;
    mathOk: boolean;
    discountAmbiguity: boolean;
  };
};

export type ClientMatchOption = {
  id: string;
  name: string;
  tradeName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  score: number;
  reason: string;
};
