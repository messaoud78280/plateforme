import fs from "fs";
import path from "path";
import type { QuoteDocument, QuoteLine, QuoteProject } from "@prisma/client";
import { jsPDF } from "jspdf";
import { BEWORK_PDF, drawBeworkAccentLine } from "@/lib/be-work-brand-pdf";
import {
  beworkPdfFooterLine,
  buildLegalMentionsBlock,
  DEFAULT_COMMERCIAL_CONDITIONS,
  DEFAULT_PAYMENT_CONDITIONS_LINES,
  formatDesignationForPdf,
  isCommercialPdfLayout,
  isDraftStatus,
  parsePresentationSettings,
  quoteStatusLabelForPdf,
  resolvePdfIssuer,
  resolveQuoteObject,
  type QuotePdfIssuer,
  type QuotePdfPresentationSettings,
} from "@/lib/be-work-devis-pdf-presentation";
import { formatClientLinesForPdf } from "@/lib/quote-client-form";

const C = BEWORK_PDF;
const MARGIN = 14;
const FOOTER_H = 14;

/** Montants au format français : 8 018,90 € */
export function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateLong(d: Date): string {
  const raw = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function fmtQty(n: number): string {
  const v = Number(n);
  if (Number.isInteger(v)) return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

function fmtPct(n: number): string {
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)} %`;
}

type TableCols = {
  ref: number;
  desc: number;
  unit: number;
  qty: number;
  pu: number;
  tva: number;
  ht: number;
  descW: number;
  right: number;
};

type PdfCtx = {
  doc: jsPDF;
  pageW: number;
  pageH: number;
  y: number;
  settings: QuotePdfPresentationSettings;
  issuer: QuotePdfIssuer;
  document: QuoteDocument & { project: QuoteProject };
  cols: TableCols;
  isEstimation: boolean;
  isDraft: boolean;
  tableHeaderDrawn: boolean;
};

function buildCols(pageW: number, showVat: boolean, commercial: boolean): TableCols {
  const right = pageW - MARGIN;
  const ht = right - 1;
  const tva = ht - (showVat ? 14 : 0);
  const pu = tva - 22;
  const qty = pu - 18;
  if (commercial) {
    const desc = MARGIN + 16;
    const ref = MARGIN;
    const descW = qty - desc - 4;
    return { ref, desc, unit: qty, qty, pu, tva: showVat ? tva : pu, ht, descW, right };
  }
  const unit = qty - 14;
  const desc = MARGIN + 14;
  const ref = MARGIN;
  const descW = unit - desc - 4;
  return { ref, desc, unit, qty, pu, tva: showVat ? tva : pu, ht, descW, right };
}

function footerReserve(ctx: PdfCtx): number {
  return FOOTER_H + (ctx.isEstimation ? 6 : 4);
}

function paintPageBase(ctx: PdfCtx) {
  const { doc, pageW, pageH } = ctx;
  doc.setFillColor(...C.white);
  doc.rect(0, 0, pageW, pageH, "F");
}

function drawDraftWatermark(ctx: PdfCtx) {
  if (!ctx.isDraft || ctx.isEstimation) return;
  const { doc, pageW, pageH } = ctx;
  doc.setTextColor(220, 224, 230);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.text("BROUILLON", pageW / 2, pageH / 2, { align: "center", angle: 35 });
  doc.setFontSize(14);
  doc.text("NON CONTRACTUEL", pageW / 2, pageH / 2 + 14, { align: "center", angle: 35 });
}

function drawEstimationBanner(ctx: PdfCtx) {
  if (!ctx.isEstimation) return;
  const { doc, pageW } = ctx;
  doc.setFillColor(...C.panelBlue);
  doc.setDrawColor(...C.borderAccent);
  doc.rect(MARGIN, ctx.y, pageW - 2 * MARGIN, 10, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.navy);
  doc.text(
    "ESTIMATION INDICATIVE BeWork — document non contractuel",
    pageW / 2,
    ctx.y + 6.5,
    { align: "center" },
  );
  ctx.y += 13;
}

function tryDrawIssuerLogo(doc: jsPDF, issuer: QuotePdfIssuer, x: number, y: number): number {
  const candidates: string[] = [];
  if (issuer.logoPath) {
    const p = issuer.logoPath.startsWith("/")
      ? path.join(process.cwd(), "public", issuer.logoPath.replace(/^\//, ""))
      : path.join(process.cwd(), issuer.logoPath);
    candidates.push(p);
  }
  for (const c of candidates) {
    if (!fs.existsSync(c)) continue;
    try {
      const data = fs.readFileSync(c);
      const ext = c.toLowerCase().endsWith(".jpg") || c.toLowerCase().endsWith(".jpeg") ? "JPEG" : "PNG";
      doc.addImage(`data:image/${ext.toLowerCase()};base64,${data.toString("base64")}`, ext, x, y, 32, 14);
      return 16;
    } catch {
      /* ignore */
    }
  }
  return 0;
}

function drawIssuerLines(doc: jsPDF, issuer: QuotePdfIssuer, x: number, y: number, maxW: number): number {
  let cy = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.navy);
  doc.text(issuer.companyName || "Entreprise émettrice", x, cy);
  cy += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate);
  for (const line of [issuer.addressLine1, issuer.addressLine2].filter(Boolean)) {
    for (const w of doc.splitTextToSize(line!, maxW)) {
      doc.text(w, x, cy);
      cy += 3.4;
    }
  }
  for (const line of [issuer.phone && `Tél. ${issuer.phone}`, issuer.email].filter(Boolean)) {
    doc.text(line!, x, cy);
    cy += 3.4;
  }
  const ids = [
    issuer.siret && `SIRET ${issuer.siret}`,
    issuer.tvaNumber && `TVA ${issuer.tvaNumber}`,
    issuer.apeCode && `APE ${issuer.apeCode}`,
  ].filter(Boolean);
  if (ids.length) {
    for (const w of doc.splitTextToSize(ids.join(" · "), maxW)) {
      doc.text(w, x, cy);
      cy += 3.4;
    }
  }
  if (issuer.insuranceName || issuer.insurancePolicy) {
    for (const w of doc.splitTextToSize(
      `Assurance : ${[issuer.insuranceName, issuer.insurancePolicy].filter(Boolean).join(" — ")}`,
      maxW,
    )) {
      doc.text(w, x, cy);
      cy += 3.4;
    }
  }
  return cy;
}

/** En-tête type ERP : titre + client à droite, sans coordonnées société. */
function drawCommercialHeader(ctx: PdfCtx) {
  const { doc, document, pageW } = ctx;
  const p = document.project;
  const rightX = pageW - MARGIN;
  let ry = MARGIN + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.navy);
  const titleLines = doc.splitTextToSize(document.title.trim() || "Titre du devis", 88);
  for (const line of titleLines) {
    doc.text(line, rightX, ry, { align: "right" });
    ry += 4.5;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.slate);
  doc.text(p.clientName, rightX, ry, { align: "right" });
  ry += 4;
  for (const line of formatClientLinesForPdf(p)) {
    for (const w of doc.splitTextToSize(line, 88)) {
      doc.text(w, rightX, ry, { align: "right" });
      ry += 3.6;
    }
  }

  ctx.y = Math.max(ry, MARGIN + 28) + 6;
  const prov = ctx.isDraft ? " (PROVISOIRE)" : "";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...C.ink);
  doc.text(`DEVIS N° ${document.documentNumber}${prov}`, pageW / 2, ctx.y, { align: "center" });
  ctx.y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...C.slate);
  doc.text(fmtDateLong(new Date(document.issueDate)), pageW / 2, ctx.y, { align: "center" });
  ctx.y += 5;
  if (document.validityDate) {
    doc.setFontSize(8);
    doc.text(`Valable jusqu'au ${fmtDate(new Date(document.validityDate))}`, pageW / 2, ctx.y, { align: "center" });
    ctx.y += 5;
  }
  ctx.y += 4;
}

