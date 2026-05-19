import type { QuoteDocument, QuoteProject, QuoteDocumentStatus } from "@prisma/client";
import { QUOTE_DOCUMENT_STATUS_LABELS } from "@/lib/be-work-devis-quote-labels";

export type QuotePdfMode = "official" | "estimation";
export type QuotePdfDesignationMode = "summary" | "full";

export type QuotePdfLayoutStyle = "commercial" | "classic";

export type QuotePdfPresentationSettings = {
  pdfMode: QuotePdfMode;
  layoutStyle: QuotePdfLayoutStyle;
  /** Affiche logo + coordonnées entreprise en en-tête PDF (modèle classique). */
  showIssuerOnPdf: boolean;
  designationMode: QuotePdfDesignationMode;
  showLineVat: boolean;
  showLotSubtotals: boolean;
  showSignatureBlock: boolean;
};

/** Modèle type ERP : titre + client, sans bloc société à gauche. */
export const DEFAULT_QUOTE_PDF_PRESENTATION: QuotePdfPresentationSettings = {
  pdfMode: "official",
  layoutStyle: "commercial",
  showIssuerOnPdf: false,
  designationMode: "full",
  showLineVat: true,
  showLotSubtotals: true,
  showSignatureBlock: true,
};

export type QuotePdfIssuer = {
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  siret: string;
  tvaNumber: string;
  apeCode: string;
  insuranceName: string;
  insurancePolicy: string;
  legalMentions: string;
  logoPath: string | null;
};

export type IssuerValidationResult =
  | { ok: true }
  | { ok: false; message: string; missing: string[] };

const BEWORK_FOOTER_OFFICIAL = "Généré via BeWork — outil d'aide au chiffrage BTP";
const BEWORK_FOOTER_ESTIMATION =
  "Estimation indicative générée avec BeWork. Ne constitue pas un devis contractuel tant qu'il n'est pas validé et émis par l'entreprise exécutante.";

export function beworkPdfFooterLine(mode: QuotePdfMode): string {
  return mode === "estimation" ? BEWORK_FOOTER_ESTIMATION : BEWORK_FOOTER_OFFICIAL;
}

function envOrEmpty(key: string): string {
  return process.env[key]?.trim() ?? "";
}

/** Valeurs de secours dev uniquement (jamais « BeWork » comme entreprise de travaux). */
export function defaultPdfIssuerFromEnv(): QuotePdfIssuer {
  return {
    companyName: envOrEmpty("DEVIS_ISSUER_NAME"),
    addressLine1: envOrEmpty("DEVIS_ISSUER_ADDRESS_LINE1"),
    addressLine2: envOrEmpty("DEVIS_ISSUER_ADDRESS_LINE2"),
    phone: envOrEmpty("DEVIS_ISSUER_PHONE"),
    email: envOrEmpty("DEVIS_ISSUER_EMAIL"),
    siret: envOrEmpty("DEVIS_ISSUER_SIRET"),
    tvaNumber: envOrEmpty("DEVIS_ISSUER_TVA"),
    apeCode: envOrEmpty("DEVIS_ISSUER_APE"),
    insuranceName: envOrEmpty("DEVIS_ISSUER_INSURANCE_NAME"),
    insurancePolicy: envOrEmpty("DEVIS_ISSUER_INSURANCE_POLICY"),
    legalMentions: "",
    logoPath: null,
  };
}

export function resolvePdfIssuer(project: QuoteProject): QuotePdfIssuer {
  const env = defaultPdfIssuerFromEnv();
  let logoPath: string | null = project.issuerLogoPath?.trim() || null;
  if (logoPath && !logoPath.startsWith("/")) logoPath = `/${logoPath}`;

  return {
    companyName: project.issuerCompanyName?.trim() || env.companyName,
    addressLine1: project.issuerAddressLine1?.trim() || env.addressLine1,
    addressLine2: project.issuerAddressLine2?.trim() || env.addressLine2,
    phone: project.issuerPhone?.trim() || env.phone,
    email: project.issuerEmail?.trim() || env.email,
    siret: project.issuerSiret?.trim() || env.siret,
    tvaNumber: project.issuerTvaNumber?.trim() || env.tvaNumber,
    apeCode: project.issuerApeCode?.trim() || env.apeCode,
    insuranceName: project.issuerInsuranceName?.trim() || env.insuranceName,
    insurancePolicy: project.issuerInsurancePolicy?.trim() || env.insurancePolicy,
    legalMentions: project.issuerLegalMentions?.trim() || "",
    logoPath,
  };
}

