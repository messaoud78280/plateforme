import { jsPDF } from "jspdf";
import { COMMERCIAL_AMENDMENT_STATUS_LABELS } from "@/lib/commercial/money";
import type { QuotePdfSnapshot } from "@/lib/commercial/pdf-quote";

export type AmendmentPdfInput = {
  number: string;
  subject: string;
  status: string;
  issueDate: Date;
  quoteNumber: string;
  projectTitle?: string | null;
  clientNotes?: string | null;
  issuer: QuotePdfSnapshot | null;
  client: QuotePdfSnapshot | null;
  siteAddressSnapshot?: string | null;
  lines: Array<{
    designation: string;
    quantity: number;
    unit: string;
    unitSellHt: number;
    lineSellHt: number;
  }>;
  totals: {
    totalSellHt: number;
    totalVat: number;
    totalTtc: number;
  };
  /** Impact HT de l’avenant (souvent = totalSellHt). Affiché si ACCEPTED. */
  impactHt?: number | null;
  /** Marché actualisé HT après avenants acceptés — si fourni et ACCEPTED. */
  updatedMarketHt?: number | null;
  initialMarketHt?: number | null;
};

const MARGIN = 14;
const NAVY: [number, number, number] = [30, 58, 95];
const SLATE: [number, number, number] = [71, 85, 105];
const LIGHT: [number, number, number] = [241, 245, 249];
const AMBER: [number, number, number] = [180, 83, 9];

function pdfSafe(raw: string): string {
  return raw.replace(/\u202f/g, " ").replace(/\u00a0/g, " ");
}

function fmtEur(n: number): string {
  return pdfSafe(
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n),
  );
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtQty(n: number): string {
  if (Number.isInteger(n)) {
    return pdfSafe(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n));
  }
  return pdfSafe(
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n),
  );
}

function snapshotLines(s: QuotePdfSnapshot | null): string[] {
  if (!s) return ["—"];
  const lines: string[] = [];
  const name = s.tradeName || s.name;
  if (name) lines.push(name);
  if (s.siret) lines.push(`SIRET ${s.siret}`);
  const addr = s.addressLine1 || s.address;
  if (addr) lines.push(addr);
  if (s.addressLine2) lines.push(s.addressLine2);
  const city = [s.postalCode || s.zipCode, s.city].filter(Boolean).join(" ");
  if (city) lines.push(city);
  if (s.country && s.country !== "France") lines.push(s.country);
  if (s.email) lines.push(s.email);
  if (s.phone) lines.push(s.phone);
  return lines.length ? lines : ["—"];
}

function isContractual(status: string): boolean {
  return status === "ACCEPTED";
}

