import { jsPDF } from "jspdf";
import {
  COMMERCIAL_INVOICE_STATUS_LABELS,
  COMMERCIAL_INVOICE_TYPE_LABELS,
} from "@/lib/commercial/money";
import type { QuotePdfSnapshot } from "@/lib/commercial/pdf-quote";

export type InvoicePdfInput = {
  number: string;
  subject: string;
  status: string;
  type: string;
  issueDate: Date;
  dueDate?: Date | null;
  issuedAt?: Date | null;
  clientNotes?: string | null;
  projectTitle?: string | null;
  siteAddressSnapshot?: string | null;
  quoteNumber?: string | null;
  issuer: QuotePdfSnapshot | null;
  client: QuotePdfSnapshot | null;
  currency: string;
  invoiceMentions?: string | null;
  legalMentions?: string | null;
  bankIban?: string | null;
  bankBic?: string | null;
  bankName?: string | null;
  depositPercent?: number | null;
  worksSellHt?: number | null;
  worksVat?: number | null;
  worksTtc?: number | null;
  retentionAmountHt?: number | null;
  retentionRate?: number | null;
  depositDeductedHt?: number | null;
  totals: {
    totalSellHt: number;
    totalVat: number;
    totalTtc: number;
    amountPaid: number;
    amountDue: number;
  };
  lines: Array<{
    designation: string;
    description?: string | null;
    quantity: number;
    unit: string;
    unitSellHt: number;
    vatRate: number;
    lineSellHt: number;
  }>;
};

const MARGIN = 14;
const NAVY: [number, number, number] = [30, 58, 95];
const SLATE: [number, number, number] = [71, 85, 105];
const LIGHT: [number, number, number] = [241, 245, 249];

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
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtQty(n: number): string {
  if (Number.isInteger(n)) {
    return pdfSafe(
      new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n),
    );
  }
  return pdfSafe(
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n),
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

function tryDrawLogo(
  doc: jsPDF,
  logoPath: string | null | undefined,
  x: number,
  y: number,
): number {
  if (!logoPath?.trim()) return 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const raw = logoPath.trim();
    if (
      raw.startsWith("http://") ||
      raw.startsWith("https://") ||
      raw.startsWith("data:")
    ) {
      return 0;
    }
    const p = raw.startsWith("/")
      ? path.join(process.cwd(), "public", raw.replace(/^\//, ""))
      : path.join(process.cwd(), raw);
    if (!fs.existsSync(p)) return 0;
    const data = fs.readFileSync(p);
    const lower = p.toLowerCase();
    const ext = lower.endsWith(".jpg") || lower.endsWith(".jpeg") ? "JPEG" : "PNG";
    const mime = ext === "JPEG" ? "jpeg" : "png";
    doc.addImage(
      `data:image/${mime};base64,${data.toString("base64")}`,
      ext,
      x,
      y,
      28,
      12,
    );
    return 14;
  } catch {
    return 0;
  }
}

function stabilizePdfDocumentIds(pdf: Buffer): Buffer {
  const latin = pdf.toString("latin1");
  const fixed =
    "/ID[<00000000000000000000000000000000><00000000000000000000000000000000>]";
  const next = latin.replace(/\/ID\s*\[[^\]]*\]/g, fixed);
  return Buffer.from(next, "latin1");
}