export function validateOfficialPdfIssuer(project: QuoteProject): IssuerValidationResult {
  const issuer = resolvePdfIssuer(project);
  const missing: string[] = [];
  if (!issuer.companyName) missing.push("Raison sociale de l'entreprise");
  if (!issuer.addressLine1 && !issuer.addressLine2) missing.push("Adresse de l'entreprise");
  if (!issuer.siret) missing.push("SIRET");
  if (!issuer.phone && !issuer.email) missing.push("Téléphone ou e-mail");

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      message:
        "Informations entreprise incomplètes : le devis ne peut pas être généré comme document commercial officiel. Complétez la section « Entreprise émettrice ».",
    };
  }
  return { ok: true };
}

function isPdfMode(v: unknown): v is QuotePdfMode {
  return v === "official" || v === "estimation";
}

function isDesignationMode(v: unknown): v is QuotePdfDesignationMode {
  return v === "summary" || v === "full";
}

function isLayoutStyle(v: unknown): v is QuotePdfLayoutStyle {
  return v === "commercial" || v === "classic";
}

export function parsePresentationSettings(raw: unknown): QuotePdfPresentationSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_QUOTE_PDF_PRESENTATION };
  const o = raw as Record<string, unknown>;
  const layoutStyle = isLayoutStyle(o.layoutStyle) ? o.layoutStyle : DEFAULT_QUOTE_PDF_PRESENTATION.layoutStyle;
  const showIssuerOnPdf =
    typeof o.showIssuerOnPdf === "boolean"
      ? o.showIssuerOnPdf
      : layoutStyle === "classic"
        ? true
        : DEFAULT_QUOTE_PDF_PRESENTATION.showIssuerOnPdf;

  return {
    pdfMode: isPdfMode(o.pdfMode) ? o.pdfMode : DEFAULT_QUOTE_PDF_PRESENTATION.pdfMode,
    layoutStyle,
    showIssuerOnPdf,
    designationMode: isDesignationMode(o.designationMode)
      ? o.designationMode
      : DEFAULT_QUOTE_PDF_PRESENTATION.designationMode,
    showLineVat: typeof o.showLineVat === "boolean" ? o.showLineVat : DEFAULT_QUOTE_PDF_PRESENTATION.showLineVat,
    showLotSubtotals:
      typeof o.showLotSubtotals === "boolean"
        ? o.showLotSubtotals
        : DEFAULT_QUOTE_PDF_PRESENTATION.showLotSubtotals,
    showSignatureBlock:
      typeof o.showSignatureBlock === "boolean"
        ? o.showSignatureBlock
        : DEFAULT_QUOTE_PDF_PRESENTATION.showSignatureBlock,
  };
}

export function presentationSettingsFromFormData(formData: FormData): QuotePdfPresentationSettings {
  const layoutStyle = formData.get("pdfLayoutStyle") === "classic" ? "classic" : "commercial";
  return {
    pdfMode: formData.get("pdfMode") === "estimation" ? "estimation" : "official",
    layoutStyle,
    showIssuerOnPdf: formData.get("pdfShowIssuerOnPdf") === "on",
    designationMode: formData.get("pdfDesignationMode") === "summary" ? "summary" : "full",
    showLineVat: formData.get("pdfShowLineVat") === "on",
    showLotSubtotals: formData.get("pdfShowLotSubtotals") === "on",
    showSignatureBlock: formData.get("pdfShowSignatureBlock") === "on",
  };
}

export function isCommercialPdfLayout(settings: QuotePdfPresentationSettings): boolean {
  return settings.layoutStyle === "commercial" || !settings.showIssuerOnPdf;
}

