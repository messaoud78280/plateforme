/**
 * DEVIS PDF V2 — document commercial premium BTP.
 * Moteur unique (preview + snapshot acceptation). Aucune IA.
 * Calculs = données serveur (QuotePdfInput) — aucun recalcul approximatif.
 */
import { jsPDF } from "jspdf";
import { COMMERCIAL_QUOTE_STATUS_LABELS } from "@/lib/commercial/money";
import {
  computePaymentScheduleAmounts,
  parsePaymentSchedule,
  type PaymentSchedule,
} from "@/lib/commercial/payment-schedule";
import {
  DEFAULT_BRAND,
  INK,
  MUTED,
  RULE,
  SLATE,
  WHITE,
  parseHexColor,
  tint,
  type Rgb,
} from "@/lib/commercial/pdf/colors";
import {
  compactLines,
  fmtDate,
  fmtEur,
  fmtPct,
  fmtQty,
  pdfSafe,
} from "@/lib/commercial/pdf/format";
import { tryDrawLogo } from "@/lib/commercial/pdf/logo";
import {
  drawArchitecturalWatermark,
  drawDraftWatermark,
} from "@/lib/commercial/pdf/architectural-watermark";
import {
  DEFAULT_ACCEPTANCE_TEXT,
  type QuoteDocumentSettings,
} from "@/lib/commercial/pdf/document-settings";

export type QuotePdfSnapshot = {
  name?: string | null;
  tradeName?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
  legalForm?: string | null;
  capital?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  zipCode?: string | null;
  postalCode?: string | null;
  country?: string | null;
  contactName?: string | null;
  /** Chemin public local (ex. /brands/…) ou URL — réutilise DemoEnvironment.logoUrl. */
  logoPath?: string | null;
};

export type QuotePdfVatSlice = {
  rate: number;
  baseHt: number;
  vat: number;
};

export type QuotePdfLine = {
  kind: string;
  reference?: string | null;
  designation: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unitSellHt: number;
  vatRate: number;
  lineSellHt: number;
  isOptional?: boolean;
};

export type QuotePdfInput = {
  number: string;
  subject: string;
  status: string;
  issueDate: Date;
  validityDate?: Date | null;
  paymentTerms?: string | null;
  paymentSchedule?: PaymentSchedule | null;
  clientNotes?: string | null;
  siteAddressSnapshot?: string | null;
  projectTitle?: string | null;
  versionNumber?: number | null;
  issuer: QuotePdfSnapshot | null;
  client: QuotePdfSnapshot | null;
  currency: string;
  quoteMentions?: string | null;
  legalMentions?: string | null;
  insuranceMentions?: string | null;
  accentColor?: string | null;
  documentSettings?: QuoteDocumentSettings | null;
  bank?: {
    iban?: string | null;
    bic?: string | null;
    name?: string | null;
  } | null;
  acceptedAt?: Date | null;
  particularConditions?: string | null;
  executionDurationNote?: string | null;
  executionStartNote?: string | null;
  consumerContractContext?: string | null;
  vatBreakdown?: QuotePdfVatSlice[];
  totals: {
    totalSellHt: number;
    totalVat: number;
    totalTtc: number;
  };
  sections: Array<{
    title: string;
    lines: QuotePdfLine[];
  }>;
};

const MARGIN = 16;
const FOOTER_H = 14;
const HEADER_CONT_H = 18;

function issuerContactLines(s: QuotePdfSnapshot | null): string[] {
  if (!s) return [];
  return compactLines([
    s.addressLine1 || s.address,
    s.addressLine2,
    [s.postalCode || s.zipCode, s.city].filter(Boolean).join(" ") || null,
    s.country && s.country !== "France" ? s.country : null,
    s.phone,
    s.email,
    s.website,
  ]);
}

function clientBlockLines(s: QuotePdfSnapshot | null): string[] {
  if (!s) return [];
  const name = s.tradeName || s.name;
  return compactLines([
    name,
    s.contactName && s.contactName !== name ? s.contactName : null,
    s.addressLine1 || s.address,
    s.addressLine2,
    [s.postalCode || s.zipCode, s.city].filter(Boolean).join(" ") || null,
    s.phone,
    s.email,
    s.siret ? `SIRET ${s.siret}` : null,
  ]);
}

