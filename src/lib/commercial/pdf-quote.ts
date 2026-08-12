import { jsPDF } from "jspdf";
import { COMMERCIAL_QUOTE_STATUS_LABELS } from "@/lib/commercial/money";
import {
  computePaymentScheduleAmounts,
  parsePaymentSchedule,
  type PaymentSchedule,
} from "@/lib/commercial/payment-schedule";

export type QuotePdfSnapshot = {
  name?: string | null;
  tradeName?: string | null;
  siret?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  zipCode?: string | null;
  postalCode?: string | null;
  country?: string | null;
  /** Chemin public local (ex. /brands/…) ou URL — réutilise DemoEnvironment.logoUrl. */
  logoPath?: string | null;
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
  totals: {
    totalSellHt: number;
    totalVat: number;
    totalTtc: number;
  };
  sections: Array<{
    title: string;
    lines: Array<{
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
    }>;
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
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
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

  // En-tête émetteur
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

  // Titre document
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("DEVIS", pageW - MARGIN, MARGIN + 2, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const versionSuffix =
    input.versionNumber != null ? ` — V${input.versionNumber}` : "";
  doc.text(`${input.number}${versionSuffix}`, pageW - MARGIN, MARGIN + 8, {
    align: "right",
  });
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(`Date : ${fmtDate(input.issueDate)}`, pageW - MARGIN, MARGIN + 13, {
    align: "right",
  });
  if (input.validityDate) {
    doc.text(`Validité : ${fmtDate(input.validityDate)}`, pageW - MARGIN, MARGIN + 17, {
      align: "right",
    });
  }
  const statusLabel = COMMERCIAL_QUOTE_STATUS_LABELS[input.status] ?? input.status;
  doc.text(`Statut : ${statusLabel}`, pageW - MARGIN, MARGIN + 21, { align: "right" });

  y = Math.max(iy + 2, 42);

  // Client + chantier
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

  const colRef = MARGIN;
  const colDesc = MARGIN + 22;
  const colQty = pageW - MARGIN - 78;
  const colPu = pageW - MARGIN - 52;
  const colHt = pageW - MARGIN;

  const drawTableHeader = () => {
    doc.setFillColor(...NAVY);
    doc.rect(MARGIN, y, pageW - MARGIN * 2, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Réf.", colRef + 1, y + 4.5);
    doc.text("Désignation", colDesc, y + 4.5);
    doc.text("Qté", colQty, y + 4.5, { align: "right" });
    doc.text("P.U. HT", colPu, y + 4.5, { align: "right" });
    doc.text("Total HT", colHt, y + 4.5, { align: "right" });
    y += 9;
  };

  drawTableHeader();
  inTable = true;

  for (const section of input.sections) {
    ensureSpace(12);
    doc.setFillColor(226, 232, 240);
    doc.rect(MARGIN, y - 1, pageW - MARGIN * 2, 6, "F");
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(section.title, MARGIN + 1, y + 3);
    y += 8;

    for (const line of section.lines) {
      if (line.kind === "COMMENT" || line.kind === "SUBTOTAL") {
        ensureSpace(8);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(...SLATE);
        const t = doc.splitTextToSize(line.designation, pageW - MARGIN * 2 - 4);
        doc.text(t, MARGIN + 1, y);
        y += t.length * 3.8 + 2;
        continue;
      }

      const descPrefix = line.isOptional || line.kind === "OPTION" ? "[Option] " : "";
      const main = doc.splitTextToSize(descPrefix + line.designation, colQty - colDesc - 4);
      const detail = line.description
        ? doc.splitTextToSize(line.description, colQty - colDesc - 4)
        : [];
      const rowH = Math.max(6, main.length * 3.4 + detail.length * 3 + 2);
      ensureSpace(rowH + 2);

      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      if (line.reference) doc.text(String(line.reference).slice(0, 12), colRef + 1, y + 3);
      doc.text(main, colDesc, y + 3);
      if (detail.length) {
        doc.setFontSize(6.5);
        doc.setTextColor(...SLATE);
        doc.text(detail, colDesc, y + 3 + main.length * 3.4);
      }
      doc.setFontSize(7.5);
      doc.setTextColor(40, 40, 40);
      doc.text(`${fmtQty(line.quantity)} ${line.unit}`, colQty, y + 3, { align: "right" });
      doc.text(fmtEur(line.unitSellHt), colPu, y + 3, { align: "right" });
      doc.text(fmtEur(line.lineSellHt), colHt, y + 3, { align: "right" });
      y += rowH;
    }
  }

  inTable = false;

  // Totaux
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

  const schedule =
    input.paymentSchedule ??
    parsePaymentSchedule(null);
  const scheduleLines = computePaymentScheduleAmounts(
    schedule && schedule.lines.length ? schedule : null,
    input.totals.totalTtc,
  );

  if (scheduleLines.length > 0) {
    ensureSpace(10 + scheduleLines.length * 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text("Conditions de paiement", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    doc.setFontSize(8);
    for (const row of scheduleLines) {
      const txt = `${row.percent} % — ${row.label} — ${fmtEur(row.amountTtc)}`;
      doc.text(txt, MARGIN, y);
      y += 4.2;
    }
    y += 2;
  }

  if (input.paymentTerms) {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text(
      scheduleLines.length > 0 ? "Conditions complémentaires" : "Conditions de paiement",
      MARGIN,
      y,
    );
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    const pt = doc.splitTextToSize(input.paymentTerms, pageW - MARGIN * 2);
    doc.text(pt, MARGIN, y);
    y += pt.length * 3.6 + 3;
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

  // Bon pour accord
  ensureSpace(36);
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.25);
  doc.roundedRect(MARGIN, y, pageW - MARGIN * 2, 32, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("Bon pour accord", MARGIN + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE);
  doc.text("Date : ____________________", MARGIN + 3, y + 14);
  doc.text("Nom / qualité : ________________________________", MARGIN + 3, y + 20);
  doc.text("Signature / cachet :", MARGIN + 3, y + 26);
  y += 38;

  const mentions = [input.quoteMentions, input.legalMentions]
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

function stabilizePdfDocumentIds(pdf: Buffer): Buffer {
  const latin = pdf.toString("latin1");
  const fixed =
    "/ID[<00000000000000000000000000000000><00000000000000000000000000000000>]";
  const next = latin.replace(/\/ID\s*\[[^\]]*\]/g, fixed);
  return Buffer.from(next, "latin1");
}

export function generateCommercialQuotePdf(input: QuotePdfInput): Buffer {
  return generateQuotePdfBuffer(input);
}