/** PDF avenant — projection non contractuelle tant que non accepté. */
export function buildAmendmentPdfBuffer(input: AmendmentPdfInput): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  if (typeof doc.setCreationDate === "function") {
    doc.setCreationDate(input.issueDate);
  }
  doc.setProperties({
    title: `Avenant ${input.number}`,
    subject: input.subject,
    creator: "BeWork Devis & Facturation",
  });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = MARGIN;

  const ensureSpace = (need: number) => {
    if (y + need > pageH - 18) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const contractual = isContractual(input.status);

  // Bannière projection
  if (!contractual) {
    doc.setFillColor(254, 243, 199);
    doc.rect(0, 0, pageW, 12, "F");
    doc.setTextColor(...AMBER);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(
      "PROJECTION — non contractuel tant que non accepté",
      pageW / 2,
      7.5,
      { align: "center" },
    );
    y = 18;
  }

  // Émetteur
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const issuerName = input.issuer?.name || input.issuer?.tradeName || "Émetteur";
  doc.text(issuerName, MARGIN, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  for (const line of snapshotLines(input.issuer).slice(1)) {
    doc.text(line, MARGIN, y);
    y += 3.5;
  }

  const headerTop = contractual ? MARGIN : 18;
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("AVENANT", pageW - MARGIN, headerTop + 2, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(input.number, pageW - MARGIN, headerTop + 8, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(`Date : ${fmtDate(input.issueDate)}`, pageW - MARGIN, headerTop + 13, {
    align: "right",
  });
  doc.text(`Devis : ${input.quoteNumber}`, pageW - MARGIN, headerTop + 17, {
    align: "right",
  });
  const statusLabel = COMMERCIAL_AMENDMENT_STATUS_LABELS[input.status] ?? input.status;
  doc.text(`Statut : ${statusLabel}`, pageW - MARGIN, headerTop + 21, { align: "right" });

  y = Math.max(y, headerTop + 28);

  // Client
  doc.setFillColor(...LIGHT);
  doc.roundedRect(MARGIN, y, pageW - MARGIN * 2, 28, 2, 2, "F");
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Client", MARGIN + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  let cy = y + 10;
  for (const line of snapshotLines(input.client)) {
    doc.text(line, MARGIN + 3, cy);
    cy += 3.5;
  }
  if (input.siteAddressSnapshot || input.projectTitle) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("Chantier", pageW / 2, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    const siteText = [input.projectTitle, input.siteAddressSnapshot].filter(Boolean).join(" — ");
    const siteLines = doc.splitTextToSize(siteText, pageW / 2 - MARGIN - 4);
    doc.text(siteLines, pageW / 2, y + 10);
  }
  y += 34;

  // Objet
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Objet", MARGIN, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  const subjectLines = doc.splitTextToSize(input.subject, pageW - MARGIN * 2);
  doc.text(subjectLines, MARGIN, y);
  y += subjectLines.length * 4.2 + 4;

  // Impact marché si accepté
  if (contractual && (input.impactHt != null || input.updatedMarketHt != null)) {
    ensureSpace(18);
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(MARGIN, y, pageW - MARGIN * 2, 16, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text("Impact contractuel", MARGIN + 3, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    const impact = input.impactHt ?? input.totals.totalSellHt;
    doc.text(`Impact avenant HT : ${fmtEur(impact)}`, MARGIN + 3, y + 10);
    if (input.initialMarketHt != null) {
      doc.text(`Marché initial HT : ${fmtEur(input.initialMarketHt)}`, pageW / 2, y + 10);
    }
    if (input.updatedMarketHt != null) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...NAVY);
      doc.text(`Marché actualisé HT : ${fmtEur(input.updatedMarketHt)}`, MARGIN + 3, y + 14.5);
    }
    y += 20;
  }

  // Table
  const colDesc = MARGIN;
  const colQty = pageW - MARGIN - 78;
  const colPu = pageW - MARGIN - 52;
  const colHt = pageW - MARGIN;

  const drawTableHeader = () => {
    doc.setFillColor(...NAVY);
    doc.rect(MARGIN, y, pageW - MARGIN * 2, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Désignation", colDesc + 1, y + 4.5);
    doc.text("Qté", colQty, y + 4.5, { align: "right" });
    doc.text("P.U. HT", colPu, y + 4.5, { align: "right" });
    doc.text("Total HT", colHt, y + 4.5, { align: "right" });
    y += 9;
  };

  drawTableHeader();

  for (const line of input.lines) {
    const desc = doc.splitTextToSize(line.designation, colQty - colDesc - 6);
    const rowH = Math.max(6, desc.length * 3.6 + 2);
    ensureSpace(rowH + 2);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(desc, colDesc + 1, y + 3);
    doc.text(`${fmtQty(line.quantity)} ${line.unit}`, colQty, y + 3, { align: "right" });
    doc.text(fmtEur(line.unitSellHt), colPu, y + 3, { align: "right" });
    doc.text(fmtEur(line.lineSellHt), colHt, y + 3, { align: "right" });
    y += rowH;
  }

  ensureSpace(32);
  y += 4;
  const boxW = 70;
  const boxX = pageW - MARGIN - boxW;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, y, boxW, 26, 2, 2, "S");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.setFont("helvetica", "normal");
  doc.text("Total HT", boxX + 3, y + 7);
  doc.text(fmtEur(input.totals.totalSellHt), boxX + boxW - 3, y + 7, { align: "right" });
  doc.text("TVA", boxX + 3, y + 14);
  doc.text(fmtEur(input.totals.totalVat), boxX + boxW - 3, y + 14, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Total TTC", boxX + 3, y + 22);
  doc.text(fmtEur(input.totals.totalTtc), boxX + boxW - 3, y + 22, { align: "right" });
  y += 32;

  if (input.clientNotes) {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text("Notes", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    const notes = doc.splitTextToSize(input.clientNotes, pageW - MARGIN * 2);
    doc.text(notes, MARGIN, y);
  }

  // Filigrane projection sur chaque page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    if (!contractual) {
      doc.setTextColor(226, 232, 240);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(42);
      doc.text("PROJECTION", pageW / 2, pageH / 2, {
        align: "center",
        angle: 35,
      });
    }
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    const footer = contractual
      ? `Page ${i} / ${pages} — ${input.number} (accepté)`
      : `Page ${i} / ${pages} — ${input.number} — projection`;
    doc.text(footer, pageW / 2, pageH - 8, { align: "center" });
  }

  const ab = doc.output("arraybuffer");
  return Buffer.from(ab);
}

/** Alias. */
export function renderAmendmentPdf(input: AmendmentPdfInput): Buffer {
  return buildAmendmentPdfBuffer(input);
}