function drawDocumentMetaBox(ctx: PdfCtx) {
  const { doc, document, pageW, issuer, settings } = ctx;

  if (isCommercialPdfLayout(settings)) {
    drawCommercialHeader(ctx);
    return;
  }

  const boxW = 58;
  const boxX = pageW - MARGIN - boxW;
  const boxY = MARGIN;
  doc.setFillColor(...C.panelBlue);
  doc.setDrawColor(...C.borderAccent);
  doc.setLineWidth(0.25);
  doc.roundedRect(boxX, boxY, boxW, 34, 2, 2, "FD");
  let ty = boxY + 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C.navy);
  doc.text("DEVIS", boxX + boxW / 2, ty, { align: "center" });
  ty += 6;
  doc.setFontSize(8);
  doc.setTextColor(...C.slate);
  doc.text(`N° ${document.documentNumber}`, boxX + boxW / 2, ty, { align: "center" });
  ty += 4.5;
  doc.text(`Émis le ${fmtDate(new Date(document.issueDate))}`, boxX + boxW / 2, ty, { align: "center" });
  ty += 4.5;
  if (document.validityDate) {
    doc.text(`Valable jusqu'au ${fmtDate(new Date(document.validityDate))}`, boxX + boxW / 2, ty, {
      align: "center",
    });
    ty += 4.5;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.accent);
  doc.text(quoteStatusLabelForPdf(document.status).toUpperCase(), boxX + boxW / 2, ty, { align: "center" });

  const leftW = pageW - 2 * MARGIN - boxW - 6;
  const logoH = tryDrawIssuerLogo(doc, issuer, MARGIN, MARGIN);
  const textY = logoH > 0 ? MARGIN + logoH + 2 : MARGIN;
  const bottomLeft = drawIssuerLines(doc, issuer, MARGIN, textY, leftW);
  ctx.y = Math.max(bottomLeft, boxY + 36) + 4;
  ctx.issuer = issuer;
}

