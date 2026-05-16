import fs from "fs";
import path from "path";
import type { QuoteDocument, QuoteLine, QuoteProject } from "@prisma/client";
import { jsPDF } from "jspdf";
import { QUOTE_DOCUMENT_TYPE_LABELS } from "@/lib/be-work-devis-quote-labels";

const BLUE: [number, number, number] = [30, 58, 95];
const SLATE: [number, number, number] = [71, 85, 105];

function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR");
}

function fmtPct(n: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n)} %`;
}

export function buildQuoteDocumentPdf(
  document: QuoteDocument & { project: QuoteProject },
  lines: QuoteLine[],
): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  let y = margin;

  const tryLogo = path.join(process.cwd(), "public", "BeWork.logo.png");
  if (fs.existsSync(tryLogo)) {
    try {
      const data = fs.readFileSync(tryLogo);
      const base64 = data.toString("base64");
      doc.addImage(`data:image/png;base64,${base64}`, "PNG", margin, y, 28, 10);
    } catch {
      /* ignore */
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BLUE);
  doc.text(document.title, margin + 32, y + 7);
  y += 16;

  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${document.documentNumber}`, margin, y);
  doc.text(QUOTE_DOCUMENT_TYPE_LABELS[document.documentType], margin + 55, y);
  y += 5;
  doc.text(`Émission : ${fmtDate(new Date(document.issueDate))}`, margin, y);
  if (document.validityDate) {
    doc.text(`Validité : ${fmtDate(new Date(document.validityDate))}`, margin + 55, y);
  }
  y += 8;

  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Client", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const clientLines = [
    document.project.clientName,
    document.project.clientEmail ?? "",
    document.project.clientPhone ?? "",
  ].filter(Boolean);
  for (const line of clientLines) {
    doc.text(line, margin, y);
    y += 4;
  }
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.text("Projet", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const projLines = doc.splitTextToSize(
    [
      document.project.projectName,
      [document.project.projectAddress, document.project.projectCity, document.project.projectDepartment]
        .filter(Boolean)
        .join(" · "),
    ]
      .filter(Boolean)
      .join("\n"),
    pageW - 2 * margin,
  );
  for (const pl of projLines) {
    doc.text(pl, margin, y);
    y += 4;
  }
  y += 4;

  const sorted = [...lines].sort((a, b) => a.sortOrder - b.sortOrder || a.lot.localeCompare(b.lot, "fr"));
  const lots = [...new Set(sorted.map((l) => l.lot))];

  const colLot = margin;
  const colCode = margin + 18;
  const colDesc = margin + 34;
  const colU = pageW - margin - 78;
  const colQ = pageW - margin - 68;
  const colPu = pageW - margin - 54;
  const colTva = pageW - margin - 40;
  const colHt = pageW - margin - 26;
  const colTtc = pageW - margin - 10;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 22) {
      doc.addPage();
      y = margin;
    }
  };

  const drawHeader = () => {
    ensureSpace(10);
    doc.setFillColor(240, 244, 250);
    doc.rect(margin, y - 1, pageW - 2 * margin, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...BLUE);
    doc.text("Lot", colLot, y + 4);
    doc.text("Code", colCode, y + 4);
    doc.text("Désignation", colDesc, y + 4);
    doc.text("U", colU, y + 4);
    doc.text("Qté", colQ, y + 4);
    doc.text("PU HT", colPu, y + 4);
    doc.text("TVA", colTva, y + 4);
    doc.text("HT", colHt, y + 4);
    doc.text("TTC", colTtc, y + 4);
    y += 9;
    doc.setTextColor(...SLATE);
    doc.setFont("helvetica", "normal");
  };

  drawHeader();

  let grandHt = 0;
  let grandVat = 0;
  let grandTtc = 0;

  for (const lot of lots) {
    const sub = sorted.filter((l) => l.lot === lot);
    let subHt = 0;
    let subTtc = 0;
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...BLUE);
    doc.text(`Lot — ${lot}`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);

    for (const row of sub) {
      const ht = Number(row.totalHT);
      const ttc = Number(row.totalTTC);
      const vat = Number(row.totalVat);
      subHt += ht;
      subTtc += ttc;
      grandHt += ht;
      grandVat += vat;
      grandTtc += ttc;

      const desc = doc.splitTextToSize(`${row.title}\n${row.description}`, colU - colDesc - 2);
      const rowH = Math.max(10, desc.length * 3.2 + 2);
      ensureSpace(rowH + 2);

      doc.text(row.lot.length > 14 ? `${row.lot.slice(0, 12)}…` : row.lot, colLot, y + 3);
      doc.text(row.code ?? "—", colCode, y + 3);
      doc.text(row.unit, colU, y + 3);
      doc.text(String(Number(row.quantity)), colQ, y + 3);
      doc.text(fmtEur(Number(row.unitPriceHT)), colPu, y + 3);
      doc.text(fmtPct(Number(row.vatRate)), colTva, y + 3);
      doc.text(fmtEur(ht), colHt, y + 3);
      doc.text(fmtEur(ttc), colTtc, y + 3);
      let dy = y + 3;
      for (const d of desc) {
        doc.text(d, colDesc, dy);
        dy += 3.2;
      }
      y = dy + 2;
      doc.setDrawColor(230, 232, 237);
      doc.line(margin, y, pageW - margin, y);
      y += 2;
    }

    ensureSpace(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`Sous-total lot (${fmtEur(subHt)} HT · ${fmtEur(subTtc)} TTC)`, margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
  }

  ensureSpace(20);
  doc.setDrawColor(...BLUE);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Total HT : ${fmtEur(grandHt)}`, margin, y);
  y += 5;
  doc.text(`Total TVA : ${fmtEur(grandVat)}`, margin, y);
  y += 5;
  doc.text(`Total TTC : ${fmtEur(grandTtc)}`, margin, y);
  y += 8;

  if (document.notesClient?.trim()) {
    ensureSpace(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Notes", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (const line of doc.splitTextToSize(document.notesClient.trim(), pageW - 2 * margin)) {
      ensureSpace(4);
      doc.text(line, margin, y);
      y += 3.5;
    }
    y += 4;
  }

  const legal = document.legalDisclaimer?.trim();
  if (legal) {
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Mentions", margin, y);
    y += 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    for (const line of doc.splitTextToSize(legal, pageW - 2 * margin)) {
      ensureSpace(4);
      doc.text(line, margin, y);
      y += 3.4;
    }
    y += 4;
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...SLATE);
    doc.text(`BeWork — page ${p} / ${totalPages}`, margin, pageH - 10);
    doc.text("Document interne — outil d’aide au chiffrage", pageW - margin - 58, pageH - 10);
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export { fmtEur, fmtDate, fmtPct };