export function quoteStatusLabelForPdf(status: QuoteDocumentStatus): string {
  return QUOTE_DOCUMENT_STATUS_LABELS[status] ?? status;
}

export function isDraftStatus(status: QuoteDocumentStatus): boolean {
  return status === "brouillon" || status === "a_verifier";
}

export function resolveQuoteObject(
  document: Pick<QuoteDocument, "title" | "quoteObject">,
  project: Pick<QuoteProject, "projectName">,
  lotNames: string[],
): string {
  if (document.quoteObject?.trim()) return document.quoteObject.trim();
  if (document.title.trim() && document.title !== project.projectName) return document.title.trim();
  if (lotNames.length === 1) return `Travaux — ${lotNames[0]}`;
  if (lotNames.length > 1) return `Travaux — ${lotNames.slice(0, 3).join(", ")}${lotNames.length > 3 ? "…" : ""}`;
  return project.projectName;
}

export const DEFAULT_COMMERCIAL_CONDITIONS = `Devis valable jusqu'à la date indiquée ci-dessus. Les prix sont établis sur la base des informations disponibles à la date d'émission. Toute modification de quantité, d'accès, de support, de prescription technique ou de condition d'exécution pourra entraîner une révision du montant.

Modalités de paiement : à convenir entre les parties. Acompte éventuel selon accord. Solde à réception de facture.

Délais prévisionnels : à préciser après validation du devis et planification chantier.`;

export const DEFAULT_TECHNICAL_RESERVATION = `Le présent devis est établi sous réserve de validation des supports, accès chantier, réseaux existants, contraintes techniques, autorisations administratives, prescriptions du CCTP le cas échéant, et de toute étude technique nécessaire avant exécution.`;

export const DEFAULT_PAYMENT_CONDITIONS_LINES = [
  "30,00 % soit 0,00 € — Acompte à la commande",
  "40,00 % soit 0,00 € — Acompte en cours de chantier",
  "30,00 % soit 0,00 € — Paiement du solde",
] as const;

export function buildLegalMentionsBlock(
  issuer: QuotePdfIssuer,
  document: Pick<QuoteDocument, "legalDisclaimer" | "technicalReservations">,
  opts?: { includeIssuerIds?: boolean },
): string {
  const includeIssuerIds = opts?.includeIssuerIds !== false;
  const parts: string[] = [];
  if (document.legalDisclaimer?.trim()) parts.push(document.legalDisclaimer.trim());
  else {
    parts.push(DEFAULT_TECHNICAL_RESERVATION);
    parts.push(
      "Indemnité forfaitaire de recouvrement de 40 € due au titre des articles L.441-10 et D.441-5 du code de commerce (client professionnel). Pénalités de retard au taux légal en vigueur.",
    );
  }
  if (includeIssuerIds) {
    if (issuer.siret) parts.push(`SIRET : ${issuer.siret}`);
    if (issuer.tvaNumber) parts.push(`TVA intracommunautaire : ${issuer.tvaNumber}`);
    if (issuer.apeCode) parts.push(`Code APE / NAF : ${issuer.apeCode}`);
    if (issuer.insuranceName || issuer.insurancePolicy) {
      parts.push(
        `Assurance décennale / responsabilité civile : ${[issuer.insuranceName, issuer.insurancePolicy].filter(Boolean).join(" — ")}`,
      );
    }
    if (issuer.legalMentions) parts.push(issuer.legalMentions);
  }
  if (document.technicalReservations?.trim()) parts.push(document.technicalReservations.trim());
  return parts.join("\n\n");
}

export function formatDesignationForPdf(
  title: string,
  description: string,
  mode: QuotePdfDesignationMode,
): { headline: string; body: string } {
  const t = title.trim();
  const d = description.trim();
  if (mode === "full") {
    return { headline: t, body: d && d !== "—" ? d : "" };
  }
  if (!d || d === "—" || d === t) return { headline: t, body: "" };
  const short = d.length > 280 ? `${d.slice(0, 277).trim()}…` : d;
  return { headline: t, body: short };
}