function drawCard(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
  w: number,
  lines: string[],
): number {
  const h = 8 + lines.length * 3.6;
  doc.setFillColor(252, 252, 253);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.muted);
  doc.text(title.toUpperCase(), x + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.ink);
  let ly = y + 9;
  for (const line of lines) {
    if (!line) continue;
    for (const wline of doc.splitTextToSize(line, w - 6)) {
      doc.text(wline, x + 3, ly);
      ly += 3.6;
    }
  }
  return h;
}

function drawClientProjectCards(ctx: PdfCtx) {
  const { doc, document, pageW } = ctx;
  const p = document.project;
  const gap = 5;
  const cardW = (pageW - 2 * MARGIN - gap) / 2;
  const clientLines = [
    p.clientName,
    [p.projectAddress, p.projectCity, p.projectDepartment].filter(Boolean).join(", ") || undefined,
    p.clientEmail,
    p.clientPhone,
    p.clientReference && `Réf. client : ${p.clientReference}`,
  ].filter(Boolean) as string[];
  const projectLines = [
    p.projectName,
    p.projectAddress && `Chantier : ${p.projectAddress}`,
    [p.projectCity, p.projectDepartment].filter(Boolean).join(" — ") || undefined,
    p.projectType && `Type : ${p.projectType}`,
    `Réf. devis : ${document.documentNumber}`,
  ].filter(Boolean) as string[];
  const h1 = drawCard(doc, "Client", MARGIN, ctx.y, cardW, clientLines);
  const h2 = drawCard(doc, "Projet", MARGIN + cardW + gap, ctx.y, cardW, projectLines);
  ctx.y += Math.max(h1, h2) + 5;
}

function drawObjectBlock(ctx: PdfCtx, objectText: string) {
  const { doc, pageW } = ctx;
  doc.setFillColor(...C.panelBlue);
  doc.setDrawColor(...C.borderAccent);
  doc.roundedRect(MARGIN, ctx.y, pageW - 2 * MARGIN, 12, 1, 1, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.navy);
  doc.text("OBJET DU DEVIS", MARGIN + 3, ctx.y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.ink);
  for (const line of doc.splitTextToSize(objectText, pageW - 2 * MARGIN - 6)) {
    doc.text(line, MARGIN + 3, ctx.y + 9);
  }
  ctx.y += 15;
}

function drawTableHeader(ctx: PdfCtx) {
  const { doc, cols, settings } = ctx;
  const commercial = isCommercialPdfLayout(settings);
  const headerH = 8;
  doc.setFillColor(240, 240, 242);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.rect(MARGIN, ctx.y, cols.right - MARGIN, headerH, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.navy);
  const hy = ctx.y + 5.2;
  if (commercial) {
    doc.text("Référence", cols.ref + 1, hy);
    doc.text("Désignation", cols.desc, hy);
    doc.text("Quantité", cols.qty + 14, hy, { align: "right" });
    doc.text("PU Vente", cols.pu + 20, hy, { align: "right" });
    if (settings.showLineVat) doc.text("TVA", cols.tva + 10, hy, { align: "right" });
    doc.text("Montant HT", cols.ht, hy, { align: "right" });
  } else {
    doc.text("Réf.", cols.ref + 1, hy);
    doc.text("Désignation", cols.desc, hy);
    doc.text("Unité", cols.unit + 12, hy, { align: "right" });
    doc.text("Qté", cols.qty + 14, hy, { align: "right" });
    doc.text("PU HT", cols.pu + 20, hy, { align: "right" });
    if (settings.showLineVat) doc.text("TVA", cols.tva + 10, hy, { align: "right" });
    doc.text("Total HT", cols.ht, hy, { align: "right" });
  }
  ctx.y += headerH + 1;
  ctx.tableHeaderDrawn = true;
}