function footerLegalLine(s: QuotePdfSnapshot | null, extra?: string | null): string {
  if (!s) return (extra ?? "").trim();
  const parts = compactLines([
    s.tradeName || s.name,
    s.legalForm,
    s.capital ? `au capital de ${s.capital}` : null,
    s.siret ? `SIRET ${s.siret}` : null,
    s.vatNumber ? `TVA ${s.vatNumber}` : null,
    extra,
  ]);
  return parts.join(" · ");
}

function isOptionLine(line: QuotePdfLine): boolean {
  return Boolean(line.isOptional) || line.kind === "OPTION";
}

function isPricedWork(line: QuotePdfLine): boolean {
  return line.kind === "WORK" && !isOptionLine(line);
}

function stabilizePdfDocumentIds(pdf: Buffer): Buffer {
  const latin = pdf.toString("latin1");
  const fixed =
    "/ID[<00000000000000000000000000000000><00000000000000000000000000000000>]";
  const next = latin.replace(/\/ID\s*\[[^\]]*\]/g, fixed);
  return Buffer.from(next, "latin1");
}

/** PDF devis client — sans logo BeWork. Moteur unique (preview + snapshot). */
export function generateQuotePdfBuffer(input: QuotePdfInput): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  if (typeof doc.setCreationDate === "function") {
    doc.setCreationDate(input.issueDate);
  }
  doc.setProperties({
    title: `Devis ${input.number}`,
    subject: input.subject,
    creator: "BeWork Devis & Facturation",
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const brand = parseHexColor(input.accentColor, DEFAULT_BRAND);
  const brandSoft = tint(brand, 0.9);
  const docSettings = input.documentSettings ?? {};
  const isDraft = input.status === "DRAFT" || input.status === "TO_VALIDATE";

  let y = MARGIN;
  let inTable = false;

  const contentBottom = () => pageH - FOOTER_H - 4;

  const ensureSpace = (need: number) => {
    if (y + need <= contentBottom()) return;
    doc.addPage();
    y = MARGIN;
    drawContinuationHeader();
    if (inTable) drawTableHeader();
  };

  const drawPageChrome = (pageNum: number, totalPages: number) => {
    doc.setPage(pageNum);
    drawArchitecturalWatermark(doc, pageW, pageH, brand);
    if (isDraft) drawDraftWatermark(doc, pageW, pageH);

    const footer = footerLegalLine(input.issuer, docSettings.footerText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    if (footer) {
      const fl = doc.splitTextToSize(footer, pageW - MARGIN * 2 - 28);
      doc.text(fl.slice(0, 2), MARGIN, pageH - 10);
    }
    const contact = compactLines([
      input.issuer?.website,
      input.issuer?.email,
    ]).join(" · ");
    if (contact) {
      doc.text(contact, MARGIN, pageH - 6.5);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...SLATE);
    doc.text(`Page ${pageNum} / ${totalPages}`, pageW - MARGIN, pageH - 8, {
      align: "right",
    });
  };

  function drawContinuationHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...brand);
    const issuerName = input.issuer?.tradeName || input.issuer?.name || "";
    if (issuerName) doc.text(issuerName, MARGIN, y + 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    const versionSuffix =
      input.versionNumber != null ? ` — V${input.versionNumber}` : "";
    doc.text(`Devis ${input.number}${versionSuffix}`, pageW - MARGIN, y + 3, {
      align: "right",
    });
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y + 6, pageW - MARGIN, y + 6);
    y += HEADER_CONT_H - 6;
  }

  // ——— PAGE 1 HEADER ———
  const logoH = tryDrawLogo(doc, input.issuer?.logoPath, MARGIN, y, 40, 14);
  const issuerName = input.issuer?.tradeName || input.issuer?.name || "";
  let leftY = logoH > 0 ? y + logoH + 1 : y;
  if (issuerName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...brand);
    doc.text(issuerName, MARGIN, leftY + 4);
    leftY += 6;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE);
  for (const line of issuerContactLines(input.issuer)) {
    doc.text(line, MARGIN, leftY);
    leftY += 3.3;
  }

  // Droite — DEVIS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...brand);
  doc.text("DEVIS", pageW - MARGIN, MARGIN + 6, { align: "right" });
  doc.setFontSize(11);
  const versionSuffix =
    input.versionNumber != null ? ` — V${input.versionNumber}` : "";
  doc.text(`${input.number}${versionSuffix}`, pageW - MARGIN, MARGIN + 13, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  let ry = MARGIN + 18;
  doc.text(`Date : ${fmtDate(input.issueDate)}`, pageW - MARGIN, ry, {
    align: "right",
  });
  ry += 4;
  if (input.validityDate) {
    doc.text(`Validité : ${fmtDate(input.validityDate)}`, pageW - MARGIN, ry, {
      align: "right",
    });
    ry += 4;
  } else if (docSettings.quoteFeeLabel) {
    /* noop — fee below */
  }
  if (input.acceptedAt && input.status === "ACCEPTED") {
    doc.setTextColor(...brand);
    doc.text(`Accepté le ${fmtDate(input.acceptedAt)}`, pageW - MARGIN, ry, {
      align: "right",
    });
    ry += 4;
  }
  if (docSettings.quoteFeeLabel?.trim()) {
    doc.setTextColor(...SLATE);
    doc.text(docSettings.quoteFeeLabel.trim(), pageW - MARGIN, ry, {
      align: "right",
    });
    ry += 4;
  }

  y = Math.max(leftY + 4, ry + 4, 46);

  // ——— Client / Chantier ———
  const cardW = (pageW - MARGIN * 2 - 4) / 2;
  const clientLines = clientBlockLines(input.client);
  const siteLines = compactLines([
    input.projectTitle,
    input.siteAddressSnapshot,
  ]);
  const cardLines = Math.max(clientLines.length, siteLines.length, 1);
  const cardH = 8 + cardLines * 3.5 + 4;

  doc.setFillColor(...brandSoft);
  doc.roundedRect(MARGIN, y, cardW, cardH, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...brand);
  doc.text("CLIENT", MARGIN + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  let cy = y + 10;
  if (clientLines.length === 0) {
    doc.setTextColor(...MUTED);
    doc.text("Non renseigné", MARGIN + 3, cy);
  } else {
    for (const line of clientLines) {
      doc.text(pdfSafe(line), MARGIN + 3, cy);
      cy += 3.5;
    }
  }

  doc.setFillColor(...brandSoft);
  doc.roundedRect(MARGIN + cardW + 4, y, cardW, cardH, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...brand);
  doc.text("CHANTIER", MARGIN + cardW + 7, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  let sy = y + 10;
  if (siteLines.length === 0) {
    doc.setTextColor(...MUTED);
    doc.text("Adresse non renseignée", MARGIN + cardW + 7, sy);
  } else {
    for (const line of siteLines) {
      const wrapped = doc.splitTextToSize(pdfSafe(line), cardW - 8);
      doc.text(wrapped, MARGIN + cardW + 7, sy);
      sy += wrapped.length * 3.5;
    }
  }
  y += cardH + 8;

  // ——— Objet ———
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text("OBJET", MARGIN, y);
  y += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  const subjectLines = doc.splitTextToSize(pdfSafe(input.subject || "—"), pageW - MARGIN * 2);
  doc.text(subjectLines, MARGIN, y);
  y += subjectLines.length * 5 + 6;

  // Colonnes tableau
  const colRef = MARGIN;
  const colDesc = MARGIN + 18;
  const colQty = pageW - MARGIN - 88;
  const colUnit = pageW - MARGIN - 72;
  const colPu = pageW - MARGIN - 48;
  const colHt = pageW - MARGIN;
  const descW = colQty - colDesc - 3;

  const vatRates = new Set<number>();
  for (const sec of input.sections) {
    for (const l of sec.lines) {
      if (isPricedWork(l) || isOptionLine(l)) vatRates.add(l.vatRate);
    }
  }
  const multiVat = vatRates.size > 1;

  function drawTableHeader() {
    doc.setFillColor(...brand);
    doc.rect(MARGIN, y, pageW - MARGIN * 2, 7, "F");
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Réf.", colRef + 1, y + 4.6);
    doc.text("Désignation", colDesc, y + 4.6);
    doc.text("Qté", colQty, y + 4.6, { align: "right" });
    doc.text("U", colUnit, y + 4.6, { align: "right" });
    doc.text("P.U. HT", colPu, y + 4.6, { align: "right" });
    doc.text("Total HT", colHt, y + 4.6, { align: "right" });
    y += 9;
  }

  // Séparer options
  const optionLines: QuotePdfLine[] = [];
  const workSections = input.sections.map((sec) => {
    const work: QuotePdfLine[] = [];
    for (const line of sec.lines) {
      if (isOptionLine(line) && line.kind !== "COMMENT" && line.kind !== "SUBTOTAL") {
        optionLines.push(line);
      } else {
        work.push(line);
      }
    }
    return { title: sec.title, lines: work };
  });

  drawTableHeader();
  inTable = true;

  for (const section of workSections) {
    if (section.lines.length === 0) continue;

    // Chapitre + au moins une ligne : éviter orphelin
    ensureSpace(16);
    doc.setFillColor(...brandSoft);
    doc.rect(MARGIN, y - 1, pageW - MARGIN * 2, 6.5, "F");
    doc.setTextColor(...brand);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(pdfSafe(section.title.toUpperCase()), MARGIN + 1.5, y + 3.5);
    y += 8;

    let sectionHt = 0;

    for (const line of section.lines) {
      if (line.kind === "COMMENT" || line.kind === "SUBTOTAL") {
        const t = doc.splitTextToSize(pdfSafe(line.designation), pageW - MARGIN * 2 - 4);
        ensureSpace(t.length * 3.6 + 3);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(...SLATE);
        doc.text(t, MARGIN + 1, y);
        y += t.length * 3.6 + 2;
        continue;
      }

      const main = doc.splitTextToSize(pdfSafe(line.designation), descW);
      const detail = line.description
        ? doc.splitTextToSize(pdfSafe(line.description), descW)
        : [];
      const rowH = Math.max(7, 2 + main.length * 3.4 + detail.length * 3.1);
      ensureSpace(rowH + 1);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      if (line.reference) {
        doc.text(String(line.reference).slice(0, 14), colRef + 1, y + 3);
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...INK);
      doc.text(main, colDesc, y + 3);
      if (detail.length) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.8);
        doc.setTextColor(...SLATE);
        doc.text(detail, colDesc, y + 3 + main.length * 3.4);
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...INK);
      doc.text(fmtQty(line.quantity), colQty, y + 3, { align: "right" });
      doc.text(pdfSafe(line.unit), colUnit, y + 3, { align: "right" });
      doc.text(fmtEur(line.unitSellHt), colPu, y + 3, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(fmtEur(line.lineSellHt), colHt, y + 3, { align: "right" });
      if (multiVat) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(...MUTED);
        doc.text(`TVA ${fmtPct(line.vatRate)} %`, colHt, y + 3 + 3.2, {
          align: "right",
        });
      }
      y += rowH;
      if (isPricedWork(line)) sectionHt += line.lineSellHt;
    }

    if (sectionHt > 0.004) {
      ensureSpace(8);
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.2);
      doc.line(colPu - 20, y, pageW - MARGIN, y);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE);
      doc.text(`Sous-total ${section.title}`, colPu - 2, y, { align: "right" });
      doc.setTextColor(...brand);
      doc.text(fmtEur(sectionHt), colHt, y, { align: "right" });
      y += 6;
    }
  }

  inTable = false;

  // ——— Options non incluses ———
  if (optionLines.length > 0) {
    ensureSpace(18 + optionLines.length * 8);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...brand);
    doc.text("OPTIONS NON INCLUSES DANS LE TOTAL", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...SLATE);
    const optNote = doc.splitTextToSize(
      "Ces prestations ne sont pas comprises dans le montant total du devis sauf acceptation explicite.",
      pageW - MARGIN * 2,
    );
    doc.text(optNote, MARGIN, y);
    y += optNote.length * 3.2 + 3;

    for (const line of optionLines) {
      const main = doc.splitTextToSize(pdfSafe(line.designation), pageW - MARGIN * 2 - 50);
      ensureSpace(main.length * 3.5 + 8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...INK);
      doc.text(main, MARGIN, y);
      doc.text(fmtEur(line.lineSellHt), pageW - MARGIN, y, { align: "right" });
      y += main.length * 3.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...SLATE);
      doc.text(
        `${fmtQty(line.quantity)} ${line.unit} × ${fmtEur(line.unitSellHt)}`,
        MARGIN,
        y,
      );
      y += 5;
    }
    y += 2;
  }

  // ——— Récapitulatif (bloc entier) ———
  const vatSlices =
    input.vatBreakdown && input.vatBreakdown.length > 0
      ? input.vatBreakdown
      : [
          {
            rate: [...vatRates][0] ?? 20,
            baseHt: input.totals.totalSellHt,
            vat: input.totals.totalVat,
          },
        ];
  const recapH =
    28 + (vatSlices.length > 1 ? vatSlices.length * 8 : 8) + 14;
  ensureSpace(recapH);
  y += 2;
  const boxW = 78;
  const boxX = pageW - MARGIN - boxW;
  doc.setFillColor(...brandSoft);
  doc.roundedRect(boxX, y, boxW, recapH - 4, 2, 2, "F");
  doc.setDrawColor(...brand);
  doc.setLineWidth(0.35);
  doc.roundedRect(boxX, y, boxW, recapH - 4, 2, 2, "S");

  let ty = y + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...brand);
  doc.text("Récapitulatif", boxX + 3, ty);
  ty += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text("Total HT", boxX + 3, ty);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(fmtEur(input.totals.totalSellHt), boxX + boxW - 3, ty, {
    align: "right",
  });
  ty += 5;

  if (vatSlices.length > 1) {
    for (const slice of vatSlices) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...SLATE);
      doc.text(`Base HT ${fmtPct(slice.rate)} %`, boxX + 3, ty);
      doc.text(fmtEur(slice.baseHt), boxX + boxW - 3, ty, { align: "right" });
      ty += 3.8;
      doc.text(`TVA ${fmtPct(slice.rate)} %`, boxX + 3, ty);
      doc.text(fmtEur(slice.vat), boxX + boxW - 3, ty, { align: "right" });
      ty += 4.2;
    }
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    const rateLabel =
      vatSlices[0] != null ? `TVA ${fmtPct(vatSlices[0].rate)} %` : "TVA";
    doc.text(rateLabel, boxX + 3, ty);
    doc.text(fmtEur(input.totals.totalVat), boxX + boxW - 3, ty, {
      align: "right",
    });
    ty += 6;
  }

  doc.setDrawColor(...brand);
  doc.setLineWidth(0.4);
  doc.line(boxX + 3, ty - 1, boxX + boxW - 3, ty - 1);
  ty += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...brand);
  doc.text("TOTAL TTC", boxX + 3, ty);
  doc.text(fmtEur(input.totals.totalTtc), boxX + boxW - 3, ty, {
    align: "right",
  });
  y += recapH;

  // ——— Validité explicite ———
  if (input.validityDate) {
    ensureSpace(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text(
      `Offre valable jusqu’au : ${fmtDate(input.validityDate)}`,
      MARGIN,
      y,
    );
    y += 6;
  }

  // ——— Paiement ———
  const schedule =
    input.paymentSchedule ?? parsePaymentSchedule(null);
  const scheduleLines = computePaymentScheduleAmounts(
    schedule && schedule.lines.length ? schedule : null,
    input.totals.totalTtc,
  );

  if (scheduleLines.length > 0 || input.paymentTerms || docSettings.paymentModeLabel) {
    const payH =
      10 +
      scheduleLines.length * 6 +
      (input.paymentTerms ? 10 : 0) +
      (docSettings.paymentModeLabel || docSettings.showBankOnQuote ? 12 : 0);
    ensureSpace(Math.min(payH, 40));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...brand);
    doc.text("CONDITIONS DE PAIEMENT", MARGIN, y);
    y += 5;

    if (docSettings.paymentModeLabel?.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...SLATE);
      doc.text(
        `Mode de règlement : ${docSettings.paymentModeLabel.trim()}`,
        MARGIN,
        y,
      );
      y += 4.5;
    }

    for (const row of scheduleLines) {
      ensureSpace(7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...INK);
      doc.text(pdfSafe(row.label), MARGIN, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...SLATE);
      doc.text(`${fmtPct(row.percent)} %`, MARGIN + 70, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brand);
      doc.text(fmtEur(row.amountTtc), pageW - MARGIN, y, { align: "right" });
      y += 5;
    }

    if (input.paymentTerms?.trim()) {
      ensureSpace(12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE);
      const pt = doc.splitTextToSize(pdfSafe(input.paymentTerms), pageW - MARGIN * 2);
      doc.text(pt, MARGIN, y);
      y += pt.length * 3.4 + 2;
    }

    if (docSettings.showBankOnQuote) {
      /* IBAN/BIC affichés juste après via input.bank */
    }
    y += 2;
  }

  if (docSettings.showBankOnQuote && (input.bank?.iban || input.bank?.bic)) {
    ensureSpace(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    if (input.bank?.name) {
      doc.text(pdfSafe(input.bank.name), MARGIN, y);
      y += 3.5;
    }
    if (input.bank?.iban) doc.text(`IBAN ${pdfSafe(input.bank.iban)}`, MARGIN, y);
    y += 3.5;
    if (input.bank?.bic) doc.text(`BIC ${pdfSafe(input.bank.bic)}`, MARGIN, y);
    y += 5;
  }

  // ——— Exécution ———
  if (input.executionStartNote || input.executionDurationNote) {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...brand);
    doc.text("EXÉCUTION DES TRAVAUX", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    if (input.executionStartNote) {
      doc.text(`Début prévu : ${pdfSafe(input.executionStartNote)}`, MARGIN, y);
      y += 4;
    }
    if (input.executionDurationNote) {
      doc.text(
        `Durée estimée : ${pdfSafe(input.executionDurationNote)}`,
        MARGIN,
        y,
      );
      y += 5;
    }
  }

  // ——— Déchets ———
  if (docSettings.wasteManagementText?.trim()) {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...brand);
    doc.text("GESTION DES DÉCHETS", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    const w = doc.splitTextToSize(
      pdfSafe(docSettings.wasteManagementText),
      pageW - MARGIN * 2,
    );
    doc.text(w, MARGIN, y);
    y += w.length * 3.3;
    if (docSettings.wasteCostLabel?.trim()) {
      doc.setTextColor(...INK);
      doc.text(`Coût : ${docSettings.wasteCostLabel.trim()}`, MARGIN, y);
      y += 4;
    }
    y += 2;
  }

  // ——— Assurance ———
  if (input.insuranceMentions?.trim() || docSettings.decennaleInsurer) {
    ensureSpace(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...brand);
    doc.text("ASSURANCE PROFESSIONNELLE", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    const insParts = compactLines([
      docSettings.decennaleInsurer
        ? `Assureur : ${docSettings.decennaleInsurer}`
        : null,
      docSettings.decennalePolicyNumber
        ? `Police : ${docSettings.decennalePolicyNumber}`
        : null,
      docSettings.decennaleCoverage
        ? `Couverture : ${docSettings.decennaleCoverage}`
        : null,
      docSettings.decennaleValidFrom || docSettings.decennaleValidTo
        ? `Validité : ${[docSettings.decennaleValidFrom, docSettings.decennaleValidTo].filter(Boolean).join(" → ")}`
        : null,
      input.insuranceMentions,
    ]);
    for (const p of insParts) {
      const lines = doc.splitTextToSize(pdfSafe(p), pageW - MARGIN * 2);
      ensureSpace(lines.length * 3.3 + 1);
      doc.text(lines, MARGIN, y);
      y += lines.length * 3.3;
    }
    if (docSettings.decennaleDocumentPath) {
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(
        "Attestation décennale : document annexé séparément selon paramétrage (fusion PDF non automatique en V2).",
        MARGIN,
        y,
      );
      y += 4;
    }
    y += 2;
  }

  // ——— Conditions particulières ———
  const particular =
    input.particularConditions?.trim() ||
    docSettings.defaultParticularConditions?.trim();
  if (particular) {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...brand);
    doc.text("CONDITIONS PARTICULIÈRES", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    const pc = doc.splitTextToSize(pdfSafe(particular), pageW - MARGIN * 2);
    doc.text(pc, MARGIN, y);
    y += pc.length * 3.4 + 3;
  }

  // ——— Observations ———
  if (input.clientNotes?.trim()) {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...brand);
    doc.text("OBSERVATIONS", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    const notes = doc.splitTextToSize(
      pdfSafe(input.clientNotes),
      pageW - MARGIN * 2,
    );
    doc.text(notes, MARGIN, y);
    y += notes.length * 3.4 + 3;
  }

  // ——— Mentions ———
  const mentions = [input.quoteMentions, input.legalMentions]
    .map((m) => m?.trim())
    .filter(Boolean) as string[];
  if (mentions.length) {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...brand);
    doc.text("MENTIONS", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...SLATE);
    for (const m of mentions) {
      const lines = doc.splitTextToSize(pdfSafe(m), pageW - MARGIN * 2);
      ensureSpace(lines.length * 3 + 2);
      doc.text(lines, MARGIN, y);
      y += lines.length * 3 + 2;
    }
  }

  // ——— B2C annex (template only, if configured) ———
  const ctx =
    input.consumerContractContext ||
    docSettings.consumerContractContextDefault ||
    null;
  if (
    docSettings.showRetractionAnnex &&
    docSettings.retractionAnnexText?.trim() &&
    (ctx === "A_DISTANCE" || ctx === "HORS_ETABLISSEMENT")
  ) {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...brand);
    doc.text("INFORMATIONS RELATIVES AU DROIT DE RÉTRACTATION", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...SLATE);
    const rt = doc.splitTextToSize(
      pdfSafe(docSettings.retractionAnnexText),
      pageW - MARGIN * 2,
    );
    for (const line of rt) {
      ensureSpace(4);
      doc.text(line, MARGIN, y);
      y += 3.2;
    }
    y += 3;
  }

  // ——— Bon pour accord ———
  ensureSpace(42);
  doc.setDrawColor(...brand);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN, y, pageW - MARGIN * 2, 38, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...brand);
  doc.text("BON POUR ACCORD", MARGIN + 3, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...SLATE);
  const acc = doc.splitTextToSize(
    pdfSafe(docSettings.acceptanceText?.trim() || DEFAULT_ACCEPTANCE_TEXT),
    pageW - MARGIN * 2 - 8,
  );
  doc.text(acc.slice(0, 2), MARGIN + 3, y + 12);
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text("Date : ____________________", MARGIN + 3, y + 22);
  doc.text(
    "Nom / qualité : ________________________________",
    MARGIN + 3,
    y + 28,
  );
  doc.text("Signature / cachet :", MARGIN + 3, y + 34);
  y += 42;

  // ——— CGV annex ———
  if (docSettings.cgvText?.trim()) {
    doc.addPage();
    y = MARGIN;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...brand);
    doc.text("CONDITIONS GÉNÉRALES", MARGIN, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    const cgv = doc.splitTextToSize(
      pdfSafe(docSettings.cgvText),
      pageW - MARGIN * 2,
    );
    for (const line of cgv) {
      if (y > contentBottom()) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(line, MARGIN, y);
      y += 3.3;
    }
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    drawPageChrome(i, pages);
  }

  const ab = doc.output("arraybuffer");
  return stabilizePdfDocumentIds(Buffer.from(ab));
}

export function generateCommercialQuotePdf(input: QuotePdfInput): Buffer {
  return generateQuotePdfBuffer(input);
}

/** Re-export types utiles facture future */
export type { Rgb };
