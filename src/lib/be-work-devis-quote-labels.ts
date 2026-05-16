import type { QuoteDocumentType } from "@prisma/client";

export const QUOTE_DOCUMENT_TYPE_LABELS: Record<QuoteDocumentType, string> = {
  devis_estimatif: "Devis estimatif",
  dpgf_consultation: "DPGF / consultation",
  devis_corrige: "Devis corrigé / restructuré",
  comparatif_devis: "Comparatif de devis",
  devis_contractuel: "Devis contractuel",
};

export const QUOTE_DOCUMENT_STATUS_LABELS: Record<
  "brouillon" | "a_verifier" | "pret_a_envoyer" | "envoye" | "archive",
  string
> = {
  brouillon: "Brouillon",
  a_verifier: "À vérifier",
  pret_a_envoyer: "Prêt à envoyer",
  envoye: "Envoyé",
  archive: "Archivé",
};

export function defaultLegalDisclaimerForType(type: QuoteDocumentType): string {
  switch (type) {
    case "devis_estimatif":
      return "Document estimatif établi sur la base de prix observés et de désignations types BeWork. Les quantités, choix techniques, plans d’exécution, études de sol, accès chantier et prescriptions réglementaires doivent être confirmés avant contractualisation avec une entreprise exécutante.";
    case "dpgf_consultation":
      return "Document de consultation destiné à recueillir les prix d’entreprises. Les quantités, prix et conditions d’exécution doivent être vérifiés et complétés par l’entreprise consultée avant engagement.";
    case "devis_corrige":
      return "Document de restructuration et de clarification établi à partir d’un devis existant. Il ne se substitue pas au devis contractuel de l’entreprise exécutante.";
    case "comparatif_devis":
      return "Document de comparaison à titre d’aide à la décision. Les montants et périmètres doivent être validés avec les entreprises concernées avant tout engagement contractuel.";
    case "devis_contractuel":
      return "Document de nature contractuelle : vérifier l’identité de l’entreprise exécutante, le périmètre, les options et les conditions généraales avant signature.";
    default:
      return "";
  }
}

export function isQuoteDocumentType(v: string): v is QuoteDocumentType {
  return (Object.keys(QUOTE_DOCUMENT_TYPE_LABELS) as QuoteDocumentType[]).includes(v as QuoteDocumentType);
}

const QUOTE_STATUS_SET = new Set(["brouillon", "a_verifier", "pret_a_envoyer", "envoye", "archive"]);

export function isQuoteDocumentStatus(v: string): v is "brouillon" | "a_verifier" | "pret_a_envoyer" | "envoye" | "archive" {
  return QUOTE_STATUS_SET.has(v);
}