function drawContinuationHeader(ctx: PdfCtx) {
  const { doc, document, issuer, pageW, settings } = ctx;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.navy);
  const leftLabel = isCommercialPdfLayout(settings)
    ? document.title.slice(0, 48)
    : issuer.companyName || "Entreprise";
  doc.text(leftLabel, MARGIN, ctx.y + 4);
  doc.text(`DEVIS N° ${document.documentNumber}`, pageW - MARGIN, ctx.y + 4, { align: "right" });
  ctx.y += 8;
  drawBeworkAccentLine(doc, ctx.y, MARGIN, pageW);
  ctx.y += 2;
  drawTableHeader(ctx);
}

function ensureSpace(ctx: PdfCtx, needed: number) {
  if (ctx.y + needed > ctx.pageH - footerReserve(ctx)) {
    ctx.doc.addPage();
    paintPageBase(ctx);
    drawDraftWatermark(ctx);
    ctx.y = MARGIN;
    drawContinuationHeader(ctx);
  }
}

function drawLotBanner(ctx: PdfCtx, lot: string) {
  ensureSpace(ctx, 10);
  const { doc, cols } = ctx;
  doc.setFillColor(...C.navy);
  doc.rect(MARGIN, ctx.y, cols.right - MARGIN, 6.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(lot.toUpperCase(), MARGIN + 3, ctx.y + 4.5);
  ctx.y += 8;
}

function drawLineRow(ctx: PdfCtx, row: QuoteLine, ht: number) {
  const { doc, cols, settings } = ctx;
  const { headline, body } = formatDesignationForPdf(row.title, row.description, settings.designationMode);
  const bodyLines = body ? doc.splitTextToSize(body, cols.descW) : [];
  const headlineLines = doc.splitTextToSize(headline, cols.descW);
  const rowH = Math.max(9, 4 + headlineLines.length * 3.3 + bodyLines.length * 3);
  ensureSpace(ctx, rowH + 2);

  const numY = ctx.y + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text(row.code ?? "—", cols.ref + 1, numY);

  let dy = ctx.y + 3.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.ink);
  for (const hl of headlineLines) {
    doc.text(hl, cols.desc, dy);
    dy += 3.3;
  }
  if (bodyLines.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...C.muted);
    for (const bl of bodyLines) {
      doc.text(bl, cols.desc, dy);
      dy += 3;
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.slate);
  if (!isCommercialPdfLayout(settings)) {
    doc.text(row.unit, cols.unit + 12, numY, { align: "right" });
  }
  doc.text(fmtQty(Number(row.quantity)), cols.qty + 14, numY, { align: "right" });
  doc.text(fmtEur(Number(row.unitPriceHT)), cols.pu + 20, numY, { align: "right" });
  if (settings.showLineVat) doc.text(fmtPct(Number(row.vatRate)), cols.tva + 10, numY, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(fmtEur(ht), cols.ht, numY, { align: "right" });

  ctx.y = Math.max(dy, numY) + 4;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.1);
  doc.line(MARGIN, ctx.y, cols.right, ctx.y);
  ctx.y += 1.5;
}

function drawLotSubtotal(ctx: PdfCtx, lot: string, subHt: number, subTtc: number) {
  if (!ctx.settings.showLotSubtotals) return;
  ensureSpace(ctx, 7);
  ctx.doc.setFont("helvetica", "italic");
  ctx.doc.setFontSize(7);
  ctx.doc.setTextColor(...C.muted);
  ctx.doc.text(`Sous-total ${lot} — ${fmtEur(subHt)} HT · ${fmtEur(subTtc)} TTC`, ctx.cols.desc, ctx.y + 3);
  ctx.y += 7;
}