/** PDF facture client — même charte que le devis, sans logo BeWork. */
export function generateInvoicePdfBuffer(input: InvoicePdfInput): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  if (typeof doc.setCreationDate === "function") {
    doc.setCreationDate(input.issueDate);
  }
  doc.setProperties({
    title: `Facture ${input.number}`,
    subject: input.subject,
    creator: "BeWork Devis & Facturation",
  });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = MARGIN;
  let inTable = false;

  const ensureSpace = (need: number) => {
    if (y + need > pageH - 22) {
      doc.addPage();
      y = MARGIN;
      if (inTable) drawTableHeader();
    }
  };

  const logoH = tryDrawLogo(doc, input.issuer?.logoPath, MARGIN, y);
  const issuerTextY = logoH > 0 ? y + logoH + 1 : y;
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const issuerName = input.issuer?.name || input.issuer?.tradeName || "Émetteur";
  doc.text(issuerName, MARGIN, issuerTextY);
  let iy = issuerTextY + 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  for (const line of snapshotLines(input.issuer).slice(1)) {
    doc.text(line, MARGIN, iy);
    iy += 3.4;
  }

  const typeLabel = COMMERCIAL_INVOICE_TYPE_LABELS[input.type] ?? input.type;
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("FACTURE", pageW - MARGIN, MARGIN + 2, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(typeLabel, pageW - MARGIN, MARGIN + 8, { align: "right" });
  doc.setFontSize(10);
  doc.text(input.number, pageW - MARGIN, MARGIN + 14, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(`Date : ${fmtDate(input.issueDate)}`, pageW - MARGIN, MARGIN + 19, {
    align: "right",
  });
  if (input.dueDate) {
    doc.text(`Échéance : ${fmtDate(input.dueDate)}`, pageW - MARGIN, MARGIN + 23, {
      align: "right",
    });
  }
  const statusLabel =
    COMMERCIAL_INVOICE_STATUS_LABELS[input.status] ?? input.status;
  doc.text(`Statut : ${statusLabel}`, pageW - MARGIN, MARGIN + 27, {
    align: "right",
  });

  y = Math.max(iy + 2, 48);

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
  const siteLabel = input.projectTitle || input.siteAddressSnapshot;
  if (siteLabel) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("Chantier", pageW / 2, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    const siteLines = doc.splitTextToSize(siteLabel, pageW / 2 - MARGIN - 4);
    doc.text(siteLines, pageW / 2, y + 10);
  }
  y += 34;

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
  y += subjectLines.length * 4.2 + 2;
  if (input.quoteNumber) {
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text(`Réf. devis : ${input.quoteNumber}`, MARGIN, y);
    y += 5;
  }
  if (input.depositPercent != null && input.type === "DEPOSIT") {
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text(`Acompte ${input.depositPercent} % du marché`, MARGIN, y);
    y += 5;
  }
  y += 2;

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
  inTable = true;

  for (const line of input.lines) {
    const main = doc.splitTextToSize(line.designation, colQty - colDesc - 6);
    const detail = line.description
      ? doc.splitTextToSize(line.description, colQty - colDesc - 6)
      : [];
    const rowH = Math.max(6, main.length * 3.4 + detail.length * 3 + 2);
    ensureSpace(rowH + 2);

    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(main, colDesc + 1, y + 3);
    if (detail.length) {
      doc.setFontSize(6.5);
      doc.setTextColor(...SLATE);
      doc.text(detail, colDesc + 1, y + 3 + main.length * 3.4);
    }
    doc.setFontSize(7.5);
    doc.setTextColor(40, 40, 40);
    doc.text(`${fmtQty(line.quantity)} ${line.unit}`, colQty, y + 3, {
      align: "right",
    });
    doc.text(fmtEur(line.unitSellHt), colPu, y + 3, { align: "right" });
    doc.text(fmtEur(line.lineSellHt), colHt, y + 3, { align: "right" });
    y += rowH;
  }

  inTable = false;

  ensureSpace(48);
  y += 4;
  const boxW = 72;
  const boxX = pageW - MARGIN - boxW;
  const hasRetention = (input.retentionAmountHt ?? 0) > 0.004;
  const hasDeposit = (input.depositDeductedHt ?? 0) > 0.004;
  const hasBreakdown = hasRetention || hasDeposit;
  let boxH = 26;
  if (hasBreakdown) {
    boxH = 32;
    if (hasRetention) boxH += 5.5;
    if (hasDeposit) boxH += 5.5;
    if (input.totals.amountPaid > 0) boxH += 12;
  } else if (input.totals.amountPaid > 0) {
    boxH = 34;
  }
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, y, boxW, boxH, 2, 2, "S");
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE);
  doc.setFont("helvetica", "normal");
  let ty = y + 6;
  if (hasBreakdown && input.worksSellHt != null) {
    doc.text("Travaux HT", boxX + 3, ty);
    doc.text(fmtEur(input.worksSellHt), boxX + boxW - 3, ty, { align: "right" });
    ty += 5.5;
    if (hasRetention) {
      doc.text(`RG ${input.retentionRate ?? ""} %`, boxX + 3, ty);
      doc.text(`- ${fmtEur(input.retentionAmountHt ?? 0)}`, boxX + boxW - 3, ty, {
        align: "right",
      });
      ty += 5.5;
    }
    if (hasDeposit) {
      doc.text("Déduction acompte", boxX + 3, ty);
      doc.text(
        `- ${fmtEur(input.depositDeductedHt ?? 0)}`,
        boxX + boxW - 3,
        ty,
        { align: "right" },
      );
      ty += 5.5;
    }
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("Net HT", boxX + 3, ty);
    doc.text(fmtEur(input.totals.totalSellHt), boxX + boxW - 3, ty, {
      align: "right",
    });
    ty += 5.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    doc.text("TVA", boxX + 3, ty);
    doc.text(fmtEur(input.totals.totalVat), boxX + boxW - 3, ty, {
      align: "right",
    });
    ty += 5.5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("Net TTC exigible", boxX + 3, ty);
    doc.text(fmtEur(input.totals.totalTtc), boxX + boxW - 3, ty, {
      align: "right",
    });
  } else {
    doc.text("Total HT", boxX + 3, ty);
    doc.text(fmtEur(input.totals.totalSellHt), boxX + boxW - 3, ty, {
      align: "right",
    });
    ty += 7;
    doc.text("TVA", boxX + 3, ty);
    doc.text(fmtEur(input.totals.totalVat), boxX + boxW - 3, ty, {
      align: "right",
    });
    ty += 8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("Total TTC", boxX + 3, ty);
    doc.text(fmtEur(input.totals.totalTtc), boxX + boxW - 3, ty, {
      align: "right",
    });
  }
  if (input.totals.amountPaid > 0) {
    ty += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    doc.setFontSize(7);
    doc.text("Reste dû", boxX + 3, ty);
    doc.text(fmtEur(input.totals.amountDue), boxX + boxW - 3, ty, {
      align: "right",
    });
  }
  y += boxH + 6;

  if (input.bankIban || input.bankBic || input.bankName) {
    ensureSpace(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text("Coordonnées bancaires", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    doc.setFontSize(8);
    if (input.bankName) {
      doc.text(input.bankName, MARGIN, y);
      y += 4;
    }
    if (input.bankIban) {
      doc.text(`IBAN ${input.bankIban}`, MARGIN, y);
      y += 4;
    }
    if (input.bankBic) {
      doc.text(`BIC ${input.bankBic}`, MARGIN, y);
      y += 4;
    }
    y += 2;
  }

  if (input.clientNotes) {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text("Observations", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    const notes = doc.splitTextToSize(input.clientNotes, pageW - MARGIN * 2);
    doc.text(notes, MARGIN, y);
    y += notes.length * 3.6 + 4;
  }

  const mentions = [input.invoiceMentions, input.legalMentions]
    .map((m) => m?.trim())
    .filter(Boolean) as string[];
  if (mentions.length) {
    ensureSpace(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...NAVY);
    doc.text("Mentions", MARGIN, y);
    y += 3.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    for (const m of mentions) {
      const lines = doc.splitTextToSize(m, pageW - MARGIN * 2);
      ensureSpace(lines.length * 3 + 2);
      doc.text(lines, MARGIN, y);
      y += lines.length * 3 + 2;
    }
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} / ${pages} — ${input.number}`, pageW / 2, pageH - 8, {
      align: "center",
    });
  }

  const ab = doc.output("arraybuffer");
  return stabilizePdfDocumentIds(Buffer.from(ab));
}

export function generateCommercialInvoicePdf(input: InvoicePdfInput): Buffer {
  return generateInvoicePdfBuffer(input);
}
