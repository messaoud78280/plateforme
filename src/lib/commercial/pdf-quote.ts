/**
 * DEVIS PDF — document commercial BTP.
 * Moteur unique (preview + snapshot acceptation). Aucune IA.
 * Calculs = données serveur (QuotePdfInput) — aucun recalcul approximatif.
 */
import { jsPDF } from "jspdf";
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
  fmtDateLong,
  fmtEur,
  fmtPct,
  fmtQty,
  pdfSafe,
} from "@/lib/commercial/pdf/format";
import { tryDrawLogo } from "@/lib/commercial/pdf/logo";
import { drawDraftWatermark } from "@/lib/commercial/pdf/architectural-watermark";
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
const FOOTER_H = 12;
const HEADER_CONT_H = 11;
const FS = {
  display: 18,
  title: 11,
  section: 9,
  body: 8,
  small: 7,
} as const;

function issuerContactLines(s: QuotePdfSnapshot | null): string[] {
  if (!s) return [];
  return compactLines([
    s.addressLine1 || s.address,
    s.addressLine2,
    [s.postalCode || s.zipCode, s.city].filter(Boolean).join(" ") || null,
    s.country && s.country !== "France" ? s.country : null,
    compactLines([s.phone, s.email]).join("  ·  ") || null,
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

/** Désignation / descriptif / observation (paragraphes séparés par ligne vide). */
function splitLineCopy(line: QuotePdfLine): {
  title: string;
  technical: string | null;
  observation: string | null;
} {
  const title = (line.designation || "").trim();
  const raw = (line.description || "").trim();
  if (!raw) return { title, technical: null, observation: null };
  const parts = raw
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return {
      title,
      technical: parts[0] ?? null,
      observation: parts.slice(1).join(" "),
    };
  }
  return { title, technical: raw.replace(/\s+/g, " "), observation: null };
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
  const wash = tint(brand, 0.94);
  const docSettings = input.documentSettings ?? {};
  const isDraft = input.status === "DRAFT" || input.status === "TO_VALIDATE";

  let y = MARGIN;
  let inTable = false;

  const contentBottom = () => pageH - FOOTER_H - 3;

  const paintDraftIfNeeded = () => {
    if (isDraft) drawDraftWatermark(doc, pageW, pageH);
  };

  const startNewPage = () => {
    doc.addPage();
    paintDraftIfNeeded();
    y = MARGIN;
    drawContinuationHeader();
    if (inTable) drawTableHeader();
  };

  const ensureSpace = (need: number) => {
    if (y + need <= contentBottom()) return;
    startNewPage();
  };

  const versionSuffix =
    input.versionNumber != null ? ` — V${input.versionNumber}` : "";

  function drawContinuationHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.small);
    doc.setTextColor(...brand);
    const issuerName = input.issuer?.tradeName || input.issuer?.name || "";
    if (issuerName) doc.text(issuerName, MARGIN, y + 3.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    doc.text(`Devis ${input.number}${versionSuffix}`, pageW - MARGIN, y + 3.5, {
      align: "right",
    });
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, y + 6.5, pageW - MARGIN, y + 6.5);
    y += HEADER_CONT_H;
  }

  paintDraftIfNeeded();

  // ——— PAGE 1 HEADER ———
  const logoH = tryDrawLogo(doc, input.issuer?.logoPath, MARGIN, y, 52, 20);
  const issuerName = input.issuer?.tradeName || input.issuer?.name || "";
  let leftY = logoH > 0 ? y + logoH + 1.5 : y;
  if (issuerName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.title);
    doc.setTextColor(...brand);
    doc.text(issuerName, MARGIN, leftY + 4);
    leftY += 6;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FS.small);
  doc.setTextColor(...SLATE);
  for (const line of issuerContactLines(input.issuer)) {
    doc.text(line, MARGIN, leftY);
    leftY += 3.2;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FS.display);
  doc.setTextColor(...brand);
  doc.text("DEVIS", pageW - MARGIN, MARGIN + 7, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(input.number, pageW - MARGIN, MARGIN + 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FS.small);
  doc.setTextColor(...SLATE);
  let ry = MARGIN + 18.5;
  if (input.versionNumber != null) {
    doc.text(`Version V${input.versionNumber}`, pageW - MARGIN, ry, {
      align: "right",
    });
    ry += 3.8;
  }
  doc.text(fmtDateLong(input.issueDate), pageW - MARGIN, ry, { align: "right" });
  ry += 3.8;
  if (input.validityDate) {
    doc.text(`Valable jusqu’au ${fmtDateLong(input.validityDate)}`, pageW - MARGIN, ry, {
      align: "right",
    });
    ry += 3.8;
  }
  if (input.acceptedAt && input.status === "ACCEPTED") {
    doc.setTextColor(...brand);
    doc.text(`Accepté le ${fmtDateLong(input.acceptedAt)}`, pageW - MARGIN, ry, {
      align: "right",
    });
    ry += 3.8;
  }
  if (docSettings.quoteFeeLabel?.trim()) {
    doc.setTextColor(...SLATE);
    doc.text(docSettings.quoteFeeLabel.trim(), pageW - MARGIN, ry, {
      align: "right",
    });
    ry += 3.8;
  }

  y = Math.max(leftY + 3, ry + 2, 38);

  // ——— Client / Chantier ———
  const clientLines = clientBlockLines(input.client);
  const siteLines = compactLines([input.projectTitle, input.siteAddressSnapshot]);
  const showClient = clientLines.length > 0;
  const showSite = siteLines.length > 0;

  if (showClient || showSite) {
    const gap = 4;
    const fullW = pageW - MARGIN * 2;
    const cardW = showClient && showSite ? (fullW - gap) / 2 : fullW;
    const lineH = 3.4;
    const padX = 3;
    const labelH = 4.5;
    const inner = (lines: string[], nameBold: boolean, width: number) => {
      let h = labelH;
      lines.forEach((line, i) => {
        const size = nameBold && i === 0 ? FS.body : FS.small;
        doc.setFontSize(size);
        const wrapped = doc.splitTextToSize(pdfSafe(line), width - padX * 2);
        h += wrapped.length * lineH;
      });
      return h + 3;
    };
    const h1 = showClient ? inner(clientLines, true, cardW) : 0;
    const h2 = showSite ? inner(siteLines, true, cardW) : 0;
    const cardH = Math.max(h1, h2, 12);

    const drawParty = (title: string, lines: string[], x: number, width: number) => {
      doc.setFillColor(...wash);
      doc.rect(x, y, width, cardH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.small - 0.5);
      doc.setTextColor(...brand);
      doc.text(title, x + padX, y + 4);
      let cy = y + 8.5;
      lines.forEach((line, i) => {
        const isName = i === 0;
        doc.setFont("helvetica", isName ? "bold" : "normal");
        doc.setFontSize(isName ? FS.body : FS.small);
        doc.setTextColor(...(isName ? INK : SLATE));
        const wrapped = doc.splitTextToSize(pdfSafe(line), width - padX * 2);
        doc.text(wrapped, x + padX, cy);
        cy += wrapped.length * lineH;
      });
    };

    if (showClient && showSite) {
      drawParty("CLIENT", clientLines, MARGIN, cardW);
      drawParty("CHANTIER", siteLines, MARGIN + cardW + gap, cardW);
    } else if (showClient) {
      drawParty("CLIENT", clientLines, MARGIN, cardW);
    } else {
      drawParty("CHANTIER", siteLines, MARGIN, cardW);
    }
    y += cardH + 5.5;
  }

  // ——— Objet ———
  if (input.subject?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.small - 0.5);
    doc.setTextColor(...MUTED);
    doc.text("OBJET", MARGIN, y);
    y += 4.2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.title);
    doc.setTextColor(...INK);
    const subjectLines = doc.splitTextToSize(
      pdfSafe(input.subject),
      pageW - MARGIN * 2,
    );
    doc.text(subjectLines, MARGIN, y);
    y += subjectLines.length * 4.6 + 5;
  }

  // Colonnes tableau
  const colRef = MARGIN;
  const colDesc = MARGIN + 17;
  const colHt = pageW - MARGIN;
  const colPu = pageW - MARGIN - 32;
  const colUnit = pageW - MARGIN - 56;
  const colQty = pageW - MARGIN - 70;
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
    doc.rect(MARGIN, y, pageW - MARGIN * 2, 6.4, "F");
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.small);
    const hy = y + 4.3;
    doc.text("Réf.", colRef + 1, hy);
    doc.text("Désignation", colDesc, hy);
    doc.text("Qté", colQty, hy, { align: "right" });
    doc.text("U", colUnit, hy, { align: "right" });
    doc.text("P.U. HT", colPu, hy, { align: "right" });
    doc.text("Total HT", colHt, hy, { align: "right" });
    y += 7.4;
  }

  function measureCommentH(line: QuotePdfLine): number {
    const t = doc.splitTextToSize(pdfSafe(line.designation), pageW - MARGIN * 2 - 4);
    return t.length * 3.4 + 2;
  }

  function measureWorkRow(line: QuotePdfLine): {
    titleLines: string[];
    techLines: string[];
    obsLines: string[];
    headerH: number;
    totalH: number;
  } {
    const copy = splitLineCopy(line);
    const titleLines = doc.splitTextToSize(pdfSafe(copy.title), descW);
    const techLines = copy.technical
      ? doc.splitTextToSize(pdfSafe(copy.technical), descW)
      : [];
    const obsLines = copy.observation
      ? doc.splitTextToSize(pdfSafe(copy.observation), descW)
      : [];
    const headerH = 2 + titleLines.length * 3.45 + (multiVat ? 3 : 0);
    const totalH = Math.max(
      7,
      headerH + techLines.length * 3.15 + obsLines.length * 3.15 + 1.2,
    );
    return { titleLines, techLines, obsLines, headerH, totalH };
  }

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

    const first = section.lines[0]!;
    const firstH =
      first.kind === "COMMENT" || first.kind === "SUBTOTAL"
        ? measureCommentH(first)
        : measureWorkRow(first).totalH;
    // Titre de lot + première prestation : jamais orphelins.
    ensureSpace(6.5 + firstH + 2);

    doc.setFillColor(...wash);
    doc.rect(MARGIN, y, pageW - MARGIN * 2, 5.6, "F");
    doc.setTextColor(...brand);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.body);
    doc.text(pdfSafe(section.title.toUpperCase()), MARGIN + 1.5, y + 3.8);
    y += 7;

    let sectionHt = 0;
    const pricedCount = section.lines.filter((l) => isPricedWork(l)).length;
    let pricedDrawn = 0;

    for (const line of section.lines) {
      if (line.kind === "COMMENT" || line.kind === "SUBTOTAL") {
        const t = doc.splitTextToSize(
          pdfSafe(line.designation),
          pageW - MARGIN * 2 - 4,
        );
        ensureSpace(t.length * 3.4 + 3);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(FS.small);
        doc.setTextColor(...SLATE);
        doc.text(t, MARGIN + 1, y);
        y += t.length * 3.4 + 1.5;
        continue;
      }

      const measured = measureWorkRow(line);
      const isLastPriced = isPricedWork(line) && pricedDrawn + 1 === pricedCount;
      const subtotalH = isLastPriced ? 7 : 0;
      const pageBodyH = contentBottom() - MARGIN - HEADER_CONT_H - 8;
      const keepTogether = measured.totalH + subtotalH <= pageBodyH;

      if (keepTogether) {
        ensureSpace(measured.totalH + subtotalH);
      } else {
        ensureSpace(measured.headerH + 4);
      }

      const priceY = y + 3.1;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.small);
      doc.setTextColor(...MUTED);
      if (line.reference) {
        doc.text(String(line.reference).slice(0, 12), colRef + 1, priceY);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.body);
      doc.setTextColor(...INK);
      doc.text(measured.titleLines, colDesc, priceY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.body);
      doc.setTextColor(...INK);
      doc.text(fmtQty(line.quantity), colQty, priceY, { align: "right" });
      doc.text(pdfSafe(line.unit), colUnit, priceY, { align: "right" });
      doc.text(fmtEur(line.unitSellHt), colPu, priceY, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(fmtEur(line.lineSellHt), colHt, priceY, { align: "right" });
      if (multiVat) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...MUTED);
        doc.text(`TVA ${fmtPct(line.vatRate)} %`, colHt, priceY + 3.1, {
          align: "right",
        });
      }

      y = priceY + measured.titleLines.length * 3.45;
      const flowLines = (lines: string[], italic: boolean) => {
        for (const ln of lines) {
          ensureSpace(3.4);
          doc.setFont("helvetica", italic ? "italic" : "normal");
          doc.setFontSize(FS.small);
          doc.setTextColor(...SLATE);
          doc.text(ln, colDesc, y);
          y += 3.15;
        }
      };
      flowLines(measured.techLines, false);
      flowLines(measured.obsLines, true);
      y += 2.2;

      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.15);
      doc.line(MARGIN, y - 0.8, pageW - MARGIN, y - 0.8);

      if (isPricedWork(line)) {
        sectionHt += line.lineSellHt;
        pricedDrawn += 1;
      }
    }

    if (sectionHt > 0.004) {
      ensureSpace(7);
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.3);
      doc.line(colPu - 18, y, pageW - MARGIN, y);
      y += 3.8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.small);
      doc.setTextColor(...SLATE);
      doc.text(`Sous-total ${section.title}`, colPu - 2, y, { align: "right" });
      doc.setTextColor(...brand);
      doc.text(fmtEur(sectionHt), colHt, y, { align: "right" });
      y += 5.5;
    }
  }

  inTable = false;

  // ——— Options ———
  if (optionLines.length > 0) {
    const firstOpt = optionLines[0]!;
    const firstTitle = doc.splitTextToSize(
      pdfSafe(firstOpt.designation),
      pageW - MARGIN * 2 - 46,
    );
    ensureSpace(14 + firstTitle.length * 3.4 + 8);
    y += 1.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.section);
    doc.setTextColor(...brand);
    doc.text("Options", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(FS.small);
    doc.setTextColor(...SLATE);
    const optNote = doc.splitTextToSize(
      "Non comprises dans le montant du devis sauf acceptation.",
      pageW - MARGIN * 2,
    );
    doc.text(optNote, MARGIN, y);
    y += optNote.length * 3.2 + 3;

    for (const line of optionLines) {
      const main = doc.splitTextToSize(
        pdfSafe(line.designation),
        pageW - MARGIN * 2 - 48,
      );
      ensureSpace(main.length * 3.4 + 9);
      doc.setFillColor(...wash);
      doc.roundedRect(MARGIN, y - 2.2, 14, 4.2, 0.6, 0.6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...brand);
      doc.text("Option", MARGIN + 7, y + 0.6, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.body);
      doc.setTextColor(...INK);
      doc.text(main, MARGIN + 16, y);
      doc.text(`${fmtEur(line.lineSellHt)} HT`, pageW - MARGIN, y, {
        align: "right",
      });
      y += main.length * 3.4 + 0.4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.small);
      doc.setTextColor(...SLATE);
      doc.text(
        `${fmtQty(line.quantity)} ${pdfSafe(line.unit)} × ${fmtEur(line.unitSellHt)}`,
        MARGIN + 16,
        y,
      );
      y += 5.5;
    }
  }

  // ——— Récapitulatif ———
  type RecapSlice = { rate: number | null; baseHt: number; vat: number };
  const vatSlices: RecapSlice[] =
    input.vatBreakdown && input.vatBreakdown.length > 0
      ? input.vatBreakdown
      : vatRates.size > 0
        ? [
            {
              rate: [...vatRates][0] ?? null,
              baseHt: input.totals.totalSellHt,
              vat: input.totals.totalVat,
            },
          ]
        : [
            {
              rate: null,
              baseHt: input.totals.totalSellHt,
              vat: input.totals.totalVat,
            },
          ];

  const recapRows = 2 + (vatSlices.length > 1 ? vatSlices.length * 2 : 1);
  const recapH = 6 + recapRows * 5 + 8;
  ensureSpace(recapH);
  y += 2;
  const boxW = 72;
  const boxX = pageW - MARGIN - boxW;

  let ty = y;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FS.body);
  doc.setTextColor(...SLATE);
  doc.text("Total HT", boxX, ty);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(fmtEur(input.totals.totalSellHt), boxX + boxW, ty, { align: "right" });
  ty += 5.2;

  if (vatSlices.length > 1) {
    for (const slice of vatSlices) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.small);
      doc.setTextColor(...SLATE);
      const rateBit = slice.rate != null ? ` ${fmtPct(slice.rate)} %` : "";
      doc.text(`Base HT${rateBit}`, boxX, ty);
      doc.text(fmtEur(slice.baseHt), boxX + boxW, ty, { align: "right" });
      ty += 3.8;
      doc.text(`TVA${rateBit}`, boxX, ty);
      doc.text(fmtEur(slice.vat), boxX + boxW, ty, { align: "right" });
      ty += 4.2;
    }
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.body);
    doc.setTextColor(...SLATE);
    const rateLabel =
      vatSlices[0]?.rate != null ? `TVA ${fmtPct(vatSlices[0].rate)} %` : "TVA";
    doc.text(rateLabel, boxX, ty);
    doc.text(fmtEur(input.totals.totalVat), boxX + boxW, ty, { align: "right" });
    ty += 5.5;
  }

  doc.setDrawColor(...brand);
  doc.setLineWidth(0.35);
  doc.line(boxX, ty - 1, boxX + boxW, ty - 1);
  ty += 2;
  doc.setFillColor(...wash);
  doc.rect(boxX - 2, ty - 4, boxW + 4, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FS.title);
  doc.setTextColor(...brand);
  doc.text("TOTAL TTC", boxX, ty + 2.2);
  doc.text(fmtEur(input.totals.totalTtc), boxX + boxW, ty + 2.2, {
    align: "right",
  });
  y = ty + 8;

  // ——— Paiement ———
  const schedule = input.paymentSchedule ?? parsePaymentSchedule(null);
  const scheduleLines = computePaymentScheduleAmounts(
    schedule && schedule.lines.length ? schedule : null,
    input.totals.totalTtc,
  );
  const paymentMode = docSettings.paymentModeLabel?.trim() || "";
  const paymentTerms = input.paymentTerms?.trim() || "";
  const showPaymentMode =
    Boolean(paymentMode) &&
    !paymentTerms.toLowerCase().includes(paymentMode.toLowerCase());

  if (scheduleLines.length > 0 || paymentTerms || showPaymentMode) {
    const payH =
      8 +
      scheduleLines.length * 5 +
      (paymentTerms ? 8 : 0) +
      (showPaymentMode ? 5 : 0);
    ensureSpace(Math.min(payH, 36));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.section);
    doc.setTextColor(...brand);
    doc.text("Conditions de paiement", MARGIN, y);
    y += 5.2;

    const pctX = pageW - MARGIN - 48;
    for (const row of scheduleLines) {
      ensureSpace(6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.body);
      doc.setTextColor(...INK);
      doc.text(pdfSafe(row.label), MARGIN, y);
      doc.setTextColor(...SLATE);
      doc.text(`${fmtPct(row.percent)} %`, pctX, y, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...INK);
      doc.text(fmtEur(row.amountTtc), pageW - MARGIN, y, { align: "right" });
      y += 4.8;
    }

    if (showPaymentMode) {
      ensureSpace(5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.small);
      doc.setTextColor(...SLATE);
      doc.text(`Règlement par ${paymentMode.toLowerCase()}.`, MARGIN, y);
      y += 4.2;
    }
    if (paymentTerms) {
      ensureSpace(10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.small);
      doc.setTextColor(...SLATE);
      const pt = doc.splitTextToSize(pdfSafe(paymentTerms), pageW - MARGIN * 2);
      doc.text(pt, MARGIN, y);
      y += pt.length * 3.3 + 2;
    }
    y += 1.5;
  }

  if (docSettings.showBankOnQuote && (input.bank?.iban || input.bank?.bic)) {
    ensureSpace(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.small);
    doc.setTextColor(...SLATE);
    if (input.bank?.name) {
      doc.text(pdfSafe(input.bank.name), MARGIN, y);
      y += 3.4;
    }
    if (input.bank?.iban) doc.text(`IBAN ${pdfSafe(input.bank.iban)}`, MARGIN, y);
    y += 3.4;
    if (input.bank?.bic) doc.text(`BIC ${pdfSafe(input.bank.bic)}`, MARGIN, y);
    y += 5;
  }

  const drawTextSection = (title: string, body: string) => {
    const lines = doc.splitTextToSize(pdfSafe(body), pageW - MARGIN * 2);
    ensureSpace(10 + Math.min(lines.length, 3) * 3.3);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.section);
    doc.setTextColor(...brand);
    doc.text(title, MARGIN, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.small);
    doc.setTextColor(...SLATE);
    for (const line of lines) {
      ensureSpace(4);
      doc.text(line, MARGIN, y);
      y += 3.3;
    }
    y += 2.5;
  };

  if (input.executionStartNote || input.executionDurationNote) {
    const bits = compactLines([
      input.executionStartNote
        ? `Début prévu : ${input.executionStartNote}`
        : null,
      input.executionDurationNote
        ? `Durée estimée : ${input.executionDurationNote}`
        : null,
    ]);
    drawTextSection("Exécution des travaux", bits.join("\n"));
  }

  if (docSettings.wasteManagementText?.trim()) {
    const waste = compactLines([
      docSettings.wasteManagementText,
      docSettings.wasteCostLabel?.trim()
        ? `Coût : ${docSettings.wasteCostLabel.trim()}`
        : null,
    ]).join("\n");
    drawTextSection("Gestion des déchets", waste);
  }

  if (input.insuranceMentions?.trim() || docSettings.decennaleInsurer) {
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
      docSettings.decennaleDocumentPath
        ? "Attestation décennale : document annexé séparément selon paramétrage (fusion PDF non automatique)."
        : null,
    ]);
    drawTextSection("Assurance professionnelle", insParts.join("\n"));
  }

  const particular =
    input.particularConditions?.trim() ||
    docSettings.defaultParticularConditions?.trim();
  if (particular) {
    drawTextSection("Conditions particulières", particular);
  }

  if (input.clientNotes?.trim()) {
    drawTextSection("Observations", input.clientNotes.trim());
  }

  const mentions = [input.quoteMentions, input.legalMentions]
    .map((m) => m?.trim())
    .filter(Boolean) as string[];
  if (mentions.length) {
    drawTextSection("Mentions", mentions.join("\n\n"));
  }

  const ctx =
    input.consumerContractContext ||
    docSettings.consumerContractContextDefault ||
    null;
  if (
    docSettings.showRetractionAnnex &&
    docSettings.retractionAnnexText?.trim() &&
    (ctx === "A_DISTANCE" || ctx === "HORS_ETABLISSEMENT")
  ) {
    drawTextSection(
      "Informations relatives au droit de rétractation",
      docSettings.retractionAnnexText,
    );
  }

  // ——— Bon pour accord (compact ; dernière page seulement si la place manque) ———
  const accText = pdfSafe(
    docSettings.acceptanceText?.trim() || DEFAULT_ACCEPTANCE_TEXT,
  );
  const accLines = doc.splitTextToSize(accText, pageW - MARGIN * 2);
  const signatureH =
    5 + 4.5 + accLines.length * 3.2 + 4 + 5.5 + 5.5 + 13;
  ensureSpace(signatureH);

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, pageW - MARGIN, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FS.section);
  doc.setTextColor(...brand);
  doc.text("Bon pour accord", MARGIN, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FS.small);
  doc.setTextColor(...SLATE);
  doc.text(accLines, MARGIN, y);
  y += accLines.length * 3.2 + 4;
  doc.setFontSize(FS.body);
  doc.setTextColor(...INK);
  doc.text("Date : ______________________", MARGIN, y);
  y += 5.5;
  doc.text("Nom / qualité : _________________________________", MARGIN, y);
  y += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FS.small);
  doc.setTextColor(...SLATE);
  doc.text(
    "Signature précédée de la mention « Bon pour accord » :",
    MARGIN,
    y,
  );
  y += 13;

  // ——— CGV annex ———
  if (docSettings.cgvText?.trim()) {
    doc.addPage();
    paintDraftIfNeeded();
    y = MARGIN;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.title);
    doc.setTextColor(...brand);
    doc.text("Conditions générales", MARGIN, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.small);
    doc.setTextColor(...SLATE);
    const cgv = doc.splitTextToSize(
      pdfSafe(docSettings.cgvText),
      pageW - MARGIN * 2,
    );
    for (const line of cgv) {
      if (y > contentBottom()) {
        doc.addPage();
        paintDraftIfNeeded();
        y = MARGIN;
      }
      doc.text(line, MARGIN, y);
      y += 3.3;
    }
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, pageH - FOOTER_H, pageW - MARGIN, pageH - FOOTER_H);
    const footer = footerLegalLine(input.issuer, docSettings.footerText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    if (footer) {
      const fl = doc.splitTextToSize(footer, pageW - MARGIN * 2 - 28);
      doc.text(fl.slice(0, 2), MARGIN, pageH - 7);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.small);
    doc.setTextColor(...SLATE);
    doc.text(`Page ${i} / ${pages}`, pageW - MARGIN, pageH - 7, {
      align: "right",
    });
  }

  const ab = doc.output("arraybuffer");
  return stabilizePdfDocumentIds(Buffer.from(ab));
}

export function generateCommercialQuotePdf(input: QuotePdfInput): Buffer {
  return generateQuotePdfBuffer(input);
}

/** Re-export types utiles facture future */
export type { Rgb };