function drawTotals(ctx: PdfCtx, grandHt: number, grandVat: number, grandTtc: number) {
  ensureSpace(ctx, 38);
  const { doc, cols } = ctx;
  const boxW = 70;
  const boxX = cols.ht - boxW + 6;
  const boxY = ctx.y + 2;

  doc.setFillColor(...C.panelBlue);
  doc.setDrawColor(...C.borderAccent);
  doc.setLineWidth(0.35);
  doc.roundedRect(boxX, boxY, boxW, 32, 2, 2, "FD");

  let ty = boxY + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.slate);
  doc.text("Total HT", boxX + 4, ty);
  doc.text(fmtEur(grandHt), cols.ht, ty, { align: "right" });
  ty += 6;
  doc.text("Total TVA", boxX + 4, ty);
  doc.text(fmtEur(grandVat), cols.ht, ty, { align: "right" });
  ty += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.navy);
  doc.text("Total TTC", boxX + 4, ty);
  doc.text(fmtEur(grandTtc), cols.ht, ty, { align: "right" });
  ty += 7;
  doc.setFontSize(9);
  doc.text("Net à payer TTC", boxX + 4, ty);
  doc.text(fmtEur(grandTtc), cols.ht, ty, { align: "right" });
  ctx.y = boxY + 36;
}

function drawSectionTitle(ctx: PdfCtx, title: string) {
  ensureSpace(ctx, 12);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(8);
  ctx.doc.setTextColor(...C.navy);
  ctx.doc.text(title, MARGIN, ctx.y + 3);
  ctx.y += 6;
}

function drawParagraphBlock(ctx: PdfCtx, text: string) {
  const { doc, pageW } = ctx;
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(6.8);
  ctx.doc.setTextColor(...C.slate);
  for (const line of doc.splitTextToSize(text, pageW - 2 * MARGIN)) {
    ensureSpace(ctx, 4);
    ctx.doc.text(line, MARGIN, ctx.y);
    ctx.y += 3.2;
  }
  ctx.y += 3;
}

function drawCommercialClosing(ctx: PdfCtx, grandHt: number, grandVat: number, grandTtc: number, commercialText: string) {
  ensureSpace(ctx, 52);
  const { doc, pageW, settings } = ctx;
  const leftW = (pageW - 2 * MARGIN) * 0.55;
  const rightX = MARGIN + leftW + 6;
  const startY = ctx.y;

  if (settings.showSignatureBlock && !ctx.isEstimation) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.navy);
    doc.text("Bon pour Accord", MARGIN, ctx.y + 3);
    ctx.y += 6;
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, ctx.y, leftW - 4, 22);
    ctx.y += 26;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.navy);
  doc.text("Conditions de paiement", MARGIN, ctx.y + 3);
  ctx.y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.slate);
  const payLines = commercialText.split("\n").filter((l) => /%|acompte|solde|paiement/i.test(l));
  const linesToShow = payLines.length >= 2 ? payLines.slice(0, 5) : [...DEFAULT_PAYMENT_CONDITIONS_LINES];
  for (const line of linesToShow) {
    doc.text(line, MARGIN, ctx.y);
    ctx.y += 3.8;
  }

  const boxW = pageW - MARGIN - rightX;
  const boxY = startY;
  doc.setFillColor(245, 245, 247);
  doc.setDrawColor(...C.border);
  doc.rect(rightX, boxY, boxW, 32, "FD");
  let ty = boxY + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.slate);
  doc.text("Total HT", rightX + 4, ty);
  doc.text(fmtEur(grandHt), pageW - MARGIN - 2, ty, { align: "right" });
  ty += 7;
  doc.text("TVA", rightX + 4, ty);
  doc.text(fmtEur(grandVat), pageW - MARGIN - 2, ty, { align: "right" });
  ty += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.navy);
  doc.text("Total TTC", rightX + 4, ty);
  doc.text(fmtEur(grandTtc), pageW - MARGIN - 2, ty, { align: "right" });

  ctx.y = Math.max(ctx.y, boxY + 36) + 4;
}

function drawSignature(ctx: PdfCtx) {
  if (!ctx.settings.showSignatureBlock || ctx.isEstimation) return;
  if (isCommercialPdfLayout(ctx.settings)) return;
  ensureSpace(ctx, 32);
  const { doc, issuer, pageW } = ctx;
  drawSectionTitle(ctx, "Bon pour accord");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text('Mention « Lu et accepté, bon pour accord » — Date : ___ / ___ / ______', MARGIN, ctx.y);
  ctx.y += 4;
  doc.text(`Nom du signataire : ${" ".repeat(40)}`, MARGIN, ctx.y);
  ctx.y += 5;
  doc.setDrawColor(...C.borderAccent);
  doc.rect(MARGIN, ctx.y, pageW - 2 * MARGIN, 18);
  ctx.y += 6;
  doc.setFontSize(6.5);
  doc.text(`Cachet et signature de ${issuer.companyName}`, MARGIN + 2, ctx.y + 12);
  ctx.y += 24;
}

function drawFooters(ctx: PdfCtx) {
  const { doc, document, issuer, pageW, pageH, settings } = ctx;
  const total = doc.getNumberOfPages();
  const footerLine = beworkPdfFooterLine(settings.pdfMode);
  const commercial = isCommercialPdfLayout(settings);
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawDraftWatermark(ctx);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.15);
    doc.line(MARGIN, pageH - FOOTER_H, pageW - MARGIN, pageH - FOOTER_H);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.text(
      commercial ? document.documentNumber : `${issuer.companyName} — ${document.documentNumber}`,
      MARGIN,
      pageH - 5,
    );
    doc.text(`Page ${p} / ${total}`, pageW - MARGIN, pageH - 5, { align: "right" });
    const footerLines = doc.splitTextToSize(footerLine, pageW - 2 * MARGIN);
    let fy = pageH - 9;
    for (const line of footerLines) {
      doc.text(line, pageW / 2, fy, { align: "center" });
      fy -= 2.8;
    }
  }
}

export function buildQuoteDocumentPdf(
  document: QuoteDocument & { project: QuoteProject },
  lines: QuoteLine[],
): Buffer {
  const settings = parsePresentationSettings(document.presentationSettings);
  const issuer = resolvePdfIssuer(document.project);
  const isEstimation = settings.pdfMode === "estimation";
  const isDraft = isDraftStatus(document.status);

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const commercial = isCommercialPdfLayout(settings);
  const cols = buildCols(pageW, settings.showLineVat, commercial);

  const ctx: PdfCtx = {
    doc,
    pageW,
    pageH,
    y: MARGIN,
    settings,
    issuer,
    document,
    cols,
    isEstimation,
    isDraft,
    tableHeaderDrawn: false,
  };

  paintPageBase(ctx);
  drawDraftWatermark(ctx);
  drawEstimationBanner(ctx);
  drawDocumentMetaBox(ctx);
  if (!commercial) {
    drawBeworkAccentLine(doc, ctx.y, MARGIN, pageW);
    ctx.y += 3;
    drawClientProjectCards(ctx);
  } else {
    drawBeworkAccentLine(doc, ctx.y, MARGIN, pageW);
    ctx.y += 3;
  }

  const sorted = [...lines].sort((a, b) => a.sortOrder - b.sortOrder || a.lot.localeCompare(b.lot, "fr"));
  const lots = [...new Set(sorted.map((l) => l.lot))];
  if (!commercial) {
    const objectText = resolveQuoteObject(document, document.project, lots);
    drawObjectBlock(ctx, objectText);
  }

  drawTableHeader(ctx);

  if (commercial && sorted.length === 0) {
    ensureSpace(ctx, 12);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...C.muted);
    doc.text("Cliquez ici pour saisir vos lignes", pageW / 2, ctx.y + 6, { align: "center" });
    ctx.y += 14;
  }

  let grandHt = 0;
  let grandVat = 0;
  let grandTtc = 0;

  for (const lot of lots) {
    const sub = sorted.filter((l) => l.lot === lot);
    let subHt = 0;
    let subTtc = 0;
    drawLotBanner(ctx, lot);
    for (const row of sub) {
      const ht = Number(row.totalHT);
      const ttc = Number(row.totalTTC);
      const vat = Number(row.totalVat);
      subHt += ht;
      subTtc += ttc;
      grandHt += ht;
      grandVat += vat;
      grandTtc += ttc;
      drawLineRow(ctx, row, ht);
    }
    drawLotSubtotal(ctx, lot, subHt, subTtc);
  }

  const commercialText =
    document.commercialConditions?.trim() ||
    (document.notesClient?.trim() ? `${DEFAULT_COMMERCIAL_CONDITIONS}\n\n${document.notesClient.trim()}` : DEFAULT_COMMERCIAL_CONDITIONS);

  if (commercial) {
    drawCommercialClosing(ctx, grandHt, grandVat, grandTtc, commercialText);
  } else {
    drawTotals(ctx, grandHt, grandVat, grandTtc);
    drawSectionTitle(ctx, "Conditions");
    drawParagraphBlock(ctx, commercialText);
  }

  drawSectionTitle(ctx, commercial ? "Mentions légales" : "Mentions légales et réserves");
  drawParagraphBlock(
    ctx,
    buildLegalMentionsBlock(issuer, document, { includeIssuerIds: !commercial && settings.showIssuerOnPdf }),
  );

  drawSignature(ctx);
  drawFooters(ctx);

  return Buffer.from(doc.output("arraybuffer"));
}
